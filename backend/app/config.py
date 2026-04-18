from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    spotify_client_id: str = ""
    spotify_client_secret: str = ""
    spotify_redirect_uri: str = "http://127.0.0.1:8000/auth/callback"
    database_url: str = "postgresql://spotify:spotify@db:5432/spotify_dashboard"
    frontend_url: str = "http://localhost:5173"
    sync_interval_hours: int = 2

    class Config:
        env_file = ".env"


settings = Settings()
