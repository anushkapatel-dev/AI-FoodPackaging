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

from app.main import app as fastapi_app

class VercelPathNormalizer:
    """
    ASGI middleware ensuring incoming requests match FastAPI's defined routes.
    - If path arrives without /api (e.g. /health, /recommend, /commodities, /materials, /sources):
      normalizes to /api/health, /api/recommend, etc.
    - If path arrives with /index.py or /api/index.py:
      cleans the path to /api or the target subpath.
    - If path already has /api prefix:
      leaves untouched.
    """
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope.get("type") == "http":
            path = scope.get("path", "")
            if "/index.py" in path:
                cleaned = path.replace("/api/index.py", "").replace("/index.py", "")
                scope["path"] = f"/api{cleaned}" if cleaned else "/api"
            elif path and not path.startswith("/api") and path != "/":
                scope["path"] = f"/api{path}"

        await self.app(scope, receive, send)

app = VercelPathNormalizer(fastapi_app)
