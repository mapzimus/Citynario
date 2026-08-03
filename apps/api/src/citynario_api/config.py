"""Environment-backed API configuration."""

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="CITYNARIO_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    environment: Literal["development", "test", "staging", "production"] = Field(
        default="development", validation_alias="CITYNARIO_ENV"
    )
    log_level: str = "INFO"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    database_url: str = Field(
        default="postgresql+asyncpg://citynario:citynario_local_only@localhost:5432/citynario",
        validation_alias="DATABASE_URL",
    )
    enable_experimental_assistant: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
