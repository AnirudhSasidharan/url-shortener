# snip. — URL Shortener with Analytics

A production-style URL shortener built with **FastAPI**, **Redis**, and **PostgreSQL**. Supports custom aliases, click tracking, per-link analytics, and a React dashboard. Fully containerized with Docker.

![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)

---

## Features

- Shorten any URL with an auto-generated or custom alias
- Redirect short links to their original destination
- Track every click with timestamp, IP address, and browser info
- View per-link analytics and top-performing links
- Redis caching layer for fast redirects without hitting the database
- React dashboard with live stats and click charts
- Fully containerized — runs with one command via Docker Compose
- Auto-generated API docs via Swagger UI

---

## Project Structure

```
url-shortener/
├── docker-compose.yml        — Orchestrates all 4 services
├── backend/
│   ├── main.py               — API routes and application entry point
│   ├── models.py             — Database models (URLs and Clicks)
│   ├── crud.py               — Database operations
│   ├── database.py           — Database connection setup
│   ├── cache.py              — Redis client setup
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .dockerignore
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── AnalyticsPanel.jsx
    │   │   ├── ClicksChart.jsx
    │   │   ├── Header.jsx
    │   │   ├── ShortenForm.jsx
    │   │   ├── StatsBar.jsx
    │   │   └── UrlTable.jsx
    │   ├── App.jsx
    │   ├── App.css
    │   └── index.js
    ├── Dockerfile
    └── .dockerignore
```

---

## Running with Docker (Recommended)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running

### Start the full stack

```bash
git clone https://github.com/AnirudhSasidharan/url-shortener.git
cd url-shortener
docker compose up --build
```

That's it. Docker pulls and starts all 4 services automatically.

| Service | URL |
|---------|-----|
| React Frontend | http://localhost:3000 |
| FastAPI Backend | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

### Stop everything
```bash
docker compose down
```

### Stop and wipe the database
```bash
docker compose down -v
```

---

## Running Locally (without Docker)

### Prerequisites
- Python 3.10+
- Node.js 18+
- Redis (optional — app works without it, caching disabled)

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

API runs at: `http://localhost:8000`

### Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs at: `http://localhost:3000`

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

When a short link is visited, the server checks Redis first. If the URL is cached, it redirects instantly without touching the database. On a cache miss, it queries PostgreSQL, repopulates the cache, and redirects. Every visit is logged with a timestamp, IP address, and user agent for analytics. The React dashboard polls the API every 10 seconds to keep stats live.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./urls.db` | Database connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |

In Docker, these are set automatically via `docker-compose.yml`. For manual setup with PostgreSQL:
```
DATABASE_URL=postgresql://user:password@localhost/dbname
```




## License

MIT
