import { useQuery } from "@tanstack/react-query";
import { Music, Disc, ListMusic, Users, Clock, Radio } from "lucide-react";
import { api } from "../api/client";
import StatCard from "../components/StatCard";
import TrackRow from "../components/TrackRow";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const { data: overview } = useQuery({ queryKey: ["overview"], queryFn: api.overview });
  const { data: topTracks } = useQuery({
    queryKey: ["top-tracks", "short_term"],
    queryFn: () => api.topTracks("short_term"),
  });
  const { data: nowPlaying } = useQuery({
    queryKey: ["currently-playing"],
    queryFn: api.currentlyPlaying,
    refetchInterval: 15_000,
  });
  const { data: recentStats } = useQuery({
    queryKey: ["recently-played-stats", 7],
    queryFn: () => api.recentlyPlayedStats(7),
  });

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Saved Tracks" value={overview?.saved_tracks ?? "—"} icon={<Music size={16} />} />
        <StatCard label="Saved Albums" value={overview?.saved_albums ?? "—"} icon={<Disc size={16} />} />
        <StatCard label="Playlists" value={overview?.playlists ?? "—"} icon={<ListMusic size={16} />} />
        <StatCard label="Following" value={overview?.followed_artists ?? "—"} icon={<Users size={16} />} />
        <StatCard label="Plays Logged" value={overview?.recently_played_total ?? "—"} icon={<Clock size={16} />} />
      </div>

      {/* Now playing */}
      {nowPlaying?.is_playing && nowPlaying.track && (
        <div className="bg-sp-card rounded-lg p-4 flex items-center gap-4">
          {nowPlaying.track.album.image_url && (
            <img
              src={nowPlaying.track.album.image_url}
              alt=""
              className="w-14 h-14 rounded object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Radio size={14} className="text-sp-green animate-pulse" />
              <span className="text-xs text-sp-green font-medium uppercase tracking-wider">Now Playing</span>
            </div>
            <p className="font-semibold truncate">{nowPlaying.track.name}</p>
            <p className="text-sm text-sp-muted truncate">
              {nowPlaying.track.artists.map((a) => a.name).join(", ")}
            </p>
          </div>
          {nowPlaying.progress_ms != null && nowPlaying.track.duration_ms && (
            <div className="w-32 hidden sm:block">
              <div className="h-1 bg-sp-hover rounded-full overflow-hidden">
                <div
                  className="h-full bg-sp-green rounded-full"
                  style={{
                    width: `${(nowPlaying.progress_ms / nowPlaying.track.duration_ms) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top tracks this month */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Top Tracks This Month</h2>
          <div className="bg-sp-card rounded-lg overflow-hidden">
            {topTracks?.slice(0, 8).map((t) => (
              <TrackRow key={t.id} track={t} rank={t.rank} />
            ))}
            {!topTracks && (
              <p className="text-sp-muted text-sm p-4">No data yet — sync to get started.</p>
            )}
          </div>
        </div>

        {/* Plays per day */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Plays Last 7 Days</h2>
          <div className="bg-sp-card rounded-lg p-4 h-64">
            {recentStats?.plays_per_day.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recentStats.plays_per_day} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => new Date(v + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" })}
                    tick={{ fontSize: 11, fill: "#A7A7A7" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#A7A7A7" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#282828", border: "none", borderRadius: 6, fontSize: 12 }}
                    labelFormatter={(v) => new Date(v + "T00:00:00").toLocaleDateString()}
                  />
                  <Bar dataKey="count" fill="#1DB954" radius={[4, 4, 0, 0]} name="Plays" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sp-muted text-sm">No recent play data.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
