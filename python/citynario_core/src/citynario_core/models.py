"""Versioned, transport-independent domain contracts."""

from __future__ import annotations

from datetime import UTC, date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class DomainModel(BaseModel):
    """Strict base model used by every public contract."""

    model_config = ConfigDict(extra="forbid", frozen=True)


class EstimateRange(DomainModel):
    """A documented low, central, and high estimate."""

    low: float
    central: float
    high: float

    @model_validator(mode="after")
    def ordered(self) -> EstimateRange:
        if not self.low <= self.central <= self.high:
            raise ValueError("estimate values must be ordered low <= central <= high")
        return self


class AssumptionRange(EstimateRange):
    id: str
    label: str
    unit: str
    source_ids: tuple[str, ...] = ()
    note: str


class HousingUnitMix(DomainModel):
    studio: int = Field(default=0, ge=0)
    one_bedroom: int = Field(default=0, ge=0)
    two_bedroom: int = Field(default=0, ge=0)
    three_plus_bedroom: int = Field(default=0, ge=0)

    @property
    def total(self) -> int:
        return self.studio + self.one_bedroom + self.two_bedroom + self.three_plus_bedroom


class ResidentialDevelopmentInputs(DomainModel):
    units: HousingUnitMix
    affordable_share: float = Field(default=0, ge=0, le=1)
    parking_spaces_per_unit: float = Field(default=0, ge=0)
    site_area_square_feet: float | None = Field(default=None, gt=0)
    proposed_impervious_square_feet: float | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def valid_site_area(self) -> ResidentialDevelopmentInputs:
        if self.units.total == 0:
            raise ValueError("at least one proposed housing unit is required")
        if (
            self.site_area_square_feet is not None
            and self.proposed_impervious_square_feet is not None
            and self.proposed_impervious_square_feet > self.site_area_square_feet
        ):
            raise ValueError("impervious area cannot exceed total site area")
        return self


class Intervention(DomainModel):
    id: str = "development-1"
    type: Literal["residential_development"]
    geometry: dict[str, Any] | None = None
    inputs: ResidentialDevelopmentInputs


class ScenarioDefinition(DomainModel):
    name: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=1000)
    interventions: tuple[Intervention, ...] = Field(min_length=1, max_length=10)
    assumption_set: str
    requested_modules: tuple[str, ...] = Field(min_length=1)


class ScenarioEnvelope(DomainModel):
    schema_version: Literal["1.0"] = "1.0"
    city_pack: str
    baseline: str
    scenario: ScenarioDefinition


class MapView(DomainModel):
    center: tuple[float, float]
    zoom: float
    bounds: tuple[float, float, float, float]


class Maintainer(DomainModel):
    name: str
    url: str | None = None


class CityPackManifest(DomainModel):
    schema_version: Literal["1.0"] = "1.0"
    id: str
    name: str
    version: str
    status: Literal["experimental", "pilot", "verified", "reference"]
    published_at: date
    baseline: str
    maintainers: tuple[Maintainer, ...]
    map: MapView
    enabled_modules: tuple[str, ...]
    assumption_sets: tuple[str, ...]
    disclaimer: str
    known_limitations: tuple[str, ...] = ()

    @property
    def reference(self) -> str:
        return f"{self.id}@{self.version}"


class CityPackSnapshot(DomainModel):
    manifest: CityPackManifest
    assumption_set: str
    assumptions: dict[str, AssumptionRange]
    source_titles: dict[str, str]


class TraceNode(DomainModel):
    id: str
    module: str
    label: str
    operation: str
    formula: str
    inputs: dict[str, Any]
    output: EstimateRange
    assumption_ids: tuple[str, ...] = ()
    source_ids: tuple[str, ...] = ()


class Indicator(DomainModel):
    id: str
    module: str
    label: str
    estimate: EstimateRange
    unit: str
    trace_root: str
    interpretation: str


class RunWarning(DomainModel):
    code: str
    message: str
    severity: Literal["info", "warning", "error"] = "warning"


class ModuleResult(DomainModel):
    module: str
    module_version: str
    indicators: tuple[Indicator, ...]
    traces: tuple[TraceNode, ...]
    warnings: tuple[RunWarning, ...] = ()
    excluded_effects: tuple[str, ...] = ()


class RunResult(DomainModel):
    schema_version: Literal["1.0"] = "1.0"
    run_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    city_pack: str
    baseline: str
    assumption_set: str
    scenario_name: str
    module_versions: dict[str, str]
    indicators: tuple[Indicator, ...]
    traces: tuple[TraceNode, ...]
    warnings: tuple[RunWarning, ...]
    excluded_effects: tuple[str, ...]
    disclaimer: str
