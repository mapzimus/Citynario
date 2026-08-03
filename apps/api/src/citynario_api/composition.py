"""Application composition: installed City Packs, models, and assistant providers."""

from functools import lru_cache

from citynario_assistant import DeterministicDraftProvider, PlanningAssistant
from citynario_core import CityPackSnapshot, SimulationEngine
from citynario_models import built_in_modules
from citynario_pack_lynn import load_city_pack


@lru_cache
def city_packs() -> dict[str, CityPackSnapshot]:
    lynn = load_city_pack()
    return {lynn.manifest.reference: lynn}


@lru_cache
def simulation_engine() -> SimulationEngine:
    return SimulationEngine(built_in_modules())


@lru_cache
def planning_assistant() -> PlanningAssistant:
    return PlanningAssistant(DeterministicDraftProvider())
