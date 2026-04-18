import json
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, desc
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..auth import get_spotify_client, is_authenticated
from ..fetcher import sync_all
from ..models import (
    Track, Artist, Album,
    TopTrack, TopArtist, RecentlyPlayed,
    SavedTrack, SavedAlbum, Playlist,
    FollowedArtist, SyncRun,
)

router = APIRouter(prefix="/api", tags=["api"])
USER = "default"


def _require_auth(db: Session = Depends(get_db)) -> Session:
    if not is_authenticated(db):
        raise HTTPException(status_code=401, detail="Not authenticated with Spotify")
    return db


# ── Sync ──────────────────────────────────────────────────────────────────────

@router.post("/sync")
def trigger_sync(db: Session = Depends(_require_auth)):
    return sync_all(db)


@router.get("/sync/status")
def sync_status(db: Session = Depends(get_db)):
    run = db.query(SyncRun).order_by(desc(SyncRun.started_at)).first()
    if not run:
        return {"last_sync": None}
    return {
        "last_sync": {
            "started_at": run.started_at,
            "completed_at": run.completed_at,
            "status": run.status,
            "items_synced": run.items_synced,
            "error": run.error,
        }
    }


# ── Overview ──────────────────────────────────────────────────────────────────

@router.get("/overview")
def overview(db: Session = Depends(_require_auth)):
    return {
        "saved_tracks": db.query(SavedTrack).filter_by(user_id=USER).count(),
        "saved_albums": db.query(SavedAlbum).filter_by(user_id=USER).count(),
        "playlists": db.query(Playlist).filter_by(user_id=USER).count(),
        "followed_artists": db.query(FollowedArtist).filter_by(user_id=USER).count(),
        "recently_played_total": db.query(RecentlyPlayed).filter_by(user_id=USER).count(),
    }


# ── Currently playing (live) ──────────────────────────────────────────────────

@router.get("/currently-playing")
def currently_playing(db: Session = Depends(_require_auth)):
    try:
        sp = get_spotify_client(db)
        current = sp.currently_playing()
        if not current or not current.get("item"):
            return {"is_playing": False}
        item = current["item"]
        images = (item.get("album") or {}).get("images") or []
        return {
            "is_playing": current.get("is_playing", False),
            "progress_ms": current.get("progress_ms", 0),
            "track": {
                "id": item["id"],
                "name": item["name"],
                "duration_ms": item.get("duration_ms"),
                "artists": [{"name": a["name"]} for a in item.get("artists", [])],
                "album": {
                    "name": (item.get("album") or {}).get("name"),
                    "image_url": images[0]["url"] if images else None,
                },
                "external_url": (item.get("external_urls") or {}).get("spotify"),
            },
        }
    except Exception:
        return {"is_playing": False}


# ── Top tracks ────────────────────────────────────────────────────────────────

@router.get("/top-tracks")
def top_tracks(
    time_range: str = Query("short_term", pattern="^(short_term|medium_term|long_term)$"),
    db: Session = Depends(_require_auth),
):
    latest = (
        db.query(func.max(TopTrack.synced_at))
        .filter_by(user_id=USER, time_range=time_range)
        .scalar()
    )
    if not latest:
        return []

    rows = (
        db.query(TopTrack)
        .filter_by(user_id=USER, time_range=time_range, synced_at=latest)
        .options(
            joinedload(TopTrack.track).joinedload(Track.artists),
            joinedload(TopTrack.track).joinedload(Track.album),
            joinedload(TopTrack.track).joinedload(Track.audio_features),
        )
        .order_by(TopTrack.rank)
        .all()
    )

    return [
        {
            "rank": r.rank,
            "id": r.track.id,
            "name": r.track.name,
            "artists": [{"id": a.id, "name": a.name} for a in r.track.artists],
            "album": {
                "name": r.track.album.name if r.track.album else None,
                "image_url": r.track.album.image_url if r.track.album else None,
            },
            "duration_ms": r.track.duration_ms,
            "popularity": r.track.popularity,
            "explicit": r.track.explicit,
            "external_url": r.track.external_url,
            "audio_features": {
                "danceability": r.track.audio_features.danceability,
                "energy": r.track.audio_features.energy,
                "valence": r.track.audio_features.valence,
                "tempo": r.track.audio_features.tempo,
            } if r.track.audio_features else None,
        }
        for r in rows
    ]


