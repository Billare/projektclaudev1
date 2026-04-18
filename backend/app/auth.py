from datetime import datetime
from sqlalchemy.orm import Session
import spotipy
from spotipy.oauth2 import SpotifyOAuth

from .config import settings
from .models import SpotifyToken

SCOPES = " ".join([
    "user-read-private",
    "user-read-email",
    "user-top-read",
    "user-read-recently-played",
    "user-library-read",
    "user-follow-read",
    "playlist-read-private",
    "playlist-read-collaborative",
    "user-read-currently-playing",
    "user-read-playback-state",
])

USER_ID = "default"


class DBCacheHandler(spotipy.cache_handler.CacheHandler):
    def __init__(self, db: Session, user_id: str = USER_ID):
        self.db = db
        self.user_id = user_id

    def get_cached_token(self):
        token = self.db.query(SpotifyToken).filter_by(user_id=self.user_id).first()
        if not token:
            return None
        return {
            "access_token": token.access_token,
            "refresh_token": token.refresh_token,
            "expires_at": token.token_expiry.timestamp() if token.token_expiry else 0,
            "scope": token.scope,
            "token_type": "Bearer",
        }

    def save_token_to_cache(self, token_info):
        expiry = datetime.fromtimestamp(token_info.get("expires_at", 0))
        existing = self.db.query(SpotifyToken).filter_by(user_id=self.user_id).first()
        if existing:
            existing.access_token = token_info["access_token"]
            existing.refresh_token = token_info.get("refresh_token") or existing.refresh_token
            existing.token_expiry = expiry
            existing.scope = token_info.get("scope", "")
            existing.updated_at = datetime.utcnow()
        else:
            self.db.add(SpotifyToken(
                user_id=self.user_id,
                access_token=token_info["access_token"],
                refresh_token=token_info.get("refresh_token"),
                token_expiry=expiry,
                scope=token_info.get("scope", ""),
            ))
        self.db.commit()


def get_oauth(db: Session, user_id: str = USER_ID) -> SpotifyOAuth:
    return SpotifyOAuth(
        client_id=settings.spotify_client_id,
        client_secret=settings.spotify_client_secret,
        redirect_uri=settings.spotify_redirect_uri,
        scope=SCOPES,
        cache_handler=DBCacheHandler(db, user_id),
        open_browser=False,
    )


def get_spotify_client(db: Session, user_id: str = USER_ID) -> spotipy.Spotify:
    oauth = get_oauth(db, user_id)
    token_info = oauth.get_cached_token()
    if not token_info:
        raise ValueError("No token found. Please authenticate first.")
    if oauth.is_token_expired(token_info):
        token_info = oauth.refresh_access_token(token_info["refresh_token"])
    return spotipy.Spotify(auth=token_info["access_token"])


def is_authenticated(db: Session, user_id: str = USER_ID) -> bool:
    return db.query(SpotifyToken).filter_by(user_id=user_id).first() is not None
