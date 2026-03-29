# snip. — URL Shortener with Analytics

A production-style URL shortener built with FastAPI + Redis + PostgreSQL (SQLite for dev).

---

## Project Structure

```
url-shortener/
├── backend/
│   ├── main.py          ← FastAPI app, all route handlers
│   ├── models.py        ← SQLAlchemy DB models (URL, Click tables)
│   ├── crud.py          ← All database operations
│   ├── database.py      ← DB connection setup
│   ├── cache.py         ← Redis client setup
│   └── requirements.txt
└── frontend/
    └── index.html       ← Dashboard UI (vanilla JS)
```

---

## How to Run

```bash
# 1. Install dependencies
cd backend
pip install -r requirements.txt

# 2. (Optional) Start Redis locally
#    Mac:   brew install redis && redis-server
#    Linux: sudo apt install redis && redis-server
#    Without Redis, the app still works — just no caching

# 3. Start the API
uvicorn main:app --reload

# 4. Open frontend
# Just open frontend/index.html in your browser
# (or serve it: python -m http.server 3000)
```

API runs at: http://localhost:8000
Docs at:     http://localhost:8000/docs  ← FastAPI auto-generates this!

---

## API Endpoints

| Method | Endpoint                  | Description                      |
|--------|---------------------------|----------------------------------|
| POST   | /shorten                  | Create a short URL               |
| GET    | /{short_code}             | Redirect to original URL         |
| GET    | /analytics/{short_code}   | Get click analytics for a link   |
| GET    | /stats/all                | Get all shortened URLs           |
| GET    | /stats/top                | Get top 10 most-clicked URLs     |

---

## Architecture Explained (Read This Before Interviews)

### 1. What happens when you shorten a URL?

```
User POSTs { original_url, custom_alias? }
    │
    ├── Check if alias already exists in DB
    │       If yes → return 400 "Alias already taken"
    │
    ├── Generate 6-char random alphanumeric code (if no alias)
    │       e.g. "aB3xYz" from [a-z A-Z 0-9]
    │
    ├── Save to PostgreSQL: short_code, original_url, created_at
    │
    └── Cache in Redis: SET url:aB3xYz → "https://original.com" EX 3600
            (key expires in 1 hour)
```

### 2. What happens when someone visits the short URL?

```
User visits http://localhost:8000/aB3xYz
    │
    ├── CHECK REDIS FIRST (fast path ~1ms)
    │       key "url:aB3xYz" exists?
    │       YES → grab original URL, go straight to redirect
    │       NO  → cache miss, proceed to DB
    │
    ├── (Cache miss) QUERY POSTGRESQL (slow path ~5-20ms)
    │       SELECT * FROM urls WHERE short_code = 'aB3xYz'
    │       Not found → 404
    │       Found → repopulate Redis cache
    │
    ├── LOG THE CLICK
    │       INSERT into clicks: short_code, ip, user_agent, timestamp
    │       UPDATE urls SET click_count = click_count + 1
    │
    └── HTTP 302 Redirect → original URL
```

### 3. Why Redis? Why not just always use the DB?

This is the most important concept in the whole project.

Redis is an in-memory key-value store. Reads from Redis take ~0.1–1ms.
PostgreSQL reads from disk take ~5–50ms.

For a URL shortener, the redirect endpoint is called MILLIONS of times.
Most of those calls are for the same popular links.
Hitting PostgreSQL every single time would:
  a) Slow down every redirect
  b) Hammer the DB with unnecessary reads
  c) Not scale beyond a few hundred req/sec easily

With Redis:
  - First visit for a link → DB hit, then cache it
  - Every subsequent visit → Redis hit (10-50x faster)
  - 95%+ of requests never touch the DB

This is called the "cache-aside" pattern.

### 4. Why TTL (Time To Live) on Redis keys?

redis_client.setex("url:aB3xYz", 3600, original_url)
                                  ^^^^
                                  TTL in seconds (1 hour)

If a URL gets updated or deleted, the cache would serve stale data forever
without TTL. By setting TTL = 1 hour, worst case = 1 hour of stale data.
This is an acceptable tradeoff for most apps.

Alternative: on URL update/delete, explicitly delete the Redis key too.
(Called "cache invalidation" — one of the hardest problems in CS.)

