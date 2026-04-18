import { NavLink, Outlet } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, Music, Users, Clock,
  ListMusic, RefreshCw, LogOut,
} from "lucide-react";
import { api } from "../api/client";

const NAV = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/top-tracks", icon: Music, label: "Top Tracks" },
  { to: "/top-artists", icon: Users, label: "Top Artists" },
  { to: "/recently-played", icon: Clock, label: "Recently Played" },
  { to: "/playlists", icon: ListMusic, label: "Playlists" },
];

export default function Layout() {
  const qc = useQueryClient();
  const { data: syncStatus } = useQuery({
    queryKey: ["sync-status"],
    queryFn: api.syncStatus,
    refetchInterval: 30_000,
  });

  const sync = useMutation({
    mutationFn: api.triggerSync,
    onSuccess: () => qc.invalidateQueries(),
  });

  const lastSync = syncStatus?.last_sync;

  function formatAgo(iso: string | null) {
    if (!iso) return "Never";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-sp-black flex flex-col flex-shrink-0 border-r border-sp-card">
        <div className="px-6 py-5 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-sp-green flex items-center justify-center">
            <Music size={16} className="text-black" />
          </div>
          <span className="font-bold text-lg tracking-tight">Spotistats</span>
        </div>

        <nav className="flex-1 px-3 mt-2 space-y-1">
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sp-card text-white"
                    : "text-sp-muted hover:text-white hover:bg-sp-hover"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Sync status */}
        <div className="px-4 py-4 border-t border-sp-card space-y-2">
          <div className="flex items-center justify-between text-xs text-sp-muted">
            <span>
              {lastSync
                ? `Synced ${formatAgo(lastSync.completed_at)}`
                : "Never synced"}
            </span>
            {lastSync?.status === "failed" && (
              <span className="text-red-400">Failed</span>
            )}
          </div>
          <button
            onClick={() => sync.mutate()}
            disabled={sync.isPending}
            className="w-full flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium bg-sp-card hover:bg-sp-hover text-sp-muted hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={sync.isPending ? "animate-spin" : ""} />
            {sync.isPending ? "Syncing…" : "Sync now"}
          </button>
          <a
            href="/auth/logout"
            onClick={(e) => {
              e.preventDefault();
              fetch("/auth/logout", { method: "POST" }).then(() => {
                window.location.reload();
              });
            }}
            className="w-full flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-medium text-sp-muted hover:text-white hover:bg-sp-hover transition-colors"
          >
            <LogOut size={12} />
            Disconnect
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-sp-dark">
        <Outlet />
      </main>
    </div>
  );
}
