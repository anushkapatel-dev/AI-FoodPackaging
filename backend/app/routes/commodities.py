from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import FoodCommodity
from app.schemas import FoodCommodityResponse

router = APIRouter(prefix="/api/commodities", tags=["Food Commodities"])

@router.get("", response_model=List[FoodCommodityResponse])
def get_all_commodities(
    category: Optional[str] = Query(None, description="Filter by food category"),
    search: Optional[str] = Query(None, description="Search by commodity name"),
    db: Session = Depends(get_db)
):
    """Retrieve all preset food commodities with default chemical and respiratory properties."""
    query = db.query(FoodCommodity)
    if category:
        query = query.filter(FoodCommodity.category.ilike(f"%{category}%"))
    if search:
        query = query.filter(FoodCommodity.name.ilike(f"%{search}%"))
    return query.all()

@router.get("/{commodity_id}", response_model=FoodCommodityResponse)
def get_commodity_by_id(commodity_id: int, db: Session = Depends(get_db)):
    """Retrieve details for a single food commodity by ID."""
    commodity = db.query(FoodCommodity).filter(FoodCommodity.id == commodity_id).first()
    if not commodity:
        raise HTTPException(
            status_code=404,
            detail=f"Food commodity with ID {commodity_id} not found."
        )
    return commodity
