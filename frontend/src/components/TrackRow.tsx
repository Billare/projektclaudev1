import type { TopTrack, Track } from "../types";

interface Props {
  track: TopTrack | Track;
  rank?: number;
  playedAt?: string;
}

function fmtDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TrackRow({ track, rank, playedAt }: Props) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 rounded-md hover:bg-sp-hover transition-colors group">
      {rank !== undefined && (
        <span className="w-5 text-center text-sm text-sp-muted">{rank}</span>
      )}
      {track.album?.image_url ? (
        <img
          src={track.album.image_url}
          alt={track.album.name ?? ""}
          className="w-10 h-10 rounded object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded bg-sp-card flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <a
          href={track.external_url ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium truncate block hover:underline"
        >
          {track.name}
        </a>
        <p className="text-xs text-sp-muted truncate">
          {track.artists.map((a) => a.name).join(", ")}
          {track.album?.name && <> &middot; {track.album.name}</>}
        </p>
      </div>
      {playedAt && (
        <span className="text-xs text-sp-muted flex-shrink-0">{fmtTime(playedAt)}</span>
      )}
      {track.duration_ms && (
        <span className="text-xs text-sp-muted flex-shrink-0 w-10 text-right">
          {fmtDuration(track.duration_ms)}
        </span>
      )}
      {"popularity" in track && track.popularity != null && (
        <div className="w-16 h-1 bg-sp-hover rounded-full overflow-hidden flex-shrink-0">
          <div
            className="h-full bg-sp-green rounded-full"
            style={{ width: `${track.popularity}%` }}
          />
        </div>
      )}
    </div>
  );
}
