from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime,
    ForeignKey, Table, Text, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

track_artists = Table(
    "track_artists", Base.metadata,
    Column("track_id", String, ForeignKey("tracks.id", ondelete="CASCADE")),
    Column("artist_id", String, ForeignKey("artists.id", ondelete="CASCADE")),
)

album_artists = Table(
    "album_artists", Base.metadata,
    Column("album_id", String, ForeignKey("albums.id", ondelete="CASCADE")),
    Column("artist_id", String, ForeignKey("artists.id", ondelete="CASCADE")),
)


class Artist(Base):
    __tablename__ = "artists"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    genres = Column(Text)  # JSON array
    popularity = Column(Integer)
    followers = Column(Integer)
    image_url = Column(String)
    external_url = Column(String)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Album(Base):
    __tablename__ = "albums"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    release_date = Column(String)
    image_url = Column(String)
    external_url = Column(String)
    total_tracks = Column(Integer)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    artists = relationship("Artist", secondary=album_artists)


class Track(Base):
    __tablename__ = "tracks"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    album_id = Column(String, ForeignKey("albums.id"))
    duration_ms = Column(Integer)
    popularity = Column(Integer)
    explicit = Column(Boolean)
    preview_url = Column(String)
    external_url = Column(String)
    track_number = Column(Integer)
    disc_number = Column(Integer)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    album = relationship("Album")
    artists = relationship("Artist", secondary=track_artists)
    audio_features = relationship("AudioFeatures", uselist=False, back_populates="track")


class AudioFeatures(Base):
    __tablename__ = "audio_features"

    track_id = Column(String, ForeignKey("tracks.id"), primary_key=True)
    danceability = Column(Float)
    energy = Column(Float)
    key = Column(Integer)
    loudness = Column(Float)
    mode = Column(Integer)
    speechiness = Column(Float)
    acousticness = Column(Float)
    instrumentalness = Column(Float)
    liveness = Column(Float)
    valence = Column(Float)
    tempo = Column(Float)
    time_signature = Column(Integer)

    track = relationship("Track", back_populates="audio_features")


class TopTrack(Base):
    __tablename__ = "top_tracks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False, index=True)
    track_id = Column(String, ForeignKey("tracks.id"), nullable=False)
    time_range = Column(String, nullable=False)
    rank = Column(Integer, nullable=False)
    synced_at = Column(DateTime, default=datetime.utcnow, index=True)

    track = relationship("Track")


class TopArtist(Base):
    __tablename__ = "top_artists"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False, index=True)
    artist_id = Column(String, ForeignKey("artists.id"), nullable=False)
    time_range = Column(String, nullable=False)
    rank = Column(Integer, nullable=False)
    synced_at = Column(DateTime, default=datetime.utcnow, index=True)

    artist = relationship("Artist")


class RecentlyPlayed(Base):
    __tablename__ = "recently_played"
    __table_args__ = (UniqueConstraint("user_id", "played_at"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False, index=True)
    track_id = Column(String, ForeignKey("tracks.id"), nullable=False)
    played_at = Column(DateTime, nullable=False, index=True)
    context_type = Column(String)
    context_uri = Column(String)

    track = relationship("Track")


class SavedTrack(Base):
    __tablename__ = "saved_tracks"
    __table_args__ = (UniqueConstraint("user_id", "track_id"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False, index=True)
    track_id = Column(String, ForeignKey("tracks.id"), nullable=False)
    added_at = Column(DateTime)

    track = relationship("Track")


class SavedAlbum(Base):
    __tablename__ = "saved_albums"
    __table_args__ = (UniqueConstraint("user_id", "album_id"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False, index=True)
    album_id = Column(String, ForeignKey("albums.id"), nullable=False)
    added_at = Column(DateTime)

    album = relationship("Album")


class Playlist(Base):
    __tablename__ = "playlists"

    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    track_count = Column(Integer)
    image_url = Column(String)
    public = Column(Boolean)
    snapshot_id = Column(String)
    external_url = Column(String)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class FollowedArtist(Base):
    __tablename__ = "followed_artists"
    __table_args__ = (UniqueConstraint("user_id", "artist_id"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False, index=True)
    artist_id = Column(String, ForeignKey("artists.id"), nullable=False)
    first_seen_at = Column(DateTime, default=datetime.utcnow)

    artist = relationship("Artist")


class SpotifyToken(Base):
    __tablename__ = "spotify_tokens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False, unique=True)
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text)
    token_expiry = Column(DateTime)
    scope = Column(Text)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SyncRun(Base):
    __tablename__ = "sync_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False, index=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    status = Column(String)  # running, success, failed
    error = Column(Text)
    items_synced = Column(Integer, default=0)
