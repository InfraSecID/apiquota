import React from 'react';
import { ShieldCheck, Plus, Bell, RefreshCw, KeyRound } from 'lucide-react';

interface NavbarProps {
  onOpenAddModal: () => void;
  onOpenAlertModal: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAddModal,
  onOpenAlertModal,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <KeyRound className="h-5 w-5 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white">APIQuota</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                SaaS
              </span>
            </div>
            <p className="text-xs text-slate-400">Multi-Provider Quota & Security Shield</p>
          </div>
        </div>

        {/* Security badge and Actions */}
        <div className="flex items-center space-x-3">
          {/* Security Indicator */}
          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-emerald-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-slate-300">AES-256-GCM Vault Active</span>
          </div>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition duration-150 disabled:opacity-50"
            title="Refresh Dashboard"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Alert Settings */}
          <button
            onClick={onOpenAlertModal}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition duration-150"
          >
            <Bell className="h-4 w-4 text-amber-400" />
            <span className="hidden sm:inline">Alert Settings</span>
          </button>

          {/* Add Provider */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium shadow-md shadow-emerald-600/30 transition duration-150"
          >
            <Plus className="h-4 w-4" />
            <span>Add Provider</span>
          </button>
        </div>
      </div>
    </header>
  );
};
