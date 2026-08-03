"""Built-in transparent simulation modules."""

from typing import cast

from citynario_core.engine import SimulationModule

from citynario_models.mobility import MobilityScreeningModule
from citynario_models.residents import ResidentEstimateModule
from citynario_models.schools import SchoolEnrollmentModule
from citynario_models.site import SiteContextModule


def built_in_modules() -> tuple[SimulationModule, ...]:
    return cast(
        tuple[SimulationModule, ...],
        (
            ResidentEstimateModule(),
            SchoolEnrollmentModule(),
            MobilityScreeningModule(),
            SiteContextModule(),
        ),
    )


__all__ = [
    "MobilityScreeningModule",
    "ResidentEstimateModule",
    "SchoolEnrollmentModule",
    "SiteContextModule",
    "built_in_modules",
]
