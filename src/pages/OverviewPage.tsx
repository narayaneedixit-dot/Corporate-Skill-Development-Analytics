import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import {
  Database,
  Layers,
  Briefcase,
  Flame,
  TrendingUp,
  Cpu,
  Sparkles,
  Info,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import {
  DatabaseStatus,
  AnalyticsOverview,
  TopOccupation,
  SoftwareCategory,
  TechnologyDistribution,
  DemandDistribution,
  TopSoftware,
  AnalyticsInsights
} from '../types';
import { api } from '../api/client';
import { DisconnectedState } from '../components/DisconnectedState';

interface OverviewPageProps {
  dbStatus: DatabaseStatus | null;
  onOpenConnectModal: () => void;
  onNavigateTab: (tab: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  dbStatus,
  onOpenConnectModal,
  onNavigateTab
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [topOccupations, setTopOccupations] = useState<TopOccupation[]>([]);
  const [categories, setCategories] = useState<SoftwareCategory[]>([]);
  const [techDist, setTechDist] = useState<TechnologyDistribution | null>(null);
  const [demandDist, setDemandDist] = useState<DemandDistribution | null>(null);
  const [topSoftware, setTopSoftware] = useState<TopSoftware[]>([]);
  const [insights, setInsights] = useState<AnalyticsInsights | null>(null);

  const loadData = async () => {
    if (!dbStatus?.connected) return;
    setLoading(true);
    setError(null);
    try {
      const [
        ov,
        topOcc,
        cats,
        techD,
        demD,
        topSw,
        ins
      ] = await Promise.all([
        api.getOverview(),
        api.getTopOccupations(8),
        api.getSoftwareCategories(8),
        api.getTechnologyDistribution(),
        api.getDemandDistribution(),
        api.getTopSoftware(8),
        api.getInsights()
      ]);

      setOverview(ov);
      setTopOccupations(topOcc);
      setCategories(cats);
      setTechDist(techD);
      setDemandDist(demD);
      setTopSoftware(topSw);
      setInsights(ins);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve analytics data from PostgreSQL database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dbStatus?.connected) {
      loadData();
    }
  }, [dbStatus?.connected]);

  if (!dbStatus?.connected) {
    return (
      <DisconnectedState
        onOpenConnectModal={onOpenConnectModal}
        featureTitle="Workforce Intelligence Overview"
      />
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Section */}
      <div className="border-b border-[#263447] pb-8 pt-2">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-mono font-semibold tracking-wider text-[#43D9F5] mb-1.5 uppercase">
              WORKFORCE INTELLIGENCE
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#EAF0F6]">
              THE SKILLS LANDSCAPE
            </h1>
            <p className="text-sm text-[#8494A7] mt-2 max-w-2xl leading-relaxed">
              Empirical analysis of technology distributions across U.S. workforce occupations, querying live records from <code className="font-mono text-xs text-[#EAF0F6]">public.onet_software_skills</code>.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-3 py-1.5 bg-[#151F2D] hover:bg-[#101824] border border-[#263447] text-[#EAF0F6] text-xs font-medium rounded flex items-center gap-1.5 transition-colors focus:outline-none"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#C7F464]' : 'text-[#8494A7]'}`} />
              <span>Refresh Metrics</span>
            </button>
            <button
              onClick={() => onNavigateTab('explorer')}
              className="px-3.5 py-1.5 bg-[#C7F464] hover:bg-[#b5e74f] text-[#080D16] text-xs font-semibold rounded flex items-center gap-1.5 transition-colors focus:outline-none"
            >
              <span>Explore Raw Table</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dataset Status Banner */}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-[#8494A7] bg-[#101824] p-3 rounded border border-[#263447]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#C7F464]" />
            <span className="text-[#EAF0F6] font-medium">PostgreSQL Database:</span>
            <span className="font-mono">{dbStatus.database_name || 'postgres'}</span>
          </div>
          <span aria-hidden="true">·</span>
          <div>
            <span className="text-[#EAF0F6] font-medium">Table:</span> <span className="font-mono">public.{dbStatus.table_name}</span>
          </div>
          <span aria-hidden="true">·</span>
          <div>
            <span className="text-[#EAF0F6] font-medium">Total Verified Rows:</span> <span className="font-mono font-semibold text-[#C7F464]">{dbStatus.row_count.toLocaleString()}</span>
          </div>
          <span aria-hidden="true">·</span>
          <div>
            <span className="text-[#8494A7]">Host:</span> <span className="font-mono text-[#8494A7]">{dbStatus.host || 'Supabase Pooler'}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800 rounded text-xs text-red-200 font-mono">
          {error}
        </div>
      )}

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 bg-[#101824] border border-[#263447] rounded">
          <div className="text-xs text-[#8494A7] flex items-center gap-1.5 mb-1">
            <Layers className="w-3.5 h-3.5 text-[#43D9F5]" />
            <span>Total Mapped Skills</span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#EAF0F6] tabular-nums">
            {overview?.total_records.toLocaleString() || '—'}
          </div>
          <div className="text-[11px] text-[#8494A7] mt-1">O*NET software records</div>
        </div>

        <div className="p-4 bg-[#101824] border border-[#263447] rounded">
          <div className="text-xs text-[#8494A7] flex items-center gap-1.5 mb-1">
            <Briefcase className="w-3.5 h-3.5 text-[#C7F464]" />
            <span>Unique Occupations</span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#EAF0F6] tabular-nums">
            {overview?.unique_occupations.toLocaleString() || '—'}
          </div>
          <div className="text-[11px] text-[#8494A7] mt-1">Distinct SOC occupations</div>
        </div>

        <div className="p-4 bg-[#101824] border border-[#263447] rounded">
          <div className="text-xs text-[#8494A7] flex items-center gap-1.5 mb-1">
            <Cpu className="w-3.5 h-3.5 text-[#43D9F5]" />
            <span>Distinct Software</span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#EAF0F6] tabular-nums">
            {overview?.distinct_software.toLocaleString() || '—'}
          </div>
          <div className="text-[11px] text-[#8494A7] mt-1">Unique software tools</div>
        </div>

        <div className="p-4 bg-[#101824] border border-[#263447] rounded">
          <div className="text-xs text-[#8494A7] flex items-center gap-1.5 mb-1">
            <Flame className="w-3.5 h-3.5 text-[#F2B84B]" />
            <span>Hot Technologies</span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#F2B84B] tabular-nums">
            {overview?.hot_technologies.toLocaleString() || '—'}
          </div>
          <div className="text-[11px] text-[#8494A7] mt-1">
            <span className="font-mono text-[#EAF0F6]">{overview?.hot_tech_percentage}%</span> of catalog
          </div>
        </div>

        <div className="p-4 bg-[#101824] border border-[#263447] rounded col-span-2 md:col-span-1">
          <div className="text-xs text-[#8494A7] flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-[#C7F464]" />
            <span>In-Demand Skills</span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#C7F464] tabular-nums">
            {overview?.in_demand_skills.toLocaleString() || '—'}
          </div>
          <div className="text-[11px] text-[#8494A7] mt-1">
            <span className="font-mono text-[#EAF0F6]">{overview?.in_demand_percentage}%</span> employer frequency
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Occupational Software Density */}
        <div className="lg:col-span-7 bg-[#101824] border border-[#263447] rounded p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#EAF0F6] tracking-tight">
                Occupational Software Density
              </h3>
              <p className="text-xs text-[#8494A7] mt-0.5">
                Occupations requiring the highest volume of discrete software proficiencies
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('occupations')}
              className="text-xs text-[#43D9F5] hover:underline"
            >
              View all
            </button>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topOccupations}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
              >
                <XAxis
                  type="number"
                  stroke="#8494A7"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#263447' }}
                />
                <YAxis
                  type="category"
                  dataKey="occupation_title"
                  stroke="#8494A7"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#263447' }}
                  width={130}
                  tickFormatter={(val) => (val.length > 20 ? `${val.substring(0, 18)}...` : val)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#080D16',
                    borderColor: '#263447',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#EAF0F6'
                  }}
                  formatter={(val: any, name: any) => [
                    `${val} skills`,
                    name === 'software_count' ? 'Total Software' : name
                  ]}
                />
                <Bar dataKey="software_count" fill="#43D9F5" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Software Category Distribution */}
        <div className="lg:col-span-5 bg-[#101824] border border-[#263447] rounded p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#EAF0F6] tracking-tight">
                Software Category Breakdown
              </h3>
              <p className="text-xs text-[#8494A7] mt-0.5">
                Leading software functional categories by record frequency
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {categories.slice(0, 6).map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#EAF0F6] truncate max-w-[220px]" title={cat.software_category}>
                    {cat.software_category}
                  </span>
                  <div className="flex items-center gap-2 font-mono text-[#8494A7]">
                    <span className="text-[#EAF0F6] tabular-nums font-semibold">{cat.count.toLocaleString()}</span>
                    <span>({cat.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-[#080D16] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#C7F464]"
                    style={{ width: `${Math.min(100, cat.percentage * 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Technology & Demand Indicator Splits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hot Technology Share */}
        <div className="bg-[#101824] border border-[#263447] rounded p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#EAF0F6] tracking-tight">
                Hot Technology Ratio
              </h3>
              <p className="text-xs text-[#8494A7]">
                Rapidly emerging tools vs stable foundational software
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-[#F2B84B]">
              {techDist?.hot_percentage}% Hot
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="p-3 bg-[#080D16] border border-[#263447] rounded">
              <div className="text-xs text-[#F2B84B] font-semibold flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                <span>Hot Technology</span>
              </div>
              <div className="text-xl font-mono font-bold text-[#EAF0F6] mt-1 tabular-nums">
                {techDist?.hot.toLocaleString() || '0'}
              </div>
              <div className="text-[11px] text-[#8494A7] mt-0.5">
                {techDist?.hot_percentage}% of mapped skills
              </div>
            </div>

            <div className="p-3 bg-[#080D16] border border-[#263447] rounded">
              <div className="text-xs text-[#8494A7] font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Standard Baseline</span>
              </div>
              <div className="text-xl font-mono font-bold text-[#EAF0F6] mt-1 tabular-nums">
                {techDist?.standard.toLocaleString() || '0'}
              </div>
              <div className="text-[11px] text-[#8494A7] mt-0.5">
                {techDist?.standard_percentage}% of mapped skills
              </div>
            </div>
          </div>
        </div>

        {/* In-Demand Skills Share */}
        <div className="bg-[#101824] border border-[#263447] rounded p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#EAF0F6] tracking-tight">
                Employer In-Demand Ratio
              </h3>
              <p className="text-xs text-[#8494A7]">
                Skills flagged as frequently requested in hiring listings
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-[#C7F464]">
              {demandDist?.in_demand_percentage}% In Demand
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="p-3 bg-[#080D16] border border-[#263447] rounded">
              <div className="text-xs text-[#C7F464] font-semibold flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>High Frequency (In-Demand)</span>
              </div>
              <div className="text-xl font-mono font-bold text-[#EAF0F6] mt-1 tabular-nums">
                {demandDist?.in_demand.toLocaleString() || '0'}
              </div>
              <div className="text-[11px] text-[#8494A7] mt-0.5">
                {demandDist?.in_demand_percentage}% employer citation rate
              </div>
            </div>

            <div className="p-3 bg-[#080D16] border border-[#263447] rounded">
              <div className="text-xs text-[#8494A7] font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Specialized Baseline</span>
              </div>
              <div className="text-xl font-mono font-bold text-[#EAF0F6] mt-1 tabular-nums">
                {demandDist?.baseline.toLocaleString() || '0'}
              </div>
              <div className="text-[11px] text-[#8494A7] mt-0.5">
                {demandDist?.baseline_percentage}% domain-specific
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Cross-Functional Software Tools */}
      <div className="bg-[#101824] border border-[#263447] rounded p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#EAF0F6] tracking-tight">
              Most Ubiquitous Software Tools Across Occupations
            </h3>
            <p className="text-xs text-[#8494A7]">
              Tools spanning the largest number of distinct workforce roles
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('software')}
            className="text-xs text-[#43D9F5] hover:underline"
          >
            Explore software matrix
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {topSoftware.map((sw, idx) => (
            <div key={idx} className="p-3 bg-[#080D16] border border-[#263447] rounded space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-xs text-[#EAF0F6] truncate" title={sw.software_example}>
                  {sw.software_example}
                </span>
                {sw.is_hot && (
                  <span className="text-[10px] font-mono font-semibold text-[#F2B84B]">HOT</span>
                )}
              </div>
              <div className="flex items-baseline gap-1 text-[#8494A7] text-xs">
                <span className="font-mono text-base font-bold text-[#43D9F5] tabular-nums">
                  {sw.occupation_count}
                </span>
                <span>occupations</span>
              </div>
              {sw.categories && sw.categories.length > 0 && (
                <div className="text-[11px] text-[#8494A7] truncate">
                  {sw.categories[0]}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Data-Backed Insights Section */}
      {insights && (
        <div className="bg-[#101824] border border-[#263447] rounded p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#C7F464] uppercase">
            <Sparkles className="w-4 h-4 text-[#C7F464]" />
            <span>EMPIRICAL WORKFORCE INSIGHTS</span>
          </div>

          <p className="text-sm text-[#EAF0F6] leading-relaxed">
            {insights.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {insights.insights.map((item) => (
              <div key={item.id} className="p-4 bg-[#080D16] border border-[#263447] rounded space-y-2">
                <div className="text-[11px] font-mono text-[#8494A7] uppercase">
                  {item.category}
                </div>
                <div className="font-bold text-xs text-[#EAF0F6]">
                  {item.title}
                </div>
                <div className="text-xl font-bold font-mono text-[#43D9F5] tabular-nums">
                  {item.metric_value}
                </div>
                <p className="text-xs text-[#8494A7] leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#263447] flex items-start gap-2 text-xs text-[#8494A7]">
            <Info className="w-4 h-4 text-[#8494A7] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {insights.methodology_note}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
