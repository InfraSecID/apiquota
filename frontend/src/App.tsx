import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import { ApiProvider, DashboardSummary } from './types';
import { Navbar } from './components/Navbar';
import { StatCard } from './components/StatCard';
import { UsageChart } from './components/UsageChart';
import { ProviderCard } from './components/ProviderCard';
import { AddProviderModal } from './components/AddProviderModal';
import { AlertSettingsModal } from './components/AlertSettingsModal';
import {
  DollarSign,
  PieChart,
  Server,
  AlertTriangle,
  ShieldCheck,
  Bell,
  Clock,
  Layers,
} from 'lucide-react';

export const App: React.FC = () => {
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ApiProvider | null>(null);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const [providersData, summaryData] = await Promise.all([
        api.getProviders(),
        api.getDashboardSummary(),
      ]);
      setProviders(providersData);
      setSummary(summaryData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => fetchData(true), 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Provider Actions
  const handleSaveProvider = async (data: any) => {
    if (data.id) {
      await api.updateProvider(data.id, data);
    } else {
      await api.createProvider(data);
    }
    await fetchData(true);
  };

  const handleSyncProvider = async (id: string) => {
    await api.syncProvider(id);
    await fetchData(true);
  };

  const handleDeleteProvider = async (id: string) => {
    await api.deleteProvider(id);
    await fetchData(true);
  };

  const handleOpenEdit = (provider: ApiProvider) => {
    setEditingProvider(provider);
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setEditingProvider(null);
  };

  // Find critical providers (< 20%)
  const lowQuotaProviders = providers.filter((p) => p.remainingPercentage <= p.alertThreshold);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <Navbar
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenAlertModal={() => setIsAlertModalOpen(true)}
        onRefresh={() => fetchData()}
        isRefreshing={refreshing}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Error notification */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center justify-between text-rose-300 text-sm">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchData()}
              className="text-xs bg-rose-500/20 px-3 py-1 rounded hover:bg-rose-500/30 transition text-rose-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* Low Quota Warning Alert Banner */}
        {lowQuotaProviders.length > 0 && (
          <div className="bg-gradient-to-r from-amber-950/40 via-amber-900/30 to-amber-950/40 border border-amber-500/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 shadow-lg shadow-amber-950/20">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-amber-100">
                  ⚠️ Low Quota Alert Detected ({lowQuotaProviders.length} Provider{lowQuotaProviders.length > 1 ? 's' : ''} &lt; 20%)
                </h4>
                <p className="text-xs text-amber-300/80 mt-0.5">
                  Providers at risk: {lowQuotaProviders.map((p) => `${p.name} (${p.remainingPercentage.toFixed(1)}%)`).join(', ')}. Dispatches sent via Telegram/WhatsApp.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsAlertModalOpen(true)}
              className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 text-xs font-medium transition"
            >
              View Alert Settings
            </button>
          </div>
        )}

        {/* Top Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Quota Budget"
            value={`$${summary?.metrics.totalAllocatedQuota.toFixed(2) || '0.00'}`}
            subtitle="Allocated across all providers"
            icon={DollarSign}
            badge={{ text: 'Allocated', variant: 'info' }}
          />

          <StatCard
            title="Total Quota Used"
            value={`$${summary?.metrics.totalUsedQuota.toFixed(2) || '0.00'}`}
            subtitle="Current cycle API consumption"
            icon={PieChart}
            badge={{ text: 'Consumed', variant: 'warning' }}
          />

          <StatCard
            title="Sisa Kuota (Remaining)"
            value={`${summary?.metrics.overallRemainingPercentage.toFixed(1) || '100'}%`}
            subtitle="Global quota balance"
            icon={Layers}
            badge={{
              text: (summary?.metrics.overallRemainingPercentage || 100) > 20 ? 'Optimal' : 'Low Quota',
              variant: (summary?.metrics.overallRemainingPercentage || 100) > 20 ? 'success' : 'danger',
            }}
          />

          <StatCard
            title="Monitored Providers"
            value={summary?.metrics.activeProvidersCount || 0}
            subtitle={`${summary?.metrics.warningCount || 0} warning · ${summary?.metrics.criticalCount || 0} critical`}
            icon={Server}
            badge={{
              text: `${summary?.metrics.healthyCount || 0} Healthy`,
              variant: 'success',
            }}
          />
        </div>

        {/* Usage Analytics Chart (Recharts) */}
        {summary && summary.chartData && (
          <UsageChart data={summary.chartData} />
        )}

        {/* Monitored Providers Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">Monitored API Providers</h3>
            </div>
            <span className="text-xs text-slate-400">
              {providers.length} provider{providers.length === 1 ? '' : 's'} connected
            </span>
          </div>

          {providers.length === 0 && !loading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Server className="h-7 w-7" />
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="text-base font-semibold text-white">No API providers registered yet</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Connect your OpenAI, Gemini, or custom API keys. Keys are automatically encrypted with AES-256-GCM.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
              >
                Add Your First Provider
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {providers.map((p) => (
                <ProviderCard
                  key={p.id}
                  provider={p}
                  onSync={handleSyncProvider}
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteProvider}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recent Alert Logs Section */}
        {summary?.recentAlerts && summary.recentAlerts.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Bell className="h-5 w-5 text-amber-400" />
              <h4 className="text-base font-semibold text-white">Recent Security & Quota Alert Dispatches</h4>
            </div>

            <div className="divide-y divide-slate-800">
              {summary.recentAlerts.map((log) => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white">{log.provider?.name || 'Provider'}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                        {log.channel}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          log.status === 'SENT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                    <p className="text-slate-400 font-mono text-[11px]">{log.message}</p>
                  </div>
                  <div className="flex items-center space-x-1 text-slate-500 whitespace-nowrap">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <AddProviderModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSubmit={handleSaveProvider}
        editingProvider={editingProvider}
      />

      <AlertSettingsModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
      />
    </div>
  );
};

export default App;
