import React, { useState } from 'react';
import {
  X,
  Database,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Server,
  Table,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { DatabaseStatus, ConnectionTestResult } from '../types';
import { api } from '../api/client';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbStatus: DatabaseStatus | null;
  onConnectionSuccess: (status: DatabaseStatus) => void;
  onDisconnected: () => void;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({
  isOpen,
  onClose,
  dbStatus,
  onConnectionSuccess,
  onDisconnected
}) => {
  const [connectionName, setConnectionName] = useState('Supabase Workforce Database');
  const [connectionUri, setConnectionUri] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!connectionUri.trim()) {
      setErrorMessage('Please enter a PostgreSQL connection URI.');
      return;
    }
    setTesting(true);
    setErrorMessage(null);
    setTestResult(null);

    try {
      const result = await api.testConnection(connectionUri.trim(), connectionName);
      setTestResult(result);
      if (!result.success) {
        setErrorMessage(result.error || result.message || 'Connection test failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to connect to database host.');
    } finally {
      setTesting(false);
    }
  };

  const handleConnect = async () => {
    if (!connectionUri.trim()) {
      setErrorMessage('Please enter a PostgreSQL connection URI.');
      return;
    }
    setConnecting(true);
    setErrorMessage(null);

    try {
      const status = await api.connectDb(connectionUri.trim(), connectionName);
      onConnectionSuccess(status);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save and establish connection.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await api.disconnectDb();
      onDisconnected();
      setTestResult(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error disconnecting.');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-[#101824] border border-[#263447] rounded shadow-2xl text-[#EAF0F6] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#263447] bg-[#151F2D]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#080D16] border border-[#263447] rounded">
              <Database className="w-5 h-5 text-[#43D9F5]" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-[#EAF0F6]">
                PostgreSQL Database Connection
              </h2>
              <div className="flex items-center gap-2 text-xs text-[#8494A7] mt-0.5">
                <span>Supabase PostgreSQL integration</span>
                <span aria-hidden="true">·</span>
                <span>Target: public.onet_software_skills</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#8494A7] hover:text-[#EAF0F6] hover:bg-[#080D16] rounded transition-colors focus:outline-none"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Current Status Banner */}
          <div className={`p-4 rounded border flex items-start gap-3.5 ${
            dbStatus?.connected
              ? 'bg-[#151F2D] border-[#C7F464]/30'
              : 'bg-[#151F2D] border-[#263447]'
          }`}>
            {dbStatus?.connected ? (
              <CheckCircle2 className="w-5 h-5 text-[#C7F464] shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-[#F2B84B] shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#EAF0F6]">
                  {dbStatus?.connected ? 'Connected to Active Database' : 'Database Disconnected'}
                </span>
                {dbStatus?.connected && (
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="flex items-center gap-1.5 text-xs text-[#8494A7] hover:text-[#F2B84B] transition-colors focus:outline-none"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-[#8494A7] mt-1">
                {dbStatus?.connected
                  ? `Active connection to table ${dbStatus.table_name} with ${dbStatus.row_count.toLocaleString()} skill records.`
                  : 'Enter your Supabase PostgreSQL connection URI below to verify and query workforce intelligence data.'}
              </p>
            </div>
          </div>

          {/* Connection Details Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#8494A7] mb-1.5">
                Connection Name
              </label>
              <input
                type="text"
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
                className="w-full px-3 py-2 bg-[#080D16] border border-[#263447] rounded text-sm text-[#EAF0F6] focus:border-[#43D9F5] focus:outline-none font-mono"
                placeholder="Supabase Workforce Database"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#8494A7]">
                  PostgreSQL Connection URI
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="flex items-center gap-1 text-[11px] text-[#8494A7] hover:text-[#EAF0F6] focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Mask password' : 'Show password'}</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={connectionUri}
                  onChange={(e) => setConnectionUri(e.target.value)}
                  className="w-full px-3 py-2 bg-[#080D16] border border-[#263447] rounded text-sm text-[#EAF0F6] focus:border-[#43D9F5] focus:outline-none font-mono text-xs"
                  placeholder="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#8494A7] mt-1.5">
                <span>Example: postgresql://postgres:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres</span>
              </div>
            </div>
          </div>

          {/* Error Message Display */}
          {errorMessage && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded text-xs text-red-200">
              <div className="font-semibold mb-0.5">Connection Error</div>
              <p className="font-mono text-[11px] break-all">{errorMessage}</p>
            </div>
          )}

          {/* Test Result Verification Card */}
          {testResult && testResult.success && (
            <div className="p-4 bg-[#151F2D] border border-[#C7F464]/40 rounded space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#C7F464]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verification Succeeded: Schema & Table Confirmed</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-[#080D16] border border-[#263447] rounded">
                  <div className="text-[11px] text-[#8494A7] flex items-center gap-1">
                    <Database className="w-3 h-3 text-[#43D9F5]" /> Database
                  </div>
                  <div className="font-mono text-sm font-semibold text-[#EAF0F6] mt-1">
                    {testResult.database_name || 'postgres'}
                  </div>
                </div>
                <div className="p-2.5 bg-[#080D16] border border-[#263447] rounded">
                  <div className="text-[11px] text-[#8494A7] flex items-center gap-1">
                    <Table className="w-3 h-3 text-[#C7F464]" /> Target Table
                  </div>
                  <div className="font-mono text-xs font-semibold text-[#EAF0F6] mt-1 truncate">
                    {testResult.table_name}
                  </div>
                </div>
                <div className="p-2.5 bg-[#080D16] border border-[#263447] rounded">
                  <div className="text-[11px] text-[#8494A7] flex items-center gap-1">
                    <Layers className="w-3 h-3 text-[#43D9F5]" /> Verified Rows
                  </div>
                  <div className="font-mono text-sm font-semibold text-[#C7F464] mt-1">
                    {testResult.row_count.toLocaleString()}
                  </div>
                </div>
                <div className="p-2.5 bg-[#080D16] border border-[#263447] rounded">
                  <div className="text-[11px] text-[#8494A7] flex items-center gap-1">
                    <Server className="w-3 h-3 text-[#8494A7]" /> Engine
                  </div>
                  <div className="font-mono text-xs font-semibold text-[#EAF0F6] mt-1 truncate">
                    {testResult.server_version || 'PostgreSQL'}
                  </div>
                </div>
              </div>
              {testResult.columns && testResult.columns.length > 0 && (
                <div className="text-[11px] text-[#8494A7]">
                  <span className="font-medium text-[#EAF0F6]">Verified Columns:</span>{' '}
                  <span className="font-mono">{testResult.columns.join(' · ')}</span>
                </div>
              )}
            </div>
          )}

          {/* Security Notice */}
          <div className="p-3 bg-[#080D16] border border-[#263447] rounded text-xs text-[#8494A7] flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#43D9F5] shrink-0 mt-0.5" />
            <div>
              <span className="text-[#EAF0F6] font-medium">Server-Side Security Enforced:</span> Connection strings are processed exclusively by the backend service. Credentials are never written to client storage, never logged in plain text, and error messages are sanitized before transmission.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#263447] bg-[#151F2D]">
          <div className="text-xs text-[#8494A7]">
            {dbStatus?.connected ? 'Database ready for querying' : 'Connection required for live analytics'}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || connecting}
              className="px-4 py-2 text-xs font-semibold rounded border border-[#263447] bg-[#101824] text-[#EAF0F6] hover:bg-[#080D16] hover:border-[#43D9F5] transition-colors flex items-center gap-2 focus:outline-none"
            >
              {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>{testing ? 'Testing Connection...' : 'Test Connection'}</span>
            </button>
            <button
              type="button"
              onClick={handleConnect}
              disabled={testing || connecting}
              className="px-4 py-2 text-xs font-semibold rounded bg-[#C7F464] text-[#080D16] hover:bg-[#b5e74f] transition-colors flex items-center gap-1.5 focus:outline-none"
            >
              {connecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
              <span>{connecting ? 'Establishing...' : 'Save & Connect'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
