import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "VerifiedFix"
    TEAM_NAME: str = "Team ByteForce"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "verifiedfix-hackathon-insecure-secret-key-byteforce-2026")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # SQLite Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./verifiedfix.db")
    
    # CORS Configuration
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS",
        "https://verified-fix-six.vercel.app,http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
    )

    @property
    def cors_origins_list(self) -> list[str]:
        origins = [orig.strip() for orig in self.CORS_ORIGINS.split(",") if orig.strip()]
        required = [
            "https://verified-fix-six.vercel.app",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
        for req in required:
            if req not in origins:
                origins.append(req)
        return origins

    # Demo and target configurations
    DOCVAULT_TARGET_URL: str = os.getenv("DOCVAULT_TARGET_URL", "http://localhost:8000")
    
    # AI Provider settings (Supports local deterministic fallback by default)
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "local")  # "local", "openai", "anthropic", "gemini"
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Safe storage directory
    DATA_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
    REPORTS_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "reports")
    DEMO_DATA_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "demo_data")

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()

# Ensure directories exist
os.makedirs(settings.DATA_DIR, exist_ok=True)
os.makedirs(settings.REPORTS_DIR, exist_ok=True)
os.makedirs(settings.DEMO_DATA_DIR, exist_ok=True)