### 5. Why two tables (urls + clicks)?

Option A (naive): Store all click timestamps in the urls table as JSON array
  Problem: That array grows to millions of entries. Reading/writing it is slow.

Option B (what we did): Separate clicks table
  - urls table: one row per link, fast reads
  - clicks table: append-only log of every click
  - click_count column on urls: denormalized counter for fast "total clicks" reads
    (avoids SELECT COUNT(*) FROM clicks every time)

This is called "denormalization" — storing redundant data for read performance.

### 6. What is a denormalized counter? Why not just COUNT(*)?

Bad approach:
  SELECT COUNT(*) FROM clicks WHERE short_code = 'aB3xYz'
  → Full table scan or index scan on every request. Slow at scale.

Good approach (what we did):
  urls.click_count column updated atomically on every click:
  UPDATE urls SET click_count = click_count + 1 WHERE short_code = ?
  → O(1) read later: SELECT click_count FROM urls WHERE short_code = ?

Tradeoff: click_count could get out of sync if there's a bug. Acceptable.

### 7. What is a 302 redirect vs 301?

302 = Temporary redirect → browsers don't cache it
301 = Permanent redirect → browsers cache it forever

We use 302 because:
  - If we serve 301 and later the link changes, user's browser would
    keep using the old cached destination forever
  - Analytics also break with 301 (browser skips the server entirely)

### 8. How is the short code generated?

chars = string.ascii_letters + string.digits  # 62 characters
code = random.choices(chars, k=6)             # 6 characters

Possible combinations = 62^6 = ~56 billion unique codes.
More than enough for most apps.

Problem: birthday paradox — collision probability grows as you add more URLs.
At ~50% collision probability you'd need ~170,000 codes in the 6-char space.
Solution at scale: use a counter (auto-increment ID) + base62 encode it.
This guarantees no collisions. Twitter/Bitly do this.

### 9. Dependency Injection (get_db)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/shorten")
def shorten_url(db: Session = Depends(get_db)):
    ...

FastAPI sees `Depends(get_db)` and calls get_db() before your route runs.
It passes the db session to your function, then closes it in the finally block.

Benefits:
  - Every request gets its own DB session (no state sharing between requests)
  - Session is always closed even if an exception is thrown
  - Makes testing easy (swap get_db with a test DB in tests)

---

## Interview Questions You Will 100% Be Asked

### System Design Questions

Q: "Why did you use Redis here? What's the alternative?"
A: Redis is an in-memory cache. Without it, every redirect hits PostgreSQL.
   At scale (millions of redirects/day), the DB becomes a bottleneck.
   Redis serves the most-hit URLs from memory in <1ms.
   Alternative: Memcached (simpler, but no persistence or advanced data types).

Q: "What happens if Redis goes down?"
A: The app degrades gracefully — redirects still work via the DB (just slower).
   In cache.py, the ping() on startup catches connection failures.
   In production, you'd add try/except around every Redis call so a Redis
   failure never crashes the main app. Redis failure = performance hit, not outage.

