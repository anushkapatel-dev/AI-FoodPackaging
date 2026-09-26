from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base

class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(Integer, primary_key=True, index=True)
    source_name = Column(String(150), unique=True, nullable=False, index=True)
    organization = Column(String(150), nullable=True)
    source_type = Column(String(50), default="ACADEMIC_HANDBOOK", nullable=False) # ACADEMIC_HANDBOOK, GOVERNMENT_DATABASE, ASTM_STANDARD, LAB_TRIAL
    source_url = Column(String(255), nullable=True)
    full_citation = Column(Text, nullable=False)
    verified_by = Column(String(100), default="Scientific Integrity Panel", nullable=True)
    last_verified = Column(String(50), default="2026-09", nullable=True)

class FoodCommodity(Base):
    __tablename__ = "food_commodities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)
    
    # Baseline chemical composition
    standard_moisture_percent = Column(Float, nullable=False)
    standard_fat_percent = Column(Float, nullable=False)
    standard_ph = Column(Float, nullable=False)
    
    # Qualitative sensitivity tiers
    oxygen_sensitivity = Column(String(30), default="MEDIUM", nullable=True)
    moisture_sensitivity = Column(String(30), default="MEDIUM", nullable=True)
    light_sensitivity = Column(String(30), default="LOW", nullable=True)
    typical_storage_type = Column(String(50), default="Ambient", nullable=True)
    
    # Post-harvest produce respiration specifics
    is_fresh_produce = Column(Boolean, default=False, nullable=False)
    respiration_category = Column(String(30), default="NONE", nullable=False)
    map_suitable = Column(Boolean, default=False, nullable=False)
    recommended_gas_mix = Column(String(100), nullable=True)
    
    # Provenance and scientific integrity tracking
    source_name = Column(String(150), nullable=True)
    source_url = Column(String(255), nullable=True)
    source_reference = Column(String(255), nullable=True)
    source_citation = Column(String(255), nullable=False)
    data_status = Column(String(30), default="DEMO DATA", nullable=False)
    last_verified = Column(String(50), default="Pending Lab Audit", nullable=True)

class PackagingMaterial(Base):
    __tablename__ = "packaging_materials"

    id = Column(Integer, primary_key=True, index=True)
    material_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(120), nullable=False)
    material_type = Column(String(50), nullable=False)
    
    # Qualitative barrier categories (Robertson / ASTM verified classifications)
    oxygen_barrier = Column(String(20), nullable=False)
    moisture_barrier = Column(String(20), nullable=False)
    light_barrier = Column(String(30), nullable=False)
    
    # Performance & Suitability categories
    sealability = Column(String(20), nullable=False)
    mechanical_strength = Column(String(20), nullable=False)
    fat_oil_resistance = Column(String(20), nullable=False)
    temp_min_c = Column(Float, nullable=False)
    temp_max_c = Column(Float, nullable=False)
    storage_compatibility = Column(String(100), nullable=False)
    
    # Environmental & Cost metrics
    recyclability = Column(String(50), nullable=False)
    biodegradability = Column(Boolean, default=False, nullable=False)
    relative_cost_category = Column(String(20), nullable=False)
    relative_cost_index = Column(Float, nullable=False)
    
    # Produce & Structure specifics
    is_breathable = Column(Boolean, default=False, nullable=False)
    layers_json = Column(Text, nullable=True)
    suitable_food_categories = Column(String(255), nullable=True)
    
    # Provenance and scientific integrity tracking
    source_name = Column(String(150), nullable=True)
    source_url = Column(String(255), nullable=True)
    source_reference = Column(String(255), nullable=True)
    source_citation = Column(String(255), nullable=False)
    data_status = Column(String(30), default="DEMO DATA", nullable=False)
    last_verified = Column(String(50), default="Pending Lab Audit", nullable=True)

class RecommendationHistory(Base):
    __tablename__ = "recommendation_history"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    commodity_name = Column(String(100), nullable=False)
    user_priority = Column(String(50), nullable=False)
    storage_type = Column(String(50), nullable=False)
    primary_recommended_name = Column(String(120), nullable=False)
    suitability_score = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
