"""
Explainable Recommendation & Scientific Rationale Engine (SIH 26236)
====================================================================
Generates auditable, evidence-aware explanation fields:
- why_selected: Decisive rationale for material selection
- key_requirements_met: Explicit alignment with deduced physical barrier specs
- main_risks_addressed: Concrete chemical, physical, and biological mitigations
- limitations: Transparent engineering constraints and recycling trade-offs
- ranked_materials: Top ranked alternatives with exact mathematical score breakdowns
"""

from typing import List, Dict, Any, Tuple, Optional
from app.models import PackagingMaterial
from app.schemas import (
    MaterialScoreDetail,
    RankedMaterialDetail,
    RecommendationRequest,
    PackagingLayerSchema,
    ScoreBreakdownDetail
)

MATERIAL_LIMITATIONS_CATALOG = {
    "ALU_LAMINATE": [
        "Multi-material aluminum foil/polymer triplex laminate cannot be separated in standard domestic curbside recycling streams.",
        "Completely opaque foil prevents consumer visual inspection of the packed product inside the pouch."
    ],
    "MET_BOPP": [
        "Vacuum metallized layer may develop microscopic pinholes or crack if subjected to sharp repetitive folding or creasing.",
        "Difficult multi-material recycling stream compared to pure mono-polyolefins."
    ],
    "MET_PET": [
        "Multi-material laminate creates challenges in post-consumer mechanical recycling.",
        "Requires dedicated heat-seal polyolefin inner ply as PET itself cannot form low-temperature hermetic seals."
    ],
    "EVOH_COEX": [
        "EVOH barrier layer is hydrophilic; moisture ingress weakens gas barrier if PE protective skin layers are compromised.",
        "Higher raw material cost index relative to commodity single-resin polyolefins."
    ],
    "PA_EVOH_PE_COEX": [
        "Multi-layer 7-ply coextrusion requires precise blown-film extrusion processing and compatible tie resins.",
        "Higher cost index compared to standard LDPE mono-films."
    ],
    "PAPER_PE": [
        "Cellulosic substrate offers minimal oxygen barrier, restricting suitability for high-fat long-shelf-life goods.",
        "Extrusion PE coat must be maintained dry; prolonged liquid immersion softens paper fiber matrix."
    ],
    "LDPE": [
        "High gas permeability (very low oxygen barrier) limits room-temperature shelf life for lipid-rich or oxygen-sensitive items.",
        "Lower puncture and tensile strength compared to biaxially oriented films."
    ],
    "HDPE": [
        "Translucent/semi-opaque appearance with lower optical clarity than BOPP or PET.",
        "Low oxygen barrier requires secondary barrier or vacuum flush for oxygen-sensitive matrix."
    ],
    "PP": [
        "Sub-zero embrittlement risk: cast polypropylene loses impact resistance near 0°C; unsuited for frozen storage.",
        "Moderate oxygen transmission rate requires barrier coating for extended ambient storage."
    ],
    "BOPP": [
        "Moderate oxygen barrier insufficient on its own for ultra-long preservation of high-fat fried foods without metallization.",
        "Sensitive to high-temperature thermal deformation above 120°C."
    ],
    "PET": [
        "Poor heat-sealability: requires PE or sealant laminate layer to form hermetic pouch closures.",
        "Moderate water vapor barrier compared to high-density polyolefins or metallized films."
    ],
    "PLA": [
        "Thermal softening ceiling at ~55-60°C restricts use in hot-fill, microwave, or high-ambient heat environments.",
        "Requires certified industrial composting facility (>58°C, high RH) for complete biological assimilation."
    ],
    "PBAT_PLA_BLEND": [
        "Higher oxygen and water vapor transmission rates than conventional fossil-fuel barrier laminates.",
        "Higher manufacturing raw material cost index compared to standard polyethylene."
    ],
    "MICRO_PERF_PE": [
        "Macroscopic laser micro-perforations permit continuous moisture and oxygen ingress; completely unsuitable for dry or processed foods.",
        "Requires cold chain refrigeration (0-4°C) to prevent rapid fungal development."
    ],
    "NATUREFLEX_CELLULOSE": [
        "Bio-cellulose moisture barrier is moderate relative to aluminum foil or metallized films.",
        "Higher raw material cost index relative to standard commodity polyolefins."
    ]
}

