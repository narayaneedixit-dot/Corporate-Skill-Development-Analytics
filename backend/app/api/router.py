from fastapi import APIRouter
from backend.app.api.endpoints import health, database, analytics, records

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(database.router)
api_router.include_router(analytics.router)
api_router.include_router(records.router)
