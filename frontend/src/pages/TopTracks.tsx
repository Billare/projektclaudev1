import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import TrackRow from "../components/TrackRow";
import TimeRangeTabs from "../components/TimeRangeTabs";
import type { TimeRange } from "../types";

export default function TopTracks() {
  const [range, setRange] = useState<TimeRange>("short_term");

  const { data, isLoading } = useQuery({
    queryKey: ["top-tracks", range],
    queryFn: () => api.topTracks(range),
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Top Tracks</h1>
        <TimeRangeTabs value={range} onChange={setRange} />
      </div>

      <div className="bg-sp-card rounded-lg overflow-hidden">
        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-sp-green border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!isLoading && !data?.length && (
          <p className="text-sp-muted text-sm p-6">No data yet — trigger a sync first.</p>
        )}
        {data?.map((track) => (
          <TrackRow key={`${track.id}-${track.rank}`} track={track} rank={track.rank} />
        ))}
      </div>
    </div>
  );
}
