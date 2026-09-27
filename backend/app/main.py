import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import engine, Base, get_db
from app.models import PackagingMaterial, FoodCommodity
from app.seed_data import seed_database
from app.routes import commodities, materials, recommendation, sources
from app.schemas import HealthResponse

SCIENTIFIC_DISCLAIMER = (
    "This prototype provides decision support based on available food and packaging data. "
    "Packaging selection for commercial production should be validated by qualified food-packaging "
    "professionals and appropriate laboratory testing."
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure SQLite tables and seed catalog data are present
    from app.database import init_db
    init_db()
    yield
    # Shutdown logic (if any)

app = FastAPI(
    title="AI-Based Intelligent Food Packaging Material Recommendation System",
    description="SIH 26236 Decision Support System API for Food Packaging Selection",
    version="2.0.0 (Phase 2A)",
    lifespan=lifespan
)

# Dynamic CORS Configuration for Local Development & Render Production
# Supports comma-separated list of origins via CORS_ORIGINS env var
# Default matches localhost dev servers and permits any https://*.onrender.com domain
cors_origins_env = os.environ.get("CORS_ORIGINS", "")
if cors_origins_env.strip():
    allowed_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
    is_wildcard = "*" in allowed_origins
else:
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    is_wildcard = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if is_wildcard else allowed_origins,
    allow_origin_regex=r"https://.*\.onrender\.com|https://.*\.vercel\.app" if not is_wildcard else None,
    allow_credentials=not is_wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register catalog routers
app.include_router(commodities.router)
app.include_router(materials.router)
app.include_router(sources.router)
app.include_router(recommendation.router)

@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """Check API and database health status."""
    # Test DB query
    db.execute(text("SELECT 1"))
    total_mats = db.query(PackagingMaterial).count()
    total_comms = db.query(FoodCommodity).count()

    return HealthResponse(
        status="ONLINE",
        app_name="AI Food Packaging Decision Support (SIH 26236)",
        version="1.1.0-phase1b",
        database_connected=True,
        total_materials=total_mats,
        total_commodities=total_comms,
        scientific_disclaimer=SCIENTIFIC_DISCLAIMER
    )

@app.get("/", tags=["Root"])
@app.get("/api", tags=["Root"])
def root():
    return {
        "message": "Welcome to SIH 26236 Food Packaging Recommendation API",
        "documentation": "/docs",
        "health": "/api/health",
        "disclaimer": SCIENTIFIC_DISCLAIMER
    }
