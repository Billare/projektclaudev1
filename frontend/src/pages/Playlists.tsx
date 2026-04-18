import { useQuery } from "@tanstack/react-query";
import { ListMusic } from "lucide-react";
import { api } from "../api/client";

export default function Playlists() {
  const { data, isLoading } = useQuery({ queryKey: ["playlists"], queryFn: api.playlists });

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Playlists</h1>
        {data && <p className="text-sm text-sp-muted mt-1">{data.length} playlists</p>}
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-sp-green border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {data?.map((pl) => (
          <a
            key={pl.id}
            href={pl.external_url ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-sp-card rounded-lg p-3 hover:bg-sp-hover transition-colors group"
          >
            {pl.image_url ? (
              <img
                src={pl.image_url}
                alt={pl.name}
                className="w-full aspect-square object-cover rounded mb-3"
              />
            ) : (
              <div className="w-full aspect-square bg-sp-hover rounded mb-3 flex items-center justify-center">
                <ListMusic size={32} className="text-sp-muted" />
              </div>
            )}
            <p className="text-sm font-medium truncate group-hover:text-white">{pl.name}</p>
            <p className="text-xs text-sp-muted mt-0.5">{pl.track_count} tracks</p>
            {pl.description && (
              <p className="text-xs text-sp-muted mt-1 line-clamp-2">{pl.description}</p>
            )}
          </a>
        ))}
      </div>

      {!isLoading && !data?.length && (
        <p className="text-sp-muted text-sm">No playlists found — trigger a sync first.</p>
      )}
    </div>
  );
}
