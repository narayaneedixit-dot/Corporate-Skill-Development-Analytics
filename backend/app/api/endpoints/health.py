from fastapi import APIRouter
from backend.app.core.config import settings
from backend.app.db.database import db_manager

router = APIRouter()


@router.get("/health")
def get_health():
    db_status = db_manager.get_status()
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": {
            "connected": db_status["connected"],
            "host": db_status["host"],
            "table_exists": db_status["table_exists"],
            "row_count": db_status["row_count"]
        }
    }
