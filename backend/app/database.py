import os
import shutil
import tempfile
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Base directory for backend
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUNDLED_DB_PATH = os.path.join(BASE_DIR, "food_packaging.db")

# Detect serverless environment (e.g. Vercel, AWS Lambda) where deployment root is read-only
IS_SERVERLESS = bool(
    os.environ.get("VERCEL") or 
    os.environ.get("AWS_LAMBDA_FUNCTION_NAME") or 
    os.environ.get("NOW_REGION")
)

if IS_SERVERLESS:
    # On Vercel Serverless Functions, only the system temp directory (/tmp) is writable.
    TMP_DIR = tempfile.gettempdir()
    DB_PATH = os.path.join(TMP_DIR, "food_packaging.db")
    
    # If a pre-seeded database is bundled in the repository, copy it to temp dir on cold start
    if os.path.exists(BUNDLED_DB_PATH) and not os.path.exists(DB_PATH):
        try:
            shutil.copyfile(BUNDLED_DB_PATH, DB_PATH)
        except Exception as e:
            print(f"Notice: Could not copy seed DB to {DB_PATH} ({e}), will initialize fresh.")
else:
    DB_PATH = BUNDLED_DB_PATH

SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

_initialized = False

def init_db():
    """Ensure database schema is created and seed catalog data is populated."""
    global _initialized
    if _initialized:
        return
    
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        from app.models import PackagingMaterial
        from app.seed_data import seed_database
        
        try:
            count = session.query(PackagingMaterial).count()
        except Exception:
            count = 0
            
        if count == 0:
            seed_database(session)
    _initialized = True

def get_db():
    """Dependency that yields a database session for requests, ensuring DB is ready."""
    init_db()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
