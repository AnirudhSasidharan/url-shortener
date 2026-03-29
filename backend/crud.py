from sqlalchemy.orm import Session
from models import URL, Click
from datetime import datetime

def get_url_by_code(db: Session, short_code: str) -> URL | None:
    return db.query(URL).filter(URL.short_code == short_code).first()

def create_url(db: Session, original_url: str, short_code: str) -> URL:
    url_obj = URL(
        short_code=short_code,
        original_url=original_url,
        created_at=datetime.utcnow(),
    )
    db.add(url_obj)
    db.commit()
    db.refresh(url_obj)
    return url_obj

def log_click(db: Session, short_code: str, ip: str, user_agent: str):
    # Insert click record
    click = Click(
        short_code=short_code,
        ip_address=ip,
        user_agent=user_agent,
        timestamp=datetime.utcnow(),
    )
    db.add(click)

    # Increment denormalized counter on URL row
    db.query(URL).filter(URL.short_code == short_code).update(
        {URL.click_count: URL.click_count + 1}
    )
    db.commit()

def get_clicks(db: Session, short_code: str) -> list[Click]:
    return (
        db.query(Click)
        .filter(Click.short_code == short_code)
        .order_by(Click.timestamp.desc())
        .all()
    )

def get_top_urls(db: Session, limit: int = 10) -> list[URL]:
    return db.query(URL).order_by(URL.click_count.desc()).limit(limit).all()

def get_all_urls(db: Session) -> list[URL]:
    return db.query(URL).order_by(URL.created_at.desc()).all()
