# Spotify Dashboard

A personal Spotify analytics dashboard that fetches all available data from the Spotify Web API, stores it in a PostgreSQL database, and displays it in a React dashboard. Data syncs automatically every 2 hours.

## Features

- **Dashboard** — overview stats, now playing, and plays-per-day chart
- **Top Tracks** — your top 50 tracks across 4 weeks, 6 months, and all time
- **Top Artists** — your top 50 artists across all time ranges
- **Recently Played** — full play history with charts and most-played breakdown
- **Playlists** — all your playlists with cover art and track counts
- Auto-sync every 2 hours via background scheduler

## Stack

- **Backend** — Python, FastAPI, SQLAlchemy, spotipy, APScheduler
- **Database** — PostgreSQL
- **Frontend** — React, TypeScript, Vite, Tailwind CSS, Recharts

## Getting Started

### 1. Spotify credentials

1. Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) and create an app
2. Add `http://127.0.0.1:8000/auth/callback` as a Redirect URI
3. Copy your Client ID and Client Secret

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in your credentials in `.env`:

```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
```

### 3. Run

```bash
docker-compose up --build
```

Open `http://127.0.0.1:5173` and click **Connect with Spotify**.

## Development

```bash
# Backend (requires a running PostgreSQL)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```
