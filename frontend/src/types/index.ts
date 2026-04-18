export interface ArtistRef {
  id: string;
  name: string;
}

export interface AlbumRef {
  name: string | null;
  image_url: string | null;
}

export interface AudioFeaturesRef {
  danceability: number;
  energy: number;
  valence: number;
  tempo: number;
}

export interface Track {
  id: string;
  name: string;
  artists: ArtistRef[];
  album: AlbumRef;
  duration_ms: number;
  popularity: number;
  explicit: boolean;
  external_url: string | null;
  audio_features?: AudioFeaturesRef | null;
}

export interface TopTrack extends Track {
  rank: number;
}

export interface TopArtist {
  rank: number;
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  followers: number;
  image_url: string | null;
  external_url: string | null;
}

export interface RecentlyPlayedItem {
  played_at: string;
  track: Track;
}

export interface Overview {
  saved_tracks: number;
  saved_albums: number;
  playlists: number;
  followed_artists: number;
  recently_played_total: number;
}

export interface AudioFeaturesStats {
  danceability: number;
  energy: number;
  valence: number;
  acousticness: number;
  instrumentalness: number;
  speechiness: number;
  liveness: number;
  tempo: number;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  track_count: number;
  image_url: string | null;
  public: boolean;
  external_url: string | null;
}

export interface SyncStatus {
  last_sync: {
    started_at: string;
    completed_at: string | null;
    status: string;
    items_synced: number | null;
    error: string | null;
  } | null;
}

export interface CurrentlyPlaying {
  is_playing: boolean;
  progress_ms?: number;
  track?: {
    id: string;
    name: string;
    duration_ms: number;
    artists: { name: string }[];
    album: { name: string | null; image_url: string | null };
    external_url: string | null;
  };
}

export type TimeRange = "short_term" | "medium_term" | "long_term";
