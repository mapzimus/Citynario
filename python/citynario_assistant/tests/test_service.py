from citynario_assistant import AssistantRequest, DeterministicDraftProvider, PlanningAssistant


def test_draft_extracts_only_explicit_units_and_requires_review() -> None:
    assistant = PlanningAssistant(DeterministicDraftProvider())
    draft = assistant.create_draft(
        AssistantRequest(
            prompt="Add 200 apartments near downtown.",
            city_pack="us-ma-lynn@0.1.0",
        )
    )
    assert draft.extracted_fields == {"total_housing_units": 200}
    assert "location" in draft.unresolved_fields
    assert draft.review_required
