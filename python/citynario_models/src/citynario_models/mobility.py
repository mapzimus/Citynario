"""High-level mobility screening, not a traffic impact analysis."""

from citynario_core.engine import SimulationContext
from citynario_core.models import Indicator, ModuleResult

from citynario_models.common import assumption, multiply, trace


class MobilityScreeningModule:
    slug = "mobility_screening"
    version = "0.1.0"
    dependencies = ("resident_estimate",)

    def run(self, context: SimulationContext) -> ModuleResult:
        residents = context.indicator("added_residents").estimate
        trip_rate = assumption(context, "daily_person_trips_per_resident")
        vehicle_share = assumption(context, "vehicle_mode_share")
        person_trips = multiply(residents, trip_rate)
        vehicle_trips = multiply(person_trips, vehicle_share)
        person_trace = trace(
            module=self.slug,
            label="Daily person trips",
            operation="multiply_ranges",
            formula="added residents × daily person trips per resident",
            inputs={
                "added_residents": residents.model_dump(mode="json"),
                "daily_person_trips_per_resident": trip_rate.model_dump(mode="json"),
            },
            output=person_trips,
            assumptions=(trip_rate,),
        )
        vehicle_trace = trace(
            module=self.slug,
            label="Daily vehicle trips",
            operation="multiply_ranges",
            formula="daily person trips × vehicle mode share",
            inputs={
                "daily_person_trips": person_trips.model_dump(mode="json"),
                "vehicle_mode_share": vehicle_share.model_dump(mode="json"),
            },
            output=vehicle_trips,
            assumptions=(vehicle_share,),
        )
        return ModuleResult(
            module=self.slug,
            module_version=self.version,
            indicators=(
                Indicator(
                    id="daily_person_trips",
                    module=self.slug,
                    label="Estimated daily person trips",
                    estimate=person_trips,
                    unit="trips/day",
                    trace_root=person_trace.id,
                    interpretation="All-mode screening estimate under the selected trip rate.",
                ),
                Indicator(
                    id="daily_vehicle_trips",
                    module=self.slug,
                    label="Estimated daily vehicle trips",
                    estimate=vehicle_trips,
                    unit="trips/day",
                    trace_root=vehicle_trace.id,
                    interpretation="Screening estimate, not roadway or intersection performance.",
                ),
            ),
            traces=(person_trace, vehicle_trace),
            excluded_effects=(
                "Detailed roadway assignment and intersection operations",
                "Time-of-day and induced-travel effects",
            ),
        )
