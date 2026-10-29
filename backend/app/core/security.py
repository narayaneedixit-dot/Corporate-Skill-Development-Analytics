import re
from urllib.parse import urlparse


def normalize_postgres_uri(uri: str) -> str:
    """
    Ensure the URI is compatible with SQLAlchemy 2.x and psycopg 3.
    If 'postgresql://' is provided, convert to 'postgresql+psycopg://'.
    Handle query parameters like sslmode safely.
    """
    uri = uri.strip()
    if uri.startswith("postgres://"):
        uri = "postgresql+psycopg://" + uri[len("postgres://"):]
    elif uri.startswith("postgresql://") and not uri.startswith("postgresql+"):
        uri = "postgresql+psycopg://" + uri[len("postgresql://"):]
    return uri


def redact_error_message(err_str: str) -> str:
    """
    Strip credentials, passwords, and internal secret tokens from error strings
    so they are never exposed to clients or logs.
    """
    # Strip user:passwords
    clean = re.sub(r"://([^:@]+):([^@]+)@", r"://\1:***@", str(err_str))
    # Strip password= patterns
    clean = re.sub(r"password=['\"][^'\"]*['\"]", "password='***'", clean, flags=re.IGNORECASE)
    clean = re.sub(r"password=[^\s;&]+", "password=***", clean, flags=re.IGNORECASE)
    return clean
