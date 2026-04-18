# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A personal Spotify analytics dashboard. A Python/FastAPI backend fetches all available data from the Spotify Web API every 2 hours, stores it in PostgreSQL, and serves it to a React/TypeScript frontend dashboard.

## Running the project

```bash
# 1. Copy and fill in secrets
cp .env.example .env
# Edit .env with your Spotify CLIENT_ID and CLIENT_SECRET

# 2. Start everything
docker-compose up --build

# 3. Open http://localhost:5173 and click "Connect with Spotify"
```

After first auth the backend triggers an initial sync automatically. The scheduler then syncs every 2 hours. Use the "Sync now" button in the sidebar at any time.

## Development commands

```bash
# Backend only (needs a running postgres)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend only (proxies /api and /auth to localhost:8000)
cd frontend
npm install
npm run dev

# TypeScript type check
cd frontend && npx tsc --noEmit
```

## Architecture

```
frontend (React, port 5173)
    └── Vite proxies /api/* and /auth/* → backend
backend (FastAPI, port 8000)
    ├── /auth/*   — Spotify OAuth 2.0 flow
    ├── /api/*    — Dashboard data endpoints (served from DB)
    └── APScheduler — runs sync_all() every 2h in background thread
PostgreSQL (port 5432)
    └── All Spotify data persisted here
```

### Backend layout

| File | Purpose |
|------|---------|
| `app/config.py` | Pydantic settings from `.env` |
| `app/models.py` | All SQLAlchemy ORM models |
| `app/auth.py` | Spotify OAuth + `DBCacheHandler` (stores tokens in DB) |
| `app/fetcher.py` | `sync_all()` — fetches everything from Spotify and upserts into DB |
| `app/scheduler.py` | APScheduler wrapper that calls `sync_all()` on interval |
| `app/routes/auth.py` | `/auth/login`, `/auth/callback`, `/auth/status`, `/auth/logout` |
| `app/routes/api.py` | All dashboard data endpoints + manual sync trigger |

### Frontend layout

| Path | Purpose |
|------|---------|
| `src/api/client.ts` | All API calls (typed wrappers around fetch) |
| `src/types/index.ts` | Shared TypeScript types |
| `src/components/Layout.tsx` | Sidebar nav + sync status |
| `src/pages/Dashboard.tsx` | Overview stats + now playing + plays chart |
| `src/pages/TopTracks.tsx` | Top 50 tracks with time-range tabs |
| `src/pages/TopArtists.tsx` | Top 50 artists with time-range tabs |
| `src/pages/RecentlyPlayed.tsx` | Play history + plays-per-day chart |
| `src/pages/AudioFeatures.tsx` | Radar chart + breakdown of avg audio features |
| `src/pages/Playlists.tsx` | Playlist grid |

### Key data model decisions

- **Snapshots**: `top_tracks` and `top_artists` keep every sync run (with `synced_at`). The API always serves the latest snapshot so trends can be queried later.
- **Upserts**: Tracks, artists, albums are upserted by Spotify ID — partial data (e.g. artist embedded in a track) only overwrites non-null fields.
- **Audio features**: Fetched in batches of 100 for tracks that don't have them yet, appended each sync run.
- **Single user**: All rows carry `user_id = "default"`. The auth token is stored in `spotify_tokens` with the same key.

## Getting Spotify credentials

1. Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Create an app → copy Client ID and Client Secret into `.env`
3. Add `http://127.0.0.1:8000/auth/callback` to the app's Redirect URIs
