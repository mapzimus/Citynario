from citynario_core.models import CityPackManifest
from fastapi import APIRouter, HTTPException

from citynario_api.composition import city_packs

router = APIRouter(prefix="/v1", tags=["catalog"])


@router.get("/meta")
async def metadata() -> dict[str, str]:
    return {
        "name": "Citynario API",
        "version": "0.1.0",
        "contract_version": "1.0",
        "positioning": "decision support, not prediction",
    }


@router.get("/city-packs", response_model=list[CityPackManifest])
async def list_city_packs() -> list[CityPackManifest]:
    return [pack.manifest for pack in city_packs().values()]


@router.get("/city-packs/{pack_reference}", response_model=CityPackManifest)
async def get_city_pack(pack_reference: str) -> CityPackManifest:
    pack = city_packs().get(pack_reference)
    if pack is None:
        raise HTTPException(status_code=404, detail="City Pack not found")
    return pack.manifest