def generate_material_limitations(mat: PackagingMaterial) -> List[str]:
    """Retrieves scientifically verified engineering limitations and recycling trade-offs."""
    if mat.material_code in MATERIAL_LIMITATIONS_CATALOG:
        return MATERIAL_LIMITATIONS_CATALOG[mat.material_code]
    
    # Dynamic fallback based on material properties
    limits = []
    if mat.recyclability == "DIFFICULT_MULTI_MATERIAL":
        limits.append("Multi-material composite structure cannot be separated in standard mono-material recycling streams.")
    if mat.oxygen_barrier in ["LOW", "VERY_LOW"]:
        limits.append("Low oxygen barrier limits long-term ambient preservation of oxygen-sensitive or high-fat products.")
    if mat.biodegradability:
        limits.append("Bio-degradable polymer exhibits lower thermal resistance threshold compared to conventional polyesters.")
    return limits or ["Standard single-use plastic considerations apply."]

def generate_key_requirements_met(
    mat: PackagingMaterial,
    request: RecommendationRequest,
    reqs: Dict[str, Any]
) -> List[str]:
    """Generates explicit list of physical packaging requirements satisfied by candidate."""
    met = []
    
    # 1. Moisture requirement
    req_moisture = reqs.get("required_moisture_barrier", reqs.get("moisture_barrier", "LOW"))
    met.append(f"Moisture Protection: Provides {mat.moisture_barrier.replace('_', ' ').lower()} barrier against moisture ingress (requirement: {req_moisture.replace('_', ' ').lower()}).")
    
    # 2. Oxygen requirement
    req_o2 = reqs.get("required_oxygen_barrier", reqs.get("oxygen_barrier", "LOW"))
    met.append(f"Oxygen Control: Offers {mat.oxygen_barrier.replace('_', ' ').lower()} oxygen barrier (requirement: {req_o2.replace('_', ' ').lower()}).")

    # 3. Light shielding
    if reqs.get("required_light_barrier") == "OPAQUE":
        met.append(f"Light Shielding: {mat.light_barrier.lower()} structure blocks ultraviolet and visible photo-oxidation.")

    # 4. Mechanical & seal
    met.append(f"Mechanical & Seal Integrity: Delivers {mat.mechanical_strength.lower()} strength and {mat.sealability.lower()} heat seal strength.")

    # 5. Thermal compatibility
    storage_type_str = request.storage_type.value if hasattr(request.storage_type, "value") else str(request.storage_type)
    met.append(f"Thermal Envelope: Operating range ({mat.temp_min_c}°C to {mat.temp_max_c}°C) encompasses {storage_type_str} storage ({request.storage_temperature_c}°C).")

    return met

def generate_main_risks_addressed(
    mat: PackagingMaterial,
    request: RecommendationRequest,
    risk_profile: Dict[str, Any]
) -> List[str]:
    """Maps candidate material strengths directly against detected food risks."""
    risks_addressed = []

    if risk_profile.get("moisture_risk") in ["HIGH", "VERY_HIGH"]:
        risks_addressed.append("Mitigates Crispness Loss & Sogginess: High moisture barrier stops vapor absorption from ambient relative humidity.")
    
    if risk_profile.get("oxygen_risk") in ["HIGH", "VERY_HIGH"]:
        risks_addressed.append("Suppresses Lipid Oxidation: Low O2 transmission halts peroxide formation, rancid odors, and hexanal spoilage.")

    if risk_profile.get("light_risk") in ["HIGH", "VERY_HIGH"]:
        risks_addressed.append("Prevents Photodegradation: Opaque barrier shields sensitive lipids, vitamins, and natural pigments from light catalyzed decay.")

    if risk_profile.get("fat_oil_risk") in ["HIGH", "VERY_HIGH"]:
        risks_addressed.append("Resists Oil Delamination: Chemically inert polyolefin inner contact surface prevents oil softening and pinholing.")

    if risk_profile.get("temperature_risk") == "HIGH":
        risks_addressed.append("Withstands Temperature Stress: Preserves seal toughness and flex-crack resistance under target thermal conditions.")

    if risk_profile.get("mechanical_risk") == "HIGH":
        risks_addressed.append("Withstands Transit Vibration: High puncture resistance and tensile tenacity protect pouch integrity on rough distribution routes.")

    if risk_profile.get("respiration_required"):
        if mat.is_breathable:
            risks_addressed.append("Averts Anaerobic Produce Spoilage: Engineered micro-perforations maintain oxygen equilibrium, preventing off-flavors.")
        else:
            risks_addressed.append("Preserves Post-Harvest Respiration Balance: Compatible with modified atmosphere gas flushing.")

    return risks_addressed

