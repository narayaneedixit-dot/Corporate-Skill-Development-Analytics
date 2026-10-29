from typing import List, Optional
from pydantic import BaseModel


class OnetSkillRecord(BaseModel):
    id: int
    onet_soc_code: Optional[str] = None
    occupation_title: Optional[str] = None
    software_example: Optional[str] = None
    element_id: Optional[str] = None
    software_category: Optional[str] = None
    hot_technology: bool = False
    in_demand: bool = False


class PaginatedRecordsResponse(BaseModel):
    items: List[OnetSkillRecord]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool


class OccupationDetailItem(BaseModel):
    onet_soc_code: Optional[str]
    occupation_title: str
    software_count: int
    hot_count: int
    in_demand_count: int
    categories: List[str]
    sample_software: List[str]


class PaginatedOccupationsResponse(BaseModel):
    items: List[OccupationDetailItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class SoftwareDetailItem(BaseModel):
    software_example: str
    occupation_count: int
    software_category: Optional[str]
    hot_technology: bool
    in_demand: bool
    sample_occupations: List[str]


class PaginatedSoftwareResponse(BaseModel):
    items: List[SoftwareDetailItem]
    total: int
    page: int
    page_size: int
    total_pages: int
