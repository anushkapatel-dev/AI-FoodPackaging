"""
Multi-Criteria Weighted Scorer & Dynamic Score Breakdown Engine (SIH 26236)
===========================================================================
Calculates transparent scores across 6 dimensions:
1. Barrier Suitability
2. Food-Material Compatibility
3. Thermal & Storage Suitability
4. Mechanical & Transit Integrity
5. Commercial Cost Economy
6. Circular Sustainability

Generates exact, mathematically verifiable score breakdowns where category
max points equal the configured user priority weights (summing to 100.0).
"""

import json
from typing import List, Dict, Any, Tuple
from app.models import PackagingMaterial
from app.schemas import (
    RecommendationRequest,
    UserPriorityEnum,
    PackagingLayerSchema,
    WeightedScoreComponent,
    ScoreBreakdownDetail
)

QUALITATIVE_RANK = {
    "VERY_LOW": 1,
    "LOW": 2,
    "MEDIUM": 3,
    "HIGH": 4,
    "VERY_HIGH": 5
}

SEALABILITY_RANK = {
    "POOR": 1,
    "FAIR": 2,
    "GOOD": 3,
    "EXCELLENT": 4
}

FAT_RESISTANCE_RANK = {
    "POOR": 1,
    "FAIR": 2,
    "GOOD": 3,
    "EXCELLENT": 4
}

def get_priority_weights(priority: UserPriorityEnum) -> Dict[str, float]:
    """
    Returns normalized multi-criteria weighting vector based on user selection.
    Guarantees weights sum to exactly 1.00 (100%).
    """
    if priority == UserPriorityEnum.BARRIER:
        return {
            "barrier": 0.45,
            "compat": 0.20,
            "storage": 0.15,
            "mech": 0.10,
            "cost": 0.05,
            "eco": 0.05
        }
    elif priority == UserPriorityEnum.COST:
        return {
            "cost": 0.35,
            "barrier": 0.25,
            "compat": 0.15,
            "storage": 0.10,
            "mech": 0.10,
            "eco": 0.05
        }
    elif priority == UserPriorityEnum.SUSTAINABILITY:
        return {
            "eco": 0.35,
            "barrier": 0.25,
            "compat": 0.15,
            "storage": 0.10,
            "mech": 0.10,
            "cost": 0.05
        }
    else:  # Balanced
        return {
            "barrier": 0.35,
            "compat": 0.20,
            "storage": 0.15,
            "mech": 0.10,
            "cost": 0.10,
            "eco": 0.10
        }

def _calc_rank_delta_score(provided_level: str, required_level: str) -> float:
    p_val = QUALITATIVE_RANK.get(provided_level, 1)
    r_val = QUALITATIVE_RANK.get(required_level, 1)
    delta = p_val - r_val
    if delta >= 0:
        return 100.0  # Meets or exceeds requirement
    elif delta == -1:
        return 65.0   # Slightly below requirement
    elif delta == -2:
        return 35.0   # Deficient
    else:
        return 10.0   # Severely deficient

def score_barrier(mat: PackagingMaterial, reqs: Dict[str, Any], is_fresh: bool) -> float:
    """Evaluates barrier suitability against required moisture, oxygen, and light protection."""
    if is_fresh:
        if mat.is_breathable:
            return 98.0
        # Moderate semi-permeable films
        if mat.oxygen_barrier in ["LOW", "VERY_LOW"]:
            return 85.0
        elif mat.oxygen_barrier == "MEDIUM":
            return 70.0
        else:
            return 45.0  # Too airtight without active MAP engineering

    # Non-produce barrier calculations
    req_o2 = reqs.get("required_oxygen_barrier", reqs.get("oxygen_barrier", "LOW"))
    req_h2o = reqs.get("required_moisture_barrier", reqs.get("moisture_barrier", "LOW"))
    req_light = reqs.get("required_light_barrier", reqs.get("light_barrier", "TRANSPARENT"))

    s_o2 = _calc_rank_delta_score(mat.oxygen_barrier, req_o2)
    s_h2o = _calc_rank_delta_score(mat.moisture_barrier, req_h2o)
    
    # Light barrier score
    if req_light == "OPAQUE":
        s_light = 100.0 if mat.light_barrier == "OPAQUE" else (65.0 if mat.light_barrier == "SEMI_OPAQUE" else 35.0)
    elif req_light == "SEMI_OPAQUE":
        s_light = 100.0 if mat.light_barrier in ["OPAQUE", "SEMI_OPAQUE"] else 50.0
    else:
        s_light = 100.0  # Transparent is acceptable

    return round(0.45 * s_o2 + 0.45 * s_h2o + 0.10 * s_light, 1)