def generate_primary_explanations(
    primary: Dict[str, Any],
    request: RecommendationRequest,
    reqs: Dict[str, Any],
    risk_profile: Dict[str, Any]
) -> List[str]:
    """Generates human-readable, transparent reasons for why this material was chosen as top pick."""
    mat = primary["material"]
    reasons = []

    priority_str = request.user_priority.value if hasattr(request.user_priority, "value") else str(request.user_priority)
    reasons.append(
        f"Ranked #1 with a Prototype Compatibility Score of {primary['total_score']}/100 under {priority_str} priority configuration."
    )

    if reqs.get("required_moisture_barrier") in ["HIGH", "VERY_HIGH"]:
        reasons.append(
            f"Provides {mat.moisture_barrier.lower().replace('_', ' ')} moisture barrier "
            f"to protect low moisture content ({request.moisture_content_percent}%) from ambient humidity ({request.relative_humidity_percent}% RH)."
        )

    if request.fat_content_percent > 15.0:
        reasons.append(
            f"Combines {mat.oxygen_barrier.lower().replace('_', ' ')} oxygen barrier with {mat.light_barrier.lower()} shielding "
            f"to halt oxidative rancidity in lipid matrix ({request.fat_content_percent}% fat)."
        )

    if request.is_fresh_produce:
        if mat.is_breathable:
            reasons.append(
                "Engineered micro-perforations maintain continuous aerobic gas exchange matching produce respiration rate."
            )
        else:
            reasons.append(
                "Compatible with equilibrium modified atmosphere packaging (EMAP) to retard senescence."
            )

    storage_type_str = request.storage_type.value if hasattr(request.storage_type, "value") else str(request.storage_type)
    reasons.append(
        f"Qualitative thermal compatibility ({mat.storage_compatibility}) encompasses required {storage_type_str} storage."
    )

    return reasons

def build_material_score_detail(
    item: Dict[str, Any],
    why_selected: List[str],
    key_reqs: List[str],
    main_risks: List[str],
    limitations: List[str]
) -> MaterialScoreDetail:
    """Constructs backward-compatible MaterialScoreDetail with enhanced breakdown."""
    mat = item["material"]
    
    if mat.biodegradability:
        eco_badge = "Bio-Compostable"
    elif mat.recyclability == "HIGHLY_RECYCLABLE":
        eco_badge = "Circular Recyclable"
    elif mat.recyclability == "RECYCLABLE":
        eco_badge = "Standard Recyclable"
    else:
        eco_badge = "Multi-Material Laminate"

    return MaterialScoreDetail(
        material_id=mat.id,
        material_code=mat.material_code,
        material_name=mat.name,
        material_type=mat.material_type,
        total_score=item["total_score"],
        barrier_score=item["barrier_score"],
        compatibility_score=item["compatibility_score"],
        storage_score=item["storage_score"],
        mechanical_score=item["mechanical_score"],
        cost_score=item["cost_score"],
        sustainability_score=item["sustainability_score"],
        relative_cost_category=mat.relative_cost_category,
        sustainability_badge=eco_badge,
        layers=item["layers"],
        why_selected=why_selected,
        key_requirements_met=key_reqs,
        main_risks_addressed=main_risks,
        limitations=limitations,
        score_breakdown=item.get("score_breakdown"),
        source_citation=mat.source_citation,
        data_status=mat.data_status
    )

def build_ranked_material_detail(
    item: Dict[str, Any],
    rank: int,
    why_selected: List[str],
    key_reqs: List[str],
    main_risks: List[str],
    limitations: List[str]
) -> RankedMaterialDetail:
    """Constructs RankedMaterialDetail showing dynamic scoring breakdown and rank position."""
    mat = item["material"]

    if mat.biodegradability:
        eco_badge = "Bio-Compostable"
    elif mat.recyclability == "HIGHLY_RECYCLABLE":
        eco_badge = "Circular Recyclable"
    elif mat.recyclability == "RECYCLABLE":
        eco_badge = "Standard Recyclable"
    else:
        eco_badge = "Multi-Material Laminate"

    return RankedMaterialDetail(
        rank=rank,
        material_id=mat.id,
        material_code=mat.material_code,
        material_name=mat.name,
        material_type=mat.material_type,
        total_score=item["total_score"],
        score_breakdown=item["score_breakdown"],
        why_selected=why_selected,
        key_requirements_met=key_reqs,
        main_risks_addressed=main_risks,
        limitations=limitations,
        relative_cost_category=mat.relative_cost_category,
        sustainability_badge=eco_badge,
        layers=item["layers"],
        source_citation=mat.source_citation,
        data_status=mat.data_status
    )

