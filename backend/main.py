from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, HttpUrl
from sqlalchemy.orm import Session
from datetime import datetime
import string, random, json

from database import SessionLocal, engine
import models
import crud
from cache import redis_client

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="URL Shortener API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── DB dependency ──────────────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ── Pydantic schemas ───────────────────────────────────────────────────────────
class URLCreate(BaseModel):
    original_url: str
    custom_alias: str | None = None

class URLResponse(BaseModel):
    short_code: str
    original_url: str
    short_url: str
    created_at: datetime
    click_count: int

# ── Helpers ────────────────────────────────────────────────────────────────────
def generate_short_code(length: int = 6) -> str:
    chars = string.ascii_letters + string.digits
    return "".join(random.choices(chars, k=length))

BASE_URL = "http://localhost:8000"

# ── Routes ─────────────────────────────────────────────────────────────────────

@app.post("/shorten", response_model=URLResponse)
def shorten_url(payload: URLCreate, db: Session = Depends(get_db)):
    """
    Creates a short URL.
    1. Checks if custom alias is taken.
    2. Generates a random code if no alias provided.
    3. Saves to PostgreSQL.
    4. Caches original_url in Redis (key = short_code).
    """
    short_code = payload.custom_alias or generate_short_code()

    # Check alias conflict
    if crud.get_url_by_code(db, short_code):
        raise HTTPException(status_code=400, detail="Alias already taken")

    url_obj = crud.create_url(db, payload.original_url, short_code)

    # Cache in Redis (TTL = 1 hour)
    try:
        redis_client.setex(f"url:{short_code}", 3600, payload.original_url)
    except:
        pass

    return URLResponse(
        short_code=url_obj.short_code,
        original_url=url_obj.original_url,
        short_url=f"{BASE_URL}/{short_code}",
        created_at=url_obj.created_at,
        click_count=url_obj.click_count,
    )


@app.get("/{short_code}")
def redirect_url(short_code: str, request: Request, db: Session = Depends(get_db)):
    """
    Redirects short URL → original URL.
    1. Check Redis cache FIRST (fast path).
    2. On cache miss → hit PostgreSQL (slow path).
    3. Log click analytics (IP, user-agent, timestamp).
    4. Repopulate Redis cache on miss.
    """
    # ── Cache hit ──────────────────────────────────────────────────────────────
    try:
        cached = redis_client.get(f"url:{short_code}")
    except:
        cached = None
    if cached:
        original_url = cached.decode("utf-8")
        # Log click async-ish (still sync here for simplicity)
        _log_click(db, short_code, request)
        return RedirectResponse(url=original_url, status_code=302)

    # ── Cache miss → DB ────────────────────────────────────────────────────────
    url_obj = crud.get_url_by_code(db, short_code)
    if not url_obj:
        raise HTTPException(status_code=404, detail="Short URL not found")

    # Repopulate cache
    try:
        redis_client.setex(f"url:{short_code}", 3600, url_obj.original_url)
    except:
        pass
    _log_click(db, short_code, request)

    return RedirectResponse(url=url_obj.original_url, status_code=302)


@app.get("/analytics/{short_code}")
def get_analytics(short_code: str, db: Session = Depends(get_db)):
    """
    Returns analytics for a short URL:
    - Total clicks
    - Click history (timestamp, IP, user-agent)
    """
    url_obj = crud.get_url_by_code(db, short_code)
    if not url_obj:
        raise HTTPException(status_code=404, detail="Short URL not found")

    clicks = crud.get_clicks(db, short_code)

    return {
        "short_code": short_code,
        "original_url": url_obj.original_url,
        "total_clicks": url_obj.click_count,
        "created_at": url_obj.created_at,
        "click_history": [
            {
                "timestamp": c.timestamp,
                "ip_address": c.ip_address,
                "user_agent": c.user_agent,
            }
            for c in clicks
        ],
    }


@app.get("/stats/top")
def get_top_urls(db: Session = Depends(get_db)):
    """Returns top 10 most-clicked URLs."""
    urls = crud.get_top_urls(db, limit=10)
    return [
        {
            "short_code": u.short_code,
            "original_url": u.original_url,
            "click_count": u.click_count,
            "short_url": f"{BASE_URL}/{u.short_code}",
        }
        for u in urls
    ]


@app.get("/stats/all")
def get_all_urls(db: Session = Depends(get_db)):
    """Returns all shortened URLs with stats."""
    urls = crud.get_all_urls(db)
    return [
        {
            "short_code": u.short_code,
            "original_url": u.original_url,
            "click_count": u.click_count,
            "created_at": u.created_at,
            "short_url": f"{BASE_URL}/{u.short_code}",
        }
        for u in urls
    ]


# ── Internal helpers ───────────────────────────────────────────────────────────
def _log_click(db: Session, short_code: str, request: Request):
    ip = request.client.host if request.client else "unknown"
    ua = request.headers.get("user-agent", "unknown")
    crud.log_click(db, short_code, ip, ua)
