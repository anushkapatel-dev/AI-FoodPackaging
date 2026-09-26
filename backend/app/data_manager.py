"""
Internal Data Management Utility (SIH 26236)
===========================================
Allows adding, updating, validating, and synchronizing Food Commodities,
Packaging Materials, and Scientific Data Sources without touching core
recommendation engine logic.
"""

import sys
import json
import argparse
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import engine, Base, SessionLocal
from app.models import FoodCommodity, PackagingMaterial, DataSource, RecommendationHistory
from app.seed_data import SEED_SOURCES, SEED_MATERIALS, SEED_COMMODITIES, seed_database

def get_session(db: Optional[Session] = None) -> Session:
    """Helper to return active session or create new one."""
    return db if db is not None else SessionLocal()

def add_or_update_commodity(data: Dict[str, Any], db: Optional[Session] = None) -> FoodCommodity:
    """
    Safely adds or updates a Food Commodity record.
    Maintains scientific integrity rules (guarantees DEMO DATA flag and citation).
    """
    owns_session = db is None
    session = get_session(db)
    try:
        # Enforce integrity defaults
        if "data_status" not in data or not data["data_status"]:
            data["data_status"] = "DEMO DATA"
        if "source_citation" not in data or not data["source_citation"]:
            raise ValueError(f"Commodity '{data.get('name')}' must include a source_citation.")

        name = data.get("name")
        if not name:
            raise ValueError("Commodity 'name' is required.")

        commodity = session.query(FoodCommodity).filter(FoodCommodity.name == name).first()
        if commodity:
            for k, v in data.items():
                setattr(commodity, k, v)
        else:
            commodity = FoodCommodity(**data)
            session.add(commodity)

        session.commit()
        session.refresh(commodity)
        return commodity
    finally:
        if owns_session:
            session.close()

def add_or_update_material(data: Dict[str, Any], db: Optional[Session] = None) -> PackagingMaterial:
    """
    Safely adds or updates a Packaging Material record.
    Validates layers_json format and scientific traceability fields.
    """
    owns_session = db is None
    session = get_session(db)
    try:
        if "data_status" not in data or not data["data_status"]:
            data["data_status"] = "DEMO DATA"
        if "source_citation" not in data or not data["source_citation"]:
            raise ValueError(f"Material '{data.get('material_code')}' must include a source_citation.")

        code = data.get("material_code")
        if not code:
            raise ValueError("Packaging Material 'material_code' is required.")

        # Ensure layers_json is valid JSON string if provided as list or dict
        if "layers_json" in data and isinstance(data["layers_json"], (list, dict)):
            data["layers_json"] = json.dumps(data["layers_json"])

        material = session.query(PackagingMaterial).filter(PackagingMaterial.material_code == code).first()
        if material:
            for k, v in data.items():
                setattr(material, k, v)
        else:
            material = PackagingMaterial(**data)
            session.add(material)

        session.commit()
        session.refresh(material)
        return material
    finally:
        if owns_session:
            session.close()

def add_or_update_source(data: Dict[str, Any], db: Optional[Session] = None) -> DataSource:
    """
    Safely adds or updates an authoritative scientific DataSource.
    """
    owns_session = db is None
    session = get_session(db)
    try:
        source_name = data.get("source_name")
        if not source_name:
            raise ValueError("DataSource 'source_name' is required.")
        if "full_citation" not in data or not data["full_citation"]:
            raise ValueError(f"Source '{source_name}' must have a full_citation.")

        src = session.query(DataSource).filter(DataSource.source_name == source_name).first()
        if src:
            for k, v in data.items():
                setattr(src, k, v)
        else:
            src = DataSource(**data)
            session.add(src)

        session.commit()
        session.refresh(src)
        return src
    finally:
        if owns_session:
            session.close()

def get_database_summary(db: Optional[Session] = None) -> Dict[str, Any]:
    """Returns total counts, categorization, and data status breakdown."""
    owns_session = db is None
    session = get_session(db)
    try:
        comms = session.query(FoodCommodity).all()
        mats = session.query(PackagingMaterial).all()
        sources = session.query(DataSource).all()

        processed_comms = [c for c in comms if not c.is_fresh_produce]
        fresh_comms = [c for c in comms if c.is_fresh_produce]

        comm_statuses = {}
        for c in comms:
            comm_statuses[c.data_status] = comm_statuses.get(c.data_status, 0) + 1

        mat_statuses = {}
        for m in mats:
            mat_statuses[m.data_status] = mat_statuses.get(m.data_status, 0) + 1

        return {
            "total_commodities": len(comms),
            "processed_commodities_count": len(processed_comms),
            "fresh_produce_count": len(fresh_comms),
            "commodity_names": [c.name for c in comms],
            "commodity_status_breakdown": comm_statuses,
            "total_materials": len(mats),
            "material_codes": [m.material_code for m in mats],
            "material_status_breakdown": mat_statuses,
            "total_sources": len(sources),
            "source_names": [s.source_name for s in sources]
        }
    finally:
        if owns_session:
            session.close()

