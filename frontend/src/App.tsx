import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "./api/client";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import TopTracks from "./pages/TopTracks";
import TopArtists from "./pages/TopArtists";
import RecentlyPlayed from "./pages/RecentlyPlayed";
import Playlists from "./pages/Playlists";
import Login from "./pages/Login";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ["auth-status"],
    queryFn: api.authStatus,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-sp-black">
        <div className="w-8 h-8 border-2 border-sp-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.authenticated) {
    return <Login />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthGate>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="top-tracks" element={<TopTracks />} />
            <Route path="top-artists" element={<TopArtists />} />
            <Route path="recently-played" element={<RecentlyPlayed />} />
            <Route path="playlists" element={<Playlists />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthGate>
    </BrowserRouter>
  );
}
