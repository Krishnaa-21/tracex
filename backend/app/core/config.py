from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Explicitly load backend/.env
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./tracex.db"
    JWT_SECRET: str = "changeme"
    JWT_EXPIRE_MINUTES: int = 480
    AI_SUMMARY_API_KEY: str = "your_key_here"
    AI_SUMMARY_API_URL: str = "https://api.groq.com/openai/v1/chat/completions"
    AI_SUMMARY_MODEL: str = "openai/gpt-oss-20b"
    # Chat assistant re-uses the AI_SUMMARY_* credentials/endpoint. Timeout (seconds)
    # for a single LLM call before the assistant falls back to data-driven answers.
    # 30s leaves room for Render cold starts and slower/reasoning models.
    AI_CHAT_TIMEOUT_SECONDS: float = 30.0

    model_config = SettingsConfigDict(
        env_file=str(env_path),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()