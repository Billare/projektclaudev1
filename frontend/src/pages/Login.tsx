import { Music } from "lucide-react";

export default function Login() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-sp-black gap-8">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-sp-green flex items-center justify-center">
          <Music size={24} className="text-black" />
        </div>
        <h1 className="text-3xl font-bold">Spotistats</h1>
      </div>
      <p className="text-sp-muted text-center max-w-sm">
        Connect your Spotify account to see your listening stats, top tracks, artists, and more.
      </p>
      <a
        href="/auth/login"
        className="flex items-center gap-2 px-8 py-3 bg-sp-green text-black font-bold rounded-full hover:scale-105 transition-transform"
      >
        Connect with Spotify
      </a>
    </div>
  );
}
