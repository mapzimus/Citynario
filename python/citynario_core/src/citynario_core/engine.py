"""Deterministic simulation module orchestration."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from citynario_core.ids import content_id
from citynario_core.models import (
    CityPackSnapshot,
    Indicator,
    ModuleResult,
    RunResult,
    ScenarioEnvelope,
)


class EngineConfigurationError(ValueError):
    """Raised when packs or modules cannot satisfy a scenario."""


@dataclass(frozen=True, slots=True)
class SimulationContext:
    scenario: ScenarioEnvelope
    city_pack: CityPackSnapshot
    prior_results: tuple[ModuleResult, ...]

    def indicator(self, indicator_id: str) -> Indicator:
        for result in self.prior_results:
            for indicator in result.indicators:
                if indicator.id == indicator_id:
                    return indicator
        raise EngineConfigurationError(f"required indicator is missing: {indicator_id}")


class SimulationModule(Protocol):
    slug: str
    version: str
    dependencies: tuple[str, ...]

    def run(self, context: SimulationContext) -> ModuleResult: ...


class SimulationEngine:
    """Resolve dependencies and execute immutable, deterministic modules."""

    def __init__(self, modules: tuple[SimulationModule, ...]) -> None:
        self._modules = {module.slug: module for module in modules}
        if len(self._modules) != len(modules):
            raise EngineConfigurationError("simulation module slugs must be unique")

    def run(self, scenario: ScenarioEnvelope, pack: CityPackSnapshot) -> RunResult:
        self._validate_pack(scenario, pack)
        ordered_modules = self._resolve_modules(scenario.scenario.requested_modules)
        results: list[ModuleResult] = []

        for module in ordered_modules:
            context = SimulationContext(scenario, pack, tuple(results))
            results.append(module.run(context))

        indicators = tuple(item for result in results for item in result.indicators)
        traces = tuple(item for result in results for item in result.traces)
        warnings = tuple(item for result in results for item in result.warnings)
        excluded = tuple(
            dict.fromkeys(item for result in results for item in result.excluded_effects)
        )
        versions = {result.module: result.module_version for result in results}
        run_payload = {
            "scenario": scenario.model_dump(mode="json"),
            "pack": pack.manifest.reference,
            "modules": versions,
        }

        return RunResult(
            run_id=content_id("run", run_payload),
            city_pack=pack.manifest.reference,
            baseline=scenario.baseline,
            assumption_set=pack.assumption_set,
            scenario_name=scenario.scenario.name,
            module_versions=versions,
            indicators=indicators,
            traces=traces,
            warnings=warnings,
            excluded_effects=excluded,
            disclaimer=pack.manifest.disclaimer,
        )

    def _validate_pack(self, scenario: ScenarioEnvelope, pack: CityPackSnapshot) -> None:
        if scenario.city_pack != pack.manifest.reference:
            raise EngineConfigurationError(
                f"scenario requests {scenario.city_pack}, loaded {pack.manifest.reference}"
            )
        if scenario.baseline != pack.manifest.baseline:
            raise EngineConfigurationError(
                f"scenario requests baseline {scenario.baseline}, loaded {pack.manifest.baseline}"
            )
        if scenario.scenario.assumption_set != pack.assumption_set:
            raise EngineConfigurationError("loaded assumption set does not match the scenario")
        disabled = set(scenario.scenario.requested_modules) - set(pack.manifest.enabled_modules)
        if disabled:
            raise EngineConfigurationError(
                f"modules are not enabled by this City Pack: {', '.join(sorted(disabled))}"
            )

    def _resolve_modules(self, requested: tuple[str, ...]) -> tuple[SimulationModule, ...]:
        ordered: list[SimulationModule] = []
        permanent: set[str] = set()
        temporary: set[str] = set()

        def visit(slug: str) -> None:
            if slug in permanent:
                return
            if slug in temporary:
                raise EngineConfigurationError(f"cyclic module dependency at {slug}")
            module = self._modules.get(slug)
            if module is None:
                raise EngineConfigurationError(f"simulation module is not installed: {slug}")
            temporary.add(slug)
            for dependency in module.dependencies:
                visit(dependency)
            temporary.remove(slug)
            permanent.add(slug)
            ordered.append(module)

        for slug in requested:
            visit(slug)
        return tuple(ordered)
