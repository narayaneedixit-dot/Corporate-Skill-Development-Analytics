from typing import List, Dict, Any
from sqlalchemy import text, func, distinct, case, desc
from sqlalchemy.orm import Session
from backend.app.models.onet import OnetSoftwareSkill
from backend.app.schemas.analytics import (
    AnalyticsOverviewResponse,
    TopOccupationItem,
    SoftwareCategoryItem,
    TechnologyDistributionResponse,
    DemandDistributionResponse,
    DistributionItem,
    TopSoftwareItem,
    AnalyticsInsightsResponse,
    InsightHighlight
)


def calculate_overview(db: Session) -> AnalyticsOverviewResponse:
    """
    Computes global O*NET dataset metrics via SQL aggregation:
    total records, unique occupations, distinct software examples,
    hot technology counts, in-demand counts.
    """
    row = db.query(
        func.count(OnetSoftwareSkill.id).label("total_records"),
        func.count(distinct(OnetSoftwareSkill.occupation_title)).label("unique_occupations"),
        func.count(distinct(OnetSoftwareSkill.software_example)).label("distinct_software"),
        func.coalesce(
            func.sum(case((OnetSoftwareSkill.hot_technology.is_(True), 1), else_=0)), 0
        ).label("hot_count"),
        func.coalesce(
            func.sum(case((OnetSoftwareSkill.in_demand.is_(True), 1), else_=0)), 0
        ).label("demand_count")
    ).one()

    total = int(row.total_records or 0)
    hot = int(row.hot_count or 0)
    demand = int(row.demand_count or 0)

    hot_pct = round((hot / total * 100), 2) if total > 0 else 0.0
    demand_pct = round((demand / total * 100), 2) if total > 0 else 0.0

    return AnalyticsOverviewResponse(
        total_records=total,
        unique_occupations=int(row.unique_occupations or 0),
        distinct_software=int(row.distinct_software or 0),
        hot_technologies=hot,
        in_demand_skills=demand,
        hot_tech_percentage=hot_pct,
        in_demand_percentage=demand_pct,
        database_connected=True
    )


def calculate_top_occupations(db: Session, limit: int = 10) -> List[TopOccupationItem]:
    """
    Finds occupations with the highest software skill requirements/mentions.
    """
    results = db.query(
        OnetSoftwareSkill.occupation_title,
        OnetSoftwareSkill.onet_soc_code,
        func.count(OnetSoftwareSkill.id).label("software_count"),
        func.coalesce(
            func.sum(case((OnetSoftwareSkill.hot_technology.is_(True), 1), else_=0)), 0
        ).label("hot_count"),
        func.coalesce(
            func.sum(case((OnetSoftwareSkill.in_demand.is_(True), 1), else_=0)), 0
        ).label("in_demand_count")
    ).filter(
        OnetSoftwareSkill.occupation_title.isnot(None)
    ).group_by(
        OnetSoftwareSkill.occupation_title,
        OnetSoftwareSkill.onet_soc_code
    ).order_by(
        desc("software_count")
    ).limit(limit).all()

    return [
        TopOccupationItem(
            occupation_title=r.occupation_title,
            onet_soc_code=r.onet_soc_code,
            software_count=int(r.software_count),
            hot_count=int(r.hot_count),
            in_demand_count=int(r.in_demand_count)
        )
        for r in results
    ]


def calculate_software_categories(db: Session, limit: int = 12) -> List[SoftwareCategoryItem]:
    """
    Returns breakdown of software categories ordered by record frequency.
    """
    total_records = db.query(func.count(OnetSoftwareSkill.id)).scalar() or 1

    results = db.query(
        func.coalesce(OnetSoftwareSkill.software_category, "Uncategorized").label("category"),
        func.count(OnetSoftwareSkill.id).label("cat_count")
    ).group_by(
        "category"
    ).order_by(
        desc("cat_count")
    ).limit(limit).all()

    return [
        SoftwareCategoryItem(
            software_category=r.category,
            count=int(r.cat_count),
            percentage=round(int(r.cat_count) / total_records * 100, 2)
        )
        for r in results
    ]


def calculate_technology_distribution(db: Session) -> TechnologyDistributionResponse:
    """
    Hot Technology vs Standard Technology distribution.
    """
    total = db.query(func.count(OnetSoftwareSkill.id)).scalar() or 0
    hot = db.query(func.count(OnetSoftwareSkill.id)).filter(OnetSoftwareSkill.hot_technology.is_(True)).scalar() or 0
    standard = total - hot

    hot_pct = round((hot / total * 100), 2) if total > 0 else 0.0
    std_pct = round((standard / total * 100), 2) if total > 0 else 0.0

    return TechnologyDistributionResponse(
        hot=hot,
        standard=standard,
        hot_percentage=hot_pct,
        standard_percentage=std_pct,
        distribution=[
            DistributionItem(name="Hot Technology", count=hot, percentage=hot_pct),
            DistributionItem(name="Standard Technology", count=standard, percentage=std_pct)
        ]
    )


