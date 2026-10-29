from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.db.database import get_db, db_manager
from backend.app.schemas.analytics import (
    AnalyticsOverviewResponse,
    TopOccupationItem,
    SoftwareCategoryItem,
    TechnologyDistributionResponse,
    DemandDistributionResponse,
    TopSoftwareItem,
    AnalyticsInsightsResponse
)
from backend.app.services.analytics import (
    calculate_overview,
    calculate_top_occupations,
    calculate_software_categories,
    calculate_technology_distribution,
    calculate_demand_distribution,
    calculate_top_software,
    generate_insights
)

router = APIRouter(prefix="/analytics", tags=["Workforce Analytics"])


def check_db_connected():
    if not db_manager.is_connected or not db_manager.engine:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not connected. Please provide and test your Supabase PostgreSQL connection URI in the database connection settings."
        )


@router.get("/overview", response_model=AnalyticsOverviewResponse)
def get_analytics_overview(db: Session = Depends(get_db)):
    check_db_connected()
    return calculate_overview(db)


@router.get("/top-occupations", response_model=List[TopOccupationItem])
def get_top_occupations(
    limit: int = Query(10, ge=1, le=50, description="Max occupations to return"),
    db: Session = Depends(get_db)
):
    check_db_connected()
    return calculate_top_occupations(db, limit=limit)


@router.get("/software-categories", response_model=List[SoftwareCategoryItem])
def get_software_categories(
    limit: int = Query(12, ge=1, le=50, description="Max categories to return"),
    db: Session = Depends(get_db)
):
    check_db_connected()
    return calculate_software_categories(db, limit=limit)


@router.get("/technology-distribution", response_model=TechnologyDistributionResponse)
def get_technology_distribution(db: Session = Depends(get_db)):
    check_db_connected()
    return calculate_technology_distribution(db)


@router.get("/demand-distribution", response_model=DemandDistributionResponse)
def get_demand_distribution(db: Session = Depends(get_db)):
    check_db_connected()
    return calculate_demand_distribution(db)


@router.get("/top-software", response_model=List[TopSoftwareItem])
def get_top_software(
    limit: int = Query(15, ge=1, le=50, description="Max top software to return"),
    db: Session = Depends(get_db)
):
    check_db_connected()
    return calculate_top_software(db, limit=limit)


@router.get("/insights", response_model=AnalyticsInsightsResponse)
def get_insights_report(db: Session = Depends(get_db)):
    check_db_connected()
    return generate_insights(db)
