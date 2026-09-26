import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import PackagingMaterial
from app.schemas import PackagingMaterialResponse, PackagingLayerSchema

router = APIRouter(prefix="/api/materials", tags=["Packaging Materials"])

def _format_material(mat: PackagingMaterial) -> PackagingMaterialResponse:
    """Helper to parse layers_json and construct response schema."""
    layers_data = []
    if mat.layers_json:
        try:
            raw_layers = json.loads(mat.layers_json)
            for item in raw_layers:
                layers_data.append(PackagingLayerSchema(
                    layer_name=item.get("layer_name", "Layer"),
                    typical_thickness_microns=item.get("typical_thickness_microns", 0),
                    purpose=item.get("purpose", "")
                ))
        except (json.JSONDecodeError, TypeError):
            layers_data = []

    return PackagingMaterialResponse(
        id=mat.id,
        material_code=mat.material_code,
        name=mat.name,
        material_type=mat.material_type,
        oxygen_barrier=mat.oxygen_barrier,
        moisture_barrier=mat.moisture_barrier,
        sealability=mat.sealability,
        mechanical_strength=mat.mechanical_strength,
        fat_oil_resistance=mat.fat_oil_resistance,
        temp_min_c=mat.temp_min_c,
        temp_max_c=mat.temp_max_c,
        storage_compatibility=mat.storage_compatibility,
        light_barrier=mat.light_barrier,
        recyclability=mat.recyclability,
        biodegradability=mat.biodegradability,
        relative_cost_category=mat.relative_cost_category,
        relative_cost_index=mat.relative_cost_index,
        is_breathable=mat.is_breathable,
        layers_json=mat.layers_json,
        layers=layers_data,
        suitable_food_categories=mat.suitable_food_categories,
        source_name=mat.source_name,
        source_url=mat.source_url,
        source_reference=mat.source_reference,
        source_citation=mat.source_citation,
        data_status=mat.data_status,
        last_verified=mat.last_verified
    )

@router.get("", response_model=List[PackagingMaterialResponse])
def get_all_materials(
    material_type: Optional[str] = Query(None, description="Filter by material type"),
    biodegradable: Optional[bool] = Query(None, description="Filter biodegradable materials"),
    breathable: Optional[bool] = Query(None, description="Filter breathable / perforated films"),
    db: Session = Depends(get_db)
):
    """Retrieve all available packaging materials with qualitative barrier specifications."""
    query = db.query(PackagingMaterial)
    if material_type:
        query = query.filter(PackagingMaterial.material_type.ilike(f"%{material_type}%"))
    if biodegradable is not None:
        query = query.filter(PackagingMaterial.biodegradability == biodegradable)
    if breathable is not None:
        query = query.filter(PackagingMaterial.is_breathable == breathable)
        
    materials = query.all()
    return [_format_material(m) for m in materials]

@router.get("/{material_id}", response_model=PackagingMaterialResponse)
def get_material_by_id(material_id: int, db: Session = Depends(get_db)):
    """Retrieve specifications for a single packaging material by ID."""
    material = db.query(PackagingMaterial).filter(PackagingMaterial.id == material_id).first()
    if not material:
        raise HTTPException(
            status_code=404,
            detail=f"Packaging material with ID {material_id} not found."
        )
    return _format_material(material)
