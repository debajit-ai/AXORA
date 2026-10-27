# Forward application from app.main so both `uvicorn main:app` and `uvicorn app.main:app` work seamlessly
from app.main import app

@app.get("/health", tags=["health"])
def root_health_check():
    """
    Root-level health check endpoint for backward compatibility.
    """
    return {"status": "ok", "message": "Project 55 backend is healthy."}
