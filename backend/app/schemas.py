from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional, Dict, Any
from enum import Enum

# Input Selection Enums
class StorageTypeEnum(str, Enum):
    AMBIENT = "Ambient"
    REFRIGERATED = "Refrigerated"
    FROZEN = "Frozen"

class TransitConditionEnum(str, Enum):
    STANDARD = "Standard Road"
    ROUGH_VIBRATION = "Rough Road / High Vibration"
    AIR_CARGO = "Air Cargo"
    EXPORT_MARITIME = "Export / Maritime"

class UserPriorityEnum(str, Enum):
    BALANCED = "Balanced"
    COST = "Cost"
    BARRIER = "Barrier Performance"
    SUSTAINABILITY = "Sustainability"

class RespirationCategoryEnum(str, Enum):
    NONE = "NONE"
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    EXTREMELY_HIGH = "EXTREMELY_HIGH"

class PackagingLayerSchema(BaseModel):
    layer_name: str
    typical_thickness_microns: int
    purpose: str

# Data Source Schemas
class DataSourceBase(BaseModel):
    source_name: str
    organization: Optional[str] = None
    source_type: str = "ACADEMIC_HANDBOOK"
    source_url: Optional[str] = None
    full_citation: str
    verified_by: Optional[str] = "Scientific Integrity Panel"
    last_verified: Optional[str] = "2026-09"

class DataSourceResponse(DataSourceBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# Food Commodity Schemas
class FoodCommodityBase(BaseModel):
    name: str
    category: str
    standard_moisture_percent: float
    standard_fat_percent: float
    standard_ph: float
    oxygen_sensitivity: Optional[str] = "MEDIUM"
    moisture_sensitivity: Optional[str] = "MEDIUM"
    light_sensitivity: Optional[str] = "LOW"
    typical_storage_type: Optional[str] = "Ambient"
    is_fresh_produce: bool = False
    respiration_category: str = "NONE"
    map_suitable: bool = False
    recommended_gas_mix: Optional[str] = None
    source_name: Optional[str] = None
    source_url: Optional[str] = None
    source_reference: Optional[str] = None
    source_citation: str
    data_status: str = "DEMO DATA"
    last_verified: Optional[str] = "Pending Lab Audit"

class FoodCommodityResponse(FoodCommodityBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# Packaging Material Schemas
class PackagingMaterialBase(BaseModel):
    material_code: str
    name: str
    material_type: str
    oxygen_barrier: str
    moisture_barrier: str
    sealability: str
    mechanical_strength: str
    fat_oil_resistance: str
    temp_min_c: float
    temp_max_c: float
    storage_compatibility: str
    light_barrier: str
    recyclability: str
    biodegradability: bool
    relative_cost_category: str
    relative_cost_index: float
    is_breathable: bool = False
    layers_json: Optional[str] = None
    suitable_food_categories: Optional[str] = None
    source_name: Optional[str] = None
    source_url: Optional[str] = None
    source_reference: Optional[str] = None
    source_citation: str
    data_status: str = "DEMO DATA"
    last_verified: Optional[str] = "Pending Lab Audit"

class PackagingMaterialResponse(PackagingMaterialBase):
    id: int
    layers: Optional[List[PackagingLayerSchema]] = None

    model_config = ConfigDict(from_attributes=True)

# System Health Schema
class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    database_connected: bool
    total_materials: int
    total_commodities: int
    scientific_disclaimer: str

# Recommendation Pipeline Schemas
class RecommendationRequest(BaseModel):
    commodity_name: str = Field(..., description="Food commodity name, e.g. Potato Chips or Fresh Strawberries")
    moisture_content_percent: float = Field(..., ge=0.0, le=100.0, description="Moisture content (0-100%)")
    fat_content_percent: float = Field(..., ge=0.0, le=100.0, description="Fat / oil content (0-100%)")
    ph_value: float = Field(..., ge=1.0, le=14.0, description="Food pH value (1-14)")
    desired_shelf_life_days: int = Field(..., gt=0, le=730, description="Target shelf life in days")
    storage_temperature_c: float = Field(..., ge=-50.0, le=80.0, description="Storage temperature in Celsius")
    relative_humidity_percent: float = Field(..., ge=0.0, le=100.0, description="Ambient relative humidity (0-100%)")
    storage_type: StorageTypeEnum = Field(default=StorageTypeEnum.AMBIENT)
    transportation_condition: TransitConditionEnum = Field(default=TransitConditionEnum.STANDARD)
    
    # Fresh Produce Specifics
    is_fresh_produce: bool = Field(default=False)
    respiration_category: Optional[RespirationCategoryEnum] = Field(default=RespirationCategoryEnum.NONE)
    map_required: bool = Field(default=False)
    
    # User Optimization Priority
    user_priority: UserPriorityEnum = Field(default=UserPriorityEnum.BALANCED)

# Structured Score Breakdown Component
class WeightedScoreComponent(BaseModel):
    earned_points: float = Field(..., description="Points earned in this dimension")
    max_points: float = Field(..., description="Maximum possible points assigned by priority weight")
    raw_score: float = Field(..., description="Raw suitability score out of 100")
    weight_percentage: float = Field(..., description="Weight percent assigned to this category")
    display: str = Field(..., description="Display string e.g. 31.5 / 35")

class ScoreBreakdownDetail(BaseModel):
    barrier: WeightedScoreComponent
    compatibility: WeightedScoreComponent
    storage: WeightedScoreComponent
    mechanical: WeightedScoreComponent
    cost: WeightedScoreComponent
    sustainability: WeightedScoreComponent
    total_earned: float
    total_max: float = 100.0
    display_summary: str

class MaterialScoreDetail(BaseModel):
    material_id: int
    material_code: str
    material_name: str
    material_type: str
    total_score: float
    barrier_score: float
    compatibility_score: float
    storage_score: float
    mechanical_score: float
    cost_score: float
    sustainability_score: float
    relative_cost_category: str
    sustainability_badge: str
    layers: List[PackagingLayerSchema]
    why_selected: List[str]
    key_requirements_met: List[str] = Field(default_factory=list)
    main_risks_addressed: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)
    score_breakdown: Optional[ScoreBreakdownDetail] = None
    source_citation: str
    data_status: str

class RankedMaterialDetail(BaseModel):
    rank: int
    material_id: int
    material_code: str
    material_name: str
    material_type: str
    total_score: float
    score_breakdown: ScoreBreakdownDetail
    why_selected: List[str]
    key_requirements_met: List[str] = Field(default_factory=list)
    main_risks_addressed: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)
    relative_cost_category: str
    sustainability_badge: str
    layers: List[PackagingLayerSchema]
    source_citation: str
    data_status: str

