import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { DatabaseModal } from './components/DatabaseModal';
import { OverviewPage } from './pages/OverviewPage';
import { OccupationExplorerPage } from './pages/OccupationExplorerPage';
import { SoftwareLandscapePage } from './pages/SoftwareLandscapePage';
import { DemandSignalsPage } from './pages/DemandSignalsPage';
import { DataExplorerPage } from './pages/DataExplorerPage';
import { DatabaseStatus } from './types';
import { api } from './api/client';
import { Database, FileCode, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  const fetchStatus = async () => {
    try {
      const status = await api.getDbStatus();
      setDbStatus(status);
    } catch (err) {
      // Backend may be initializing
      console.warn('Backend database status pending...', err);
      setDbStatus({
        connected: false,
        table_name: 'onet_software_skills',
        table_exists: false,
        row_count: 0,
        columns: [],
        error: 'Backend initializing'
      });
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="min-h-screen bg-[#080D16] text-[#EAF0F6] flex flex-col font-sans selection:bg-[#C7F464] selection:text-[#080D16]">
      {/* Top Bar Navigation */}
      <Navigation
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        dbStatus={dbStatus}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {currentTab === 'overview' && (
          <OverviewPage
            dbStatus={dbStatus}
            onOpenConnectModal={() => setIsConnectModalOpen(true)}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'occupations' && (
          <OccupationExplorerPage
            dbStatus={dbStatus}
            onOpenConnectModal={() => setIsConnectModalOpen(true)}
          />
        )}

        {currentTab === 'software' && (
          <SoftwareLandscapePage
            dbStatus={dbStatus}
            onOpenConnectModal={() => setIsConnectModalOpen(true)}
          />
        )}

        {currentTab === 'demand' && (
          <DemandSignalsPage
            dbStatus={dbStatus}
            onOpenConnectModal={() => setIsConnectModalOpen(true)}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'explorer' && (
          <DataExplorerPage
            dbStatus={dbStatus}
            onOpenConnectModal={() => setIsConnectModalOpen(true)}
          />
        )}
      </main>

      {/* Database Connection Modal */}
      <DatabaseModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        dbStatus={dbStatus}
        onConnectionSuccess={(newStatus) => {
          setDbStatus(newStatus);
        }}
        onDisconnected={() => {
          setDbStatus({
            connected: false,
            table_name: 'onet_software_skills',
            table_exists: false,
            row_count: 0,
            columns: []
          });
        }}
      />

      {/* Quiet Technical Footer */}
      <footer className="border-t border-[#263447] py-6 px-6 bg-[#080D16] text-xs text-[#8494A7] mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#EAF0F6]">SKILL//INTELLIGENCE</span>
            <span aria-hidden="true">·</span>
            <span>Corporate Workforce & Software Skills Analytics</span>
            <span aria-hidden="true">·</span>
            <span>O*NET 28.1+ Taxonomy</span>
          </div>

          <div className="flex items-center gap-5">
            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#43D9F5] transition-colors flex items-center gap-1.5 focus:outline-none"
            >
              <FileCode className="w-3.5 h-3.5 text-[#43D9F5]" />
              <span>FastAPI Docs (Swagger)</span>
            </a>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="hover:text-[#EAF0F6] transition-colors flex items-center gap-1 focus:outline-none"
            >
              <Database className="w-3.5 h-3.5 text-[#C7F464]" />
              <span>Database Settings</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
