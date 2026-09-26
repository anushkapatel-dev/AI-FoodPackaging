"""
Phase 2A Direct Function & Engine Verification Test Suite
========================================================
Runs tests without requiring external HTTP libraries by directly testing:
1. Catalog endpoints & response models (Commodities, Materials, Sources)
2. Scientific integrity audit & summary
3. Recommendation engine pipeline with:
   - Potato Chips (High lipid, ultra-low moisture)
   - Flour (Bulk dry grain, cost sensitive)
   - Fresh Strawberries (High respiration fresh produce with MAP)
   - Fresh Tomato (Moderate respiration fresh produce)
   - Resiliency test with partial/optional inputs
"""

import sys
import json
from app.database import SessionLocal
from app.routes.commodities import get_all_commodities, get_commodity_by_id
from app.routes.materials import get_all_materials, get_material_by_id
from app.routes.sources import get_all_sources, get_sources_audit_summary
from app.routes.recommendation import get_packaging_recommendation
from app.main import health_check
from app.schemas import RecommendationRequest, StorageTypeEnum, TransitConditionEnum, UserPriorityEnum, RespirationCategoryEnum
from app.data_manager import verify_dataset_integrity, get_database_summary

def run_tests():
    print("=" * 60)
    print("RUNNING PHASE 2A SCIENTIFIC DATA & ENGINE VERIFICATION")
    print("=" * 60)

    db = SessionLocal()
    try:
        # 1. Health & Database Counts
        health = health_check(db=db)
        print(f"[PASS] Health check: status={health.status}, DB Connected={health.database_connected}")
        assert health.total_commodities == 20, f"Expected 20 commodities, got {health.total_commodities}"
        assert health.total_materials == 15, f"Expected 15 materials, got {health.total_materials}"
        print(f"[PASS] Exact counts confirmed: {health.total_commodities} commodities, {health.total_materials} materials.")

        # 2. Verify Commodities Catalog
        comms = get_all_commodities(category=None, search=None, db=db)
        assert len(comms) == 20, f"Expected 20 commodities, got {len(comms)}"
        processed_count = sum(1 for c in comms if not c.is_fresh_produce)
        fresh_count = sum(1 for c in comms if c.is_fresh_produce)
        assert processed_count == 10, f"Expected 10 processed foods, got {processed_count}"
        assert fresh_count == 10, f"Expected 10 fresh produce items, got {fresh_count}"

        required_comm_fields = [
            "name", "category", "standard_moisture_percent", "standard_fat_percent",
            "standard_ph", "oxygen_sensitivity", "moisture_sensitivity", "light_sensitivity",
            "respiration_category", "typical_storage_type", "source_citation", "data_status",
            "source_name", "source_url", "source_reference", "last_verified"
        ]
        for c in comms:
            for field in required_comm_fields:
                val = getattr(c, field)
                assert val is not None, f"Commodity '{c.name}' has null field: {field}"
            assert c.data_status == "DEMO DATA", f"Commodity '{c.name}' must have status 'DEMO DATA'"
        print(f"[PASS] All 20 commodities (10 processed + 10 fresh) validated with complete metadata and 'DEMO DATA' tag.")

        # 3. Verify Materials Catalog
        mats = get_all_materials(material_type=None, biodegradable=None, breathable=None, db=db)
        assert len(mats) == 15, f"Expected 15 materials, got {len(mats)}"
        material_codes = [m.material_code for m in mats]
        assert "MET_PET" in material_codes, "MET_PET must be in packaging materials"
        assert "PA_EVOH_PE_COEX" in material_codes, "PA_EVOH_PE_COEX must be in packaging materials"
        assert "NATUREFLEX_CELLULOSE" in material_codes, "NATUREFLEX_CELLULOSE must be in packaging materials"

        for m in mats:
            assert m.data_status == "DEMO DATA", f"Material '{m.material_code}' must have status 'DEMO DATA'"
            assert m.source_citation, f"Material '{m.material_code}' missing source_citation"
            assert m.source_name, f"Material '{m.material_code}' missing source_name"
            assert len(m.layers) > 0, f"Material '{m.material_code}' missing cross-section layers"
        print(f"[PASS] All 15 packaging materials validated (including Met-PET, 7-Layer PA/EVOH/PE, NatureFlex).")

        # 4. Verify Scientific Sources Catalog & Integrity Audit
        sources = get_all_sources(db=db)
        assert len(sources) == 6, f"Expected 6 data sources, got {len(sources)}"
        print(f"[PASS] All 6 authoritative sources retrieved.")

        audit_result = get_sources_audit_summary(db=db)
        assert audit_result["status"] == "HEALTHY"
        assert audit_result["integrity_audit"]["total_issues"] == 0
        print(f"[PASS] Dataset integrity audit: Status={audit_result['status']}, Issues={audit_result['integrity_audit']['total_issues']}.")

        # 5. Recommendation Test A: Potato Chips (Snack, High lipid, ultra-low moisture)
        print("\n--- Test A: Potato Chips Recommendation ---")
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
        rec_chips = get_packaging_recommendation(req_chips, db=db)
        assert rec_chips.status == "SUCCESS"
        primary_chips = rec_chips.primary_recommendation
        print(f"  Primary Pick: {primary_chips.material_name} ({primary_chips.material_code})")
        print(f"  Prototype Compatibility Score: {primary_chips.total_score}/100")
        print(f"  Why Selected: {primary_chips.why_selected[0]}")
        rejected_chips = [r.material_name for r in rec_chips.rejected_materials]
        assert any("Laser Micro-Perforated" in r for r in rejected_chips), "Micro-perforated film must be rejected for potato chips"
        assert primary_chips.material_code in ["MET_BOPP", "MET_PET", "ALU_LAMINATE"]
        print("[PASS] Potato chips correctly matched high barrier metallized laminate and rejected breathable film.")

        # 6. Recommendation Test B: Flour (Cost Priority)
        print("\n--- Test B: Flour Recommendation (Cost Priority) ---")
        req_flour = RecommendationRequest(
            commodity_name="Flour",
            moisture_content_percent=12.5,
            fat_content_percent=1.5,
            ph_value=6.3,
            desired_shelf_life_days=90,
            storage_temperature_c=22.0,
            relative_humidity_percent=55.0,
            storage_type=StorageTypeEnum.AMBIENT,
            transportation_condition=TransitConditionEnum.STANDARD,
            is_fresh_produce=False,
            respiration_category=RespirationCategoryEnum.NONE,
            map_required=False,
            user_priority=UserPriorityEnum.COST
        )
        rec_flour = get_packaging_recommendation(req_flour, db=db)
        assert rec_flour.status == "SUCCESS"
        primary_flour = rec_flour.primary_recommendation
        print(f"  Primary Pick: {primary_flour.material_name} ({primary_flour.material_code})")
        print(f"  Cost Score: {primary_flour.cost_score}/100")
        print(f"  Relative Cost Category: {primary_flour.relative_cost_category}")
        assert primary_flour.relative_cost_category == "LOW"
        print("[PASS] Flour correctly recommended economical paper/polyolefin packaging.")

        # 7. Recommendation Test C: Fresh Strawberries (High Respiration Produce)
        print("\n--- Test C: Fresh Strawberries Recommendation ---")
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
        rec_straw = get_packaging_recommendation(req_straw, db=db)
        assert rec_straw.status == "SUCCESS"
        assert rec_straw.fresh_produce_guidance is not None
        guidance = rec_straw.fresh_produce_guidance
        print(f"  Produce Guidance: {guidance['category_description']}")
        print(f"  Gas Mix: {guidance['recommended_gas_mixture']}")
        print(f"  Primary Pick: {rec_straw.primary_recommendation.material_name}")
        assert rec_straw.primary_recommendation.material_code in ["MICRO_PERF_PE", "LDPE", "BOPP"]
        print("[PASS] Fresh Strawberries recommendation returned tailored post-harvest MAP guidance.")

        # 8. Recommendation Test D: Fresh Tomato (Moderate Respiration Produce)
        print("\n--- Test D: Fresh Tomato Recommendation ---")
        req_tomato = RecommendationRequest(
            commodity_name="Tomato",
            moisture_content_percent=94.5,
            fat_content_percent=0.2,
            ph_value=4.3,
            desired_shelf_life_days=21,
            storage_temperature_c=12.0,
            relative_humidity_percent=85.0,
            storage_type=StorageTypeEnum.REFRIGERATED,
            transportation_condition=TransitConditionEnum.STANDARD,
            is_fresh_produce=True,
            respiration_category=RespirationCategoryEnum.MODERATE,
            map_required=False,
            user_priority=UserPriorityEnum.BALANCED
        )
        rec_tomato = get_packaging_recommendation(req_tomato, db=db)
        assert rec_tomato.status == "SUCCESS"
        print(f"  Primary Pick: {rec_tomato.primary_recommendation.material_name}")
        print(f"  Fresh Guidance Included: {rec_tomato.fresh_produce_guidance['is_fresh_produce']}")
        print("[PASS] Fresh Tomato recommendation processed successfully.")

        # 9. Recommendation Test E: Partial/Default Inputs
        print("\n--- Test E: Engine Resiliency & Partial Inputs ---")
        req_min = RecommendationRequest(
            commodity_name="Generic Test Good",
            moisture_content_percent=25.0,
            fat_content_percent=4.0,
            ph_value=6.0,
            desired_shelf_life_days=60,
            storage_temperature_c=20.0,
            relative_humidity_percent=60.0
        )
        rec_min = get_packaging_recommendation(req_min, db=db)
        assert rec_min.status == "SUCCESS"
        print(f"  Status: {rec_min.status}, Recommended: {rec_min.primary_recommendation.material_name}")
        print("[PASS] Engine safely processed request with all optional parameters defaulted.")

        print("\n" + "=" * 60)
        print("ALL PHASE 2A TESTS PASSED WITH ZERO ERRORS!")
        print("=" * 60)
    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
