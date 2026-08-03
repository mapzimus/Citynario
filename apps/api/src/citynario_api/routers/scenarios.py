from citynario_core.engine import EngineConfigurationError
from citynario_core.models import RunResult, ScenarioEnvelope
from fastapi import APIRouter, HTTPException

from citynario_api.composition import city_packs, simulation_engine

router = APIRouter(prefix="/v1/scenarios", tags=["scenarios"])


@router.post("/run", response_model=RunResult)
async def run_scenario(scenario: ScenarioEnvelope) -> RunResult:
    pack = city_packs().get(scenario.city_pack)
    if pack is None:
        raise HTTPException(status_code=422, detail="Requested City Pack is not installed")
    try:
        return simulation_engine().run(scenario, pack)
    except EngineConfigurationError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
