import React, { useState } from 'react';
import { ApiProvider } from '../types';
import { RefreshCw, Trash2, Edit3, ShieldAlert, CheckCircle2, AlertTriangle, KeyRound } from 'lucide-react';

interface ProviderCardProps {
  provider: ApiProvider;
  onSync: (id: string) => Promise<void>;
  onEdit: (provider: ApiProvider) => void;
  onDelete: (id: string) => Promise<void>;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
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
  let progressColor = 'bg-emerald-500';
  let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  let StatusIcon = CheckCircle2;

  if (remaining <= 10 || provider.status === 'CRITICAL') {
    progressColor = 'bg-rose-500';
    badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    StatusIcon = ShieldAlert;
  } else if (remaining <= provider.alertThreshold || provider.status === 'WARNING') {
    progressColor = 'bg-amber-500';
    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    StatusIcon = AlertTriangle;
  }

  const remainingDollars = (provider.totalQuota - provider.usedQuota).toFixed(2);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition duration-150 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {provider.provider}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex items-center space-x-1 ${badgeColor}`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {provider.status}
              </span>
            </div>
            <h4 className="text-base font-semibold text-white mt-1.5">{provider.name}</h4>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onEdit(provider)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Edit Provider"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition disabled:opacity-50"
              title="Delete Provider"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Masked API Key (AES-256-GCM Vaulted) */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg px-3 py-2 my-3 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center space-x-2 overflow-hidden truncate">
            <KeyRound className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{provider.keyMask}</span>
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider shrink-0 ml-2">AES Encrypted</span>
        </div>

        {/* Quota Progress */}
        <div className="mt-4">
          <div className="flex justify-between items-baseline text-xs mb-1.5">
            <span className="text-slate-400">Sisa Kuota (Remaining)</span>
            <span className="font-bold text-white">
              {remaining.toFixed(1)}% <span className="text-slate-400 font-normal">(${remainingDollars})</span>
            </span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${Math.min(100, Math.max(0, remaining))}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2">
            <span>Used: ${provider.usedQuota.toFixed(2)}</span>
            <span>Limit: ${provider.totalQuota.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer Info & Sync Action */}
      <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="truncate">
          <span>Synced: </span>
          <span className="text-slate-300">
            {provider.lastSyncedAt ? new Date(provider.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
          </span>
          <span className="text-slate-500 ml-2">| Alert: &lt;{provider.alertThreshold}%</span>
        </div>

        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-medium transition disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
        </button>
      </div>
    </div>
  );
};
