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
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  };

  return (
    <div className="group relative bg-[#111111] border border-neutral-800 rounded-xl p-6 transition-all duration-300 hover:border-neutral-700 hover:shadow-xl hover:shadow-black/50 flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">{title}</span>
        <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 group-hover:text-emerald-400 group-hover:border-neutral-700 transition duration-300">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      {/* Metric Value */}
      <div className="space-y-1">
        <div className="flex items-baseline space-x-2.5">
          <span className="text-3xl font-extrabold tracking-tight text-white font-mono">{value}</span>
          {badge && (
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded-full border font-medium ${badgeStyles[badge.variant]}`}
            >
              {badge.text}
            </span>
          )}
        </div>

        {subtitle && <p className="text-xs text-neutral-400 mt-2 font-sans">{subtitle}</p>}
      </div>
    </div>
  );
};
