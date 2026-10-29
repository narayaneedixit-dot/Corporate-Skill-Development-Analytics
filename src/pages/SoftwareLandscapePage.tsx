import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Flame,
  TrendingUp,
  Cpu,
  ChevronLeft,
  ChevronRight,
  X,
  Layers
} from 'lucide-react';
import { DatabaseStatus, PaginatedSoftware, SoftwareDetail } from '../types';
import { api } from '../api/client';
import { DisconnectedState } from '../components/DisconnectedState';

interface SoftwareLandscapePageProps {
  dbStatus: DatabaseStatus | null;
  onOpenConnectModal: () => void;
}

export const SoftwareLandscapePage: React.FC<SoftwareLandscapePageProps> = ({
  dbStatus,
  onOpenConnectModal
}) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState<string>('');
  const [hotOnly, setHotOnly] = useState<boolean>(false);
  const [inDemandOnly, setInDemandOnly] = useState<boolean>(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [data, setData] = useState<PaginatedSoftware | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load category list on mount
  useEffect(() => {
    if (dbStatus?.connected) {
      api.getCategories().then(setCategories).catch(console.error);
    }
  }, [dbStatus?.connected]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchSoftware = async () => {
    if (!dbStatus?.connected) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getSoftware({
        search: debouncedSearch.trim() || undefined,
        category: category || undefined,
        hot_only: hotOnly ? true : undefined,
        in_demand_only: inDemandOnly ? true : undefined,
        page,
        page_size: pageSize
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch software landscape.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dbStatus?.connected) {
      fetchSoftware();
    }
  }, [dbStatus?.connected, debouncedSearch, category, hotOnly, inDemandOnly, page, pageSize]);

  if (!dbStatus?.connected) {
    return (
      <DisconnectedState
        onOpenConnectModal={onOpenConnectModal}
        featureTitle="Software Landscape Analysis"
      />
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="border-b border-[#263447] pb-6">
        <div className="text-xs font-mono font-semibold tracking-wider text-[#43D9F5] mb-1.5 uppercase">
          SOFTWARE INTELLIGENCE
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#EAF0F6] tracking-tight">
          SOFTWARE LANDSCAPE
        </h1>
        <p className="text-sm text-[#8494A7] mt-1">
          Explore discrete software applications and tools cataloged in O*NET, measuring cross-occupational prevalence and technology status flags.
        </p>

        {/* Filters Toolbar */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="w-full sm:w-64 relative">
            <Search className="w-4 h-4 text-[#8494A7] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search software (e.g. Python, Excel)..."
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
          <div className="w-full sm:w-72">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 bg-[#101824] border border-[#263447] rounded text-xs text-[#EAF0F6] focus:border-[#43D9F5] focus:outline-none"
            >
              <option value="">All Categories ({categories.length})</option>
              {categories.map((c, i) => (
                <option key={i} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setHotOnly(!hotOnly);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors flex items-center gap-1.5 focus:outline-none ${
                hotOnly
                  ? 'bg-[#F2B84B]/20 border-[#F2B84B] text-[#F2B84B]'
                  : 'bg-[#101824] border-[#263447] text-[#8494A7] hover:text-[#EAF0F6]'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Hot Tech Only</span>
            </button>

            <button
              onClick={() => {
                setInDemandOnly(!inDemandOnly);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors flex items-center gap-1.5 focus:outline-none ${
                inDemandOnly
                  ? 'bg-[#C7F464]/20 border-[#C7F464] text-[#C7F464]'
                  : 'bg-[#101824] border-[#263447] text-[#8494A7] hover:text-[#EAF0F6]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>In-Demand Only</span>
            </button>

            {(category || hotOnly || inDemandOnly || search) && (
              <button
                onClick={() => {
                  setCategory('');
                  setHotOnly(false);
                  setInDemandOnly(false);
                  setSearch('');
                  setPage(1);
                }}
                className="px-2.5 py-1.5 text-xs text-[#8494A7] hover:text-[#EAF0F6] hover:bg-[#101824] rounded border border-transparent hover:border-[#263447] transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800 rounded text-xs text-red-200 font-mono">
          {error}
        </div>
      )}

      {/* Meta status summary */}
      <div className="flex items-center justify-between text-xs text-[#8494A7]">
        <div>
          Showing <span className="font-mono text-[#EAF0F6] font-semibold">{data?.items.length || 0}</span> of{' '}
          <span className="font-mono text-[#EAF0F6] font-semibold">{data?.total.toLocaleString() || 0}</span> software tools
        </div>
        <div className="flex items-center gap-2">
          <span>Per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="bg-[#101824] border border-[#263447] rounded px-2 py-1 text-xs text-[#EAF0F6] font-mono focus:outline-none"
          >
            <option value="12">12</option>
            <option value="24">24</option>
            <option value="48">48</option>
          </select>
        </div>
      </div>

      {/* Software Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-40 bg-[#101824] border border-[#263447] rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {data?.items.map((sw, idx) => (
            <div
              key={idx}
              className="p-4 bg-[#101824] border border-[#263447] rounded hover:border-[#43D9F5]/60 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-[#EAF0F6] line-clamp-1" title={sw.software_example}>
                    {sw.software_example}
                  </h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {sw.hot_technology && (
                      <span className="text-[10px] font-mono font-bold text-[#F2B84B]" title="Hot Technology">
                        HOT
                      </span>
                    )}
                    {sw.in_demand && (
                      <span className="text-[10px] font-mono font-bold text-[#C7F464]" title="In Demand">
                        REQ
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-[#8494A7] line-clamp-1 mb-3" title={sw.software_category || 'General'}>
                  {sw.software_category || 'General Software'}
                </div>

                {sw.sample_occupations && sw.sample_occupations.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] text-[#8494A7] uppercase font-mono">Sample Roles:</div>
                    <div className="text-[11px] text-[#8494A7] space-y-0.5">
                      {sw.sample_occupations.slice(0, 2).map((occ, oIdx) => (
                        <div key={oIdx} className="truncate">
                          · {occ}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-2.5 border-t border-[#263447] flex items-center justify-between text-xs">
                <span className="text-[#8494A7]">Workforce Density</span>
                <span className="font-mono font-bold text-[#43D9F5] tabular-nums">
                  {sw.occupation_count} {sw.occupation_count === 1 ? 'role' : 'roles'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
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
