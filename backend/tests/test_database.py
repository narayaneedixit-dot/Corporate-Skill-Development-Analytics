import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.core.security import redact_error_message, normalize_postgres_uri
from backend.app.models.onet import OnetSoftwareSkill
from backend.app.db.database import Base
from backend.app.services.analytics import (
    calculate_overview,
    calculate_top_occupations,
    calculate_software_categories,
    calculate_technology_distribution,
    calculate_demand_distribution,
    calculate_top_software,
    generate_insights
)
from backend.app.services.onet import (
    get_paginated_records,
    get_paginated_occupations,
    get_paginated_software
)


@pytest.fixture
def test_db_session():
    """Create in-memory SQLite database populated with O*NET skill rows for unit tests."""
    engine = create_engine("sqlite:///:memory:")
    # Remove schema arg for sqlite testing
    OnetSoftwareSkill.__table__.schema = None
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(bind=engine)
    session = TestingSessionLocal()

    # Seed test dataset (sample slice resembling real O*NET data)
    test_rows = [
        OnetSoftwareSkill(
            id=1,
            onet_soc_code="15-1252.00",
            occupation_title="Software Developers",
            software_example="Python",
            element_id="4.A.1.b.2",
            software_category="Development environment software",
            hot_technology=True,
            in_demand=True
        ),
        OnetSoftwareSkill(
            id=2,
            onet_soc_code="15-1252.00",
            occupation_title="Software Developers",
            software_example="PostgreSQL",
            element_id="4.A.1.b.2",
            software_category="Database management system software",
            hot_technology=True,
            in_demand=True
        ),
        OnetSoftwareSkill(
            id=3,
            onet_soc_code="15-1252.00",
            occupation_title="Software Developers",
            software_example="Git",
            element_id="4.A.1.b.2",
            software_category="Configuration management software",
            hot_technology=False,
            in_demand=True
        ),
        OnetSoftwareSkill(
            id=4,
            onet_soc_code="15-2051.00",
            occupation_title="Data Scientists",
            software_example="Python",
            element_id="4.A.1.b.2",
            software_category="Development environment software",
            hot_technology=True,
            in_demand=True
        ),
        OnetSoftwareSkill(
            id=5,
            onet_soc_code="15-2051.00",
            occupation_title="Data Scientists",
            software_example="Microsoft Excel",
            element_id="4.A.1.b.2",
            software_category="Spreadsheet software",
            hot_technology=False,
            in_demand=False
        ),
        OnetSoftwareSkill(
            id=6,
            onet_soc_code="13-1111.00",
            occupation_title="Management Analysts",
            software_example="Microsoft Excel",
            element_id="4.A.1.b.2",
            software_category="Spreadsheet software",
            hot_technology=False,
            in_demand=False
        ),
    ]
    session.add_all(test_rows)
    session.commit()

    yield session

    session.close()
    Base.metadata.drop_all(engine)
    # Restore schema
    OnetSoftwareSkill.__table__.schema = "public"


def test_redact_error_message():
    raw_error = "FATAL: password authentication failed for user 'postgres' with url postgresql://postgres:mySecretPass123@aws.supabase.com:5432/postgres"
    redacted = redact_error_message(raw_error)
    assert "mySecretPass123" not in redacted
    assert "postgres:***@" in redacted


def test_normalize_postgres_uri():
    assert normalize_postgres_uri("postgresql://user:pass@host/db") == "postgresql+psycopg://user:pass@host/db"
    assert normalize_postgres_uri("postgres://user:pass@host/db") == "postgresql+psycopg://user:pass@host/db"


def test_analytics_calculations(test_db_session):
    overview = calculate_overview(test_db_session)
    assert overview.total_records == 6
    assert overview.unique_occupations == 3
    assert overview.distinct_software == 4
    assert overview.hot_technologies == 3
    assert overview.in_demand_skills == 4
    assert overview.hot_tech_percentage == 50.0

    top_occs = calculate_top_occupations(test_db_session, limit=2)
    assert len(top_occs) == 2
    assert top_occs[0].occupation_title == "Software Developers"
    assert top_occs[0].software_count == 3

    categories = calculate_software_categories(test_db_session)
    assert len(categories) > 0
    cat_names = [c.software_category for c in categories]
    assert "Development environment software" in cat_names

    top_software = calculate_top_software(test_db_session, limit=5)
    # Python is in 2 occupations, Excel is in 2 occupations
    assert top_software[0].occupation_count == 2

    insights = generate_insights(test_db_session)
    assert len(insights.insights) >= 4
    assert "Software Developers" in insights.insights[0].title


def test_pagination_and_filters(test_db_session):
    # Test search filter
    res = get_paginated_records(test_db_session, search="Python", page=1, page_size=10)
    assert res.total == 2
    for item in res.items:
        assert item.software_example == "Python"

    # Test hot filter
    res_hot = get_paginated_records(test_db_session, hot_technology=True, page=1, page_size=10)
    assert res_hot.total == 3

    # Test occupation pagination
    res_occ = get_paginated_occupations(test_db_session, search="Data", page=1, page_size=10)
    assert res_occ.total == 1
    assert res_occ.items[0].occupation_title == "Data Scientists"

    # Test software pagination
    res_sw = get_paginated_software(test_db_session, search="Excel", page=1, page_size=10)
    assert res_sw.total == 1
    assert res_sw.items[0].software_example == "Microsoft Excel"
