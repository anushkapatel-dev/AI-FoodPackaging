from typing import List, Tuple, Dict, Any
from app.models import PackagingMaterial
from app.schemas import RecommendationRequest, RejectedMaterialAudit, RespirationCategoryEnum

def filter_incompatible_materials(
    materials: List[PackagingMaterial],
    request: RecommendationRequest,
    requirements: Dict[str, Any]
) -> Tuple[List[PackagingMaterial], List[RejectedMaterialAudit]]:
    """
    Applies deterministic food-science compatibility rules to prune unsuitable materials.
    Stores simple, transparent rejection reasons for auditability.
    """
    eligible: List[PackagingMaterial] = []
    rejected: List[RejectedMaterialAudit] = []

    storage_type_str = request.storage_type.value if hasattr(request.storage_type, "value") else str(request.storage_type)

    for mat in materials:
        # Rule 1: Storage Temperature Limits
        if request.storage_temperature_c < mat.temp_min_c:
            rejected.append(RejectedMaterialAudit(
                material_name=mat.name,
                rejection_stage="Temperature Incompatibility",
                reason=(
                    f"Storage temperature ({request.storage_temperature_c}°C) is below material "
                    f"minimum operating temperature ({mat.temp_min_c}°C). Polymer risks freeze embrittlement and pinholing."
                )
            ))
            continue

        if request.storage_temperature_c > mat.temp_max_c:
            rejected.append(RejectedMaterialAudit(
                material_name=mat.name,
                rejection_stage="Thermal Incompatibility",
                reason=(
                    f"Storage temperature ({request.storage_temperature_c}°C) exceeds material "
                    f"qualitative thermal threshold ({mat.temp_max_c}°C). Polymer risks softening and accelerated gas permeation."
                )
            ))
            continue

        # Rule 2: Frozen Storage Chain Suitability
        if storage_type_str == "Frozen":
            if mat.temp_min_c > -18.0 or "Frozen" not in mat.storage_compatibility:
                rejected.append(RejectedMaterialAudit(
                    material_name=mat.name,
                    rejection_stage="Frozen Storage Failure",
                    reason=(
                        "Material is unsuitable for sub-zero freezer chain storage (-18°C); lacks impact modifiers "
                        "and will suffer flex-crack pinholing."
                    )
                ))
                continue

        # Rule 3: Fresh Produce vs High-Barrier Film Mismatch
        if request.is_fresh_produce:
            # High respiration produce packed without MAP into airtight film will turn anaerobic
            if (not request.map_required and 
                request.respiration_category in [RespirationCategoryEnum.HIGH, RespirationCategoryEnum.EXTREMELY_HIGH] and
                not mat.is_breathable and 
                mat.oxygen_barrier in ["HIGH", "VERY_HIGH"]):
                rejected.append(RejectedMaterialAudit(
                    material_name=mat.name,
                    rejection_stage="Anaerobic Spoilage Hazard",
                    reason=(
                        "Airtight high-barrier film without micro-perforation or active MAP will choke fresh produce. "
                        "Produce respiration will deplete oxygen to < 1%, causing anaerobic fermentation, off-odors, and rotting."
                    )
                ))
                continue
        else:
            # Non-produce dry or moisture-sensitive foods CANNOT use breathable / perforated films
            if mat.is_breathable:
                rejected.append(RejectedMaterialAudit(
                    material_name=mat.name,
                    rejection_stage="Barrier Deficiency",
                    reason=(
                        f"Breathable structure is unsuitable for '{request.commodity_name}' because macroscopic pores "
                        "permit continuous oxygen and moisture ingress, defeating preservation requirements."
                    )
                ))
                continue

        # Rule 4: Fat / Oil Solvent Resistance
        if request.fat_content_percent > 20.0 and mat.fat_oil_resistance == "POOR":
            rejected.append(RejectedMaterialAudit(
                material_name=mat.name,
                rejection_stage="Chemical Incompatibility",
                reason=(
                    f"High fat/oil content ({request.fat_content_percent}%) will cause swelling, stress-cracking, "
                    "or delamination in contact polymers with poor lipid resistance."
                )
            ))
            continue

        eligible.append(mat)

    return eligible, rejected