class RejectedMaterialAudit(BaseModel):
    material_name: str
    rejection_stage: str
    reason: str

class RecommendationResponse(BaseModel):
    status: str
    commodity_name: str
    user_priority: str
    detected_risks: List[str]
    risk_profile: Dict[str, Any] = Field(default_factory=dict)
    calculated_requirements: Dict[str, Any] = Field(default_factory=dict)
    packaging_requirements: Dict[str, Any] = Field(default_factory=dict)
    primary_recommendation: MaterialScoreDetail
    ranked_materials: List[RankedMaterialDetail] = Field(default_factory=list)
    score_breakdown: Dict[str, Any] = Field(default_factory=dict)
    recommendation_reason: List[str] = Field(default_factory=list)
    alternative_materials: List[MaterialScoreDetail] = Field(default_factory=list)
    alternatives: List[MaterialScoreDetail] = Field(default_factory=list)
    rejected_materials: List[RejectedMaterialAudit] = Field(default_factory=list)
    rejection_reasons: List[RejectedMaterialAudit] = Field(default_factory=list)
    fresh_produce_guidance: Optional[Dict[str, Any]] = None
    data_status: str = "DEMO DATA"
    source_information: List[Dict[str, str]] = Field(default_factory=list)
    scientific_disclaimer: str

# Material Comparison Schemas
class CompareRequest(BaseModel):
    material_ids: List[int] = Field(..., min_length=2, max_length=4)

class CompareResponse(BaseModel):
    materials: List[PackagingMaterialResponse]
