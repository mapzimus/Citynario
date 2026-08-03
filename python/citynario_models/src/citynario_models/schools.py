"""Screening estimate of added public-school enrollment."""

from citynario_core.engine import SimulationContext
from citynario_core.models import Indicator, ModuleResult

from citynario_models.common import assumption, multiply, trace


class SchoolEnrollmentModule:
    slug = "school_enrollment"
    version = "0.1.0"
    dependencies = ("resident_estimate",)

    def run(self, context: SimulationContext) -> ModuleResult:
        residents = context.indicator("added_residents").estimate
        school_age_share = assumption(context, "school_age_share")
        public_capture = assumption(context, "public_school_capture")
        estimate = multiply(residents, school_age_share, public_capture)
        root = trace(
            module=self.slug,
            label="Added public-school students",
            operation="multiply_ranges",
            formula="added residents × school-age share × public-school enrollment share",
            inputs={
                "added_residents": residents.model_dump(mode="json"),
                "school_age_share": school_age_share.model_dump(mode="json"),
                "public_school_capture": public_capture.model_dump(mode="json"),
            },
            output=estimate,
            assumptions=(school_age_share, public_capture),
        )
        return ModuleResult(
            module=self.slug,
            module_version=self.version,
            indicators=(
                Indicator(
                    id="added_public_school_students",
                    module=self.slug,
                    label="Estimated added public-school students",
                    estimate=estimate,
                    unit="students",
                    trace_root=root.id,
                    interpretation="Screening range; it does not assign students to a school.",
                ),
            ),
            traces=(root,),
            excluded_effects=(
                "Student assignment to individual schools",
                "Grade-level distribution and classroom scheduling",
            ),
        )
