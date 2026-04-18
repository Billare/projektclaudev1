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

## Hosting on the web (Railway)

[Railway](https://railway.app) is the easiest way to host this publicly — it runs the backend, frontend, and PostgreSQL together with minimal config.

### 1. Update Spotify redirect URI

In the Spotify developer dashboard, add a new Redirect URI for your domain:
```
https://your-backend-domain.up.railway.app/auth/callback
```

### 2. Deploy PostgreSQL

In Railway, create a new project and add a **PostgreSQL** plugin. Railway will provide a `DATABASE_URL` — copy it.

### 3. Deploy the backend

Add a new service pointed at the `backend/` folder. Set the following environment variables in Railway's dashboard:

```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=https://your-backend-domain.up.railway.app/auth/callback
DATABASE_URL=postgresql://...  (from Railway PostgreSQL)
FRONTEND_URL=https://your-frontend-domain.up.railway.app
SYNC_INTERVAL_HOURS=2
```

### 4. Build and deploy the frontend

The frontend needs to be built as static files and served. Update the Vite proxy in `frontend/vite.config.ts` to point to your live backend URL, then run:

```bash
cd frontend
npm run build
```

Deploy the `frontend/dist/` folder to [Vercel](https://vercel.com) or [Netlify](https://netlify.com) (both free), or add it as another Railway service using Nginx to serve the static files.

### 5. SSL & HTTPS

Railway and Vercel/Netlify provision SSL certificates automatically — no extra setup needed.

### Key differences from local

| | Local | Web |
|---|---|---|
| Redirect URI | `http://127.0.0.1:8000/...` | `https://yourdomain.com/...` |
| Frontend | Vite dev server | Built static files |
| Secrets | `.env` file | Platform environment variables |
| Database | Docker container | Hosted PostgreSQL |

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
