"""
Fresh Produce & MAP Guidance Engine (SIH 26236)
==============================================
Provides transparent post-harvest produce respiration guidance, equilibrium
gas mixture profiles, and physiological chilling sensitivity warnings based
on UC Davis Postharvest Technology Center guidelines.
"""

from typing import Dict, Any, Optional
from app.schemas import RecommendationRequest, RespirationCategoryEnum

PRODUCE_MAP_PROFILES = {
    RespirationCategoryEnum.LOW: {
        "description": "Low respiration produce (e.g., Apple, Citrus, Onion, Potato)",
        "gas_exchange_need": "Moderate semi-permeable film sufficient for short-to-medium retail storage.",
        "optimal_gas_mix": "1-3% O2, 1-3% CO2, Balance N2",
        "relative_permeability_need": "Standard semi-permeable polyolefin (e.g., LDPE, BOPP) with pinhole or vented punnet.",
        "recommended_packaging_type": "Semi-permeable polyolefin bag, mesh sack (alliums), or vented corrugated box",
        "chilling_sensitivity": "Check chilling injury threshold (many tropical items suffer damage below 10°C)."
    },
    RespirationCategoryEnum.MODERATE: {
        "description": "Moderate respiration produce (e.g., Tomato, Banana, Carrot, Peach, Cabbage, Cucumber)",
        "gas_exchange_need": "Controlled gas transmission required to balance O2 uptake and CO2 release.",
        "optimal_gas_mix": "3-5% O2, 3-5% CO2, Balance N2",
        "relative_permeability_need": "Engineered equilibrium modified atmosphere packaging (EMAP) or micro-perforated film.",
        "recommended_packaging_type": "Laser micro-perforated film (e.g. 50-80µm pores) or vented thermoformed clamshell",
        "chilling_sensitivity": "Maintain moderate refrigeration (10-13°C for subtropical fruits to avoid chilling injury)."
    },
    RespirationCategoryEnum.HIGH: {
        "description": "High respiration produce (e.g., Strawberry, Raspberry, Avocado, Cauliflower)",
        "gas_exchange_need": "High gas exchange required; strictly avoid hermetic barrier films without ventilation.",
        "optimal_gas_mix": "3-5% O2, 10-15% CO2, Balance N2 (elevated CO2 suppresses Botrytis fungal decay)",
        "relative_permeability_need": "High-transmission micro-perforated breathable membrane or high-density micro-pores.",
        "recommended_packaging_type": "Laser micro-perforated breathable film (MICRO_PERF_PE) or vented punnet with absorbent pad",
        "chilling_sensitivity": "Strict cold chain (0-4°C) essential to suppress high respiration kinetics."
    },
    RespirationCategoryEnum.EXTREMELY_HIGH: {
        "description": "Extremely high respiration produce (e.g., Mushroom, Asparagus, Sweet Corn, Broccoli)",
        "gas_exchange_need": "Continuous rapid aerobic gas transmission essential to avert immediate asphyxiation.",
        "optimal_gas_mix": "1-2% O2, 5-10% CO2, Balance N2",
        "relative_permeability_need": "High-density micro-perforated packaging or vented punnets essential to prevent immediate anaerobic rotting.",
        "recommended_packaging_type": "Macro-vented clamshell or high-frequency micro-perforated film",
        "chilling_sensitivity": "Rapid hydro-cooling or forced-air pre-cooling immediately post-harvest required."
    }
}

def evaluate_fresh_produce(request: RecommendationRequest) -> Optional[Dict[str, Any]]:
    """Generates transparent fresh produce packaging, MAP, and chilling sensitivity guidance."""
    if not request.is_fresh_produce:
        return None

    resp_cat = request.respiration_category or RespirationCategoryEnum.MODERATE
    profile = PRODUCE_MAP_PROFILES.get(
        resp_cat, 
        PRODUCE_MAP_PROFILES[RespirationCategoryEnum.MODERATE]
    )

    # Evaluate physiological chilling sensitivity
    comm_lower = request.commodity_name.lower()
    temp = request.storage_temperature_c
    chilling_warning = "No acute chilling sensitivity risk detected at current storage temperature."

    if any(k in comm_lower for k in ["tomato", "banana", "mango", "cucumber"]):
        if temp < 10.0:
            chilling_warning = (
                f"CHILLING INJURY HAZARD: Storage temperature ({temp}°C) is below the physiological threshold "
                f"(10-13°C) for {request.commodity_name}. Tropical/subtropical produce stored below 10°C suffers "
                "pitting, water-soaked lesions, failure to ripen, and accelerated decay."
            )
    elif "potato" in comm_lower:
        if temp < 4.0:
            chilling_warning = (
                f"LOW-TEMPERATURE SWEETENING RISK: Potatoes stored at {temp}°C (below 4°C) convert starch to reducing sugars, "
                "leading to excessive dark browning / acrylamide formation during frying."
            )

    guidance = {
        "is_fresh_produce": True,
        "respiration_category": resp_cat.value,
        "category_description": profile["description"],
        "gas_exchange_requirement": profile["gas_exchange_need"],
        "map_suitability": "REQUIRED" if (request.map_required or resp_cat in [RespirationCategoryEnum.HIGH, RespirationCategoryEnum.EXTREMELY_HIGH]) else "RECOMMENDED",
        "recommended_packaging_type": profile["recommended_packaging_type"],
        "recommended_gas_mixture": profile["optimal_gas_mix"],
        "packaging_film_guidance": profile["relative_permeability_need"],
        "chilling_sensitivity_warning": chilling_warning,
        "condensation_control": "High relative humidity produce packaging requires anti-fog surface treatment to prevent droplet coalescence that sparks fungal rot.",
        "anaerobic_warning": "CRITICAL: Do NOT pack high-respiration produce in standard airtight barrier films (like plain aluminum or EVOH) without micro-perforations or active MAP. Headspace O2 will plummet below 1%, triggering ethanol/acetaldehyde off-flavors."
    }

    return guidance
