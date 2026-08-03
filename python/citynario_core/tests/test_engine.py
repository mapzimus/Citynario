from datetime import date

from citynario_core.engine import SimulationContext, SimulationEngine
from citynario_core.models import (
    CityPackManifest,
    CityPackSnapshot,
    EstimateRange,
    HousingUnitMix,
    Indicator,
    Intervention,
    Maintainer,
    MapView,
    ModuleResult,
    ResidentialDevelopmentInputs,
    ScenarioDefinition,
    ScenarioEnvelope,
    TraceNode,
)


class FirstModule:
    slug = "first"
    version = "1.0.0"
    dependencies: tuple[str, ...] = ()

    def run(self, context: SimulationContext) -> ModuleResult:
        estimate = EstimateRange(low=1, central=2, high=3)
        trace = TraceNode(
            id="trace_first",
            module=self.slug,
            label="First",
            operation="identity",
            formula="fixture",
            inputs={},
            output=estimate,
        )
        indicator = Indicator(
            id="first_value",
            module=self.slug,
            label="First",
            estimate=estimate,
            unit="count",
            trace_root=trace.id,
            interpretation="Fixture",
        )
        return ModuleResult(
            module=self.slug,
            module_version=self.version,
            indicators=(indicator,),
            traces=(trace,),
        )


class SecondModule(FirstModule):
    slug = "second"
    dependencies = ("first",)

    def run(self, context: SimulationContext) -> ModuleResult:
        assert context.indicator("first_value").estimate.central == 2
        result = super().run(context)
        return result.model_copy(update={"module": self.slug})


def scenario_and_pack() -> tuple[ScenarioEnvelope, CityPackSnapshot]:
    scenario = ScenarioEnvelope(
        city_pack="test-pack@0.1.0",
        baseline="test-baseline",
        scenario=ScenarioDefinition(
            name="Test",
            interventions=(
                Intervention(
                    type="residential_development",
                    inputs=ResidentialDevelopmentInputs(units=HousingUnitMix(one_bedroom=1)),
                ),
            ),
            assumption_set="central",
            requested_modules=("second",),
        ),
    )
    manifest = CityPackManifest(
        id="test-pack",
        name="Test",
        version="0.1.0",
        status="experimental",
        published_at=date(2026, 8, 2),
        baseline="test-baseline",
        maintainers=(Maintainer(name="Tests"),),
        map=MapView(center=(0, 0), zoom=10, bounds=(-1, -1, 1, 1)),
        enabled_modules=("first", "second"),
        assumption_sets=("central",),
        disclaimer="Test only.",
    )
    return scenario, CityPackSnapshot(
        manifest=manifest,
        assumption_set="central",
        assumptions={},
        source_titles={},
    )


def test_engine_resolves_dependencies_and_is_reproducible() -> None:
    scenario, pack = scenario_and_pack()
    result = SimulationEngine((SecondModule(), FirstModule())).run(scenario, pack)

    assert list(result.module_versions) == ["first", "second"]
    assert result.run_id.startswith("run_")
    repeated = SimulationEngine((FirstModule(), SecondModule())).run(scenario, pack)
    assert repeated.run_id == result.run_id
