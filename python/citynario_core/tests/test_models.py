import pytest
from citynario_core.models import EstimateRange, HousingUnitMix, ResidentialDevelopmentInputs
from pydantic import ValidationError


def test_estimate_range_must_be_ordered() -> None:
    with pytest.raises(ValidationError):
        EstimateRange(low=2, central=1, high=3)


def test_housing_unit_mix_total() -> None:
    mix = HousingUnitMix(studio=10, one_bedroom=20, two_bedroom=5, three_plus_bedroom=1)
    assert mix.total == 36


def test_impervious_area_cannot_exceed_site() -> None:
    with pytest.raises(ValidationError):
        ResidentialDevelopmentInputs(
            units=HousingUnitMix(one_bedroom=10),
            site_area_square_feet=10_000,
            proposed_impervious_square_feet=12_000,
        )
