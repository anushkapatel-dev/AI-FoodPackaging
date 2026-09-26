from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models import DataSource
from app.schemas import DataSourceResponse
from app.data_manager import get_database_summary, verify_dataset_integrity

router = APIRouter(prefix="/api/sources", tags=["Scientific Data Sources"])

@router.get("", response_model=List[DataSourceResponse])
def get_all_sources(db: Session = Depends(get_db)):
    """Retrieve all authoritative primary scientific literature and government database sources."""
    return db.query(DataSource).all()

@router.get("/summary")
def get_sources_audit_summary(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Retrieve comprehensive dataset integrity, count breakdown, and scientific verification status."""
    summary = get_database_summary(db)
    audit = verify_dataset_integrity(db)
    return {
        "status": "HEALTHY" if audit["is_valid"] else "ATTENTION_REQUIRED",
        "summary": summary,
        "integrity_audit": audit
    }

@router.get("/{source_id}", response_model=DataSourceResponse)
def get_source_by_id(source_id: int, db: Session = Depends(get_db)):
    """Retrieve single authoritative data source citation and provenance metadata by ID."""
    source = db.query(DataSource).filter(DataSource.id == source_id).first()
    if not source:
        raise HTTPException(
            status_code=404,
            detail=f"Data source with ID {source_id} not found."
        )
    return source
