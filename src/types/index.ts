export interface DatabaseStatus {
  connected: boolean;
  database_name?: string | null;
  server_version?: string | null;
  table_name: string;
  table_exists: boolean;
  row_count: number;
  columns: string[];
  host?: string | null;
  error?: string | null;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  database_name?: string | null;
  server_version?: string | null;
  table_name: string;
  table_exists: boolean;
  row_count: number;
  columns: string[];
  host?: string | null;
  error?: string | null;
}

export interface AnalyticsOverview {
  total_records: number;
  unique_occupations: number;
  distinct_software: number;
  hot_technologies: number;
  in_demand_skills: number;
  hot_tech_percentage: number;
  in_demand_percentage: number;
  database_connected: boolean;
}

export interface TopOccupation {
  occupation_title: string;
  onet_soc_code?: string;
  software_count: number;
  hot_count: number;
  in_demand_count: number;
}

export interface SoftwareCategory {
  software_category: string;
  count: number;
  percentage: number;
}

export interface DistributionItem {
  name: string;
  count: number;
  percentage: number;
}

export interface TechnologyDistribution {
  hot: number;
  standard: number;
  hot_percentage: number;
  standard_percentage: number;
  distribution: DistributionItem[];
}

export interface DemandDistribution {
  in_demand: number;
  baseline: number;
  in_demand_percentage: number;
  baseline_percentage: number;
  distribution: DistributionItem[];
}

export interface TopSoftware {
  software_example: string;
  occupation_count: number;
  categories: string[];
  is_hot: boolean;
  is_in_demand: boolean;
}

export interface InsightHighlight {
  id: string;
  category: string;
  title: string;
  description: string;
  metric_value: string;
  metric_label: string;
  source_context: string;
}

export interface AnalyticsInsights {
  insights: InsightHighlight[];
  summary: string;
  methodology_note: string;
}

export interface OnetRecord {
  id: number;
  onet_soc_code?: string;
  occupation_title?: string;
  software_example?: string;
  element_id?: string;
  software_category?: string;
  hot_technology: boolean;
  in_demand: boolean;
}

export interface PaginatedRecords {
  items: OnetRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface OccupationDetail {
  onet_soc_code?: string;
  occupation_title: string;
  software_count: number;
  hot_count: number;
  in_demand_count: number;
  categories: string[];
  sample_software: string[];
}

export interface PaginatedOccupations {
  items: OccupationDetail[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SoftwareDetail {
  software_example: string;
  occupation_count: number;
  software_category?: string;
  hot_technology: boolean;
  in_demand: boolean;
  sample_occupations: string[];
}

export interface PaginatedSoftware {
  items: SoftwareDetail[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