def verify_dataset_integrity(db: Optional[Session] = None) -> Dict[str, Any]:
    """
    Rigorous integrity audit:
    - Verifies all commodities and materials possess non-empty source citations.
    - Verifies all demo records are strictly tagged 'DEMO DATA'.
    - Checks required physical/barrier qualitative bounds.
    """
    owns_session = db is None
    session = get_session(db)
    try:
        comms = session.query(FoodCommodity).all()
        mats = session.query(PackagingMaterial).all()
        sources = session.query(DataSource).all()

        issues: List[str] = []

        # Check commodities
        for c in comms:
            if not c.source_citation:
                issues.append(f"Commodity '{c.name}' missing source_citation.")
            if c.data_status != "DEMO DATA" and c.data_status != "VERIFIED":
                issues.append(f"Commodity '{c.name}' has invalid data_status: {c.data_status}")
            if c.standard_moisture_percent < 0 or c.standard_moisture_percent > 100:
                issues.append(f"Commodity '{c.name}' moisture out of range: {c.standard_moisture_percent}%")
            if c.standard_ph < 1 or c.standard_ph > 14:
                issues.append(f"Commodity '{c.name}' pH out of range: {c.standard_ph}")

        # Check materials
        for m in mats:
            if not m.source_citation:
                issues.append(f"Material '{m.material_code}' missing source_citation.")
            if m.data_status != "DEMO DATA" and m.data_status != "VERIFIED":
                issues.append(f"Material '{m.material_code}' has invalid data_status: {m.data_status}")
            if not m.layers_json:
                issues.append(f"Material '{m.material_code}' missing layers_json cross-section.")
            else:
                try:
                    layers = json.loads(m.layers_json)
                    if not isinstance(layers, list) or len(layers) == 0:
                        issues.append(f"Material '{m.material_code}' has empty layers.")
                except Exception as e:
                    issues.append(f"Material '{m.material_code}' invalid layers_json: {e}")

        # Check sources
        for s in sources:
            if not s.full_citation:
                issues.append(f"DataSource '{s.source_name}' missing full_citation.")

        return {
            "is_valid": len(issues) == 0,
            "total_issues": len(issues),
            "issues": issues,
            "checked_commodities": len(comms),
            "checked_materials": len(mats),
            "checked_sources": len(sources)
        }
    finally:
        if owns_session:
            session.close()

def sync_all_seed_data(db: Optional[Session] = None) -> Dict[str, Any]:
    """Synchronizes default seed data into the database."""
    owns_session = db is None
    session = get_session(db)
    try:
        seed_database(session)
        return get_database_summary(session)
    finally:
        if owns_session:
            session.close()

def reset_and_reseed_database():
    """
    Drops and recreates all database tables with the updated schema,
    then executes complete seed initialization.
    """
    print("Dropping existing tables and rebuilding schema...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("Schema rebuilt. Seeding dataset...")
    with Session(engine) as session:
        seed_database(session)
    print("Database reset and seeded successfully!")

def main():
    parser = argparse.ArgumentParser(description="Food Packaging Knowledge Base Data Manager")
    parser.add_argument("--summary", action="store_true", help="Print summary of commodities, materials, and sources")
    parser.add_argument("--verify", action="store_true", help="Run scientific integrity audit")
    parser.add_argument("--sync", action="store_true", help="Sync/upsert all seeds into database")
    parser.add_argument("--reset", action="store_true", help="Recreate tables and reseed all data")

    args = parser.parse_args()

    if args.reset:
        reset_and_reseed_database()
        summary = get_database_summary()
        print("\nReset Complete:")
        print(f"  Commodities : {summary['total_commodities']}")
        print(f"  Materials   : {summary['total_materials']}")
        print(f"  Sources     : {summary['total_sources']}")
        return

    if args.sync:
        print("Synchronizing seed dataset...")
        summary = sync_all_seed_data()
        print(f"Synced {summary['total_commodities']} commodities, {summary['total_materials']} materials, {summary['total_sources']} sources.")
        return

    if args.verify:
        audit = verify_dataset_integrity()
        print("\n=== DATASET SCIENTIFIC INTEGRITY AUDIT ===")
        print(f"Status: {'PASSED' if audit['is_valid'] else 'FAILED'}")
        print(f"Checked Commodities: {audit['checked_commodities']}")
        print(f"Checked Materials:   {audit['checked_materials']}")
        print(f"Checked Sources:     {audit['checked_sources']}")
        if audit['is_valid']:
            print("All records satisfy scientific traceability, citations, and DEMO DATA constraints.")
        else:
            print(f"Encountered {audit['total_issues']} issues:")
            for issue in audit['issues']:
                print(f"  - {issue}")
        return

    if args.summary or len(sys.argv) == 1:
        summary = get_database_summary()
        print("\n=== FOOD PACKAGING DATABASE SUMMARY ===")
        print(f"Total Commodities: {summary['total_commodities']} (Processed: {summary['processed_commodities_count']}, Fresh Produce: {summary['fresh_produce_count']})")
        print(f"Commodities: {', '.join(summary['commodity_names'])}")
        print(f"Commodity Statuses: {summary['commodity_status_breakdown']}")
        print(f"\nTotal Materials: {summary['total_materials']}")
        print(f"Materials: {', '.join(summary['material_codes'])}")
        print(f"Material Statuses: {summary['material_status_breakdown']}")
        print(f"\nTotal Sources: {summary['total_sources']}")
        print(f"Sources: {', '.join(summary['source_names'])}")

if __name__ == "__main__":
    main()
