import React from 'react';
import { Database, ShieldCheck, ArrowRight, Table, Layers, Cpu } from 'lucide-react';

interface DisconnectedStateProps {
  onOpenConnectModal: () => void;
  featureTitle?: string;
}

export const DisconnectedState: React.FC<DisconnectedStateProps> = ({
  onOpenConnectModal,
  featureTitle = 'Live Analytics & Data Exploration'
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-6">
      <div className="bg-[#101824] border border-[#263447] rounded-lg p-8 relative overflow-hidden bg-tech-grid">
        {/* Subtle decorative glow line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#43D9F5]/40 to-transparent" />

        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-mono text-[#43D9F5] mb-3">
            <span className="w-2 h-2 rounded-full bg-[#43D9F5]" />
            <span>STANDBY · DATABASE CONNECTION REQUIRED</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-[#EAF0F6] mb-3">
            Connect your Supabase PostgreSQL Instance to Access {featureTitle}
          </h2>

          <p className="text-sm text-[#8494A7] leading-relaxed mb-6">
            SKILL//INTELLIGENCE queries live records directly from your existing Supabase database table <code className="text-[#EAF0F6] bg-[#080D16] px-1.5 py-0.5 rounded border border-[#263447] font-mono text-xs">public.onet_software_skills</code> (~31,821 records). No dummy datasets or fake statistics are generated.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="p-3.5 bg-[#080D16] border border-[#263447] rounded">
              <div className="flex items-center gap-2 text-[#C7F464] text-xs font-semibold mb-1">
                <Table className="w-4 h-4" />
                <span>O*NET Skills Table</span>
              </div>
              <p className="text-xs text-[#8494A7]">
                Reads existing table with SOC codes, software titles, categories, and demand flags.
              </p>
            </div>

            <div className="p-3.5 bg-[#080D16] border border-[#263447] rounded">
              <div className="flex items-center gap-2 text-[#43D9F5] text-xs font-semibold mb-1">
                <Layers className="w-4 h-4" />
                <span>Real-Time Aggregations</span>
              </div>
              <p className="text-xs text-[#8494A7]">
                Server-side SQL aggregations for occupational density and software distribution.
              </p>
            </div>

            <div className="p-3.5 bg-[#080D16] border border-[#263447] rounded">
              <div className="flex items-center gap-2 text-[#F2B84B] text-xs font-semibold mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Secure Server URI</span>
              </div>
              <p className="text-xs text-[#8494A7]">
                Credentials remain securely in backend memory and are never exposed in browser code.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={onOpenConnectModal}
              className="px-5 py-2.5 bg-[#C7F464] text-[#080D16] hover:bg-[#b8eb52] font-semibold text-xs rounded flex items-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C7F464]"
            >
              <Database className="w-4 h-4 text-[#080D16]" />
              <span>Configure Database Connection</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-xs text-[#8494A7]">
              Connection string format: <code className="font-mono text-[#EAF0F6]">postgresql://postgres:[pass]@[host]:5432/postgres</code>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
