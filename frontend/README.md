Snip Frontend — URL Shortener Interface

This is the frontend application for the Snip URL Shortener. It provides a user interface to create short URLs and view analytics data by interacting with the backend API.

Overview

The frontend is built using React and communicates with a FastAPI backend. It allows users to:

Create shortened URLs with custom aliases
View generated short links
Access basic analytics such as total links, total clicks, and top links

Technology Stack:

-React (Create React App)
-JavaScript (ES6+)
-CSS

Project Structure:

frontend/
│
├── public/
├── src/
│   ├── components/
│   │   ├── AnalyticsPanel.jsx
│   │   ├── ClicksChart.jsx
│   │   ├── Header.jsx
│   │   ├── ShortenForm.jsx
│   │   ├── StatsBar.jsx
│   │   └── UrlTable.jsx
│   │
│   ├── App.jsx
│   ├── index.js
│   └── App.css
│
├── package.json
└── README.md

Setup Instructions:

1. Install dependencies
npm install

2. Start the development server
npm start

The application will run at:

http://localhost:3000
Backend Dependency

This frontend requires the backend server to be running.

Expected backend URL:

http://127.0.0.1:8000

Ensure the backend is active before using the application.