"""Persistence models. Domain models remain independent from SQLAlchemy."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from geoalchemy2 import Geometry
from sqlalchemy import DateTime, Index, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class ScenarioRunRecord(Base):
    __tablename__ = "scenario_runs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content_hash: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    city_pack: Mapped[str] = mapped_column(String(120), index=True)
    baseline: Mapped[str] = mapped_column(String(120))
    scenario: Mapped[dict[str, Any]] = mapped_column(JSONB)
    result: Mapped[dict[str, Any]] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class SpatialFeatureRecord(Base):
    __tablename__ = "spatial_features"
    __table_args__ = (Index("ix_spatial_features_geometry", "geometry", postgresql_using="gist"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    city_pack: Mapped[str] = mapped_column(String(120), index=True)
    baseline: Mapped[str] = mapped_column(String(120), index=True)
    layer: Mapped[str] = mapped_column(String(80), index=True)
    source_id: Mapped[str] = mapped_column(String(160))
    properties: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    geometry: Mapped[Any] = mapped_column(Geometry("GEOMETRY", srid=26986, spatial_index=False))
