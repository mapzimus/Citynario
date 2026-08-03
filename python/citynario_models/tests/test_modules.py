import json
from pathlib import Path

from citynario_core import ScenarioEnvelope, SimulationEngine
from citynario_models import built_in_modules
from citynario_pack_lynn import load_city_pack

FIXTURE = (
    Path(__file__).parents[3] / "city-packs" / "us-ma-lynn" / "fixtures" / "downtown-housing-a.json"
)


def test_golden_scenario_produces_ranges_and_traces() -> None:
    scenario = ScenarioEnvelope.model_validate_json(FIXTURE.read_text(encoding="utf-8"))
    result = SimulationEngine(built_in_modules()).run(scenario, load_city_pack())
    indicators = {item.id: item for item in result.indicators}

    assert indicators["added_residents"].estimate.central == 347.8
    assert indicators["added_public_school_students"].estimate.central == 39.93
    assert indicators["daily_vehicle_trips"].estimate.central == 539.09
    assert indicators["proposed_impervious_share"].estimate.central == 65
    assert {trace.id for trace in result.traces} == {
        indicator.trace_root for indicator in result.indicators
    }
    json.dumps(result.model_dump(mode="json"))


def test_zero_unit_scenario_is_rejected_by_contract() -> None:
    raw = json.loads(FIXTURE.read_text(encoding="utf-8"))
    raw["scenario"]["interventions"][0]["inputs"]["units"] = {
        "studio": 0,
        "one_bedroom": 0,
        "two_bedroom": 0,
        "three_plus_bedroom": 0,
    }

    try:
        ScenarioEnvelope.model_validate(raw)
    except ValueError:
        pass
    else:
        raise AssertionError("zero-unit scenario should fail validation")