def score_compatibility(mat: PackagingMaterial, request: RecommendationRequest) -> float:
    """Evaluates food chemical matrix compatibility: lipid resistance, acidity, and category fit."""
    score = 80.0

    # 1. Fat / Oil solvent resistance
    if request.fat_content_percent > 15.0:
        mat_fat_rank = FAT_RESISTANCE_RANK.get(mat.fat_oil_resistance, 2)
        if mat_fat_rank == 4:    # EXCELLENT
            score += 15.0
        elif mat_fat_rank == 3:  # GOOD
            score += 8.0
        elif mat_fat_rank == 2:  # FAIR
            score -= 10.0
        else:                    # POOR
            score -= 25.0

    # 2. Acidity resistance (pH < 4.5)
    if request.ph_value < 4.5:
        if "PE" in mat.material_code or "PP" in mat.material_code or "PET" in mat.material_code:
            score += 5.0
        elif "PAPER" in mat.material_code:
            score -= 15.0

    # 3. Known suitable food categories match
    if mat.suitable_food_categories and request.commodity_name.lower() in mat.suitable_food_categories.lower():
        score += 10.0

    return float(max(10.0, min(100.0, round(score, 1))))

def score_storage(mat: PackagingMaterial, request: RecommendationRequest) -> float:
    """Evaluates thermal margin and storage type compatibility."""
    storage_type_str = request.storage_type.value if hasattr(request.storage_type, "value") else str(request.storage_type)
    score = 70.0

    # Check nominal storage compatibility tag
    if storage_type_str.lower() in mat.storage_compatibility.lower():
        score += 20.0

    # Thermal buffer margin
    temp = request.storage_temperature_c
    if temp >= mat.temp_min_c + 5.0 and temp <= mat.temp_max_c - 10.0:
        score += 10.0  # Comfortable middle of operational window
    elif temp < mat.temp_min_c + 2.0 or temp > mat.temp_max_c - 5.0:
        score -= 20.0  # Borderline operational limit

    return float(max(10.0, min(100.0, round(score, 1))))

def score_mechanical(mat: PackagingMaterial, request: RecommendationRequest) -> float:
    """Evaluates tensile, puncture, and hermetic heat-seal integrity."""
    s_seal = SEALABILITY_RANK.get(mat.sealability, 2) * 25.0  # 25, 50, 75, 100
    s_strength = QUALITATIVE_RANK.get(mat.mechanical_strength, 2) * 20.0  # 20, 40, 60, 80, 100

    transit_str = request.transportation_condition.value if hasattr(request.transportation_condition, "value") else str(request.transportation_condition)
    if transit_str in ["Rough Road / High Vibration", "Export / Maritime"]:
        return round(0.40 * s_seal + 0.60 * s_strength, 1)
    else:
        return round(0.50 * s_seal + 0.50 * s_strength, 1)

def score_cost(mat: PackagingMaterial) -> float:
    """
    Evaluates relative commercial economy based on relative cost index.
    Index 1.0 (Commodity PE) = 100
    Index 2.0 = 84
    Index 3.5 = 57
    Index 4.8 (Triplex foil) = 33.6
    """
    idx = mat.relative_cost_index
    score = max(20.0, min(100.0, 120.0 - (idx * 18.0)))
    return round(score, 1)

