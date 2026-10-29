import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.database import db_manager

client = TestClient(app)


def test_health_check():
    """Verify health endpoint returns 200 with service information."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "database" in data
    assert "version" in data


def test_database_status_initially_disconnected():
    """Verify initial database status reports not connected when no URI provided."""
    db_manager.disconnect()
    response = client.get("/api/database/status")
    assert response.status_code == 200
    data = response.json()
    assert data["connected"] is False
    assert data["table_name"] == "onet_software_skills"


def test_test_connection_empty_uri():
    """Verify testing empty connection URI fails with 400 Bad Request."""
    response = client.post("/api/database/test-connection", json={"connection_uri": ""})
    assert response.status_code == 400


def test_test_connection_invalid_credentials():
    """Verify invalid credentials return error without crashing or exposing raw secrets."""
    invalid_uri = "postgresql://invalid_user:fake_password_12345@127.0.0.1:5432/nonexistent_db"
    response = client.post("/api/database/test-connection", json={"connection_uri": invalid_uri})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    # Verify password is not in message or error
    assert "fake_password_12345" not in data.get("error", "")
    assert "fake_password_12345" not in data.get("message", "")


def test_analytics_endpoints_require_connection():
    """Verify analytics endpoints return 503 when database is not connected."""
    db_manager.disconnect()
    res_overview = client.get("/api/analytics/overview")
    assert res_overview.status_code == 503

    res_occupations = client.get("/api/analytics/top-occupations")
    assert res_occupations.status_code == 503

    res_categories = client.get("/api/analytics/software-categories")
    assert res_categories.status_code == 503


def test_data_exploration_requires_connection():
    """Verify records and explorer endpoints return 503 when disconnected."""
    db_manager.disconnect()
    res_records = client.get("/api/records")
    assert res_records.status_code == 503

    res_occupations = client.get("/api/occupations")
    assert res_occupations.status_code == 503
