from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models import PackagingMaterial, RecommendationHistory
from app.schemas import (
    RecommendationRequest,
    RecommendationResponse,
    CompareRequest,
    CompareResponse
)
from app.routes.materials import _format_material
from app.engine.risk_analyzer import analyze_food_risks
from app.engine.fresh_produce import evaluate_fresh_produce
from app.engine.rule_filter import filter_incompatible_materials
from app.engine.scorer import score_and_rank_materials, get_priority_weights
from app.engine.explainer import select_and_explain_recommendations

router = APIRouter(prefix="/api", tags=["Recommendation Engine"])

SCIENTIFIC_DISCLAIMER = (
    "This prototype provides decision support based on available food and packaging data. "
    "Packaging selection for commercial production should be validated by qualified food-packaging "
    "professionals and appropriate laboratory testing."
)

@router.post("/recommend", response_model=RecommendationResponse)
def get_packaging_recommendation(
    request: RecommendationRequest,
    db: Session = Depends(get_db)
):
    """
    Executes the enhanced transparent recommendation pipeline:
    1. Risk Analysis -> Generates structured risk profile & human-readable warnings
    2. Packaging Requirement Generation -> Translates risks into barrier/strength/gas needs
    3. Fresh Produce Evaluation -> MAP equilibrium profiles & chilling warnings
    4. Deterministic Compatibility Filtering -> Identifies unsuitable materials with explicit reasons
    5. Multi-Criteria Weighted Scoring -> Dynamic mathematical scoring across 6 dimensions
    6. Explainable Selection -> Generates ranked materials, score breakdown, limitations, and alternatives
    7. Telemetry Logging -> Logs decision support audit record to SQLite
    """
    all_materials = db.query(PackagingMaterial).all()
    if not all_materials:
        raise HTTPException(
            status_code=500,
            detail="Packaging materials database is empty. Please ensure seed data is loaded."
        )

    # Stage 1 & 2: Risk Profile & Requirement Deduction
    analysis = analyze_food_risks(request)
    risk_profile = analysis["risk_profile"]
    packaging_requirements = analysis["packaging_requirements"]
    detected_risks = analysis["detected_risks"]
    reqs = analysis["requirements"]

    # Stage 3: Fresh Produce & MAP Evaluation
    produce_guidance = evaluate_fresh_produce(request)

    # Stage 4: Compatibility Filtering
    eligible_materials, rejected_audit = filter_incompatible_materials(
        all_materials, request, reqs
    )

    if not eligible_materials:
        raise HTTPException(
            status_code=422,
            detail=(
                "No packaging materials in the database satisfied the strict safety/physical constraints. "
                f"Rejected candidates: {[r.material_name + ': ' + r.reason for r in rejected_audit]}"
            )
        )

    # Stage 5: Multi-Criteria Scoring & Ranking
    ranked_candidates = score_and_rank_materials(eligible_materials, request, reqs)

    # Stage 6: Explainable Selection & Dynamic Breakdown Generation
    primary_pick, alternatives, ranked_materials = select_and_explain_recommendations(
        ranked_candidates, request, reqs, risk_profile
    )

    # Compile Score Breakdown Summary
    priority_weights = get_priority_weights(request.user_priority)
    score_breakdown_summary: Dict[str, Any] = {
        "priority_configuration": request.user_priority.value,
        "applied_weights_percent": {k: round(v * 100.0, 1) for k, v in priority_weights.items()},
        "primary_material_code": primary_pick.material_code,
        "primary_material_name": primary_pick.material_name,
        "primary_breakdown": primary_pick.score_breakdown.model_dump() if primary_pick.score_breakdown else {},
        "total_score": primary_pick.total_score
    }

    # Compile Source Traceability Information
    source_information: List[Dict[str, str]] = [
        {
            "material_name": primary_pick.material_name,
            "citation": primary_pick.source_citation,
            "data_status": primary_pick.data_status
        }
    ]
    for alt in alternatives:
        source_information.append({
            "material_name": alt.material_name,
            "citation": alt.source_citation,
            "data_status": alt.data_status
        })

    # Stage 7: Audit Logging to SQLite
    try:
        log_entry = RecommendationHistory(
            commodity_name=request.commodity_name,
            user_priority=request.user_priority.value,
            storage_type=request.storage_type.value,
            primary_recommended_name=primary_pick.material_name,
            suitability_score=primary_pick.total_score,
            notes=f"Risks: {len(detected_risks)}, Rejected: {len(rejected_audit)}, Top Pick: {primary_pick.material_code}"
        )
        db.add(log_entry)
        db.commit()
    except Exception:
        db.rollback()  # Non-fatal telemetry logging

    return RecommendationResponse(
        status="SUCCESS",
        commodity_name=request.commodity_name,
        user_priority=request.user_priority.value,
        detected_risks=detected_risks,
        risk_profile=risk_profile,
        calculated_requirements=reqs,
        packaging_requirements=packaging_requirements,
        primary_recommendation=primary_pick,
        ranked_materials=ranked_materials,
        score_breakdown=score_breakdown_summary,
        recommendation_reason=primary_pick.why_selected,
        alternative_materials=alternatives,
        alternatives=alternatives,
        rejected_materials=rejected_audit,
        rejection_reasons=rejected_audit,
        fresh_produce_guidance=produce_guidance,
        data_status="DEMO DATA",
        source_information=source_information,
        scientific_disclaimer=SCIENTIFIC_DISCLAIMER
    )

@router.post("/materials/compare", response_model=CompareResponse)
def compare_materials(
    request: CompareRequest,
    db: Session = Depends(get_db)
):
    """
    Compares 2 to 4 packaging materials side-by-side for radar charts and spec matrices.
    """
    materials = db.query(PackagingMaterial).filter(
        PackagingMaterial.id.in_(request.material_ids)
    ).all()

    if len(materials) < len(request.material_ids):
        found_ids = {m.id for m in materials}
        missing = set(request.material_ids) - found_ids
        raise HTTPException(
            status_code=404,
            detail=f"Materials with IDs {list(missing)} not found."
        )

    # Preserve order of requested IDs
    mat_map = {m.id: m for m in materials}
    ordered = [mat_map[m_id] for m_id in request.material_ids]

    return CompareResponse(
        materials=[_format_material(m) for m in ordered]
    )
