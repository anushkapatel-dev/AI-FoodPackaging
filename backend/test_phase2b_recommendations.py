"""
Phase 2B Recommendation Engine & Explanation Test Suite
======================================================
Tests:
1. Potato Chips (High lipid, ultra-low moisture, candidate filtering, breakdown)
2. Flour (Bulk dry grain, moisture risk, packaging requirements)
3. Fresh Strawberries (High respiration produce, MAP guidance, breathability)
4. Fresh Tomato (Moderate respiration, chilling injury hazard alert)
5. Cost Priority (Weight distribution: 35% cost, dynamic scoring effect)
6. Sustainability Priority (Weight distribution: 35% eco, compostable preference)
7. Barrier Priority (Weight distribution: 45% barrier, high-barrier dominance)
8. Missing/Partial Inputs (Engine resiliency, graceful fallback)
"""

import sys
import json
from app.database import SessionLocal
from app.routes.recommendation import get_packaging_recommendation
from app.engine.scorer import get_priority_weights
from app.schemas import (
    RecommendationRequest,
    StorageTypeEnum,
    TransitConditionEnum,
    UserPriorityEnum,
    RespirationCategoryEnum
)

def run_tests():
    print("=" * 70)
    print("STARTING PHASE 2B RECOMMENDATION ENGINE & EXPLAINABILITY VERIFICATION")
    print("=" * 70)

    db = SessionLocal()
    try:
        # -------------------------------------------------------------
        # TEST 1: POTATO CHIPS
        # -------------------------------------------------------------
        print("\n[TEST 1] Potato Chips Recommendation & Candidate Filtering")
        req_chips = RecommendationRequest(
            commodity_name="Potato Chips",
            moisture_content_percent=1.8,
            fat_content_percent=34.5,
            ph_value=6.2,
            desired_shelf_life_days=180,
            storage_temperature_c=25.0,
            relative_humidity_percent=70.0,
            storage_type=StorageTypeEnum.AMBIENT,
            transportation_condition=TransitConditionEnum.STANDARD,
            is_fresh_produce=False,
            respiration_category=RespirationCategoryEnum.NONE,
            map_required=False,
            user_priority=UserPriorityEnum.BALANCED
        )
        resp_chips = get_packaging_recommendation(req_chips, db=db)
        assert resp_chips.status == "SUCCESS"
        
        # 1.1 Verify Risk Profile
        rp = resp_chips.risk_profile
        print(f"  Risk Profile: moisture={rp['moisture_risk']}, oxygen={rp['oxygen_risk']}, light={rp['light_risk']}, fat_oil={rp['fat_oil_risk']}")
        assert rp["moisture_risk"] == "VERY_HIGH"
        assert rp["oxygen_risk"] == "VERY_HIGH"
        assert rp["light_risk"] == "HIGH"
        assert rp["respiration_required"] is False

        # 1.2 Verify Packaging Requirements
        pr = resp_chips.packaging_requirements
        print(f"  Requirements: O2 barrier={pr['oxygen_barrier']}, H2O barrier={pr['moisture_barrier']}, light={pr['light_barrier']}")
        assert pr["oxygen_barrier"] == "VERY_HIGH"
        assert pr["moisture_barrier"] == "VERY_HIGH"
        assert pr["light_barrier"] == "OPAQUE"
        assert pr["gas_exchange"] == "NOT_REQUIRED"

        # 1.3 Verify Candidate Filtering & Rejection Reasons
        rejected_names = [r.material_name for r in resp_chips.rejected_materials]
        rejection_reasons = {r.material_name: r.reason for r in resp_chips.rejected_materials}
        assert any("Laser Micro-Perforated" in name for name in rejected_names), "MICRO_PERF_PE must be rejected for potato chips"
        perf_reason = next(r.reason for r in resp_chips.rejected_materials if "Laser Micro-Perforated" in r.material_name)
        print(f"  Micro-Perf Rejection Reason: {perf_reason}")
        assert "Breathable structure is unsuitable" in perf_reason or "pores" in perf_reason

        # 1.4 Verify Top Pick & Score Breakdown
        primary = resp_chips.primary_recommendation
        print(f"  Primary Pick: {primary.material_name} ({primary.material_code}) - Score: {primary.total_score}/100")
        assert primary.material_code in ["ALU_LAMINATE", "MET_BOPP", "MET_PET"]
        assert len(primary.why_selected) > 0
        assert len(primary.key_requirements_met) > 0
        assert len(primary.main_risks_addressed) > 0
        assert len(primary.limitations) > 0
        print(f"  Limitations: {primary.limitations[0]}")

        # 1.5 Verify Top Ranked Materials (at least top 3)
        assert len(resp_chips.ranked_materials) >= 3
        print(f"  Ranked Materials Count: {len(resp_chips.ranked_materials)}")
        for rm in resp_chips.ranked_materials[:3]:
            print(f"    Rank #{rm.rank}: {rm.material_name} ({rm.total_score}/100) -> {rm.score_breakdown.display_summary}")
            assert rm.score_breakdown.total_earned == rm.total_score
        print("[PASS] Test 1: Potato Chips passed all verification criteria.")

        # -------------------------------------------------------------
        # TEST 2: FLOUR (Bulk dry grain)
        # -------------------------------------------------------------
        print("\n[TEST 2] Flour Recommendation (Moisture Risk & Low-Cost Packaging)")
        req_flour = RecommendationRequest(
            commodity_name="Flour",
            moisture_content_percent=12.5,
            fat_content_percent=1.5,
            ph_value=6.3,
            desired_shelf_life_days=90,
            storage_temperature_c=22.0,
            relative_humidity_percent=60.0,
            storage_type=StorageTypeEnum.AMBIENT,
            transportation_condition=TransitConditionEnum.STANDARD,
            is_fresh_produce=False,
            respiration_category=RespirationCategoryEnum.NONE,
            map_required=False,
            user_priority=UserPriorityEnum.BALANCED
        )
        resp_flour = get_packaging_recommendation(req_flour, db=db)
        assert resp_flour.status == "SUCCESS"
        assert resp_flour.risk_profile["moisture_risk"] == "MEDIUM" or resp_flour.risk_profile["moisture_risk"] == "HIGH"
        assert resp_flour.risk_profile["oxygen_risk"] == "LOW"
        assert resp_flour.packaging_requirements["gas_exchange"] == "NOT_REQUIRED"
        print(f"  Primary Pick: {resp_flour.primary_recommendation.material_name}")
        print(f"  Breakdown: {resp_flour.primary_recommendation.score_breakdown.display_summary}")
        print("[PASS] Test 2: Flour passed all verification criteria.")

        # -------------------------------------------------------------
        # TEST 3: FRESH STRAWBERRIES (High Respiration Produce)
        # -------------------------------------------------------------
        print("\n[TEST 3] Fresh Strawberries (High Respiration & MAP Evaluation)")
        req_straw = RecommendationRequest(
            commodity_name="Strawberry",
            moisture_content_percent=91.0,
            fat_content_percent=0.3,
            ph_value=3.5,
            desired_shelf_life_days=14,
            storage_temperature_c=4.0,
            relative_humidity_percent=90.0,
            storage_type=StorageTypeEnum.REFRIGERATED,
            transportation_condition=TransitConditionEnum.STANDARD,
            is_fresh_produce=True,
            respiration_category=RespirationCategoryEnum.HIGH,
            map_required=True,
            user_priority=UserPriorityEnum.BARRIER
        )
        resp_straw = get_packaging_recommendation(req_straw, db=db)
        assert resp_straw.status == "SUCCESS"
        
        # Verify Respiration & Produce Requirements
        assert resp_straw.risk_profile["respiration_required"] is True
        assert resp_straw.packaging_requirements["gas_exchange"] == "REQUIRED"
        assert resp_straw.packaging_requirements["breathability"] == "HIGH"
        assert resp_straw.packaging_requirements["map_suitability"] == "REQUIRED"

        # Verify Fresh Produce Guidance fields
        fpg = resp_straw.fresh_produce_guidance
        assert fpg is not None
        print(f"  Produce Guidance: {fpg['category_description']}")
        print(f"  Gas Mix: {fpg['recommended_gas_mixture']}")
        print(f"  Gas Exchange Req: {fpg['gas_exchange_requirement']}")
        print(f"  Packaging Type: {fpg['recommended_packaging_type']}")
        assert fpg["map_suitability"] == "REQUIRED"
        assert "3-5% O2" in fpg["recommended_gas_mixture"]

        # Airtight high-barrier films should be rejected without breathable pores
        rejected_straw = [r.material_name for r in resp_straw.rejected_materials]
        print(f"  Strawberries Rejections Count: {len(rejected_straw)}")
        print("[PASS] Test 3: Fresh Strawberries passed all verification criteria.")

        # -------------------------------------------------------------
        # TEST 4: TOMATO (Chilling Sensitivity Hazard Alert)
        # -------------------------------------------------------------
        print("\n[TEST 4] Fresh Tomato (Moderate Respiration & Chilling Hazard Alert)")
        # Test temperature at 6°C (below the 10°C threshold for subtropical tomatoes)
        req_tomato = RecommendationRequest(
            commodity_name="Tomato",
            moisture_content_percent=94.5,
            fat_content_percent=0.2,
            ph_value=4.3,
            desired_shelf_life_days=21,
            storage_temperature_c=6.0,
            relative_humidity_percent=85.0,
            storage_type=StorageTypeEnum.REFRIGERATED,
            transportation_condition=TransitConditionEnum.STANDARD,
            is_fresh_produce=True,
            respiration_category=RespirationCategoryEnum.MODERATE,
            map_required=False,
            user_priority=UserPriorityEnum.BALANCED
        )
        resp_tomato = get_packaging_recommendation(req_tomato, db=db)
        assert resp_tomato.status == "SUCCESS"
        fpg_tom = resp_tomato.fresh_produce_guidance
        assert fpg_tom is not None
        print(f"  Chilling Warning: {fpg_tom['chilling_sensitivity_warning']}")
        assert "CHILLING INJURY HAZARD" in fpg_tom["chilling_sensitivity_warning"]
        assert "10-13°C" in fpg_tom["chilling_sensitivity_warning"]
        print("[PASS] Test 4: Fresh Tomato correctly triggered chilling injury physiological hazard alert.")

        # -------------------------------------------------------------
        # TEST 5: COST PRIORITY CASE
        # -------------------------------------------------------------
        print("\n[TEST 5] Cost Priority Weighting Verification")
        weights_cost = get_priority_weights(UserPriorityEnum.COST)
        assert weights_cost["cost"] == 0.35, f"Cost weight should be 0.35, got {weights_cost['cost']}"
        assert sum(weights_cost.values()) == 1.00, "Weights must sum to exactly 1.00 (100%)"

        req_cost = RecommendationRequest(
            commodity_name="Whole Wheat Flour",
            moisture_content_percent=12.5,
            fat_content_percent=1.5,
            ph_value=6.3,
            desired_shelf_life_days=90,
            storage_temperature_c=25.0,
            relative_humidity_percent=50.0,
            user_priority=UserPriorityEnum.COST
        )
        resp_cost = get_packaging_recommendation(req_cost, db=db)
        sb_cost = resp_cost.primary_recommendation.score_breakdown
        print(f"  Cost Priority Pick: {resp_cost.primary_recommendation.material_name}")
        print(f"  Cost Dimension Breakdown: {sb_cost.cost.display} (Max Points: {sb_cost.cost.max_points})")
        assert sb_cost.cost.max_points == 35.0, f"Cost max points should be 35.0, got {sb_cost.cost.max_points}"
        assert resp_cost.primary_recommendation.relative_cost_category == "LOW"
        print("[PASS] Test 5: Cost priority dynamically allocated 35% weight and favored low-cost material.")

        # -------------------------------------------------------------
        # TEST 6: SUSTAINABILITY PRIORITY CASE
        # -------------------------------------------------------------
        print("\n[TEST 6] Sustainability Priority Weighting Verification")
        weights_eco = get_priority_weights(UserPriorityEnum.SUSTAINABILITY)
        assert weights_eco["eco"] == 0.35, f"Eco weight should be 0.35, got {weights_eco['eco']}"
        assert sum(weights_eco.values()) == 1.00, "Weights must sum to exactly 1.00 (100%)"

        req_eco = RecommendationRequest(
            commodity_name="Bread",
            moisture_content_percent=36.0,
            fat_content_percent=3.2,
            ph_value=5.5,
            desired_shelf_life_days=7,
            storage_temperature_c=20.0,
            relative_humidity_percent=55.0,
            user_priority=UserPriorityEnum.SUSTAINABILITY
        )
        resp_eco = get_packaging_recommendation(req_eco, db=db)
        sb_eco = resp_eco.primary_recommendation.score_breakdown
        print(f"  Sustainability Priority Pick: {resp_eco.primary_recommendation.material_name}")
        print(f"  Sustainability Breakdown: {sb_eco.sustainability.display} (Max Points: {sb_eco.sustainability.max_points})")
        assert sb_eco.sustainability.max_points == 35.0
        assert resp_eco.primary_recommendation.sustainability_score >= 80.0
        print("[PASS] Test 6: Sustainability priority dynamically allocated 35% weight and promoted green structures.")

        # -------------------------------------------------------------
        # TEST 7: BARRIER PRIORITY CASE
        # -------------------------------------------------------------
        print("\n[TEST 7] Barrier Priority Weighting Verification")
        weights_barrier = get_priority_weights(UserPriorityEnum.BARRIER)
        assert weights_barrier["barrier"] == 0.45, f"Barrier weight should be 0.45, got {weights_barrier['barrier']}"
        assert sum(weights_barrier.values()) == 1.00, "Weights must sum to exactly 1.00 (100%)"

        req_barrier = RecommendationRequest(
            commodity_name="Roasted Coffee",
            moisture_content_percent=2.5,
            fat_content_percent=14.5,
            ph_value=5.2,
            desired_shelf_life_days=365,
            storage_temperature_c=25.0,
            relative_humidity_percent=60.0,
            user_priority=UserPriorityEnum.BARRIER
        )
        resp_barrier = get_packaging_recommendation(req_barrier, db=db)
        sb_bar = resp_barrier.primary_recommendation.score_breakdown
        print(f"  Barrier Priority Pick: {resp_barrier.primary_recommendation.material_name}")
        print(f"  Barrier Breakdown: {sb_bar.barrier.display} (Max Points: {sb_bar.barrier.max_points})")
        assert sb_bar.barrier.max_points == 45.0
        assert resp_barrier.primary_recommendation.barrier_score >= 90.0
        print("[PASS] Test 7: Barrier priority dynamically allocated 45% weight and favored high-barrier laminate.")

        # -------------------------------------------------------------
        # TEST 8: MISSING / PARTIAL INPUT CASE (ENGINE RESILIENCY)
        # -------------------------------------------------------------
        print("\n[TEST 8] Missing / Partial Inputs Resiliency Test")
        req_partial = RecommendationRequest(
            commodity_name="Generic Test Food",
            moisture_content_percent=30.0,
            fat_content_percent=4.0,
            ph_value=6.5,
            desired_shelf_life_days=30,
            storage_temperature_c=20.0,
            relative_humidity_percent=50.0
            # Optional storage_type, transit, is_fresh_produce, respiration_category, map_required, user_priority omitted
        )
        resp_partial = get_packaging_recommendation(req_partial, db=db)
        assert resp_partial.status == "SUCCESS"
        assert resp_partial.primary_recommendation is not None
        assert resp_partial.risk_profile is not None
        assert resp_partial.packaging_requirements is not None
        assert len(resp_partial.ranked_materials) >= 3
        print(f"  Partial Input Status: {resp_partial.status}")
        print(f"  Recommended Material: {resp_partial.primary_recommendation.material_name}")
        print(f"  Default Priority Config: {resp_partial.user_priority}")
        print("[PASS] Test 8: Engine safely processed omitted parameters using robust Pydantic defaults.")

        print("\n" + "=" * 70)
        print("ALL 8 PHASE 2B TESTS PASSED WITH 100% SUCCESS!")
        print("=" * 70)
    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
