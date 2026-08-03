"""FastAPI application factory."""

import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from citynario_api.config import get_settings
from citynario_api.logging import configure_logging
from citynario_api.routers import assistant, health, meta, scenarios


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    configure_logging(settings.log_level)
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title="Citynario API",
        version="0.1.0",
        summary="Transparent municipal scenario decision support",
        lifespan=lifespan,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "X-Request-ID"],
    )

    @application.middleware("http")
    async def request_id(request: Request, call_next):  # type: ignore[no-untyped-def]
        value = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        response = await call_next(request)
        response.headers["X-Request-ID"] = value
        return response

    application.include_router(health.router)
    application.include_router(meta.router)
    application.include_router(scenarios.router)
    application.include_router(assistant.router)
    return application


app = create_app()