def select_and_explain_recommendations(
    ranked_candidates: List[Dict[str, Any]],
    request: RecommendationRequest,
    reqs: Dict[str, Any],
    risk_profile: Dict[str, Any]
) -> Tuple[MaterialScoreDetail, List[MaterialScoreDetail], List[RankedMaterialDetail]]:
    """
    Selects Primary pick, Eco alternative, Budget alternative, and compiles the
    top ranked candidates with transparent algorithmic score breakdowns.
    """
    if not ranked_candidates:
        raise ValueError("No eligible materials survived the compatibility filters.")

    # 1. PRIMARY RECOMMENDATION
    primary_item = ranked_candidates[0]
    primary_mat = primary_item["material"]
    primary_why = generate_primary_explanations(primary_item, request, reqs, risk_profile)
    primary_reqs = generate_key_requirements_met(primary_mat, request, reqs)
    primary_risks = generate_main_risks_addressed(primary_mat, request, risk_profile)
    primary_limits = generate_material_limitations(primary_mat)

    primary_dto = build_material_score_detail(
        primary_item, primary_why, primary_reqs, primary_risks, primary_limits
    )

    # 2. ALTERNATIVES SELECTION
    alternatives: List[MaterialScoreDetail] = []
    used_ids = {primary_mat.id}

    # Best Eco-friendly alternative
    eco_candidate = None
    for cand in ranked_candidates[1:]:
        c_mat = cand["material"]
        if c_mat.id not in used_ids and (c_mat.biodegradability or c_mat.recyclability in ["HIGHLY_RECYCLABLE", "COMPOSTABLE"]):
            eco_candidate = cand
            break

    if eco_candidate:
        used_ids.add(eco_candidate["material"].id)
        eco_mat = eco_candidate["material"]
        eco_why = [
            f"Sustainability Alternative: {eco_mat.recyclability.replace('_', ' ').title()} "
            f"{'with certified biodegradability' if eco_mat.biodegradability else 'for circular recycling stream'}.",
            f"Achieves a sustainability score of {eco_candidate['sustainability_score']}/100 with viable barrier suitability for shorter supply loops."
        ]
        alternatives.append(build_material_score_detail(
            eco_candidate, eco_why,
            generate_key_requirements_met(eco_mat, request, reqs),
            generate_main_risks_addressed(eco_mat, request, risk_profile),
            generate_material_limitations(eco_mat)
        ))

    # Best Budget / Cost-effective alternative
    remaining_sorted_by_cost = sorted(
        [c for c in ranked_candidates[1:] if c["material"].id not in used_ids],
        key=lambda x: (x["material"].relative_cost_index, -x["total_score"])
    )

    if remaining_sorted_by_cost:
        budget_candidate = remaining_sorted_by_cost[0]
        used_ids.add(budget_candidate["material"].id)
        b_mat = budget_candidate["material"]
        budget_why = [
            f"Cost-Effective Alternative: {b_mat.relative_cost_category} relative cost category "
            f"(Index {b_mat.relative_cost_index}x).",
            "Offers commercial packaging economy where budget constraints outweigh high barrier margins."
        ]
        alternatives.append(build_material_score_detail(
            budget_candidate, budget_why,
            generate_key_requirements_met(b_mat, request, reqs),
            generate_main_risks_addressed(b_mat, request, risk_profile),
            generate_material_limitations(b_mat)
        ))

    # Fallback to ensure 2 alternatives
    for cand in ranked_candidates[1:]:
        if len(alternatives) >= 2:
            break
        if cand["material"].id not in used_ids:
            used_ids.add(cand["material"].id)
            c_mat = cand["material"]
            c_why = [
                f"Runner-up Alternative with Prototype Compatibility Score of {cand['total_score']}/100."
            ]
            alternatives.append(build_material_score_detail(
                cand, c_why,
                generate_key_requirements_met(c_mat, request, reqs),
                generate_main_risks_addressed(c_mat, request, risk_profile),
                generate_material_limitations(c_mat)
            ))

    # 3. BUILD TOP RANKED MATERIALS (Top 3 or more) WITH BREAKDOWNS
    ranked_dtos: List[RankedMaterialDetail] = []
    for idx, item in enumerate(ranked_candidates[:5], start=1):
        c_mat = item["material"]
        why_list = (
            primary_why if idx == 1 
            else [f"Rank #{idx} alternative option scoring {item['total_score']}/100 overall."]
        )
        ranked_dtos.append(build_ranked_material_detail(
            item=item,
            rank=idx,
            why_selected=why_list,
            key_reqs=generate_key_requirements_met(c_mat, request, reqs),
            main_risks=generate_main_risks_addressed(c_mat, request, risk_profile),
            limitations=generate_material_limitations(c_mat)
        ))

    return primary_dto, alternatives, ranked_dtos