# ── Top artists ───────────────────────────────────────────────────────────────

@router.get("/top-artists")
def top_artists(
    time_range: str = Query("short_term", pattern="^(short_term|medium_term|long_term)$"),
    db: Session = Depends(_require_auth),
):
    latest = (
        db.query(func.max(TopArtist.synced_at))
        .filter_by(user_id=USER, time_range=time_range)
        .scalar()
    )
    if not latest:
        return []

    rows = (
        db.query(TopArtist)
        .filter_by(user_id=USER, time_range=time_range, synced_at=latest)
        .options(joinedload(TopArtist.artist))
        .order_by(TopArtist.rank)
        .all()
    )

    return [
        {
            "rank": r.rank,
            "id": r.artist.id,
            "name": r.artist.name,
            "genres": json.loads(r.artist.genres) if r.artist.genres else [],
            "popularity": r.artist.popularity,
            "followers": r.artist.followers,
            "image_url": r.artist.image_url,
            "external_url": r.artist.external_url,
        }
        for r in rows
    ]


# ── Recently played ───────────────────────────────────────────────────────────

@router.get("/recently-played")
def recently_played(
    limit: int = Query(50, le=200),
    db: Session = Depends(_require_auth),
):
    rows = (
        db.query(RecentlyPlayed)
        .filter_by(user_id=USER)
        .options(
            joinedload(RecentlyPlayed.track).joinedload(Track.artists),
            joinedload(RecentlyPlayed.track).joinedload(Track.album),
        )
        .order_by(desc(RecentlyPlayed.played_at))
        .limit(limit)
        .all()
    )
    return [
        {
            "played_at": r.played_at,
            "track": {
                "id": r.track.id,
                "name": r.track.name,
                "artists": [{"id": a.id, "name": a.name} for a in r.track.artists],
                "album": {
                    "name": r.track.album.name if r.track.album else None,
                    "image_url": r.track.album.image_url if r.track.album else None,
                },
                "duration_ms": r.track.duration_ms,
                "external_url": r.track.external_url,
            },
        }
        for r in rows
    ]


@router.get("/recently-played/stats")
def recently_played_stats(
    days: int = Query(30, le=365),
    db: Session = Depends(_require_auth),
):
    since = datetime.utcnow() - timedelta(days=days)

    plays_per_day = (
        db.query(
            func.date(RecentlyPlayed.played_at).label("date"),
            func.count().label("count"),
        )
        .filter(RecentlyPlayed.user_id == USER, RecentlyPlayed.played_at >= since)
        .group_by(func.date(RecentlyPlayed.played_at))
        .order_by("date")
        .all()
    )

    most_played = (
        db.query(RecentlyPlayed.track_id, func.count().label("play_count"))
        .filter(RecentlyPlayed.user_id == USER, RecentlyPlayed.played_at >= since)
        .group_by(RecentlyPlayed.track_id)
        .order_by(desc("play_count"))
        .limit(10)
        .all()
    )

    track_ids = [m.track_id for m in most_played]
    tracks_map = {
        t.id: t
        for t in db.query(Track)
        .filter(Track.id.in_(track_ids))
        .options(joinedload(Track.artists), joinedload(Track.album))
        .all()
    }

    return {
        "plays_per_day": [{"date": str(p.date), "count": p.count} for p in plays_per_day],
        "most_played": [
            {
                "play_count": m.play_count,
                "track": {
                    "id": m.track_id,
                    "name": tracks_map[m.track_id].name if m.track_id in tracks_map else "Unknown",
                    "artists": [
                        {"id": a.id, "name": a.name}
                        for a in (tracks_map[m.track_id].artists if m.track_id in tracks_map else [])
                    ],
                    "album": {
                        "image_url": (
                            tracks_map[m.track_id].album.image_url
                            if m.track_id in tracks_map and tracks_map[m.track_id].album
                            else None
                        )
                    },
                },
            }
            for m in most_played
        ],
    }


# ── Playlists ─────────────────────────────────────────────────────────────────

@router.get("/playlists")
def playlists(db: Session = Depends(_require_auth)):
    rows = db.query(Playlist).filter_by(user_id=USER).order_by(Playlist.name).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "track_count": p.track_count,
            "image_url": p.image_url,
            "public": p.public,
            "external_url": p.external_url,
        }
        for p in rows
    ]
