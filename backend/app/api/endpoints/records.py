from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import distinct
from sqlalchemy.orm import Session
from backend.app.db.database import get_db, db_manager
from backend.app.models.onet import OnetSoftwareSkill
from backend.app.schemas.onet import (
    PaginatedRecordsResponse,
    PaginatedOccupationsResponse,
    PaginatedSoftwareResponse
)
from backend.app.services.onet import (
    get_paginated_records,
    get_paginated_occupations,
    get_paginated_software
)

router = APIRouter(tags=["Data Exploration"])


def check_db_connected():
    if not db_manager.is_connected or not db_manager.engine:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not connected. Please provide and test your Supabase PostgreSQL connection URI in the database connection settings."
        )


@router.get("/records", response_model=PaginatedRecordsResponse)
def get_skill_records(
    search: Optional[str] = Query(None, description="Search across titles, software, or SOC code"),
    occupation: Optional[str] = Query(None, description="Filter by occupation title"),
    category: Optional[str] = Query(None, description="Filter by software category"),
    hot_technology: Optional[bool] = Query(None, description="Filter hot technology status"),
    in_demand: Optional[bool] = Query(None, description="Filter in-demand status"),
    sort_by: str = Query("id", description="Sort column (id, onet_soc_code, occupation_title, software_example, software_category)"),
    sort_dir: str = Query("asc", description="Sort direction (asc, desc)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(25, ge=5, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    check_db_connected()
    return get_paginated_records(
        db=db,
        search=search,
        occupation=occupation,
        category=category,
        hot_technology=hot_technology,
        in_demand=in_demand,
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=page,
        page_size=page_size
    )


@router.get("/occupations", response_model=PaginatedOccupationsResponse)
def get_occupations(
    search: Optional[str] = Query(None, description="Search occupation title or SOC code"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=5, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    check_db_connected()
    return get_paginated_occupations(
        db=db,
        search=search,
        page=page,
        page_size=page_size
    )


@router.get("/software", response_model=PaginatedSoftwareResponse)
def get_software(
    search: Optional[str] = Query(None, description="Search software name"),
    category: Optional[str] = Query(None, description="Filter by category"),
    hot_only: Optional[bool] = Query(None, description="Hot technology only"),
    in_demand_only: Optional[bool] = Query(None, description="In-demand only"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(24, ge=6, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    check_db_connected()
    return get_paginated_software(
        db=db,
        search=search,
        category=category,
        hot_only=hot_only,
        in_demand_only=in_demand_only,
        page=page,
        page_size=page_size
    )


@router.get("/categories", response_model=List[str])
def get_categories(db: Session = Depends(get_db)):
    """Fetch distinct software categories for dropdown filtering."""
    check_db_connected()
    cats = db.query(distinct(OnetSoftwareSkill.software_category)).filter(
        OnetSoftwareSkill.software_category.isnot(None)
    ).order_by(OnetSoftwareSkill.software_category).all()
    return [c[0] for c in cats if c[0]]
