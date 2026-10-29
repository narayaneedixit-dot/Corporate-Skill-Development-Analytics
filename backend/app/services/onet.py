from typing import Optional, List, Dict, Any
from sqlalchemy import func, distinct, desc, asc, or_, and_, case
from sqlalchemy.orm import Session
from backend.app.models.onet import OnetSoftwareSkill
from backend.app.schemas.onet import (
    OnetSkillRecord,
    PaginatedRecordsResponse,
    OccupationDetailItem,
    PaginatedOccupationsResponse,
    SoftwareDetailItem,
    PaginatedSoftwareResponse
)


def get_paginated_records(
    db: Session,
    search: Optional[str] = None,
    occupation: Optional[str] = None,
    category: Optional[str] = None,
    hot_technology: Optional[bool] = None,
    in_demand: Optional[bool] = None,
    sort_by: str = "id",
    sort_dir: str = "asc",
    page: int = 1,
    page_size: int = 25
) -> PaginatedRecordsResponse:
    query = db.query(OnetSoftwareSkill)

    # Search filter across occupation, code, software, category
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                OnetSoftwareSkill.occupation_title.ilike(term),
                OnetSoftwareSkill.onet_soc_code.ilike(term),
                OnetSoftwareSkill.software_example.ilike(term),
                OnetSoftwareSkill.software_category.ilike(term)
            )
        )

    if occupation and occupation.strip():
        query = query.filter(OnetSoftwareSkill.occupation_title.ilike(f"%{occupation.strip()}%"))

    if category and category.strip():
        query = query.filter(OnetSoftwareSkill.software_category == category.strip())

    if hot_technology is not None:
        query = query.filter(OnetSoftwareSkill.hot_technology.is_(hot_technology))

    if in_demand is not None:
        query = query.filter(OnetSoftwareSkill.in_demand.is_(in_demand))

    total = query.count()

    # Safe sorting
    sort_column_map = {
        "id": OnetSoftwareSkill.id,
        "onet_soc_code": OnetSoftwareSkill.onet_soc_code,
        "occupation_title": OnetSoftwareSkill.occupation_title,
        "software_example": OnetSoftwareSkill.software_example,
        "software_category": OnetSoftwareSkill.software_category,
        "hot_technology": OnetSoftwareSkill.hot_technology,
        "in_demand": OnetSoftwareSkill.in_demand
    }
    col = sort_column_map.get(sort_by, OnetSoftwareSkill.id)
    if sort_dir.lower() == "desc":
        query = query.order_by(desc(col))
    else:
        query = query.order_by(asc(col))

    page = max(1, page)
    page_size = min(max(5, page_size), 100)
    offset = (page - 1) * page_size

    rows = query.offset(offset).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    items = [
        OnetSkillRecord(
            id=r.id,
            onet_soc_code=r.onet_soc_code,
            occupation_title=r.occupation_title,
            software_example=r.software_example,
            element_id=r.element_id,
            software_category=r.software_category,
            hot_technology=bool(r.hot_technology),
            in_demand=bool(r.in_demand)
        )
        for r in rows
    ]

    return PaginatedRecordsResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1
    )


def get_paginated_occupations(
    db: Session,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 20
) -> PaginatedOccupationsResponse:
    base_query = db.query(
        OnetSoftwareSkill.occupation_title,
        OnetSoftwareSkill.onet_soc_code,
        func.count(OnetSoftwareSkill.id).label("software_count"),
        func.coalesce(func.sum(case((OnetSoftwareSkill.hot_technology.is_(True), 1), else_=0)), 0).label("hot_count"),
        func.coalesce(func.sum(case((OnetSoftwareSkill.in_demand.is_(True), 1), else_=0)), 0).label("in_demand_count")
    ).filter(
        OnetSoftwareSkill.occupation_title.isnot(None)
    )

    if search and search.strip():
        term = f"%{search.strip()}%"
        base_query = base_query.filter(
            or_(
                OnetSoftwareSkill.occupation_title.ilike(term),
                OnetSoftwareSkill.onet_soc_code.ilike(term)
            )
        )

    grouped_query = base_query.group_by(
        OnetSoftwareSkill.occupation_title,
        OnetSoftwareSkill.onet_soc_code
    )

    # Count distinct occupation groups
    total = grouped_query.count()

    page = max(1, page)
    page_size = min(max(5, page_size), 50)
    offset = (page - 1) * page_size

    rows = grouped_query.order_by(desc("software_count")).offset(offset).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    items: List[OccupationDetailItem] = []
    for r in rows:
        # Sample software examples
        samples = db.query(OnetSoftwareSkill.software_example).filter(
            OnetSoftwareSkill.occupation_title == r.occupation_title
        ).limit(4).all()
        sample_list = [s[0] for s in samples if s[0]]

        # Categories
        cats = db.query(distinct(OnetSoftwareSkill.software_category)).filter(
            OnetSoftwareSkill.occupation_title == r.occupation_title
        ).limit(3).all()
        cat_list = [c[0] for c in cats if c[0]]

        items.append(
            OccupationDetailItem(
                onet_soc_code=r.onet_soc_code,
                occupation_title=r.occupation_title,
                software_count=int(r.software_count),
                hot_count=int(r.hot_count),
                in_demand_count=int(r.in_demand_count),
                categories=cat_list,
                sample_software=sample_list
            )
        )

    return PaginatedOccupationsResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


def get_paginated_software(
    db: Session,
    search: Optional[str] = None,
    category: Optional[str] = None,
    hot_only: Optional[bool] = None,
    in_demand_only: Optional[bool] = None,
    page: int = 1,
    page_size: int = 24
) -> PaginatedSoftwareResponse:
    base_query = db.query(
        OnetSoftwareSkill.software_example,
        func.max(OnetSoftwareSkill.software_category).label("software_category"),
        func.count(distinct(OnetSoftwareSkill.occupation_title)).label("occupation_count"),
        func.max(case((OnetSoftwareSkill.hot_technology.is_(True), 1), else_=0)).label("hot_technology_int"),
        func.max(case((OnetSoftwareSkill.in_demand.is_(True), 1), else_=0)).label("in_demand_int")
    ).filter(
        OnetSoftwareSkill.software_example.isnot(None)
    )

    if search and search.strip():
        term = f"%{search.strip()}%"
        base_query = base_query.filter(OnetSoftwareSkill.software_example.ilike(term))

    if category and category.strip():
        base_query = base_query.filter(OnetSoftwareSkill.software_category == category.strip())

    if hot_only:
        base_query = base_query.filter(OnetSoftwareSkill.hot_technology.is_(True))

    if in_demand_only:
        base_query = base_query.filter(OnetSoftwareSkill.in_demand.is_(True))

    grouped_query = base_query.group_by(OnetSoftwareSkill.software_example)
    total = grouped_query.count()

    page = max(1, page)
    page_size = min(max(6, page_size), 60)
    offset = (page - 1) * page_size

    rows = grouped_query.order_by(desc("occupation_count")).offset(offset).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    items: List[SoftwareDetailItem] = []
    for r in rows:
        sample_occs = db.query(distinct(OnetSoftwareSkill.occupation_title)).filter(
            OnetSoftwareSkill.software_example == r.software_example
        ).limit(3).all()
        occ_list = [o[0] for o in sample_occs if o[0]]

        items.append(
            SoftwareDetailItem(
                software_example=r.software_example,
                occupation_count=int(r.occupation_count),
                software_category=r.software_category,
                hot_technology=bool(r.hot_technology_int == 1),
                in_demand=bool(r.in_demand_int == 1),
                sample_occupations=occ_list
            )
        )

    return PaginatedSoftwareResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )
