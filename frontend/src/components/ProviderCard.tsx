import React, { useState } from 'react';
import { ApiProvider } from '../types';
import { RefreshCw, Trash2, Edit3, ShieldAlert, CheckCircle2, AlertTriangle, KeyRound } from 'lucide-react';

interface ProviderCardProps {
  provider: ApiProvider;
  isAdmin: boolean;
  onSync: (id: string) => Promise<void>;
  onEdit: (provider: ApiProvider) => void;
  onDelete: (id: string) => Promise<void>;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  isAdmin,
  onSync,
  onEdit,
  onDelete,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await onSync(provider.id);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) return;
    if (window.confirm(`Are you sure you want to delete ${provider.name}?`)) {
      setIsDeleting(true);
      try {
        await onDelete(provider.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Remaining quota color
  const remaining = provider.remainingPercentage;
  let progressColor = 'bg-emerald-400';
  let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let StatusIcon = CheckCircle2;

  if (remaining <= 10 || provider.status === 'CRITICAL' || provider.status === 'ERROR') {
    progressColor = 'bg-rose-500';
    badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    StatusIcon = ShieldAlert;
  } else if (remaining <= provider.alertThreshold || provider.status === 'WARNING') {
    progressColor = 'bg-amber-400';
    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    StatusIcon = AlertTriangle;
  }

  const remainingDollars = Math.max(0, provider.totalQuota - provider.usedQuota).toFixed(2);

  return (
    <div className="group relative bg-[#111111] border border-neutral-800 rounded-xl p-6 transition-all duration-300 hover:border-neutral-700 hover:shadow-xl hover:shadow-black/40 flex flex-col justify-between">
      <div>
        {/* Header & Badges */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-800 font-semibold">
                {provider.provider}
              </span>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border font-medium flex items-center space-x-1 ${badgeColor}`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {provider.status}
              </span>
            </div>
            <h4 className="text-base font-bold text-white mt-2 group-hover:text-emerald-400 transition-colors">
              {provider.name}
            </h4>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onEdit(provider)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition"
              title="Edit Provider"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            {isAdmin && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800/80 transition disabled:opacity-40"
                title="Delete Provider (Admin Only)"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Masked API Key (AES-256-GCM Vaulted) */}
        <div className="bg-[#0a0a0a] border border-neutral-800/80 rounded-lg px-3 py-2.5 my-3.5 flex items-center justify-between text-xs font-mono text-neutral-400">
          <div className="flex items-center space-x-2 overflow-hidden truncate">
            <KeyRound className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="truncate tracking-wider">{provider.keyMask}</span>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800 shrink-0 ml-2 uppercase">
            AES-256
          </span>
        </div>

        {/* Quota Progress */}
        <div className="mt-4">
          <div className="flex justify-between items-baseline text-xs mb-2">
            <span className="text-neutral-400 font-medium">Remaining Quota</span>
            <span className="font-mono font-bold text-white">
              {remaining.toFixed(1)}% <span className="text-neutral-400 font-normal">(${remainingDollars})</span>
            </span>
          </div>

          <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden p-[1px] border border-neutral-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${Math.min(100, Math.max(0, remaining))}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center text-[11px] font-mono text-neutral-400 mt-2.5">
            <span>Used: ${provider.usedQuota.toFixed(2)}</span>
            <span>Limit: ${provider.totalQuota.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer Info & Sync Action */}
      <div className="mt-5 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400 font-mono">
        <div className="truncate text-[11px]">
          <span>Synced: </span>
          <span className="text-neutral-300">
            {provider.lastSyncedAt ? new Date(provider.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
          </span>
        </div>

        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-medium transition duration-200 disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
        </button>
      </div>
    </div>
  );
};
