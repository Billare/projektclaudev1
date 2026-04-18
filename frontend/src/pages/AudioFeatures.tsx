import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import { api } from "../api/client";
import TimeRangeTabs from "../components/TimeRangeTabs";
import type { TimeRange } from "../types";

const FEATURE_META: Record<string, { label: string; description: string; max?: number }> = {
  danceability: { label: "Danceability", description: "How suitable a track is for dancing." },
  energy: { label: "Energy", description: "Intensity and activity level." },
  valence: { label: "Valence", description: "Musical positiveness / happiness." },
  acousticness: { label: "Acousticness", description: "Confidence the track is acoustic." },
  instrumentalness: { label: "Instrumentalness", description: "Predicts whether a track has no vocals." },
  speechiness: { label: "Speechiness", description: "Presence of spoken words." },
  liveness: { label: "Liveness", description: "Presence of a live audience." },
};

function FeatureBar({ label, value, description }: { label: string; value: number; description: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-sp-muted">{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-sp-hover rounded-full overflow-hidden">
        <div
          className="h-full bg-sp-green rounded-full transition-all duration-500"
          style={{ width: `${value * 100}%` }}
        />
      </div>
      <p className="text-xs text-sp-muted">{description}</p>
    </div>
  );
}

export default function AudioFeatures() {
  const [range, setRange] = useState<TimeRange>("short_term");

  const { data, isLoading } = useQuery({
    queryKey: ["audio-features-stats", range],
    queryFn: () => api.audioFeaturesStats(range),
  });

  const radarData = data
    ? Object.entries(FEATURE_META).map(([key, meta]) => ({
        feature: meta.label,
        value: Math.round((data[key as keyof typeof data] as number) * 100),
      }))
    : [];

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Audio Features</h1>
          <p className="text-sm text-sp-muted mt-1">Average across your top 50 tracks</p>
        </div>
        <TimeRangeTabs value={range} onChange={setRange} />
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-sp-green border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Radar */}
          <div className="bg-sp-card rounded-lg p-6">
            <h2 className="text-base font-semibold mb-4">Feature Profile</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="feature" tick={{ fontSize: 11, fill: "#A7A7A7" }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Average"
                    dataKey="value"
                    stroke="#1DB954"
                    fill="#1DB954"
                    fillOpacity={0.25}
                  />
                  <Tooltip
                    contentStyle={{ background: "#282828", border: "none", borderRadius: 6, fontSize: 12 }}
                    formatter={(v: number) => [`${v}%`, "Score"]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bars */}
          <div className="bg-sp-card rounded-lg p-6 space-y-5">
            <h2 className="text-base font-semibold">Breakdown</h2>
            {Object.entries(FEATURE_META).map(([key, meta]) => (
              <FeatureBar
                key={key}
                label={meta.label}
                value={data[key as keyof typeof data] as number}
                description={meta.description}
              />
            ))}
            <div className="pt-2 border-t border-sp-hover">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Tempo</span>
                <span className="text-sp-muted">{data.tempo} BPM</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isLoading && (!data || Object.keys(data).length === 0) && (
        <div className="bg-sp-card rounded-lg p-6 text-sm text-sp-muted">
          Audio features are not available for Spotify apps created after November 2024.
          Spotify removed access to this endpoint for new apps.
        </div>
      )}
    </div>
  );
}
