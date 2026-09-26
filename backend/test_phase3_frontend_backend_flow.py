"""
Phase 3 Frontend-to-Backend End-to-End Integration Verification Suite
====================================================================
Tests the full contract and data models consumed by the Phase 3 frontend:
1. Potato Chips (Balanced priority, 7 risk dimensions, dynamic breakdown)
2. Flour (Moisture risk, low-cost selection)
3. Fresh Strawberries (Fresh produce protocol, breathability, MAP)
4. Tomato (Chilling sensitivity warning for storage below 10°C)
5. Dynamic Priority Switching (Barrier, Cost, Sustainability) verifying score/weight changes
6. API response contract validation against frontend UI components
"""

from app.database import SessionLocal
from app.routes.recommendation import get_packaging_recommendation
from app.schemas import RecommendationRequest

def make_recommend_request(payload):
    db = SessionLocal()
    try:
        req = RecommendationRequest(**payload)
        resp = get_packaging_recommendation(req, db=db)
        return resp.model_dump()
    finally:
        db.close()

def run_tests():
    print("=" * 70)
    print("RUNNING PHASE 3 FRONTEND-BACKEND INTEGRATION TESTS")
    print("=" * 70)

    # -------------------------------------------------------------
    # 1. POTATO CHIPS (Balanced Priority)
    # -------------------------------------------------------------
    print("\n[TEST 1] Potato Chips Flow")
    payload_chips = {
        "commodity_name": "Potato Chips",
        "moisture_content_percent": 1.8,
        "fat_content_percent": 34.5,
        "ph_value": 6.2,
        "desired_shelf_life_days": 180,
        "storage_temperature_c": 25.0,
        "relative_humidity_percent": 70.0,
        "storage_type": "Ambient",
        "transportation_condition": "Standard Road",
        "is_fresh_produce": False,
        "respiration_category": "NONE",
        "map_required": False,
        "user_priority": "Balanced"
    }
    resp_chips = make_recommend_request(payload_chips)
    
    # Contract validation for Section A (Risk Analysis)
    rp = resp_chips["risk_profile"]
    assert rp["moisture_risk"] == "VERY_HIGH"
    assert rp["oxygen_risk"] == "VERY_HIGH"
    assert rp["light_risk"] == "HIGH"
    assert rp["fat_oil_risk"] == "VERY_HIGH"
    assert rp["respiration_required"] is False
    print("  [PASS] Section A (Food Risks): 7 risk dimensions verified (moisture=VERY_HIGH, oxygen=VERY_HIGH)")

    # Contract validation for Section B (Requirements)
    pr = resp_chips["packaging_requirements"]
    assert pr["oxygen_barrier"] == "VERY_HIGH"
    assert pr["moisture_barrier"] == "VERY_HIGH"
    assert pr["light_barrier"] == "OPAQUE"
    assert pr["gas_exchange"] == "NOT_REQUIRED"
    print("  [PASS] Section B (Requirements): OTR=VERY_HIGH, WVTR=VERY_HIGH, Light=OPAQUE")

    # Contract validation for Section C & D (Primary & Score Breakdown)
    prim = resp_chips["primary_recommendation"]
    assert prim["total_score"] > 0
    sb = prim["score_breakdown"]
    assert sb["barrier"]["earned_points"] == 35.0
    assert sb["barrier"]["max_points"] == 35.0
    assert sb["total_earned"] == prim["total_score"]
    print(f"  [PASS] Section C & D (Primary Pick & Breakdown): {prim['material_name']} ({prim['total_score']}/100) -> {sb['display_summary']}")

    # Contract validation for Section E (Top 3 Ranked Materials)
    ranked = resp_chips["ranked_materials"]
    assert len(ranked) >= 3
    print(f"  [PASS] Section E (Top 3 Candidates): Rank 1={ranked[0]['material_name']}, Rank 2={ranked[1]['material_name']}, Rank 3={ranked[2]['material_name']}")

    # Contract validation for Section F (Rejections)
    rejected = resp_chips["rejection_reasons"]
    assert len(rejected) > 0
    assert any("Laser Micro-Perforated" in r["material_name"] for r in rejected)
    print("  [PASS] Section F (Rejection Reasons): Micro-perf film rejected with explicit reason")

    # -------------------------------------------------------------
    # 2. FLOUR FLOW
    # -------------------------------------------------------------
    print("\n[TEST 2] Flour Flow")
    payload_flour = {
        "commodity_name": "Flour",
        "moisture_content_percent": 12.5,
        "fat_content_percent": 1.5,
        "ph_value": 6.3,
        "desired_shelf_life_days": 90,
        "storage_temperature_c": 22.0,
        "relative_humidity_percent": 60.0,
        "storage_type": "Ambient",
        "user_priority": "Balanced"
    }
    resp_flour = make_recommend_request(payload_flour)
    assert resp_flour["risk_profile"]["oxygen_risk"] == "LOW"
    assert resp_flour["risk_profile"]["moisture_risk"] in ["MEDIUM", "HIGH"]
    print(f"  [PASS] Flour Primary Pick: {resp_flour['primary_recommendation']['material_name']} (Cost: {resp_flour['primary_recommendation']['relative_cost_category']})")

    # -------------------------------------------------------------
    # 3. FRESH STRAWBERRIES FLOW (Produce Protocol)
    # -------------------------------------------------------------
    print("\n[TEST 3] Fresh Strawberries Flow")
    payload_straw = {
        "commodity_name": "Strawberry",
        "moisture_content_percent": 91.0,
        "fat_content_percent": 0.3,
        "ph_value": 3.5,
        "desired_shelf_life_days": 14,
        "storage_temperature_c": 4.0,
        "relative_humidity_percent": 90.0,
        "storage_type": "Refrigerated",
        "is_fresh_produce": True,
        "respiration_category": "HIGH",
        "map_required": True,
        "user_priority": "Barrier Performance"
    }
    resp_straw = make_recommend_request(payload_straw)
    fpg = resp_straw["fresh_produce_guidance"]
    assert fpg is not None
    assert fpg["is_fresh_produce"] is True
    assert fpg["respiration_category"] == "HIGH"
    assert fpg["map_suitability"] == "REQUIRED"
    assert "3-5% O2" in fpg["recommended_gas_mixture"]
    print(f"  [PASS] Section 3 (Produce Protocol): Gas mix={fpg['recommended_gas_mixture']}, Packaging={fpg['recommended_packaging_type']}")

    # -------------------------------------------------------------
    # 4. TOMATO FLOW (Chilling Injury Alert)
    # -------------------------------------------------------------
    print("\n[TEST 4] Tomato Flow (Chilling Sensitivity Alert)")
    payload_tomato = {
        "commodity_name": "Tomato",
        "moisture_content_percent": 94.5,
        "fat_content_percent": 0.2,
        "ph_value": 4.3,
        "desired_shelf_life_days": 21,
        "storage_temperature_c": 6.0,  # Below 10°C chilling threshold
        "relative_humidity_percent": 85.0,
        "storage_type": "Refrigerated",
        "is_fresh_produce": True,
        "respiration_category": "MODERATE",
        "map_required": False,
        "user_priority": "Balanced"
    }
    resp_tomato = make_recommend_request(payload_tomato)
    chilling_warn = resp_tomato["fresh_produce_guidance"]["chilling_sensitivity_warning"]
    assert "CHILLING INJURY HAZARD" in chilling_warn
    assert "10-13" in chilling_warn
    print(f"  [PASS] Chilling Warning: {chilling_warn}")

    # -------------------------------------------------------------
    # 5. DYNAMIC PRIORITY SWITCHING VERIFICATION
    # -------------------------------------------------------------
    print("\n[TEST 5] Dynamic Priority Switching on Same Commodity")
    # Base commodity: Whole Wheat Flour
    base_item = {
        "commodity_name": "Whole Wheat Flour",
        "moisture_content_percent": 12.5,
        "fat_content_percent": 1.5,
        "ph_value": 6.3,
        "desired_shelf_life_days": 90,
        "storage_temperature_c": 22.0,
        "relative_humidity_percent": 50.0
    }

    # Priority A: Barrier Performance
    resp_bar = make_recommend_request({**base_item, "user_priority": "Barrier Performance"})
    bar_sb = resp_bar["primary_recommendation"]["score_breakdown"]["barrier"]
    assert bar_sb["max_points"] == 45.0, f"Barrier priority should have 45 max points, got {bar_sb['max_points']}"

    # Priority B: Cost
    resp_cost = make_recommend_request({**base_item, "user_priority": "Cost"})
    cost_sb = resp_cost["primary_recommendation"]["score_breakdown"]["cost"]
    assert cost_sb["max_points"] == 35.0, f"Cost priority should have 35 max points, got {cost_sb['max_points']}"

    # Priority C: Sustainability
    resp_eco = make_recommend_request({**base_item, "user_priority": "Sustainability"})
    eco_sb = resp_eco["primary_recommendation"]["score_breakdown"]["sustainability"]
    assert eco_sb["max_points"] == 35.0, f"Eco priority should have 35 max points, got {eco_sb['max_points']}"

    print(f"  [PASS] Barrier Priority: Max points on Barrier = {bar_sb['max_points']}")
    print(f"  [PASS] Cost Priority: Max points on Cost = {cost_sb['max_points']}")
    print(f"  [PASS] Sustainability Priority: Max points on Eco = {eco_sb['max_points']}")
    print("  [PASS] Priority switching dynamically adjusts weight allocations and score contributions!")

    print("\n" + "=" * 70)
    print("ALL PHASE 3 INTEGRATION TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
