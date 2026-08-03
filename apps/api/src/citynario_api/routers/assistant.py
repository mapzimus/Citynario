from citynario_assistant import AssistantDraft, AssistantRequest
from fastapi import APIRouter, Depends, HTTPException

from citynario_api.composition import planning_assistant
from citynario_api.config import Settings, get_settings

router = APIRouter(prefix="/v1/assistant", tags=["experimental"])


@router.post("/draft", response_model=AssistantDraft)
async def create_draft(
    request: AssistantRequest,
    settings: Settings = Depends(get_settings),
) -> AssistantDraft:
    if not settings.enable_experimental_assistant:
        raise HTTPException(
            status_code=404,
            detail="The planning assistant is outside the MVP and disabled by default.",
        )
    return planning_assistant().create_draft(request)
