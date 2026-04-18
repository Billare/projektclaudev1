import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { api } from "../api/client";
import TrackRow from "../components/TrackRow";

const DAY_OPTIONS = [7, 14, 30, 90];

export default function RecentlyPlayed() {
  const [days, setDays] = useState(30);

  const { data: recent, isLoading: loadingRecent } = useQuery({
    queryKey: ["recently-played", 100],
    queryFn: () => api.recentlyPlayed(100),
  });

  const { data: stats } = useQuery({
    queryKey: ["recently-played-stats", days],
    queryFn: () => api.recentlyPlayedStats(days),
  });

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Recently Played</h1>

      {/* Plays per day chart */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Plays Per Day</h2>
          <div className="flex gap-1 bg-sp-card rounded-md p-1">
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  days === d ? "bg-white text-black" : "text-sp-muted hover:text-white"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        <div className="bg-sp-card rounded-lg p-4 h-52">
          {stats?.plays_per_day.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.plays_per_day} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) =>
                    new Date(v + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })
                  }
                  tick={{ fontSize: 10, fill: "#A7A7A7" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10, fill: "#A7A7A7" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#282828", border: "none", borderRadius: 6, fontSize: 12 }}
                  labelFormatter={(v) => new Date(v + "T00:00:00").toLocaleDateString()}
                />
                <Bar dataKey="count" fill="#1DB954" radius={[3, 3, 0, 0]} name="Plays" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sp-muted text-sm">No play history found.</p>
          )}
        </div>
      </div>

      {/* Most played */}
      {stats?.most_played.length ? (
        <div>
          <h2 className="text-lg font-semibold mb-3">Most Played (Last {days} Days)</h2>
          <div className="bg-sp-card rounded-lg overflow-hidden">
            {stats.most_played.map((item, i) => (
              <div key={item.track.id} className="flex items-center gap-4 px-4 py-2 hover:bg-sp-hover transition-colors">
                <span className="w-5 text-center text-sm text-sp-muted">{i + 1}</span>
                {item.track.album?.image_url ? (
                  <img src={item.track.album.image_url} alt="" className="w-10 h-10 rounded object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded bg-sp-hover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.track.name}</p>
                  <p className="text-xs text-sp-muted truncate">
                    {item.track.artists.map((a) => a.name).join(", ")}
                  </p>
                </div>
                <span className="text-sm font-semibold text-sp-green flex-shrink-0">
                  {item.play_count}×
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Recent plays list */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent History</h2>
        <div className="bg-sp-card rounded-lg overflow-hidden">
          {loadingRecent && (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-sp-green border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {recent?.map((item, i) => (
            <TrackRow key={`${item.track.id}-${i}`} track={item.track} playedAt={item.played_at} />
          ))}
          {!loadingRecent && !recent?.length && (
            <p className="text-sp-muted text-sm p-6">No history yet — trigger a sync first.</p>
          )}
        </div>
      </div>
    </div>
  );
}
