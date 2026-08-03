"""Simple user-input site context calculation."""

from citynario_core.engine import SimulationContext
from citynario_core.models import EstimateRange, Indicator, ModuleResult, RunWarning

from citynario_models.common import trace


class SiteContextModule:
    slug = "site_context"
    version = "0.1.0"
    dependencies: tuple[str, ...] = ()

    def run(self, context: SimulationContext) -> ModuleResult:
        site_area = sum(
            item.inputs.site_area_square_feet or 0
            for item in context.scenario.scenario.interventions
        )
        impervious = sum(
            item.inputs.proposed_impervious_square_feet or 0
            for item in context.scenario.scenario.interventions
        )
        if site_area == 0:
            return ModuleResult(
                module=self.slug,
                module_version=self.version,
                indicators=(),
                traces=(),
                warnings=(
                    RunWarning(
                        code="site_context.inputs_missing",
                        message=(
                            "Site area was not provided, so impervious share was not calculated."
                        ),
                        severity="info",
                    ),
                ),
                excluded_effects=("Existing site conditions and mapped environmental constraints",),
            )

        share = round(impervious / site_area * 100, 2)
        estimate = EstimateRange(low=share, central=share, high=share)
        root = trace(
            module=self.slug,
            label="Proposed impervious share",
            operation="divide",
            formula="proposed impervious square feet ÷ site square feet × 100",
            inputs={
                "proposed_impervious_square_feet": impervious,
                "site_area_square_feet": site_area,
            },
            output=estimate,
        )
        return ModuleResult(
            module=self.slug,
            module_version=self.version,
            indicators=(
                Indicator(
                    id="proposed_impervious_share",
                    module=self.slug,
                    label="Proposed impervious share",
                    estimate=estimate,
                    unit="percent",
                    trace_root=root.id,
                    interpretation="Share calculated only from user-entered proposed site values.",
                ),
            ),
            traces=(root,),
            excluded_effects=(
                "Existing site conditions and stormwater design",
                "Mapped environmental constraints and legal review",
            ),
        )
