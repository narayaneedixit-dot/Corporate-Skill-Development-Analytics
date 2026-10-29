import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  Flame,
  TrendingUp,
  RefreshCw,
  Table
} from 'lucide-react';
import { DatabaseStatus, PaginatedRecords, OnetRecord } from '../types';
import { api } from '../api/client';
import { DisconnectedState } from '../components/DisconnectedState';

interface DataExplorerPageProps {
  dbStatus: DatabaseStatus | null;
  onOpenConnectModal: () => void;
}

export const DataExplorerPage: React.FC<DataExplorerPageProps> = ({
  dbStatus,
  onOpenConnectModal
}) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [hotTech, setHotTech] = useState<string>('all'); // all, hot, standard
  const [inDemand, setInDemand] = useState<string>('all'); // all, demand, standard
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [categories, setCategories] = useState<string[]>([]);
  const [data, setData] = useState<PaginatedRecords | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load categories
  useEffect(() => {
    if (dbStatus?.connected) {
      api.getCategories().then(setCategories).catch(console.error);
    }
  }, [dbStatus?.connected]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchRecords = async () => {
    if (!dbStatus?.connected) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getRecords({
        search: debouncedSearch.trim() || undefined,
        category: category || undefined,
        hot_technology: hotTech === 'hot' ? true : hotTech === 'standard' ? false : undefined,
        in_demand: inDemand === 'demand' ? true : inDemand === 'standard' ? false : undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
        page,
        page_size: pageSize
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to query O*NET database records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dbStatus?.connected) {
      fetchRecords();
    }
  }, [dbStatus?.connected, debouncedSearch, category, hotTech, inDemand, sortBy, sortDir, page, pageSize]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
    setPage(1);
  };

  const clearAllFilters = () => {
    setSearch('');
    setCategory('');
    setHotTech('all');
    setInDemand('all');
    setSortBy('id');
    setSortDir('asc');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    search || category || hotTech !== 'all' || inDemand !== 'all'
  );

  const exportCurrentPageCsv = () => {
    if (!data?.items || data.items.length === 0) return;
    const headers = ['ID', 'SOC Code', 'Occupation Title', 'Software Example', 'Category', 'Hot Tech', 'In Demand'];
    const rows = data.items.map((r) => [
      r.id,
      `"${r.onet_soc_code || ''}"`,
      `"${(r.occupation_title || '').replace(/"/g, '""')}"`,
      `"${(r.software_example || '').replace(/"/g, '""')}"`,
      `"${(r.software_category || '').replace(/"/g, '""')}"`,
      r.hot_technology ? 'TRUE' : 'FALSE',
      r.in_demand ? 'TRUE' : 'FALSE'
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `onet_skills_page_${page}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!dbStatus?.connected) {
    return (
      <DisconnectedState
        onOpenConnectModal={onOpenConnectModal}
        featureTitle="Raw Records Data Explorer"
      />
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="border-b border-[#263447] pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-mono font-semibold tracking-wider text-[#43D9F5] mb-1.5 uppercase">
              DATA EXPLORER
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#EAF0F6] tracking-tight">
              TABLE: public.onet_software_skills
            </h1>
            <p className="text-sm text-[#8494A7] mt-1">
              Direct querying, filtering, and inspection of all 31,000+ skill mapping records with server-side SQL pagination.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportCurrentPageCsv}
              disabled={!data || data.items.length === 0}
              className="px-3 py-1.5 bg-[#151F2D] hover:bg-[#101824] border border-[#263447] text-[#EAF0F6] text-xs font-medium rounded flex items-center gap-1.5 transition-colors focus:outline-none"
            >
              <Download className="w-3.5 h-3.5 text-[#C7F464]" />
              <span>Export Page CSV</span>
            </button>
            <button
              onClick={fetchRecords}
              disabled={loading}
              className="px-3 py-1.5 bg-[#101824] hover:bg-[#151F2D] border border-[#263447] text-[#EAF0F6] text-xs font-medium rounded flex items-center gap-1.5 transition-colors focus:outline-none"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#43D9F5]' : 'text-[#8494A7]'}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="w-full sm:w-64 relative">
            <Search className="w-4 h-4 text-[#8494A7] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search across columns..."
              className="w-full pl-9 pr-4 py-1.5 bg-[#101824] border border-[#263447] rounded text-xs text-[#EAF0F6] focus:border-[#43D9F5] focus:outline-none font-mono"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-[#8494A7] hover:text-[#EAF0F6]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="w-full sm:w-64">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 bg-[#101824] border border-[#263447] rounded text-xs text-[#EAF0F6] focus:border-[#43D9F5] focus:outline-none truncate"
            >
              <option value="">All Categories ({categories.length})</option>
              {categories.map((c, i) => (
                <option key={i} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Hot Tech Filter */}
          <div>
            <select
              value={hotTech}
              onChange={(e) => {
                setHotTech(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-[#101824] border border-[#263447] rounded text-xs text-[#EAF0F6] focus:border-[#43D9F5] focus:outline-none font-mono"
            >
              <option value="all">Hot Tech: All</option>
              <option value="hot">Hot Only</option>
              <option value="standard">Standard Only</option>
            </select>
          </div>

          {/* In-Demand Filter */}
          <div>
            <select
              value={inDemand}
              onChange={(e) => {
                setInDemand(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-[#101824] border border-[#263447] rounded text-xs text-[#EAF0F6] focus:border-[#43D9F5] focus:outline-none font-mono"
            >
              <option value="all">In-Demand: All</option>
              <option value="demand">In-Demand Only</option>
              <option value="standard">Baseline Only</option>
            </select>
          </div>

          {/* Reset Action */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-1.5 text-xs text-[#8494A7] hover:text-[#EAF0F6] hover:bg-[#101824] rounded border border-transparent hover:border-[#263447] transition-colors"
            >
              Clear Active Filters
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800 rounded text-xs text-red-200 font-mono">
          {error}
        </div>
      )}

      {/* Meta Bar */}
      <div className="flex items-center justify-between text-xs text-[#8494A7]">
        <div>
          Showing records <span className="font-mono text-[#EAF0F6] font-semibold">{data ? (page - 1) * pageSize + 1 : 0}</span> to{' '}
          <span className="font-mono text-[#EAF0F6] font-semibold">
            {data ? Math.min(page * pageSize, data.total) : 0}
          </span>{' '}
          of <span className="font-mono text-[#C7F464] font-semibold">{data?.total.toLocaleString() || 0}</span> matches
        </div>

        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="bg-[#101824] border border-[#263447] rounded px-2 py-1 text-xs text-[#EAF0F6] font-mono focus:outline-none"
          >
            <option value="15">15</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="border border-[#263447] rounded overflow-hidden bg-[#101824]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#151F2D] text-[#8494A7] border-b border-[#263447] select-none">
              <tr>
                <th
                  onClick={() => handleSort('id')}
                  className="px-4 py-3 font-medium cursor-pointer hover:text-[#EAF0F6] whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>ID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('onet_soc_code')}
                  className="px-4 py-3 font-medium cursor-pointer hover:text-[#EAF0F6] whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>SOC Code</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('occupation_title')}
                  className="px-4 py-3 font-medium cursor-pointer hover:text-[#EAF0F6] whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Occupation Title</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('software_example')}
                  className="px-4 py-3 font-medium cursor-pointer hover:text-[#EAF0F6] whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Software Example</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('software_category')}
                  className="px-4 py-3 font-medium cursor-pointer hover:text-[#EAF0F6] whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Category</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3 font-medium text-center whitespace-nowrap">
                  Hot Tech
                </th>
                <th className="px-4 py-3 font-medium text-center whitespace-nowrap">
                  In Demand
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263447] font-mono">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[#8494A7] font-sans">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#43D9F5]" />
                      <span>Executing parameterized SQL query on PostgreSQL...</span>
                    </div>
                  </td>
                </tr>
              ) : data?.items && data.items.length > 0 ? (
                data.items.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-[#151F2D]/60 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-[#8494A7] tabular-nums">
                      {row.id}
                    </td>
                    <td className="px-4 py-2.5 text-[#43D9F5]">
                      {row.onet_soc_code || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-[#EAF0F6] font-sans font-medium">
                      {row.occupation_title}
                    </td>
                    <td className="px-4 py-2.5 text-[#C7F464] font-sans">
                      {row.software_example}
                    </td>
                    <td className="px-4 py-2.5 text-[#8494A7] text-[11px] font-sans truncate max-w-xs">
                      {row.software_category || 'Uncategorized'}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {row.hot_technology ? (
                        <span className="text-[#F2B84B] font-bold text-[10px]">YES</span>
                      ) : (
                        <span className="text-[#8494A7]/50 text-[10px]">NO</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {row.in_demand ? (
                        <span className="text-[#C7F464] font-bold text-[10px]">YES</span>
                      ) : (
                        <span className="text-[#8494A7]/50 text-[10px]">NO</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[#8494A7] font-sans">
                    No matching records found. Try adjusting your search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Bar */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-[#263447]">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 bg-[#101824] border border-[#263447] text-xs font-semibold text-[#EAF0F6] disabled:opacity-40 rounded flex items-center gap-1.5 focus:outline-none"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          <div className="text-xs font-mono text-[#8494A7]">
            Page <span className="text-[#EAF0F6] font-bold">{page}</span> of {data.total_pages}
          </div>
          <button
            onClick={() => setPage(Math.min(data.total_pages, page + 1))}
            disabled={page === data.total_pages}
            className="px-3 py-1.5 bg-[#101824] border border-[#263447] text-xs font-semibold text-[#EAF0F6] disabled:opacity-40 rounded flex items-center gap-1.5 focus:outline-none"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
