import type { TopArtist } from "../types";

interface Props {
  artist: TopArtist;
}

export default function ArtistRow({ artist }: Props) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 rounded-md hover:bg-sp-hover transition-colors">
      <span className="w-5 text-center text-sm text-sp-muted">{artist.rank}</span>
      {artist.image_url ? (
        <img
          src={artist.image_url}
          alt={artist.name}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-sp-card flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <a
          href={artist.external_url ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium hover:underline"
        >
          {artist.name}
        </a>
        <p className="text-xs text-sp-muted truncate">{artist.genres.slice(0, 3).join(", ")}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs text-sp-muted">{artist.followers?.toLocaleString()} followers</p>
        <div className="w-16 h-1 bg-sp-hover rounded-full overflow-hidden mt-1 ml-auto">
          <div className="h-full bg-sp-green rounded-full" style={{ width: `${artist.popularity}%` }} />
        </div>
      </div>
    </div>
  );
}
