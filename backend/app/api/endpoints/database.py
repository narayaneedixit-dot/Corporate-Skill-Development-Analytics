from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.database import (
    ConnectionTestRequest,
    ConnectionTestResponse,
    ConnectionSaveRequest,
    DatabaseStatusResponse
)
from backend.app.db.database import db_manager

router = APIRouter(prefix="/database", tags=["Database Connection"])


@router.get("/status", response_model=DatabaseStatusResponse)
def get_database_status():
    """
    Returns current active database connection status, schema inspection,
    table verification, and row count.
    Never exposes passwords or sensitive credentials.
    """
    status_data = db_manager.get_status()
    return DatabaseStatusResponse(**status_data)


@router.post("/test-connection", response_model=ConnectionTestResponse)
def test_database_connection(req: ConnectionTestRequest):
    """
    Test user-supplied PostgreSQL URI safely:
    - Verifies network connectivity and authentication
    - Queries database name and PostgreSQL engine version
    - Verifies existence of public.onet_software_skills
    - Validates expected schema columns
    - Retrieves record count
    Does not activate the connection globally.
    """
    if not req.connection_uri or not req.connection_uri.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid PostgreSQL connection URI is required."
        )

    res = db_manager.test_connection_uri(req.connection_uri.strip())
    return ConnectionTestResponse(**res)


@router.post("/connect", response_model=DatabaseStatusResponse)
def connect_database(req: ConnectionSaveRequest):
    """
    Validates and establishes the active database connection for the application.
    Enables analytics dashboard endpoints.
    """
    if not req.connection_uri or not req.connection_uri.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid PostgreSQL connection URI is required."
        )

    try:
        status_info = db_manager.connect(req.connection_uri.strip())
        return DatabaseStatusResponse(**status_info)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/disconnect")
def disconnect_database():
    """Disconnects the active database."""
    db_manager.disconnect()
    return {"message": "Database disconnected successfully."}