def score_sustainability(mat: PackagingMaterial) -> float:
    """Evaluates circular economy suitability, recyclability, and biodegradability."""
    if mat.biodegradability:
        return 100.0  # Certified industrially or home compostable
    elif mat.recyclability == "HIGHLY_RECYCLABLE":
        return 88.0   # Mono-polymer (e.g., pure LDPE, HDPE, PP)
    elif mat.recyclability == "RECYCLABLE":
        return 65.0   # Extrusion-coated or recyclable barrier coex
    else:
        return 28.0   # Non-separable multi-material laminate

def _build_component(raw: float, weight: float, label: str) -> WeightedScoreComponent:
    max_pts = round(weight * 100.0, 1)
    earned = round(min(max_pts, raw * weight), 1)
    return WeightedScoreComponent(
        earned_points=earned,
        max_points=max_pts,
        raw_score=round(raw, 1),
        weight_percentage=round(weight * 100.0, 1),
        display=f"{earned} / {max_pts}"
    )

def score_and_rank_materials(
    eligible_materials: List[PackagingMaterial],
    request: RecommendationRequest,
    requirements: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Evaluates eligible materials against user inputs using weighted multi-criteria decision analysis.
    Generates exact mathematically derived ScoreBreakdownDetail for each candidate.
    """
    weights = get_priority_weights(request.user_priority)
    is_fresh = request.is_fresh_produce
    scored_items = []

    for mat in eligible_materials:
        s_bar = score_barrier(mat, requirements, is_fresh)
        s_com = score_compatibility(mat, request)
        s_sto = score_storage(mat, request)
        s_mec = score_mechanical(mat, request)
        s_cst = score_cost(mat)
        s_eco = score_sustainability(mat)

        c_bar = _build_component(s_bar, weights["barrier"], "Barrier Suitability")
        c_com = _build_component(s_com, weights["compat"], "Food Compatibility")
        c_sto = _build_component(s_sto, weights["storage"], "Storage Suitability")
        c_mec = _build_component(s_mec, weights["mech"], "Mechanical Suitability")
        c_cst = _build_component(s_cst, weights["cost"], "Cost")
        c_eco = _build_component(s_eco, weights["eco"], "Sustainability")

        total_earned = round(
            c_bar.earned_points +
            c_com.earned_points +
            c_sto.earned_points +
            c_mec.earned_points +
            c_cst.earned_points +
            c_eco.earned_points,
            1
        )

        display_summary = (
            f"Barrier: {c_bar.display} | "
            f"Compatibility: {c_com.display} | "
            f"Storage: {c_sto.display} | "
            f"Mechanical: {c_mec.display} | "
            f"Cost: {c_cst.display} | "
            f"Sustainability: {c_eco.display} -> "
            f"Total: {total_earned}/100"
        )

        breakdown_detail = ScoreBreakdownDetail(
            barrier=c_bar,
            compatibility=c_com,
            storage=c_sto,
            mechanical=c_mec,
            cost=c_cst,
            sustainability=c_eco,
            total_earned=total_earned,
            total_max=100.0,
            display_summary=display_summary
        )

        # Parse layers JSON for client
        layers = []
        if mat.layers_json:
            try:
                raw_layers = json.loads(mat.layers_json)
                for item in raw_layers:
                    layers.append(PackagingLayerSchema(
                        layer_name=item.get("layer_name", "Layer"),
                        typical_thickness_microns=item.get("typical_thickness_microns", 0),
                        purpose=item.get("purpose", "")
                    ))
            except Exception:
                layers = []

        scored_items.append({
            "material": mat,
            "total_score": total_earned,
            "barrier_score": s_bar,
            "compatibility_score": s_com,
            "storage_score": s_sto,
            "mechanical_score": s_mec,
            "cost_score": s_cst,
            "sustainability_score": s_eco,
            "score_breakdown": breakdown_detail,
            "layers": layers
        })

    # Sort descending by total score
    scored_items.sort(key=lambda x: x["total_score"], reverse=True)
    return scored_items
