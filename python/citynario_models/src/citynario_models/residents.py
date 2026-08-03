"""First-order estimate of residents added by proposed housing."""

from citynario_core.engine import SimulationContext
from citynario_core.models import Indicator, ModuleResult

from citynario_models.common import assumption, multiply, trace


class ResidentEstimateModule:
    slug = "resident_estimate"
    version = "0.1.0"
    dependencies: tuple[str, ...] = ()

    def run(self, context: SimulationContext) -> ModuleResult:
        units = sum(
            intervention.inputs.units.total
            for intervention in context.scenario.scenario.interventions
        )
        occupancy = assumption(context, "occupancy_rate")
        household_size = assumption(context, "people_per_occupied_unit")
        estimate = multiply(float(units), occupancy, household_size)
        root = trace(
            module=self.slug,
            label="Added residents",
            operation="multiply_ranges",
            formula="housing units × occupancy rate × residents per occupied unit",
            inputs={
                "housing_units": units,
                "occupancy_rate": occupancy.model_dump(mode="json"),
                "people_per_occupied_unit": household_size.model_dump(mode="json"),
            },
            output=estimate,
            assumptions=(occupancy, household_size),
        )
        return ModuleResult(
            module=self.slug,
            module_version=self.version,
            indicators=(
                Indicator(
                    id="added_residents",
                    module=self.slug,
                    label="Estimated added residents",
                    estimate=estimate,
                    unit="people",
                    trace_root=root.id,
                    interpretation="Plausible range under the selected occupancy assumptions.",
                ),
            ),
            traces=(root,),
            excluded_effects=(
                "Regional housing-market feedback",
                "Changes in household composition over time",
            ),
        )
