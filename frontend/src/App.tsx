import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import { ApiProvider, DashboardSummary, User } from './types';
import { Navbar } from './components/Navbar';
import { StatCard } from './components/StatCard';
import { UsageChart } from './components/UsageChart';
import { ProviderCard } from './components/ProviderCard';
import { AddProviderModal } from './components/AddProviderModal';
import { AlertSettingsModal } from './components/AlertSettingsModal';
import { ProtectedRoute } from './components/ProtectedRoute';
import {
  DollarSign,
  PieChart,
  Server,
  AlertTriangle,
  Bell,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ApiProvider | null>(null);

  // Check initial user authentication via httpOnly cookie session
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.getMe();
        setUser(res.user);
      } catch (err) {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

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
    if (user) {
      fetchData();
      // Auto-refresh every 60 seconds
      const interval = setInterval(() => fetchData(true), 60000);
      return () => clearInterval(interval);
    }
  }, [user, fetchData]);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setProviders([]);
      setSummary(null);
    }
  };

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

  const isAdmin = user?.role === 'ADMIN';

  // Find critical providers (< threshold)
  const lowQuotaProviders = providers.filter((p) => p.remainingPercentage <= p.alertThreshold);

  const marqueeKeywords = [
    'MONITORING',
    'QUOTA',
    'ALERTS',
    'SECURITY',
    'AES-256-GCM',
    'TELEMETRY',
    'RBAC CONTROL',
    'FAILOVER',
  ];

  return (
    <ProtectedRoute
      user={user}
      loading={authLoading}
      onLoginSuccess={(u) => {
        setUser(u);
        fetchData();
      }}
    >
      <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
        {/* Modern Minimal Navbar */}
        <Navbar
          user={user}
          onLogout={handleLogout}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenAlertModal={() => setIsAlertModalOpen(true)}
          onRefresh={() => fetchData()}
          isRefreshing={refreshing}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
          {/* 1. Hero / Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
            <div className="space-y-3 max-w-3xl">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono tracking-widest text-emerald-400 font-semibold uppercase px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  SYSTEM STATUS: {lowQuotaProviders.length === 0 ? 'HEALTHY' : 'WARNING'}
                </span>
                <span className="text-[11px] font-mono tracking-widest text-neutral-400 font-medium uppercase px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800">
                  {providers.length} PROVIDERS MONITORED
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white">
                APIQuota Dashboard
              </h1>
              <p className="text-base text-neutral-400 leading-relaxed max-w-2xl">
                Enterprise real-time quota telemetry, automated threshold alerts, and AES-256-GCM vaulted credential governance.
              </p>
            </div>

            {isAdmin && (
              <div className="flex items-center space-x-3 shrink-0">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition duration-200 shadow-xl shadow-emerald-500/20 flex items-center space-x-2"
                >
                  <span>Connect API Provider</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* 2. Marquee teks berjalan: "MONITORING • QUOTA • ALERTS • SECURITY •" */}
          <div className="w-full overflow-hidden border-y border-neutral-800 bg-[#0e0e0e] py-3 select-none -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
            <div className="animate-marquee flex items-center space-x-8 text-xs font-mono tracking-widest text-neutral-400">
              {[...marqueeKeywords, ...marqueeKeywords, ...marqueeKeywords].map((item, idx) => (
                <span key={idx} className="flex items-center space-x-8">
                  <span className="hover:text-emerald-400 transition-colors uppercase font-bold">{item}</span>
                  <span className="text-emerald-500/50">✦</span>
                </span>
              ))}
            </div>
          </div>

          {/* Error notification */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center justify-between text-rose-300 text-sm font-mono">
              <div className="flex items-center space-x-2.5">
                <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => fetchData()}
                className="text-xs bg-rose-500/20 px-3 py-1 rounded-lg hover:bg-rose-500/30 transition text-rose-200"
              >
                Retry
              </button>
            </div>
          )}

          {/* Low Quota Warning Alert Banner */}
          {lowQuotaProviders.length > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 shadow-lg shadow-black/40">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 shrink-0 border border-amber-500/30">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-300">
                    Low Quota Alert Detected ({lowQuotaProviders.length} Provider{lowQuotaProviders.length > 1 ? 's' : ''} &lt; Threshold)
                  </h4>
                  <p className="text-xs text-neutral-400 mt-0.5 font-mono">
                    At risk: {lowQuotaProviders.map((p) => `${p.name} (${p.remainingPercentage.toFixed(1)}%)`).join(', ')}. Automated alerts triggered.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAlertModalOpen(true)}
                className="self-start sm:self-auto px-3.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-neutral-800 text-xs font-mono font-medium transition"
              >
                Alert Config
              </button>
            </div>
          )}

          {/* 3. Baris stat card besar: Total Quota, Used Quota, Remaining %, Providers Count */}
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-semibold">
                OVERVIEW
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Global Metrics
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Quota"
                value={`$${summary?.metrics.totalAllocatedQuota.toFixed(2) || '0.00'}`}
                subtitle="Aggregated budget across connected providers"
                icon={DollarSign}
                badge={{ text: 'Allocated', variant: 'info' }}
              />

              <StatCard
                title="Used Quota"
                value={`$${summary?.metrics.totalUsedQuota.toFixed(2) || '0.00'}`}
                subtitle="Total consumed credits this cycle"
                icon={PieChart}
                badge={{ text: 'Consumed', variant: 'warning' }}
              />

              <StatCard
                title="Remaining %"
                value={`${summary?.metrics.overallRemainingPercentage.toFixed(1) || '100'}%`}
                subtitle="Global available credit headroom"
                icon={Layers}
                badge={{
                  text: (summary?.metrics.overallRemainingPercentage || 100) > 20 ? 'Optimal' : 'Threshold Breached',
                  variant: (summary?.metrics.overallRemainingPercentage || 100) > 20 ? 'success' : 'danger',
                }}
              />

              <StatCard
                title="Providers Count"
                value={summary?.metrics.activeProvidersCount || 0}
                subtitle={`${summary?.metrics.healthyCount || 0} healthy · ${summary?.metrics.warningCount || 0} warning · ${summary?.metrics.criticalCount || 0} critical`}
                icon={Server}
                badge={{
                  text: `${summary?.metrics.healthyCount || 0} Active`,
                  variant: 'success',
                }}
              />
            </div>
          </div>

          {/* 4. Section "Monitored Providers" */}
          <section className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-neutral-800 pb-4">
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-semibold">
                  PROVIDERS
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Monitored Providers
                </h2>
                <p className="text-xs text-neutral-400">
                  AES-256-GCM encrypted provider credentials and quota thresholds
                </p>
              </div>
              <span className="text-xs font-mono text-neutral-400">
                {providers.length} registered provider{providers.length === 1 ? '' : 's'}
              </span>
            </div>

            {providers.length === 0 && !loading ? (
              <div className="bg-[#111111] border border-neutral-800 rounded-2xl p-12 text-center space-y-4">
                <div className="h-14 w-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                  <Server className="h-7 w-7" />
                </div>
                <div className="max-w-md mx-auto">
                  <h4 className="text-base font-bold text-white">No API providers registered yet</h4>
                  <p className="text-xs text-neutral-400 mt-1">
                    Connect your OpenAI, Gemini, Anthropic, or custom API keys. Keys are automatically protected in the AES-256-GCM vault.
                  </p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-lg shadow-emerald-500/20 transition"
                  >
                    Add Your First Provider
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {providers.map((p) => (
                  <ProviderCard
                    key={p.id}
                    provider={p}
                    isAdmin={isAdmin}
                    onSync={handleSyncProvider}
                    onEdit={handleOpenEdit}
                    onDelete={handleDeleteProvider}
                  />
                ))}
              </div>
            )}
          </section>

          {/* 5. Section "Usage Analytics" */}
          <section className="space-y-4 pt-4">
            <div className="space-y-1 border-b border-neutral-800 pb-4">
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-semibold">
                ANALYTICS
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Usage Analytics
              </h2>
              <p className="text-xs text-neutral-400">
                Historical consumption trends visualized across all connected AI services
              </p>
            </div>

            {summary && summary.chartData && (
              <UsageChart data={summary.chartData} />
            )}
          </section>

          {/* 6. Section "Recent Alerts" */}
          <section className="space-y-4 pt-4">
            <div className="space-y-1 border-b border-neutral-800 pb-4">
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-semibold">
                INCIDENTS & LOGS
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Recent Alerts
              </h2>
              <p className="text-xs text-neutral-400">
                Automated multi-channel dispatch logs (Telegram / WhatsApp)
              </p>
            </div>

            {summary?.recentAlerts && summary.recentAlerts.length > 0 ? (
              <div className="bg-[#111111] border border-neutral-800 rounded-xl p-6">
                <div className="divide-y divide-neutral-800/80">
                  {summary.recentAlerts.map((log) => (
                    <div key={log.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white font-mono">{log.provider?.name || 'Provider'}</span>
                          <span className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 font-mono text-[10px] border border-neutral-800">
                            {log.channel}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                              log.status === 'SENT'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                        <p className="text-neutral-400 font-mono text-[11px]">{log.message}</p>
                      </div>
                      <div className="flex items-center space-x-1.5 text-neutral-400 font-mono whitespace-nowrap text-[11px]">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-[#111111] border border-neutral-800 rounded-xl p-8 text-center text-xs font-mono text-neutral-400">
                No recent alert incidents dispatched. All provider quotas operating within normal thresholds.
              </div>
            )}
          </section>

          {/* 7. Footer CTA: teks besar "Ready to monitor your API quota?" dengan tombol */}
          <section className="pt-8 pb-12">
            <div className="bg-gradient-to-b from-[#141414] to-[#0a0a0a] border border-neutral-800 rounded-2xl p-8 sm:p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 right-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

              <div className="max-w-2xl mx-auto space-y-4 relative z-10">
                <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-semibold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 inline-block">
                  NEXT-GEN QUOTA OBSERVABILITY
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Ready to monitor your API quota?
                </h2>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Avoid costly service outages and unexpected provider bills. Set up automated sync and instant Telegram alerts in minutes.
                </p>

                <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                  {isAdmin ? (
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition duration-200 shadow-xl shadow-emerald-500/20 flex items-center space-x-2"
                    >
                      <span>Add New Provider</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsAlertModalOpen(true)}
                      className="px-6 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold border border-neutral-800 transition duration-200"
                    >
                      View Alert Configuration
                    </button>
                  )}
                  <button
                    onClick={() => setIsAlertModalOpen(true)}
                    className="px-5 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-medium border border-neutral-800 transition duration-200 flex items-center space-x-1.5"
                  >
                    <Bell className="h-3.5 w-3.5 text-amber-400" />
                    <span>Configure Telegram Bot</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
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
    </ProtectedRoute>
  );
};

export default App;
