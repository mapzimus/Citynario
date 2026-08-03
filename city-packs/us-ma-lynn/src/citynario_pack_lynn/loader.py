"""Load and validate the Lynn City Pack resources."""

from __future__ import annotations

from importlib import resources
from pathlib import Path
from typing import Any, cast

import yaml
from citynario_core.models import (
    AssumptionRange,
    CityPackManifest,
    CityPackSnapshot,
    Maintainer,
    MapView,
)


def _read_yaml(relative_path: str) -> dict[str, Any]:
    repository_file = Path(__file__).parents[2] / relative_path
    if repository_file.exists():
        return cast(dict[str, Any], yaml.safe_load(repository_file.read_text(encoding="utf-8")))

    packaged_file = resources.files("citynario_pack_lynn.resources").joinpath(relative_path)
    return cast(dict[str, Any], yaml.safe_load(packaged_file.read_text(encoding="utf-8")))


def load_city_pack(assumption_set: str = "lynn-central-2026") -> CityPackSnapshot:
    raw = _read_yaml("manifest.yaml")
    pack = raw["pack"]
    map_config = pack["map"]
    manifest = CityPackManifest(
        schema_version=raw["schema_version"],
        id=pack["id"],
        name=pack["name"],
        version=pack["version"],
        status=pack["status"],
        published_at=pack["published_at"],
        baseline=raw["baseline"]["id"],
        maintainers=tuple(Maintainer(**item) for item in pack["maintainers"]),
        map=MapView(
            center=tuple(map_config["center"]),
            zoom=map_config["zoom"],
            bounds=tuple(map_config["bounds"]),
        ),
        enabled_modules=tuple(raw["modules"]),
        assumption_sets=tuple(raw["assumption_sets"]),
        disclaimer=raw["disclaimer"],
        known_limitations=tuple(raw.get("known_limitations", [])),
    )
    if assumption_set not in manifest.assumption_sets:
        raise ValueError(f"unknown Lynn assumption set: {assumption_set}")

    assumption_data = _read_yaml(f"assumptions/{assumption_set}.yaml")
    assumptions = {
        assumption_id: AssumptionRange(id=assumption_id, **value)
        for assumption_id, value in assumption_data["values"].items()
    }
    source_data = _read_yaml("sources/catalog.yaml")
    source_titles = {item["id"]: item["title"] for item in source_data["sources"]}
    return CityPackSnapshot(
        manifest=manifest,
        assumption_set=assumption_set,
        assumptions=assumptions,
        source_titles=source_titles,
    )
