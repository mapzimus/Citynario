"""Create scenario run and spatial feature tables."""

from collections.abc import Sequence

import geoalchemy2
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "scenario_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("content_hash", sa.String(length=80), nullable=False),
        sa.Column("city_pack", sa.String(length=120), nullable=False),
        sa.Column("baseline", sa.String(length=120), nullable=False),
        sa.Column("scenario", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("result", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_scenario_runs_city_pack", "scenario_runs", ["city_pack"])
    op.create_index(
        "ix_scenario_runs_content_hash", "scenario_runs", ["content_hash"], unique=True
    )
    op.create_table(
        "spatial_features",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("city_pack", sa.String(length=120), nullable=False),
        sa.Column("baseline", sa.String(length=120), nullable=False),
        sa.Column("layer", sa.String(length=80), nullable=False),
        sa.Column("source_id", sa.String(length=160), nullable=False),
        sa.Column("properties", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "geometry",
            geoalchemy2.types.Geometry(
                geometry_type="GEOMETRY", srid=26986, spatial_index=False
            ),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_spatial_features_baseline", "spatial_features", ["baseline"])
    op.create_index("ix_spatial_features_city_pack", "spatial_features", ["city_pack"])
    op.create_index("ix_spatial_features_layer", "spatial_features", ["layer"])
    op.create_index(
        "ix_spatial_features_geometry", "spatial_features", ["geometry"], postgresql_using="gist"
    )


def downgrade() -> None:
    op.drop_table("spatial_features")
    op.drop_table("scenario_runs")
