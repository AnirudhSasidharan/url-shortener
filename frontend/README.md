# Snip Frontend — URL Shortener Interface

This is the frontend application for the Snip URL Shortener. Built with React, it provides a dashboard to create short URLs, view analytics, and track click data by communicating with the FastAPI backend.

---

## Features

- Shorten URLs with optional custom aliases
- Live stats — total links, total clicks, top performing link
- Per-link analytics with click history
- Clicks over time bar chart (Recharts)
- Auto-refreshes every 10 seconds

---

## Technology Stack

- React (Create React App)
- JavaScript (ES6+)
- CSS
- Recharts — for analytics charts
- Nginx — for serving the production build inside Docker

---

## Project Structure

```
frontend/
├── public/
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
├── .dockerignore
├── package.json
└── README.md
```

---

## Running Locally (without Docker)

### 1. Install dependencies
```bash
npm install
```

### 2. Start the development server
```bash
npm start
```

App runs at: `http://localhost:3000`

> Requires the backend to be running at `http://localhost:8000`

---

## Running with Docker

### Prerequisites
- Docker Desktop installed and running

### Option 1 — Run just the frontend container
```bash
# Build the image
docker build -t snip-frontend .

# Run the container
docker run -p 3000:80 snip-frontend
```

App runs at: `http://localhost:3000`

### Option 2 — Run the full stack (recommended)
From the root `url_shortener/` directory:
```bash
docker compose up --build
```

This starts all 4 services together:
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

To stop everything:
```bash
docker compose down
```

---

## Docker Files

### Dockerfile
Multi-stage build — Stage 1 builds the React app with Node, Stage 2 serves it with Nginx. The final image is lightweight with no Node.js overhead.

### .dockerignore
Excludes `node_modules` and `build` from the Docker build context. Docker installs dependencies fresh inside the container via `npm install`, so local `node_modules` are not needed.

---

## Backend Dependency

This frontend requires the backend API to be running.

| Mode | Backend URL |
|------|-------------|
| Local dev | http://localhost:8000 |
| Docker Compose | http://localhost:8000 |
