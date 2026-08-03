from citynario_pack_lynn import load_city_pack


def test_pack_manifest_and_assumptions_load() -> None:
    pack = load_city_pack()
    assert pack.manifest.reference == "us-ma-lynn@0.1.0"
    assert pack.manifest.baseline == "lynn-2026-07"
    assert "resident_estimate" in pack.manifest.enabled_modules
    assert pack.assumptions["occupancy_rate"].central == 0.94


def test_every_assumption_source_is_registered() -> None:
    pack = load_city_pack()
    registered = set(pack.source_titles)
    referenced = {source for item in pack.assumptions.values() for source in item.source_ids}
    assert referenced <= registered
