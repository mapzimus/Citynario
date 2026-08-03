"""Provider-neutral assistant boundary.

The assistant creates reviewable drafts. It never executes models or writes result values.
"""

from __future__ import annotations

import re
from typing import Protocol

from pydantic import BaseModel, ConfigDict, Field


class AssistantRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    prompt: str = Field(min_length=1, max_length=2000)
    city_pack: str


class AssistantDraft(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    city_pack: str
    detected_intent: str | None
    extracted_fields: dict[str, str | int | float]
    unresolved_fields: tuple[str, ...]
    review_required: bool = True
    notice: str = (
        "This is a draft interpretation. Review every field before creating a scenario run."
    )


class DraftProvider(Protocol):
    def draft(self, request: AssistantRequest) -> AssistantDraft: ...


class DeterministicDraftProvider:
    """Safe offline baseline that extracts only an explicit housing-unit count."""

    _units = re.compile(r"\b(\d{1,5})\s+(?:new\s+)?(?:apartments?|homes?|housing units?)\b", re.I)

    def draft(self, request: AssistantRequest) -> AssistantDraft:
        match = self._units.search(request.prompt)
        extracted: dict[str, str | int | float] = {}
        intent = None
        if match:
            extracted["total_housing_units"] = int(match.group(1))
            intent = "residential_development"
        unresolved = (
            "location",
            "unit_mix",
            "parking_spaces_per_unit",
            "assumption_set",
        )
        return AssistantDraft(
            city_pack=request.city_pack,
            detected_intent=intent,
            extracted_fields=extracted,
            unresolved_fields=unresolved,
        )


class PlanningAssistant:
    def __init__(self, provider: DraftProvider) -> None:
        self._provider = provider

    def create_draft(self, request: AssistantRequest) -> AssistantDraft:
        return self._provider.draft(request)
