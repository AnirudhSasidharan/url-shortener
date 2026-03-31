# snip. — URL Shortener with Analytics

A production-style URL shortener built with **FastAPI**, **Redis**, and **PostgreSQL** (SQLite for local dev). Supports custom aliases, click tracking, and per-link analytics.

![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)

---

## Features

- Shorten any URL with an auto-generated or custom alias
- Redirect short links to their original destination
- Track every click with timestamp, IP address, and browser info
- View per-link analytics and top-performing links
- Redis caching layer for fast redirects without hitting the database
- Auto-generated API docs via Swagger UI

---

## Project Structure

```
url-shortener/
├── backend/
│   ├── main.py          — API routes and application entry point
│   ├── models.py        — Database models (URLs and Clicks)
│   ├── crud.py          — Database operations
│   ├── database.py      — Database connection setup
│   ├── cache.py         — Redis client setup
│   └── requirements.txt
└── frontend/
    └── index.html       — Analytics dashboard UI
```

---

## Getting Started

### Prerequisites
- Python 3.10+
- Redis (optional — app works without it, caching will be disabled)

### Installation

```bash
# Clone the repo
git clone https://github.com/AnirudhSasidharan/url-shortener.git
cd url-shortener/backend

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload
```

API runs at: `http://localhost:8000`  
Swagger docs: `http://localhost:8000/docs`

Open `frontend/index.html` in your browser for the dashboard.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/shorten` | Create a short URL |
| `GET` | `/{short_code}` | Redirect to original URL |
| `GET` | `/analytics/{short_code}` | Get click analytics for a link |
| `GET` | `/stats/all` | Get all shortened URLs |
| `GET` | `/stats/top` | Get top 10 most-clicked URLs |

### Example

**Request:**
```json
POST /shorten
{
  "original_url": "https://www.example.com/very/long/url",
  "custom_alias": "mylink"
}
```

**Response:**
```json
{
  "short_code": "mylink",
  "original_url": "https://www.example.com/very/long/url",
  "short_url": "http://localhost:8000/mylink",
  "created_at": "2026-03-29T10:08:03.253556",
  "click_count": 0
}
```

---

## How It Works

When a short link is visited, the server checks Redis first. If the URL is cached, it redirects instantly without touching the database. On a cache miss, it queries PostgreSQL, repopulates the cache, and redirects. Every visit is logged with a timestamp, IP address, and user agent for analytics.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./urls.db` | Database connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |

To use PostgreSQL in production, set:
```
DATABASE_URL=postgresql://user:password@localhost/dbname
```



## License

MIT
