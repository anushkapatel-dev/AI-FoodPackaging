"""
Vercel Serverless Function entrypoint for FastAPI backend.
Discovers and exports the FastAPI application instance from backend/app/main.py.
"""
import sys
import os

# Determine absolute path to the backend directory
api_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(api_dir)
backend_dir = os.path.join(root_dir, "backend")

# Ensure backend directory is in sys.path so 'app' package is discoverable
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Export the FastAPI instance for Vercel Python runtime
from app.main import app
