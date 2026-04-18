import json
import logging
from datetime import datetime
from sqlalchemy.orm import Session

from .auth import get_spotify_client
from .models import (
    Artist, Album, Track, AudioFeatures,
    TopTrack, TopArtist, RecentlyPlayed,
    SavedTrack, SavedAlbum, Playlist,
    FollowedArtist, SyncRun,
)

logger = logging.getLogger(__name__)
TIME_RANGES = ["short_term", "medium_term", "long_term"]


def _parse_dt(iso: str) -> datetime:
    return datetime.fromisoformat(iso.replace("Z", "+00:00")).replace(tzinfo=None)


def sync_all(db: Session, user_id: str = "default") -> dict:
    sync_run = SyncRun(user_id=user_id, status="running")
    db.add(sync_run)
    db.commit()

    # Per-sync caches: avoid duplicate db.get() calls for the same entity
    _artists: dict[str, Artist] = {}
    _albums: dict[str, Album] = {}
    _tracks: dict[str, Track] = {}

    def get_artist(data: dict) -> Artist | None:
        aid = data.get("id")
        if not aid:
            return None
        if aid not in _artists:
            obj = db.get(Artist, aid)
            if not obj:
                obj = Artist(id=aid, name=data.get("name") or "")
                db.add(obj)
            _artists[aid] = obj
        a = _artists[aid]
        a.name = data.get("name") or a.name
        if data.get("genres") is not None:
            a.genres = json.dumps(data["genres"])
        if data.get("popularity") is not None:
            a.popularity = data["popularity"]
        if data.get("followers"):
            a.followers = data["followers"].get("total")
        if data.get("images"):
            a.image_url = data["images"][0]["url"]
        if data.get("external_urls"):
            a.external_url = data["external_urls"].get("spotify")
        return a

    def get_album(data: dict) -> Album | None:
        aid = data.get("id")
        if not aid:
            return None
        if aid not in _albums:
            obj = db.get(Album, aid)
            if not obj:
                obj = Album(id=aid, name=data.get("name") or "")
                db.add(obj)
            _albums[aid] = obj
        a = _albums[aid]
        a.name = data.get("name") or a.name or ""
        a.release_date = data.get("release_date") or a.release_date
        a.total_tracks = data.get("total_tracks") or a.total_tracks
        if data.get("images"):
            a.image_url = data["images"][0]["url"]
        if data.get("external_urls"):
            a.external_url = data["external_urls"].get("spotify")
        return a

    def get_track(data: dict) -> Track | None:
        tid = data.get("id")
        if not tid:
            return None
        if tid not in _tracks:
            obj = db.get(Track, tid)
            if not obj:
                obj = Track(id=tid, name=data.get("name") or "")
                db.add(obj)
            _tracks[tid] = obj
        t = _tracks[tid]
        album_data = data.get("album")
        if album_data and album_data.get("id"):
            get_album(album_data)
            t.album_id = album_data["id"]
        t.name = data.get("name") or t.name or ""
        t.duration_ms = data.get("duration_ms")
        t.popularity = data.get("popularity")
        t.explicit = data.get("explicit", False)
        t.preview_url = data.get("preview_url")
        t.external_url = (data.get("external_urls") or {}).get("spotify")
        t.track_number = data.get("track_number")
        t.disc_number = data.get("disc_number")
        artists = [get_artist(a) for a in data.get("artists", []) if a.get("id")]
        t.artists = [a for a in artists if a]
        return t

    items = 0
    try:
        sp = get_spotify_client(db, user_id)

        # Top tracks
        for time_range in TIME_RANGES:
            synced_at = datetime.utcnow()
            results = sp.current_user_top_tracks(limit=50, time_range=time_range)
            for rank, td in enumerate(results["items"], 1):
                t = get_track(td)
                if t:
                    db.add(TopTrack(user_id=user_id, track_id=t.id, time_range=time_range, rank=rank, synced_at=synced_at))
                    items += 1
        db.commit()

        # Top artists
        for time_range in TIME_RANGES:
            synced_at = datetime.utcnow()
            results = sp.current_user_top_artists(limit=50, time_range=time_range)
            for rank, ad in enumerate(results["items"], 1):
                a = get_artist(ad)
                if a:
                    db.add(TopArtist(user_id=user_id, artist_id=a.id, time_range=time_range, rank=rank, synced_at=synced_at))
                    items += 1
        db.commit()

        # Recently played
        results = sp.current_user_recently_played(limit=50)
        for item in results["items"]:
            td = item.get("track")
            if not td or not td.get("id"):
                continue
            t = get_track(td)
            played_at = _parse_dt(item["played_at"])
            exists = db.query(RecentlyPlayed).filter_by(user_id=user_id, played_at=played_at).first()
            if not exists and t:
                ctx = item.get("context") or {}
                db.add(RecentlyPlayed(user_id=user_id, track_id=t.id, played_at=played_at,
                                      context_type=ctx.get("type"), context_uri=ctx.get("uri")))
                items += 1
        db.commit()

        # Saved tracks
        offset = 0
        while True:
            results = sp.current_user_saved_tracks(limit=50, offset=offset)
            if not results["items"]:
                break
            for item in results["items"]:
                td = item.get("track")
                if not td or not td.get("id"):
                    continue
                t = get_track(td)
                if t:
                    exists = db.query(SavedTrack).filter_by(user_id=user_id, track_id=t.id).first()
                    if not exists:
                        added_at = _parse_dt(item["added_at"]) if item.get("added_at") else None
                        db.add(SavedTrack(user_id=user_id, track_id=t.id, added_at=added_at))
                        items += 1
            db.commit()
            if not results.get("next"):
                break
            offset += 50

        # Saved albums
        offset = 0
        while True:
            results = sp.current_user_saved_albums(limit=50, offset=offset)
            if not results["items"]:
                break
            for item in results["items"]:
                ad = item.get("album")
                if not ad or not ad.get("id"):
                    continue
                a = get_album(ad)
                if a:
                    exists = db.query(SavedAlbum).filter_by(user_id=user_id, album_id=a.id).first()
                    if not exists:
                        added_at = _parse_dt(item["added_at"]) if item.get("added_at") else None
                        db.add(SavedAlbum(user_id=user_id, album_id=a.id, added_at=added_at))
                        items += 1
            db.commit()
            if not results.get("next"):
                break
            offset += 50

        # Playlists
        offset = 0
        while True:
            results = sp.current_user_playlists(limit=50, offset=offset)
            if not results["items"]:
                break
            for pl in results["items"]:
                p = db.get(Playlist, pl["id"])
                if not p:
                    p = Playlist(id=pl["id"])
                    db.add(p)
                p.user_id = user_id
                p.name = pl.get("name", "")
                p.description = pl.get("description", "")
                p.track_count = (pl.get("tracks") or {}).get("total", 0)
                p.public = pl.get("public", False)
                p.snapshot_id = pl.get("snapshot_id")
                p.external_url = (pl.get("external_urls") or {}).get("spotify")
                if pl.get("images"):
                    p.image_url = pl["images"][0]["url"]
                items += 1
            db.commit()
            if not results.get("next"):
                break
            offset += 50

        # Followed artists
        after = None
        while True:
            results = sp.current_user_followed_artists(limit=50, after=after)
            page = results.get("artists", {})
            if not page.get("items"):
                break
            for ad in page["items"]:
                a = get_artist(ad)
                if a:
                    exists = db.query(FollowedArtist).filter_by(user_id=user_id, artist_id=a.id).first()
                    if not exists:
                        db.add(FollowedArtist(user_id=user_id, artist_id=a.id))
                        items += 1
            db.commit()
            if not page.get("next"):
                break
            after = page["items"][-1]["id"]

        # Audio features — only available for apps created before Nov 2024
        try:
            missing = (
                db.query(Track.id)
                .outerjoin(AudioFeatures, Track.id == AudioFeatures.track_id)
                .filter(AudioFeatures.track_id.is_(None))
                .limit(200)
                .all()
            )
            missing_ids = [r.id for r in missing]
            for i in range(0, len(missing_ids), 100):
                batch = missing_ids[i:i + 100]
                for feat in sp.audio_features(batch):
                    if not feat:
                        continue
                    db.add(AudioFeatures(
                        track_id=feat["id"],
                        danceability=feat.get("danceability"),
                        energy=feat.get("energy"),
                        key=feat.get("key"),
                        loudness=feat.get("loudness"),
                        mode=feat.get("mode"),
                        speechiness=feat.get("speechiness"),
                        acousticness=feat.get("acousticness"),
                        instrumentalness=feat.get("instrumentalness"),
                        liveness=feat.get("liveness"),
                        valence=feat.get("valence"),
                        tempo=feat.get("tempo"),
                        time_signature=feat.get("time_signature"),
                    ))
                    items += 1
            db.commit()
        except Exception as af_exc:
            logger.warning("Audio features unavailable (likely API restriction): %s", af_exc)
            db.rollback()

        sync_run.status = "success"
        sync_run.completed_at = datetime.utcnow()
        sync_run.items_synced = items
        db.commit()
        return {"status": "success", "items_synced": items}

    except Exception as exc:
        logger.error("Sync failed: %s", exc, exc_info=True)
        db.rollback()
        sync_run.status = "failed"
        sync_run.error = str(exc)
        sync_run.completed_at = datetime.utcnow()
        db.commit()
        raise
