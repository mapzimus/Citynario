from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from citynario_api.database import engine

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/live")
async def liveness() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/ready")
async def readiness() -> dict[str, str]:
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
    except Exception as error:
        raise HTTPException(status_code=503, detail="database is not ready") from error
    return {"status": "ready"}
