import uvicorn
import os
import sys

# Ensure backend root is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 8000))
    reload = os.environ.get("RELOAD", "false").lower() in ("true", "1", "yes")
    print(f"Starting SIH 26236 Food Packaging Decision Support Backend on {host}:{port}...")
    uvicorn.run("app.main:app", host=host, port=port, reload=reload)
