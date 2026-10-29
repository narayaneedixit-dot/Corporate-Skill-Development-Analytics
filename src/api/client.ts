import {
  DatabaseStatus,
  ConnectionTestResult,
  AnalyticsOverview,
  TopOccupation,
  SoftwareCategory,
  TechnologyDistribution,
  DemandDistribution,
  TopSoftware,
  AnalyticsInsights,
  PaginatedRecords,
  PaginatedOccupations,
  PaginatedSoftware
} from '../types';

// Set VITE_API_BASE_URL to the deployed FastAPI origin on Render, e.g.
// https://your-skill-intelligence-api.onrender.com. Leave blank for same-origin local proxy setups.
const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
const BASE_URL = API_ORIGIN ? `${API_ORIGIN}/api` : '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errMsg = `Request failed (${res.status})`;
    try {
      const errData = await res.json();
      errMsg = errData.detail || errData.message || errMsg;
    } catch {
      const text = await res.text();
      if (text) errMsg = text;
    }
    throw new Error(errMsg);
  }
  return res.json();
}

export const api = {
  // Database connection
  async getDbStatus(): Promise<DatabaseStatus> {
    const res = await fetch(`${BASE_URL}/database/status`);
    return handleResponse<DatabaseStatus>(res);
  },

  async testConnection(connectionUri: string, connectionName = 'Supabase Workforce Database'): Promise<ConnectionTestResult> {
    const res = await fetch(`${BASE_URL}/database/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connection_uri: connectionUri, connection_name: connectionName }),
    });
    return handleResponse<ConnectionTestResult>(res);
  },

  async connectDb(connectionUri: string, connectionName = 'Supabase Workforce Database'): Promise<DatabaseStatus> {
    const res = await fetch(`${BASE_URL}/database/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connection_uri: connectionUri, connection_name: connectionName }),
    });
    return handleResponse<DatabaseStatus>(res);
  },

  async disconnectDb(): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/database/disconnect`, {
      method: 'POST',
    });
    return handleResponse<{ message: string }>(res);
  },

  // Analytics
  async getOverview(): Promise<AnalyticsOverview> {
    const res = await fetch(`${BASE_URL}/analytics/overview`);
    return handleResponse<AnalyticsOverview>(res);
  },

  async getTopOccupations(limit = 10): Promise<TopOccupation[]> {
    const res = await fetch(`${BASE_URL}/analytics/top-occupations?limit=${limit}`);
    return handleResponse<TopOccupation[]>(res);
  },

  async getSoftwareCategories(limit = 12): Promise<SoftwareCategory[]> {
    const res = await fetch(`${BASE_URL}/analytics/software-categories?limit=${limit}`);
    return handleResponse<SoftwareCategory[]>(res);
  },

  async getTechnologyDistribution(): Promise<TechnologyDistribution> {
    const res = await fetch(`${BASE_URL}/analytics/technology-distribution`);
    return handleResponse<TechnologyDistribution>(res);
  },

  async getDemandDistribution(): Promise<DemandDistribution> {
    const res = await fetch(`${BASE_URL}/analytics/demand-distribution`);
    return handleResponse<DemandDistribution>(res);
  },

  async getTopSoftware(limit = 15): Promise<TopSoftware[]> {
    const res = await fetch(`${BASE_URL}/analytics/top-software?limit=${limit}`);
    return handleResponse<TopSoftware[]>(res);
  },

  async getInsights(): Promise<AnalyticsInsights> {
    const res = await fetch(`${BASE_URL}/analytics/insights`);
    return handleResponse<AnalyticsInsights>(res);
  },

  // Data exploration
  async getRecords(params: {
    search?: string;
    occupation?: string;
    category?: string;
    hot_technology?: boolean;
    in_demand?: boolean;
    sort_by?: string;
    sort_dir?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedRecords> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.occupation) query.set('occupation', params.occupation);
    if (params.category) query.set('category', params.category);
    if (params.hot_technology !== undefined) query.set('hot_technology', String(params.hot_technology));
    if (params.in_demand !== undefined) query.set('in_demand', String(params.in_demand));
    if (params.sort_by) query.set('sort_by', params.sort_by);
    if (params.sort_dir) query.set('sort_dir', params.sort_dir);
    if (params.page) query.set('page', String(params.page));
    if (params.page_size) query.set('page_size', String(params.page_size));

    const res = await fetch(`${BASE_URL}/records?${query.toString()}`);
    return handleResponse<PaginatedRecords>(res);
  },

  async getOccupations(params: {
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedOccupations> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', String(params.page));
    if (params.page_size) query.set('page_size', String(params.page_size));

    const res = await fetch(`${BASE_URL}/occupations?${query.toString()}`);
    return handleResponse<PaginatedOccupations>(res);
  },

  async getSoftware(params: {
    search?: string;
    category?: string;
    hot_only?: boolean;
    in_demand_only?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedSoftware> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.category) query.set('category', params.category);
    if (params.hot_only !== undefined) query.set('hot_only', String(params.hot_only));
    if (params.in_demand_only !== undefined) query.set('in_demand_only', String(params.in_demand_only));
    if (params.page) query.set('page', String(params.page));
    if (params.page_size) query.set('page_size', String(params.page_size));

    const res = await fetch(`${BASE_URL}/software?${query.toString()}`);
    return handleResponse<PaginatedSoftware>(res);
  },

  async getCategories(): Promise<string[]> {
    const res = await fetch(`${BASE_URL}/categories`);
    return handleResponse<string[]>(res);
  }
};
