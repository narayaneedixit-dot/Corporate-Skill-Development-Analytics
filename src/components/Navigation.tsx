import React from 'react';
import { Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { DatabaseStatus } from '../types';

interface NavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  dbStatus: DatabaseStatus | null;
  onOpenConnectModal: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  dbStatus,
  onOpenConnectModal,
}) => {
  const isConnected = dbStatus?.connected ?? false;

  const navLinks = [
    { id: 'overview', label: 'Overview' },
    { id: 'occupations', label: 'Occupations' },
    { id: 'software', label: 'Software' },
    { id: 'demand', label: 'Demand Signals' },
    { id: 'explorer', label: 'Data Explorer' },
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-[#080D16]/95 backdrop-blur-md border-b border-[#263447]">
      {/* Zone 1: Single text wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => onTabChange('overview')}
          className="text-left font-bold tracking-tight text-[#EAF0F6] text-lg hover:text-[#C7F464] transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-1 focus-visible:ring-[#C7F464]"
        >
          SKILL//INTELLIGENCE
        </button>
      </div>

      {/* Zone 2: 4–5 concise single-line nav links */}
      <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#8494A7]">
        {navLinks.map((link) => {
          const isActive = currentTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => onTabChange(link.id)}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 relative focus:outline-none focus-visible:ring-1 focus-visible:ring-[#C7F464] ${
                isActive ? 'text-[#EAF0F6] font-semibold' : 'hover:text-[#EAF0F6]'
              }`}
            >
              {link.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C7F464]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenConnectModal}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C7F464] ${
            isConnected
              ? 'bg-[#151F2D] border-[#263447] text-[#EAF0F6] hover:border-[#43D9F5]'
              : 'bg-[#C7F464] border-[#C7F464] text-[#080D16] hover:bg-[#b8eb52] font-semibold'
          }`}
        >
          {isConnected ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#C7F464]" />
              <span className="font-mono text-[11px] text-[#C7F464]">CONNECTED</span>
              <span className="text-[#8494A7] text-[11px] font-mono">({dbStatus?.row_count?.toLocaleString()} rows)</span>
            </>
          ) : (
            <>
              <Database className="w-3.5 h-3.5 text-[#080D16]" />
              <span>Connect Database</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