def calculate_demand_distribution(db: Session) -> DemandDistributionResponse:
    """
    In-Demand vs Baseline skills distribution.
    """
    total = db.query(func.count(OnetSoftwareSkill.id)).scalar() or 0
    in_demand = db.query(func.count(OnetSoftwareSkill.id)).filter(OnetSoftwareSkill.in_demand.is_(True)).scalar() or 0
    baseline = total - in_demand

    demand_pct = round((in_demand / total * 100), 2) if total > 0 else 0.0
    base_pct = round((baseline / total * 100), 2) if total > 0 else 0.0

    return DemandDistributionResponse(
        in_demand=in_demand,
        baseline=baseline,
        in_demand_percentage=demand_pct,
        baseline_percentage=base_pct,
        distribution=[
            DistributionItem(name="In-Demand Skills", count=in_demand, percentage=demand_pct),
            DistributionItem(name="Baseline Requirements", count=baseline, percentage=base_pct)
        ]
    )


def calculate_top_software(db: Session, limit: int = 15) -> List[TopSoftwareItem]:
    """
    Identifies software skills that span across the widest number of distinct occupations.
    """
    results = db.query(
        OnetSoftwareSkill.software_example,
        func.count(distinct(OnetSoftwareSkill.occupation_title)).label("occupation_count"),
        func.max(case((OnetSoftwareSkill.hot_technology.is_(True), 1), else_=0)).label("is_hot_int"),
        func.max(case((OnetSoftwareSkill.in_demand.is_(True), 1), else_=0)).label("is_in_demand_int")
    ).filter(
        OnetSoftwareSkill.software_example.isnot(None)
    ).group_by(
        OnetSoftwareSkill.software_example
    ).order_by(
        desc("occupation_count")
    ).limit(limit).all()

    items: List[TopSoftwareItem] = []
    for r in results:
        # Fetch distinct categories for this software
        cats = db.query(distinct(OnetSoftwareSkill.software_category)).filter(
            OnetSoftwareSkill.software_example == r.software_example
        ).limit(3).all()
        cat_list = [c[0] for c in cats if c[0]]

        items.append(
            TopSoftwareItem(
                software_example=r.software_example,
                occupation_count=int(r.occupation_count),
                categories=cat_list,
                is_hot=bool(r.is_hot_int == 1),
                is_in_demand=bool(r.is_in_demand_int == 1)
            )
        )
    return items


def generate_insights(db: Session) -> AnalyticsInsightsResponse:
    """
    Synthesizes executive workforce insights grounded strictly in O*NET descriptive data.
    """
    overview = calculate_overview(db)
    top_occ = calculate_top_occupations(db, limit=3)
    top_soft = calculate_top_software(db, limit=3)
    top_cats = calculate_software_categories(db, limit=3)

    insights: List[InsightHighlight] = []

    # 1. Occupational software density
    if top_occ:
        top_1 = top_occ[0]
        insights.append(
            InsightHighlight(
                id="occ_density",
                category="Occupational Density",
                title=f"Highest Software Intensity: {top_1.occupation_title}",
                description=f"Demands {top_1.software_count:,} discrete software proficiencies, with {top_1.hot_count} categorized as hot technologies.",
                metric_value=f"{top_1.software_count}",
                metric_label="Software Skills",
                source_context=f"O*NET SOC Code: {top_1.onet_soc_code or 'N/A'}"
            )
        )

    # 2. Universal Cross-Occupation Tooling
    if top_soft:
        top_tool = top_soft[0]
        insights.append(
            InsightHighlight(
                id="cross_prevalence",
                category="Cross-Occupation Utility",
                title=f"Most Ubiquitous Software: {top_tool.software_example}",
                description=f"Appears across {top_tool.occupation_count:,} unique occupational profiles, demonstrating universal workforce applicability.",
                metric_value=f"{top_tool.occupation_count}",
                metric_label="Occupations",
                source_context="Cross-role foundational competency"
            )
        )

    # 3. Dominant Software Domain
    if top_cats:
        top_c = top_cats[0]
        insights.append(
            InsightHighlight(
                id="cat_dominance",
                category="Category Distribution",
                title=f"Primary Technology Cluster: {top_c.software_category}",
                description=f"Accounts for {top_c.count:,} skill records ({top_c.percentage}% of all classified software references in O*NET).",
                metric_value=f"{top_c.percentage}%",
                metric_label="Share of Records",
                source_context=f"{top_c.count:,} total classifications"
            )
        )

    # 4. Hot Technology Proportion
    insights.append(
        InsightHighlight(
            id="hot_tech_share",
            category="Innovation Momentum",
            title=f"Hot Technology Rate: {overview.hot_tech_percentage}% of Dataset",
            description=f"{overview.hot_technologies:,} of {overview.total_records:,} skill mappings are flagged as emerging or rapidly evolving technologies.",
            metric_value=f"{overview.hot_tech_percentage}%",
            metric_label="Hot Tech Ratio",
            source_context="O*NET hot technology methodology flag"
        )
    )

    summary = (
        f"Analysis across {overview.total_records:,} O*NET records and {overview.unique_occupations:,} "
        f"occupations indicates high skill clustering around {top_cats[0].software_category if top_cats else 'enterprise tooling'}. "
        f"A total of {overview.hot_technologies:,} tools ({overview.hot_tech_percentage}%) are flagged as hot technologies, "
        f"while {overview.in_demand_skills:,} ({overview.in_demand_percentage}%) represent high-frequency employer requirements."
    )

    methodology = (
        "Descriptive analysis derived from the O*NET 28.1+ Software Skills dataset (public.onet_software_skills). "
        "These metrics represent occupational curriculum and job requirement classifications documented by the U.S. "
        "Department of Labor, not real-time internal enterprise employee performance or active talent readiness."
    )

    return AnalyticsInsightsResponse(
        insights=insights,
        summary=summary,
        methodology_note=methodology
    )
