import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.app.core.config import settings
from backend.app.core.security import redact_error_message
from backend.app.db.database import db_manager
from backend.app.api.router import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("skill_intelligence.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: attempt DB connection if DATABASE_URL is configured
    logger.info("Starting SKILL//INTELLIGENCE backend...")
    db_manager.init_from_env()
    yield
    # Shutdown: clean up DB connection pool
    logger.info("Shutting down SKILL//INTELLIGENCE backend...")
    db_manager.disconnect()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Corporate Workforce & Software Skills Analytics powered by O*NET dataset intelligence.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Ensure no raw database credentials or internal stack traces leak into responses.
    """
    cleaned_msg = redact_error_message(str(exc))
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {cleaned_msg}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred.", "error": cleaned_msg}
    )


# Include API routes
app.include_router(api_router, prefix=settings.API_PREFIX)


@app.get("/")
def root_status():
    status_info = db_manager.get_status()
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "api": "/api",
        "database_connected": status_info["connected"],
        "table_name": status_info["table_name"],
        "records": status_info["row_count"]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
