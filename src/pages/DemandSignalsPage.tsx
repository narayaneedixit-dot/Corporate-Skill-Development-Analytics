import React, { useState, useEffect } from 'react';
import {
  Flame,
  TrendingUp,
  BarChart2,
  Layers,
  Info,
  CheckCircle2,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  DatabaseStatus,
  TechnologyDistribution,
  DemandDistribution,
  TopSoftware
} from '../types';
import { api } from '../api/client';
import { DisconnectedState } from '../components/DisconnectedState';

interface DemandSignalsPageProps {
  dbStatus: DatabaseStatus | null;
  onOpenConnectModal: () => void;
  onNavigateTab: (tab: string) => void;
}

export const DemandSignalsPage: React.FC<DemandSignalsPageProps> = ({
  dbStatus,
  onOpenConnectModal,
  onNavigateTab
}) => {
  const [techDist, setTechDist] = useState<TechnologyDistribution | null>(null);
  const [demandDist, setDemandDist] = useState<DemandDistribution | null>(null);
  const [topHotSoftware, setTopHotSoftware] = useState<TopSoftware[]>([]);
  const [topDemandSoftware, setTopDemandSoftware] = useState<TopSoftware[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dbStatus?.connected) return;
    setLoading(true);
    setError(null);

    Promise.all([
      api.getTechnologyDistribution(),
      api.getDemandDistribution(),
      api.getTopSoftware(20)
    ])
      .then(([tech, dem, swList]) => {
        setTechDist(tech);
        setDemandDist(dem);
        setTopHotSoftware(swList.filter((s) => s.is_hot).slice(0, 8));
        setTopDemandSoftware(swList.filter((s) => s.is_in_demand).slice(0, 8));
      })
      .catch((err) => {
        setError(err.message || 'Failed to load demand signals.');
      })
      .finally(() => setLoading(false));
  }, [dbStatus?.connected]);

  if (!dbStatus?.connected) {
    return (
      <DisconnectedState
        onOpenConnectModal={onOpenConnectModal}
        featureTitle="Demand Signals & Technology Distribution"
      />
    );
  }

  const comparisonData = [
    {
      name: 'Technology Velocity',
      flagged: techDist?.hot || 0,
      baseline: techDist?.standard || 0,
      labelFlagged: 'Hot Tech',
      labelBaseline: 'Standard'
    },
    {
      name: 'Employer Demand',
      flagged: demandDist?.in_demand || 0,
      baseline: demandDist?.baseline || 0,
      labelFlagged: 'In Demand',
      labelBaseline: 'Baseline'
    }
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-[#263447] pb-6">
        <div className="text-xs font-mono font-semibold tracking-wider text-[#43D9F5] mb-1.5 uppercase">
          MARKET INDICATORS
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#EAF0F6] tracking-tight">
          DEMAND SIGNALS & VELOCITY
        </h1>
        <p className="text-sm text-[#8494A7] mt-1 max-w-3xl">
          Comparative analysis between emerging "Hot Technologies" and employer "In-Demand" competencies, based on O*NET classification methodologies.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800 rounded text-xs text-red-200 font-mono">
          {error}
        </div>
      )}

      {/* High-Level Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hot Technology Card */}
        <div className="p-6 bg-[#101824] border border-[#263447] rounded space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#080D16] border border-[#263447] rounded">
                <Flame className="w-5 h-5 text-[#F2B84B]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#EAF0F6]">
                  Hot Technology Distribution
                </h3>
                <span className="text-xs text-[#8494A7]">Rapid evolution & high adoption tools</span>
              </div>
            </div>
            <span className="text-lg font-mono font-bold text-[#F2B84B] tabular-nums">
              {techDist?.hot_percentage}%
            </span>
          </div>

          <div className="p-4 bg-[#080D16] border border-[#263447] rounded space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8494A7]">Hot Technologies Flagged</span>
              <span className="font-mono font-bold text-[#EAF0F6] tabular-nums">
                {techDist?.hot.toLocaleString()} records
              </span>
            </div>
            <div className="w-full h-2 bg-[#151F2D] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#F2B84B]"
                style={{ width: `${techDist?.hot_percentage || 0}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#8494A7]">
              <span>Standard Baseline: {techDist?.standard.toLocaleString()}</span>
              <span>{techDist?.standard_percentage}%</span>
            </div>
          </div>

          <p className="text-xs text-[#8494A7] leading-relaxed">
            Technologies designated as "Hot" represent tools and frameworks demonstrating rapid change or accelerated inclusion across corporate job postings.
          </p>
        </div>

        {/* In-Demand Card */}
        <div className="p-6 bg-[#101824] border border-[#263447] rounded space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#080D16] border border-[#263447] rounded">
                <TrendingUp className="w-5 h-5 text-[#C7F464]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#EAF0F6]">
                  In-Demand Skills Distribution
                </h3>
                <span className="text-xs text-[#8494A7]">Frequent employer requirement citations</span>
              </div>
            </div>
            <span className="text-lg font-mono font-bold text-[#C7F464] tabular-nums">
              {demandDist?.in_demand_percentage}%
            </span>
          </div>

          <div className="p-4 bg-[#080D16] border border-[#263447] rounded space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8494A7]">High-Frequency Employer Demand</span>
              <span className="font-mono font-bold text-[#EAF0F6] tabular-nums">
                {demandDist?.in_demand.toLocaleString()} records
              </span>
            </div>
            <div className="w-full h-2 bg-[#151F2D] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C7F464]"
                style={{ width: `${demandDist?.in_demand_percentage || 0}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#8494A7]">
              <span>Baseline Domain Requirements: {demandDist?.baseline.toLocaleString()}</span>
              <span>{demandDist?.baseline_percentage}%</span>
            </div>
          </div>

          <p className="text-xs text-[#8494A7] leading-relaxed">
            In-Demand skills reflect criteria frequently required in corporate vacancy requisitions collected across occupational titles.
          </p>
        </div>
      </div>

      {/* Ranked Hot Technologies vs In-Demand Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Hot Tech */}
        <div className="bg-[#101824] border border-[#263447] rounded p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#EAF0F6]">
                Leading Hot Technologies by Occupation Reach
              </h3>
              <p className="text-xs text-[#8494A7] mt-0.5">
                Hot technologies spanning the greatest breadth of workforce titles
              </p>
            </div>
            <Flame className="w-4 h-4 text-[#F2B84B]" />
          </div>

          <div className="space-y-2.5">
            {topHotSoftware.map((tool, idx) => (
              <div
                key={idx}
                className="p-3 bg-[#080D16] border border-[#263447] rounded flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-[#EAF0F6]">{tool.software_example}</div>
                  <div className="text-[11px] text-[#8494A7]">
                    {tool.categories?.[0] || 'Software'}
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-sm font-bold text-[#43D9F5] tabular-nums">
                    {tool.occupation_count}
                  </div>
                  <div className="text-[10px] text-[#8494A7]">roles</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top In-Demand */}
        <div className="bg-[#101824] border border-[#263447] rounded p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#EAF0F6]">
                Top In-Demand Software by Occupation Reach
              </h3>
              <p className="text-xs text-[#8494A7] mt-0.5">
                Employer in-demand tools found across multi-domain roles
              </p>
            </div>
            <TrendingUp className="w-4 h-4 text-[#C7F464]" />
          </div>

          <div className="space-y-2.5">
            {topDemandSoftware.map((tool, idx) => (
              <div
                key={idx}
                className="p-3 bg-[#080D16] border border-[#263447] rounded flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-[#EAF0F6]">{tool.software_example}</div>
                  <div className="text-[11px] text-[#8494A7]">
                    {tool.categories?.[0] || 'Software'}
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-sm font-bold text-[#C7F464] tabular-nums">
                    {tool.occupation_count}
                  </div>
                  <div className="text-[10px] text-[#8494A7]">roles</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analytical Clarification Notice */}
      <div className="p-4 bg-[#101824] border border-[#263447] rounded flex items-start gap-3 text-xs text-[#8494A7]">
        <Info className="w-4 h-4 text-[#43D9F5] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[#EAF0F6]">O*NET Classification Notice:</strong> Demand flags and hot technology ratings are descriptive metrics cataloged by the U.S. Department of Labor O*NET research program. They indicate occupational curricular relevance rather than active real-time employee proficiency within a specific enterprise team.
        </p>
      </div>
    </div>
  );
};
