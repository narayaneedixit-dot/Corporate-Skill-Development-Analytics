import React, { useState, useEffect } from 'react';
import {
  Search,
  Briefcase,
  Layers,
  Flame,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { DatabaseStatus, PaginatedOccupations, OccupationDetail, OnetRecord } from '../types';
import { api } from '../api/client';
import { DisconnectedState } from '../components/DisconnectedState';

interface OccupationExplorerPageProps {
  dbStatus: DatabaseStatus | null;
  onOpenConnectModal: () => void;
}

export const OccupationExplorerPage: React.FC<OccupationExplorerPageProps> = ({
  dbStatus,
  onOpenConnectModal
}) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(18);
  const [data, setData] = useState<PaginatedOccupations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected occupation for detail modal
  const [selectedOccupation, setSelectedOccupation] = useState<OccupationDetail | null>(null);
  const [occupationRecords, setOccupationRecords] = useState<OnetRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchOccupations = async () => {
    if (!dbStatus?.connected) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getOccupations({
        search: debouncedSearch.trim() || undefined,
        page,
        page_size: pageSize
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch occupations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dbStatus?.connected) {
      fetchOccupations();
    }
  }, [dbStatus?.connected, debouncedSearch, page, pageSize]);

  // Load detailed records when an occupation is clicked
  const handleSelectOccupation = async (occ: OccupationDetail) => {
    setSelectedOccupation(occ);
    setLoadingRecords(true);
    try {
      const res = await api.getRecords({
        occupation: occ.occupation_title,
        page: 1,
        page_size: 100
      });
      setOccupationRecords(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRecords(false);
    }
  };

  if (!dbStatus?.connected) {
    return (
      <DisconnectedState
        onOpenConnectModal={onOpenConnectModal}
        featureTitle="Occupation Explorer"
      />
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header and Search Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#263447] pb-6">
        <div>
          <div className="text-xs font-mono font-semibold tracking-wider text-[#43D9F5] mb-1.5 uppercase">
            WORKFORCE TAXONOMY
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#EAF0F6] tracking-tight">
            OCCUPATION EXPLORER
          </h1>
          <p className="text-sm text-[#8494A7] mt-1">
            Browse and query standardized Standard Occupational Classification (SOC) profiles and their mapped software skills.
          </p>
        </div>

        {/* Search input */}
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-[#8494A7] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or SOC code (e.g. 15-1252)..."
            className="w-full pl-9 pr-4 py-2 bg-[#101824] border border-[#263447] rounded text-xs text-[#EAF0F6] focus:border-[#43D9F5] focus:outline-none font-mono"
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
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800 rounded text-xs text-red-200 font-mono">
          {error}
        </div>
      )}

      {/* Meta Count and Pagination summary */}
      <div className="flex items-center justify-between text-xs text-[#8494A7]">
        <div>
          Showing <span className="font-mono text-[#EAF0F6] font-semibold">{data?.items.length || 0}</span> of{' '}
          <span className="font-mono text-[#EAF0F6] font-semibold">{data?.total.toLocaleString() || 0}</span> occupations
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
            <option value="18">18</option>
            <option value="36">36</option>
          </select>
        </div>
      </div>

      {/* Occupations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 bg-[#101824] border border-[#263447] rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.items.map((occ, idx) => (
            <div
              key={idx}
              onClick={() => handleSelectOccupation(occ)}
              className="p-5 bg-[#101824] border border-[#263447] hover:border-[#43D9F5]/70 rounded cursor-pointer transition-all hover:bg-[#151F2D] flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-[#8494A7] mb-2 font-mono">
                  <span>{occ.onet_soc_code || 'SOC Code Pending'}</span>
                  <div className="flex items-center gap-2">
                    {occ.hot_count > 0 && (
                      <span className="text-[#F2B84B] flex items-center gap-0.5">
                        <Flame className="w-3 h-3" /> {occ.hot_count}
                      </span>
                    )}
                    {occ.in_demand_count > 0 && (
                      <span className="text-[#C7F464] flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3" /> {occ.in_demand_count}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-[#EAF0F6] group-hover:text-[#43D9F5] transition-colors line-clamp-2">
                  {occ.occupation_title}
                </h3>

                {/* Sample Software preview */}
                <div className="mt-3 flex flex-wrap gap-1 text-[11px] text-[#8494A7]">
                  {occ.sample_software.slice(0, 3).map((sw, sIdx) => (
                    <span key={sIdx} className="bg-[#080D16] border border-[#263447] px-2 py-0.5 rounded truncate max-w-[150px]">
                      {sw}
                    </span>
                  ))}
                  {occ.software_count > 3 && (
                    <span className="text-[#8494A7] px-1 py-0.5">
                      +{occ.software_count - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#263447] flex items-center justify-between text-xs">
                <span className="text-[#8494A7]">
                  <strong className="text-[#EAF0F6] font-mono tabular-nums">{occ.software_count}</strong> mapped skills
                </span>
                <span className="text-[#43D9F5] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  View Roster &rarr;
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

      {/* Occupation Detail Modal */}
      {selectedOccupation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl bg-[#101824] border border-[#263447] rounded text-[#EAF0F6] overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#263447] bg-[#151F2D]">
              <div>
                <div className="text-xs font-mono text-[#43D9F5]">
                  SOC CODE: {selectedOccupation.onet_soc_code || 'N/A'}
                </div>
                <h2 className="text-base font-bold text-[#EAF0F6] mt-0.5">
                  {selectedOccupation.occupation_title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOccupation(null)}
                className="p-1 text-[#8494A7] hover:text-[#EAF0F6] rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-[#080D16] border border-[#263447] rounded">
                  <div className="text-[11px] text-[#8494A7]">Total Skills</div>
                  <div className="text-lg font-mono font-bold text-[#EAF0F6] mt-0.5">
                    {selectedOccupation.software_count}
                  </div>
                </div>
                <div className="p-3 bg-[#080D16] border border-[#263447] rounded">
                  <div className="text-[11px] text-[#F2B84B] flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" /> Hot Tech
                  </div>
                  <div className="text-lg font-mono font-bold text-[#F2B84B] mt-0.5">
                    {selectedOccupation.hot_count}
                  </div>
                </div>
                <div className="p-3 bg-[#080D16] border border-[#263447] rounded">
                  <div className="text-[11px] text-[#C7F464] flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> In Demand
                  </div>
                  <div className="text-lg font-mono font-bold text-[#C7F464] mt-0.5">
                    {selectedOccupation.in_demand_count}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#EAF0F6] mb-2 uppercase tracking-wider font-mono">
                  Software Roster ({occupationRecords.length} loaded)
                </h4>
                {loadingRecords ? (
                  <div className="py-8 text-center text-xs text-[#8494A7] flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#43D9F5]" />
                    <span>Querying database records...</span>
                  </div>
                ) : (
                  <div className="border border-[#263447] rounded overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#151F2D] text-[#8494A7] border-b border-[#263447]">
                        <tr>
                          <th className="px-3.5 py-2 font-medium">Software Example</th>
                          <th className="px-3.5 py-2 font-medium">Category</th>
                          <th className="px-3.5 py-2 font-medium text-right">Flags</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#263447] font-mono">
                        {occupationRecords.map((rec) => (
                          <tr key={rec.id} className="hover:bg-[#151F2D]/50 transition-colors">
                            <td className="px-3.5 py-2 text-[#EAF0F6] font-sans font-medium">
                              {rec.software_example}
                            </td>
                            <td className="px-3.5 py-2 text-[#8494A7] text-[11px]">
                              {rec.software_category || 'General'}
                            </td>
                            <td className="px-3.5 py-2 text-right">
                              <div className="inline-flex items-center gap-2">
                                {rec.hot_technology && (
                                  <span className="text-[#F2B84B] text-[10px] font-bold">HOT</span>
                                )}
                                {rec.in_demand && (
                                  <span className="text-[#C7F464] text-[10px] font-bold">IN-DEMAND</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
