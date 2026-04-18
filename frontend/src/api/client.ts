import type {
  Overview, TopTrack, TopArtist, RecentlyPlayedItem,
  Playlist, SyncStatus, CurrentlyPlaying, TimeRange,
} from "../types";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function post<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`, { method: "POST" });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  authStatus: () => fetch("/auth/status").then((r) => r.json()) as Promise<{ authenticated: boolean }>,
  overview: () => get<Overview>("/overview"),
  currentlyPlaying: () => get<CurrentlyPlaying>("/currently-playing"),
  topTracks: (timeRange: TimeRange) => get<TopTrack[]>(`/top-tracks?time_range=${timeRange}`),
  topArtists: (timeRange: TimeRange) => get<TopArtist[]>(`/top-artists?time_range=${timeRange}`),
  recentlyPlayed: (limit = 50) => get<RecentlyPlayedItem[]>(`/recently-played?limit=${limit}`),
  recentlyPlayedStats: (days = 30) =>
    get<{ plays_per_day: { date: string; count: number }[]; most_played: { play_count: number; track: TopTrack }[] }>(
      `/recently-played/stats?days=${days}`
    ),
  playlists: () => get<Playlist[]>("/playlists"),
  syncStatus: () => get<SyncStatus>("/sync/status"),
  triggerSync: () => post<{ status: string; items_synced: number }>("/sync"),
};
