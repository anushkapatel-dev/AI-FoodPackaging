"""
Risk Analyzer & Requirement Generation Engine (SIH 26236)
=========================================================
Evaluates chemical, physical, logistic, and post-harvest biological risks
from user food input and converts them into structured packaging requirements.
"""

from typing import List, Dict, Any
from app.schemas import RecommendationRequest, RespirationCategoryEnum

QUALITATIVE_LEVELS = {
    "VERY_LOW": 1,
    "LOW": 2,
    "MEDIUM": 3,
    "HIGH": 4,
    "VERY_HIGH": 5
}

def analyze_food_risks(request: RecommendationRequest) -> Dict[str, Any]:
    """
    Translates food commodity parameters and storage context into:
    1. A structured Risk Profile (Moisture, Oxygen, Light, Fat/Oil, Temp, Mech, Respiration)
    2. Explicit Packaging Requirements (Barrier, Seal, Strength, Breathability, MAP)
    3. Human-readable detected risk statements for explainability
    """
    detected_risks: List[str] = []

    # -------------------------------------------------------------
    # 1. MOISTURE RISK ANALYSIS
    # -------------------------------------------------------------
    if request.moisture_content_percent < 5.0 and request.relative_humidity_percent > 50.0:
        moisture_risk = "VERY_HIGH"
        required_moisture_barrier = "VERY_HIGH"
        moisture_loss_control = "HIGH"
        detected_risks.append(
            f"Critical Crispness Loss Risk: Ultra-dry product ({request.moisture_content_percent}%) "
            f"in humid environment ({request.relative_humidity_percent}% RH) will absorb moisture and turn soggy."
        )
    elif request.moisture_content_percent < 15.0 and request.relative_humidity_percent > 65.0:
        moisture_risk = "HIGH"
        required_moisture_barrier = "HIGH"
        moisture_loss_control = "HIGH"
        detected_risks.append(
            f"Moisture Absorption & Caking Risk: Low-moisture food ({request.moisture_content_percent}%) "
            f"prone to clumping, staling, or mold in high ambient humidity ({request.relative_humidity_percent}% RH)."
        )
    elif request.is_fresh_produce:
        # Fresh produce loses water via transpiration
        moisture_risk = "HIGH"
        required_moisture_barrier = "MEDIUM"
        moisture_loss_control = "HIGH"
        detected_risks.append(
            "Transpirational Dehydration Hazard: Living produce suffers shriveling and weight loss if moisture is unmanaged; requires anti-fog condensation control."
        )
    elif request.moisture_content_percent > 60.0:
        moisture_risk = "MEDIUM"
        required_moisture_barrier = "MEDIUM"
        moisture_loss_control = "HIGH"
        detected_risks.append(
            f"Desiccation Risk: High-moisture food ({request.moisture_content_percent}%) "
            "requires hermetic barrier to prevent water evaporation and surface drying."
        )
    else:
        moisture_risk = "MEDIUM"
        required_moisture_barrier = "MEDIUM"
        moisture_loss_control = "STANDARD"

    # -------------------------------------------------------------
    # 2. OXYGEN / OXIDATION RISK ANALYSIS
    # -------------------------------------------------------------
    if request.fat_content_percent > 30.0:
        oxygen_risk = "VERY_HIGH"
        required_oxygen_barrier = "VERY_HIGH"
        detected_risks.append(
            f"Severe Lipid Oxidation Hazard: Very high fat content ({request.fat_content_percent}%) "
            "causes rapid peroxide and hexanal formation upon exposure to atmospheric oxygen."
        )
    elif request.fat_content_percent > 15.0:
        oxygen_risk = "HIGH"
        required_oxygen_barrier = "HIGH"
        detected_risks.append(
            f"Oxidative Rancidity Risk: High lipid content ({request.fat_content_percent}%) "
            "requires strong oxygen barrier to prevent off-flavor rancidity."
        )
    elif request.fat_content_percent > 5.0:
        oxygen_risk = "MEDIUM"
        required_oxygen_barrier = "MEDIUM"
        detected_risks.append(
            f"Mild Oxidation Susceptibility: Moderate fat level ({request.fat_content_percent}%) "
            "benefits from moderate oxygen barrier during extended storage."
        )
    else:
        oxygen_risk = "LOW"
        required_oxygen_barrier = "LOW"

    # Extended shelf life demands elevated oxygen barrier
    if not request.is_fresh_produce:
        if request.desired_shelf_life_days > 180:
            oxygen_risk = "VERY_HIGH"
            required_oxygen_barrier = "VERY_HIGH"
            detected_risks.append(
                f"Long-Term Shelf Life Requested ({request.desired_shelf_life_days} days): "
                "Demands maximum barrier resistance to slow down oxidative degradation kinetics."
            )
        elif request.desired_shelf_life_days > 90 and QUALITATIVE_LEVELS.get(required_oxygen_barrier, 1) < 4:
            oxygen_risk = "HIGH"
            required_oxygen_barrier = "HIGH"
            detected_risks.append(
                f"Extended Shelf Life ({request.desired_shelf_life_days} days): Requires elevated barrier properties."
            )

    # -------------------------------------------------------------
    # 3. LIGHT / UV RISK ANALYSIS
    # -------------------------------------------------------------
    comm_lower = request.commodity_name.lower()
    if request.fat_content_percent > 20.0 or any(k in comm_lower for k in ["chip", "nut", "coffee", "milk powder"]):
        light_risk = "HIGH"
        required_light_barrier = "OPAQUE"
        detected_risks.append(
            "Photodegradation Hazard: Product contains photo-sensitive lipids or pigments vulnerable to UV-catalyzed rancidity."
        )
    elif any(k in comm_lower for k in ["spice", "tea"]) or (request.is_fresh_produce and "potato" in comm_lower):
        light_risk = "HIGH"
        required_light_barrier = "OPAQUE"
        detected_risks.append(
            "Photodegradation Hazard: Spices/potatoes undergo pigment bleaching or solanine toxic glycoalkaloid greening upon light exposure."
        )
    elif request.fat_content_percent > 8.0:
        light_risk = "MEDIUM"
        required_light_barrier = "SEMI_OPAQUE"
    else:
        light_risk = "LOW"
        required_light_barrier = "TRANSPARENT"

    # -------------------------------------------------------------
    # 4. FAT / OIL SOLVENT INTERACTION RISK
    # -------------------------------------------------------------
    if request.fat_content_percent > 30.0:
        fat_oil_risk = "VERY_HIGH"
        required_fat_resistance = "EXCELLENT"
        detected_risks.append(
            f"High Lipid Contact ({request.fat_content_percent}%): Contact polymer must resist oil swelling and stress cracking."
        )
    elif request.fat_content_percent > 15.0:
        fat_oil_risk = "HIGH"
        required_fat_resistance = "GOOD"
    elif request.fat_content_percent > 5.0:
        fat_oil_risk = "MEDIUM"
        required_fat_resistance = "FAIR"
    else:
        fat_oil_risk = "LOW"
        required_fat_resistance = "FAIR"

    # -------------------------------------------------------------
    # 5. TEMPERATURE RISK
    # -------------------------------------------------------------
    storage_type_str = request.storage_type.value if hasattr(request.storage_type, "value") else str(request.storage_type)
    if storage_type_str == "Frozen" or request.storage_temperature_c < 0.0:
        temperature_risk = "HIGH"
        temp_suitability_req = "Sub-zero cold chain impact resistance (-18°C or below)"
        detected_risks.append(
            f"Sub-Zero Frozen Chain ({request.storage_temperature_c}°C): Requires polymer with low glass transition (Tg) to prevent freeze embrittlement."
        )
    elif request.storage_temperature_c > 35.0:
        temperature_risk = "HIGH"
        temp_suitability_req = "Elevated heat stability (>40°C thermal resistance)"
        detected_risks.append(
            f"Elevated Storage Temperature ({request.storage_temperature_c}°C): Polymer risks thermal creep, softening, and accelerated permeation."
        )
    elif storage_type_str == "Refrigerated" or request.storage_temperature_c <= 10.0:
        temperature_risk = "MEDIUM"
        temp_suitability_req = "Chilled cold chain compatibility (0°C to 10°C)"
    else:
        temperature_risk = "LOW"
        temp_suitability_req = "Standard ambient distribution (15°C to 30°C)"

    # -------------------------------------------------------------
    # 6. MECHANICAL / LOGISTICS TRANSPORT RISK
    # -------------------------------------------------------------
    transit_str = request.transportation_condition.value if hasattr(request.transportation_condition, "value") else str(request.transportation_condition)
    if transit_str in ["Rough Road / High Vibration", "Export / Maritime"]:
        mechanical_risk = "HIGH"
        required_mechanical_strength = "HIGH"
        required_sealability = "EXCELLENT"
        detected_risks.append(
            f"Transit Logistics Stress ({transit_str}): High vibration and stacking load require superior tensile strength and hermetic seal integrity."
        )
    elif transit_str == "Air Cargo":
        mechanical_risk = "MEDIUM"
        required_mechanical_strength = "HIGH"
        required_sealability = "EXCELLENT"
        detected_risks.append(
            "Air Cargo Depressurization: Requires seal withstands altitude pressure differentials."
        )
    else:
        mechanical_risk = "LOW"
        required_mechanical_strength = "MEDIUM"
        required_sealability = "GOOD"

    # -------------------------------------------------------------
    # 7. RESPIRATION FOR FRESH PRODUCE
    # -------------------------------------------------------------
    if request.is_fresh_produce:
        respiration_required = True
        gas_exchange = "REQUIRED"
        
        # High and extremely high respiration produce requires high breathability
        if request.respiration_category in [RespirationCategoryEnum.HIGH, RespirationCategoryEnum.EXTREMELY_HIGH]:
            breathability = "HIGH"
            map_suitability = "REQUIRED"
            requires_breathability = True
            detected_risks.append(
                f"High Post-Harvest Respiration Hazard: Respiring produce will rapidly consume O2. "
                "Hermetic non-breathable films will induce anaerobic fermentation, ethanol off-flavors, and rot."
            )
        elif request.respiration_category == RespirationCategoryEnum.MODERATE:
            breathability = "MODERATE"
            map_suitability = "REQUIRED" if request.map_required else "RECOMMENDED"
            requires_breathability = True
            detected_risks.append(
                "Moderate Post-Harvest Respiration: Benefits from controlled gas exchange or equilibrium MAP."
            )
        else:
            breathability = "LOW"
            map_suitability = "RECOMMENDED"
            requires_breathability = False
    else:
        respiration_required = False
        gas_exchange = "NOT_REQUIRED"
        breathability = "NONE"
        map_suitability = "NOT_REQUIRED"
        requires_breathability = False

    # Acidity & Chemical Compatibility
    if request.ph_value < 4.5:
        detected_risks.append(
            f"Acid Corrosion Risk (pH {request.ph_value}): Acidic foods react with unlined metals or active coatings. "
            "Requires chemically inert polyolefin contact surface."
        )

    # Assemble structured Risk Profile
    risk_profile = {
        "moisture_risk": moisture_risk,
        "oxygen_risk": oxygen_risk,
        "light_risk": light_risk,
        "fat_oil_risk": fat_oil_risk,
        "temperature_risk": temperature_risk,
        "mechanical_risk": mechanical_risk,
        "respiration_required": respiration_required
    }

    # Assemble structured Packaging Requirements
    packaging_requirements = {
        "oxygen_barrier": required_oxygen_barrier,
        "moisture_barrier": required_moisture_barrier,
        "light_barrier": required_light_barrier,
        "sealability": required_sealability,
        "mechanical_strength": required_mechanical_strength,
        "chemical_fat_resistance": required_fat_resistance,
        "gas_exchange": gas_exchange,
        "breathability": breathability,
        "moisture_loss_control": moisture_loss_control,
        "map_suitability": map_suitability,
        "temperature_compatibility": temp_suitability_req
    }

    # Backward compatibility requirements dict for scorer and rule_filter
    requirements = {
        "required_oxygen_barrier": required_oxygen_barrier,
        "required_moisture_barrier": required_moisture_barrier,
        "required_light_barrier": required_light_barrier,
        "required_mechanical_strength": required_mechanical_strength,
        "required_sealability": required_sealability,
        "required_fat_resistance": required_fat_resistance,
        "requires_breathability": requires_breathability,
        "gas_exchange": gas_exchange,
        "map_suitability": map_suitability
    }

    return {
        "risk_profile": risk_profile,
        "packaging_requirements": packaging_requirements,
        "requirements": requirements,
        "detected_risks": detected_risks
    }
