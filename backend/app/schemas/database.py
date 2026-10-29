from typing import List, Optional
from pydantic import BaseModel, Field


class ConnectionTestRequest(BaseModel):
    connection_uri: str = Field(..., description="PostgreSQL connection URI")
    connection_name: Optional[str] = Field("Supabase Workforce Database", description="Friendly connection label")


class ConnectionSaveRequest(BaseModel):
    connection_uri: str = Field(..., description="PostgreSQL connection URI")
    connection_name: Optional[str] = Field("Supabase Workforce Database", description="Friendly connection label")


class DatabaseStatusResponse(BaseModel):
    connected: bool
    database_name: Optional[str] = None
    server_version: Optional[str] = None
    table_name: str = "onet_software_skills"
    table_exists: bool = False
    row_count: int = 0
    columns: List[str] = []
    host: Optional[str] = None
    error: Optional[str] = None


class ConnectionTestResponse(BaseModel):
    success: bool
    message: str
    database_name: Optional[str] = None
    server_version: Optional[str] = None
    table_name: str = "onet_software_skills"
    table_exists: bool = False
    row_count: int = 0
    columns: List[str] = []
    host: Optional[str] = None
    error: Optional[str] = None
