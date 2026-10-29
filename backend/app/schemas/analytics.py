from typing import List, Optional
from pydantic import BaseModel


class AnalyticsOverviewResponse(BaseModel):
    total_records: int
    unique_occupations: int
    distinct_software: int
    hot_technologies: int
    in_demand_skills: int
    hot_tech_percentage: float
    in_demand_percentage: float
    database_connected: bool


class TopOccupationItem(BaseModel):
    occupation_title: str
    onet_soc_code: Optional[str] = None
    software_count: int
    hot_count: int
    in_demand_count: int


class SoftwareCategoryItem(BaseModel):
    software_category: str
    count: int
    percentage: float


class DistributionItem(BaseModel):
    name: str
    count: int
    percentage: float


class TechnologyDistributionResponse(BaseModel):
    hot: int
    standard: int
    hot_percentage: float
    standard_percentage: float
    distribution: List[DistributionItem]


class DemandDistributionResponse(BaseModel):
    in_demand: int
    baseline: int
    in_demand_percentage: float
    baseline_percentage: float
    distribution: List[DistributionItem]


class TopSoftwareItem(BaseModel):
    software_example: str
    occupation_count: int
    categories: List[str]
    is_hot: bool
    is_in_demand: bool


class InsightHighlight(BaseModel):
    id: str
    category: str
    title: str
    description: str
    metric_value: str
    metric_label: str
    source_context: str


class AnalyticsInsightsResponse(BaseModel):
    insights: List[InsightHighlight]
    summary: str
    methodology_note: str
