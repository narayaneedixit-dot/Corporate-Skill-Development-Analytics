import logging
import threading
from typing import Generator, Optional, Dict, Any
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from backend.app.core.config import settings, sanitize_db_uri, extract_host_from_uri
from backend.app.core.security import normalize_postgres_uri, redact_error_message

logger = logging.getLogger("skill_intelligence.database")

Base = declarative_base()

class DatabaseManager:
    def __init__(self):
        self._lock = threading.Lock()
        self.engine = None
        self.SessionLocal = None
        self.current_uri: Optional[str] = None
        self.is_connected: bool = False
        self.last_tested_uri: Optional[str] = None
        self.status_info: Dict[str, Any] = {
            "connected": False,
            "database_name": None,
            "server_version": None,
            "table_exists": False,
            "table_name": "onet_software_skills",
            "row_count": 0,
            "columns": [],
            "host": None,
            "error": None,
        }

    def init_from_env(self):
        """Initialize engine from DATABASE_URL env var if available."""
        if settings.DATABASE_URL:
            logger.info("Initializing database from DATABASE_URL environment variable...")
            try:
                self.connect(settings.DATABASE_URL)
            except Exception as e:
                logger.warning(f"Failed to connect from DATABASE_URL: {redact_error_message(str(e))}")

    def test_connection_uri(self, raw_uri: str) -> Dict[str, Any]:
        """
        Safely test a connection string without altering the active application engine.
        Validates:
        1. Connects to PostgreSQL.
        2. Retrieves database name and version.
        3. Checks if public.onet_software_skills exists.
        4. Verifies expected columns and retrieves row count.
        """
        normalized_uri = normalize_postgres_uri(raw_uri)
        test_engine = None
        result_info = {
            "success": False,
            "database_name": None,
            "server_version": None,
            "table_name": "onet_software_skills",
            "table_exists": False,
            "row_count": 0,
            "columns": [],
            "host": extract_host_from_uri(raw_uri),
            "message": "",
            "error": None
        }

        try:
            test_engine = create_engine(
                normalized_uri,
                pool_pre_ping=True,
                connect_args={"connect_timeout": 10}
            )

            with test_engine.connect() as conn:
                # 1. DB Name and version
                db_name_res = conn.execute(text("SELECT current_database();")).scalar()
                version_res = conn.execute(text("SELECT version();")).scalar()
                result_info["database_name"] = str(db_name_res)
                result_info["server_version"] = str(version_res).split(" on ")[0] if version_res else "PostgreSQL"

                # 2. Inspect table existence
                inspector = inspect(conn)
                tables = inspector.get_table_names(schema="public")
                
                target_table = "onet_software_skills"
                # Check case variations
                table_found = target_table in tables or target_table.lower() in [t.lower() for t in tables]
                result_info["table_exists"] = table_found

                if table_found:
                    # Get columns
                    cols = inspector.get_columns(target_table, schema="public")
                    col_names = [col["name"] for col in cols]
                    result_info["columns"] = col_names

                    # Verify expected core columns
                    expected_cols = {"id", "onet_soc_code", "occupation_title", "software_example", "software_category"}
                    missing_cols = expected_cols - set(c.lower() for c in col_names)
                    if missing_cols:
                        result_info["message"] = f"Connected, but table 'public.onet_software_skills' is missing columns: {list(missing_cols)}"
                    else:
                        # Row count
                        count_res = conn.execute(text("SELECT count(*) FROM public.onet_software_skills;")).scalar()
                        result_info["row_count"] = int(count_res) if count_res is not None else 0
                        result_info["success"] = True
                        result_info["message"] = f"Connection verified. Found {result_info['row_count']:,} skill records in public.onet_software_skills."
                else:
                    result_info["message"] = f"Connected to database '{db_name_res}', but table 'public.onet_software_skills' was not found in schema 'public'."

        except Exception as e:
            err_msg = redact_error_message(str(e))
            result_info["success"] = False
            result_info["error"] = err_msg
            result_info["message"] = f"Connection failed: {err_msg}"
        finally:
            if test_engine:
                test_engine.dispose()

        return result_info

    def connect(self, raw_uri: str) -> Dict[str, Any]:
        """
        Validate and establish the application's global database connection.
        """
        with self._lock:
            # First test
            test_res = self.test_connection_uri(raw_uri)
            if not test_res["success"]:
                self.is_connected = False
                self.status_info = {
                    "connected": False,
                    "database_name": test_res.get("database_name"),
                    "server_version": test_res.get("server_version"),
                    "table_exists": test_res.get("table_exists", False),
                    "table_name": "onet_software_skills",
                    "row_count": test_res.get("row_count", 0),
                    "columns": test_res.get("columns", []),
                    "host": extract_host_from_uri(raw_uri),
                    "error": test_res.get("error") or test_res.get("message"),
                }
                raise ValueError(test_res.get("message") or "Database connection verification failed.")

            # Dispose previous engine
            if self.engine:
                try:
                    self.engine.dispose()
                except Exception:
                    pass

            normalized_uri = normalize_postgres_uri(raw_uri)
            self.engine = create_engine(
                normalized_uri,
                pool_size=settings.DB_POOL_SIZE,
                max_overflow=settings.DB_MAX_OVERFLOW,
                pool_timeout=settings.DB_POOL_TIMEOUT,
                pool_recycle=settings.DB_POOL_RECYCLE,
                pool_pre_ping=True
            )
            self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
            self.current_uri = raw_uri
            self.is_connected = True
            self.status_info = {
                "connected": True,
                "database_name": test_res["database_name"],
                "server_version": test_res["server_version"],
                "table_exists": True,
                "table_name": "onet_software_skills",
                "row_count": test_res["row_count"],
                "columns": test_res["columns"],
                "host": extract_host_from_uri(raw_uri),
                "error": None,
            }
            logger.info(f"Database connection successfully established to {self.status_info['host']}")
            return self.status_info

    def disconnect(self):
        with self._lock:
            if self.engine:
                self.engine.dispose()
            self.engine = None
            self.SessionLocal = None
            self.current_uri = None
            self.is_connected = False
            self.status_info = {
                "connected": False,
                "database_name": None,
                "server_version": None,
                "table_exists": False,
                "table_name": "onet_software_skills",
                "row_count": 0,
                "columns": [],
                "host": None,
                "error": None,
            }

    def get_status(self) -> Dict[str, Any]:
        with self._lock:
            # If marked connected, do a quick active check
            if self.is_connected and self.engine:
                try:
                    with self.engine.connect() as conn:
                        conn.execute(text("SELECT 1;"))
                        self.status_info["connected"] = True
                        self.status_info["error"] = None
                except Exception as e:
                    self.status_info["connected"] = False
                    self.status_info["error"] = redact_error_message(str(e))
            return dict(self.status_info)


db_manager = DatabaseManager()


from fastapi import HTTPException, status

def get_db() -> Generator[Session, None, None]:
    """FastAPI session dependency."""
    if not db_manager.is_connected or not db_manager.SessionLocal:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection not active. Please connect via /api/database/connect."
        )
    db = db_manager.SessionLocal()
    try:
        yield db
    finally:
        db.close()
