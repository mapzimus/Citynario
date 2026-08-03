"""Fast structural and provenance checks for a City Pack source tree."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Literal

import yaml
from pydantic import BaseModel, ConfigDict


class Finding(BaseModel):
    model_config = ConfigDict(frozen=True)

    level: Literal["error", "warning"]
    code: str
    message: str


class PackValidationReport(BaseModel):
    model_config = ConfigDict(frozen=True)

    pack_id: str
    findings: tuple[Finding, ...]

    @property
    def valid(self) -> bool:
        return not any(item.level == "error" for item in self.findings)


def _load_yaml(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(path)
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError(f"expected a YAML object in {path}")
    return data


def validate_pack(pack_root: Path) -> PackValidationReport:
    findings: list[Finding] = []
    try:
        manifest = _load_yaml(pack_root / "manifest.yaml")
    except (FileNotFoundError, ValueError, yaml.YAMLError) as error:
        return PackValidationReport(
            pack_id=pack_root.name,
            findings=(Finding(level="error", code="manifest.invalid", message=str(error)),),
        )

    pack = manifest.get("pack", {})
    pack_id = str(pack.get("id", pack_root.name))
    for key in ("id", "name", "version", "status", "published_at", "maintainers"):
        if not pack.get(key):
            findings.append(
                Finding(
                    level="error",
                    code=f"manifest.missing_{key}",
                    message=f"manifest pack.{key} is required",
                )
            )

    source_path = pack_root / "sources" / "catalog.yaml"
    try:
        source_catalog = _load_yaml(source_path)
    except (FileNotFoundError, ValueError, yaml.YAMLError) as error:
        findings.append(Finding(level="error", code="sources.invalid", message=str(error)))
        source_catalog = {"sources": []}

    source_ids = {item.get("id") for item in source_catalog.get("sources", [])}
    for source in source_catalog.get("sources", []):
        if source.get("status") in {"candidate", "placeholder"}:
            findings.append(
                Finding(
                    level="warning",
                    code="sources.not_verified",
                    message=f"source {source.get('id')} is {source.get('status')}",
                )
            )

    for assumption_set in manifest.get("assumption_sets", []):
        path = pack_root / "assumptions" / f"{assumption_set}.yaml"
        try:
            assumption_data = _load_yaml(path)
        except (FileNotFoundError, ValueError, yaml.YAMLError) as error:
            findings.append(Finding(level="error", code="assumptions.invalid", message=str(error)))
            continue
        for assumption_id, value in assumption_data.get("values", {}).items():
            low, central, high = value.get("low"), value.get("central"), value.get("high")
            if not all(isinstance(item, int | float) for item in (low, central, high)):
                findings.append(
                    Finding(
                        level="error",
                        code="assumptions.non_numeric",
                        message=(
                            f"{assumption_id} must define numeric low, central, and high values"
                        ),
                    )
                )
            elif not low <= central <= high:
                findings.append(
                    Finding(
                        level="error",
                        code="assumptions.unordered",
                        message=f"{assumption_id} must be ordered low <= central <= high",
                    )
                )
            for source_id in value.get("source_ids", []):
                if source_id not in source_ids:
                    findings.append(
                        Finding(
                            level="error",
                            code="assumptions.unknown_source",
                            message=f"{assumption_id} references unknown source {source_id}",
                        )
                    )

    return PackValidationReport(pack_id=pack_id, findings=tuple(findings))
