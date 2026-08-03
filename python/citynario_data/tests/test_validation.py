from pathlib import Path

from citynario_data import validate_pack

PACK = Path(__file__).parents[3] / "city-packs" / "us-ma-lynn"


def test_lynn_pack_is_structurally_valid_but_explicitly_unverified() -> None:
    report = validate_pack(PACK)
    assert report.valid
    assert {finding.code for finding in report.findings} == {"sources.not_verified"}
