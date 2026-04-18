# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start everything
docker-compose up --build

# Restart a single service after code changes
docker-compose restart backend
docker-compose restart frontend

# View logs
docker-compose logs backend --tail=50
docker-compose logs frontend --tail=50

# Wipe database and start fresh
docker-compose down -v && docker-compose up --build

# Backend (without Docker)
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (without Docker)
cd frontend && npm install && npm run dev

# TypeScript check
cd frontend && npx tsc --noEmit
```

## Architecture

```
frontend (React, :5173)
    └── Vite proxies /api/* and /auth/* → backend
backend (FastAPI, :8000)
    ├── /auth/*        Spotify OAuth 2.0 flow
    ├── /api/*         Dashboard data (served from DB)
    └── APScheduler    runs sync_all() every 2h in a background thread
PostgreSQL (:5432)
```

## Backend

| File | Purpose |
|------|---------|
| `app/config.py` | Pydantic settings loaded from `.env` |
| `app/database.py` | SQLAlchemy engine and session factory (`autoflush=False`) |
| `app/models.py` | All ORM models |
| `app/auth.py` | Spotify OAuth + `DBCacheHandler` (stores tokens in `spotify_tokens` table) |
| `app/fetcher.py` | `sync_all()` — fetches everything from Spotify and upserts into DB |
| `app/scheduler.py` | APScheduler wrapper, calls `sync_all()` on interval |
| `app/routes/auth.py` | `/auth/login`, `/auth/callback`, `/auth/status`, `/auth/logout` |
| `app/routes/api.py` | All dashboard endpoints + manual sync trigger |

## Frontend

| Path | Purpose |
|------|---------|
| `src/api/client.ts` | All API calls — typed wrappers around fetch |
| `src/types/index.ts` | Shared TypeScript types |
| `src/components/Layout.tsx` | Sidebar nav + sync status + disconnect |
| `src/pages/Dashboard.tsx` | Stats overview, now playing, plays-per-day chart |
| `src/pages/TopTracks.tsx` | Top 50 tracks with time-range tabs |
| `src/pages/TopArtists.tsx` | Top 50 artists with time-range tabs |
| `src/pages/RecentlyPlayed.tsx` | Play history, plays-per-day chart, most played |
| `src/pages/Playlists.tsx` | Playlist grid |

## Key decisions

- **`autoflush=False`** on the SQLAlchemy session. `sync_all()` uses per-run dicts (`_artists`, `_albums`, `_tracks`) to deduplicate entities within a sync. Without these caches, `db.get()` won't find pending (unflushed) objects and will try to INSERT duplicates.
- **Snapshot tables**: `top_tracks` and `top_artists` keep every sync run with a `synced_at` timestamp. API endpoints always return the latest snapshot, so historical trends are queryable later.
- **Audio features removed**: Spotify removed the audio features endpoint for apps created after November 2024. The fetch is wrapped in a try/except so it doesn't fail the sync — it just silently skips.
- **Single user**: All rows use `user_id = "default"`. The OAuth token is stored in `spotify_tokens` under the same key.
- **Spotify redirect URI**: Must use `http://127.0.0.1:8000/auth/callback` — Spotify does not allow `localhost` as a redirect URI.