Q: "How would you scale this to handle 10 million requests per day?"
A: 
   1. Redis cluster for cache horizontal scaling
   2. Read replicas on PostgreSQL for analytics queries
   3. Async click logging (don't block the redirect waiting for DB write)
      → Push click events to a queue (Redis queue / Kafka)
      → Background worker drains the queue and writes to DB
   4. CDN in front for truly global scale (Cloudflare)
   5. Rate limiting on /shorten to prevent abuse

Q: "Why 302 and not 301?"
A: 302 is temporary. 301 is permanent and gets cached by browsers.
   With 301, analytics break (browser skips our server) and we can't update
   link destinations without users clearing their browser cache.

Q: "How would you handle custom aliases being taken?"
A: We check for existing short_code before inserting. Return 400 if conflict.
   Could also auto-suggest alternatives: "taken → try 'mylink-2' or 'mylink-abc'"

Q: "What's the time complexity of a redirect?"
A:
   Cache hit: O(1) — Redis is a hash map, key lookup is constant time
   Cache miss: O(log n) — B-tree index on short_code in PostgreSQL

### Database Questions

Q: "Why is short_code the primary key instead of an integer ID?"
A: It's the lookup key for every redirect. Making it the PK means PostgreSQL
   creates a clustered index on it automatically. No need for a separate index.
   Also simplifies queries — no JOIN needed to go from code → row.

Q: "What indexes would you add?"
A:
   - short_code: already indexed (PK)
   - clicks.short_code: indexed for fast analytics queries (we did this)
   - clicks.timestamp: if you want time-range queries ("clicks in last 7 days")

Q: "Why SQLite for dev and PostgreSQL for prod?"
A: SQLite needs no server, great for local dev and testing.
   PostgreSQL handles concurrent writes properly (multiple users shortening
   URLs simultaneously). SQLite has write locking issues under concurrency.

Q: "What is the N+1 query problem and does your code have it?"
A: N+1 = running 1 query to fetch N rows, then N more queries for related data.
   In our get_top_urls, we fetch URLs in one query. No related queries after.
   No N+1. If we'd loaded clicks for each URL separately, that'd be N+1.

### FastAPI / Python Questions

Q: "What is Pydantic and why use it?"
A: Pydantic validates incoming request data automatically.
   URLCreate schema ensures original_url is a string, custom_alias is optional.
   If someone sends invalid JSON, FastAPI returns a 422 before your code runs.
   No manual validation code needed.

Q: "What does `yield` do in the get_db dependency?"
A: It's a generator. FastAPI runs everything up to yield before your route,
   passes the db value to your function, then runs everything after yield
   (the finally block) after your route finishes. Same as a context manager.

Q: "What's the difference between 404 and 400?"
A: 400 = Bad Request (client sent invalid input — e.g. alias already taken)
   404 = Not Found (resource doesn't exist — e.g. short code not in DB)
   422 = Unprocessable Entity (FastAPI uses this for validation errors)

Q: "What is CORS and why did you add it?"
A: Cross-Origin Resource Sharing. Browsers block JS from calling APIs on
   different domains by default. Our frontend (localhost:3000) calling the
   API (localhost:8000) is a cross-origin request. The CORSMiddleware adds
   headers that tell the browser "this is allowed."

### General Backend Questions

Q: "How would you add authentication? Only let users see their own links?"
A:
   1. Add a users table (id, email, hashed_password)
   2. POST /auth/register and POST /auth/login endpoints
   3. On login, return a JWT token (signed with a secret key)
   4. Client sends token in Authorization: Bearer <token> header
   5. Add a dependency that validates the token and returns current_user
   6. Add user_id foreign key to urls table
   7. Filter queries: WHERE short_code = ? AND user_id = current_user.id

Q: "How would you add rate limiting?"
A: Use slowapi library (FastAPI rate limiting):
   - Limit /shorten to 10 requests/minute per IP
   - Prevents abuse (someone creating 1M short URLs to spam)
   Redis can store the request counts per IP (it's great for this).

Q: "How would you add link expiry?"
A:
   1. Add expires_at column to urls table (nullable DateTime)
   2. In redirect handler, check: if url.expires_at and url.expires_at < datetime.now() → 410 Gone
   3. Redis TTL can mirror the expiry time

Q: "What is the difference between SQL and NoSQL here? Would you use MongoDB?"
A: For this project, relational makes sense:
   - URLs and clicks have a clear relationship (foreign key)
   - We need aggregate queries (COUNT, SUM, ORDER BY clicks)
   - Schema is well-defined and stable
   
   MongoDB could work but you'd lose JOIN convenience and ACID guarantees.
   For analytics at massive scale, a columnar DB (ClickHouse, BigQuery) would
   be better than PostgreSQL for the clicks table.

---

## What to Say When They Ask "Walk Me Through Your Project"

"I built a URL shortener with a FastAPI backend, Redis caching, and PostgreSQL 
for persistence. The core flow is: a user POSTs a long URL, we generate a 
6-character alphanumeric short code, store it in PostgreSQL, and cache it in 
Redis with a 1-hour TTL. On redirect, we check Redis first — cache hit means 
we never touch the database, keeping latency under a millisecond. On a cache 
miss, we fall back to PostgreSQL and repopulate the cache. Every redirect also 
logs a click event with IP and user agent for analytics. I kept the click count 
denormalized on the URL row so reading total clicks is O(1) without aggregating 
the entire clicks table."

That answer alone will impress most Tier 2 interviewers.
