import React from 'react';
import { ShieldCheck, Plus, Bell, RefreshCw, LogOut, User as UserIcon, Terminal } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onOpenAddModal: () => void;
  onOpenAlertModal: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onOpenAddModal,
  onOpenAlertModal,
  onRefresh,
  isRefreshing,
}) => {
  const isAdmin = user?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800 bg-[#0a0a0a]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 p-[1px] shadow-lg shadow-emerald-500/10">
            <div className="h-full w-full bg-[#0a0a0a] rounded-[11px] flex items-center justify-center">
              <Terminal className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-white font-mono">APIQuota</span>
              <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                v2.0
              </span>
            </div>
          </div>
        </div>

        {/* Security badge and Actions */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {/* AES Security Pill */}
          <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-neutral-400 font-mono text-[11px]">AES-256-GCM VAULT</span>
          </div>

          {/* User Profile & Role Pill */}
          {user && (
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs">
              <UserIcon className="h-3.5 w-3.5 text-neutral-400" />
              <span className="text-neutral-300 font-mono text-[11px] max-w-[130px] truncate">{user.email}</span>
              <span
                className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded border ${
                  isAdmin
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                }`}
              >
                {user.role}
              </span>
            </div>
          )}

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition duration-200 disabled:opacity-50"
            title="Refresh Telemetry"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Alert Settings */}
          <button
            onClick={onOpenAlertModal}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-medium transition duration-200"
          >
            <Bell className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden md:inline">Alerts</span>
          </button>

          {/* Add Provider Button - ADMIN Only */}
          {isAdmin && (
            <button
              onClick={onOpenAddModal}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold shadow-lg shadow-emerald-500/20 transition duration-200"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Provider</span>
            </button>
          )}

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 border border-neutral-800 transition duration-200"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
