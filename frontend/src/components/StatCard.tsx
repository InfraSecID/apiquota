import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'danger' | 'info';
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
}) => {
  const badgeStyles = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition duration-150 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-400">{title}</span>
        <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="flex items-baseline space-x-2">
        <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
        {badge && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${badgeStyles[badge.variant]}`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-slate-500 mt-2">{subtitle}</p>}
    </div>
  );
};
