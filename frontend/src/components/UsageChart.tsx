import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartDataPoint } from '../types';
import { Activity } from 'lucide-react';

interface UsageChartProps {
  data: ChartDataPoint[];
}

export const UsageChart: React.FC<UsageChartProps> = ({ data }) => {
  const providerKeys = Array.from(
    new Set(
      data.flatMap((d) =>
        Object.keys(d).filter((k) => k !== 'time' && k !== 'totalUsed')
      )
    )
  );

  const colors = [
    { stroke: '#00ff88', fill: '#00ff88' }, // Neon Green (Masdika aesthetic)
    { stroke: '#00e5ff', fill: '#00e5ff' }, // Electric Cyan
    { stroke: '#a78bfa', fill: '#a78bfa' }, // Electric Purple
    { stroke: '#fbbf24', fill: '#fbbf24' }, // Neon Amber
  ];

  return (
    <div className="bg-[#111111] border border-neutral-800 rounded-xl p-6 shadow-xl transition-all duration-300 hover:border-neutral-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            <h3 className="text-base font-bold text-white tracking-tight">API Quota Telemetry Stream</h3>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time multi-provider token consumption trajectory
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono text-neutral-400">
          <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] text-emerald-400">LIVE TELEMETRY</span>
          </span>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ff88" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#00ff88" stopOpacity={0.0} />
              </linearGradient>
              {providerKeys.map((key, idx) => {
                const color = colors[idx % colors.length];
                return (
                  <linearGradient key={key} id={`color-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color.fill} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color.fill} stopOpacity={0.0} />
                  </linearGradient>
                );
              })}
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis
              dataKey="time"
              stroke="#525252"
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              axisLine={{ stroke: '#262626' }}
            />
            <YAxis
              stroke="#525252"
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              axisLine={{ stroke: '#262626' }}
              tickFormatter={(val) => `$${val}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0a0a0a',
                borderColor: '#262626',
                borderRadius: '0.75rem',
                color: '#ededed',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.8)',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}
              formatter={(value: any, name: any) => [`$${Number(value).toFixed(2)}`, name]}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '12px' }}
              formatter={(val) => <span className="text-neutral-300">{val}</span>}
            />

            {providerKeys.length > 0 ? (
              providerKeys.map((key, idx) => {
                const color = colors[idx % colors.length];
                return (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={color.stroke}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill={`url(#color-${key})`}
                  />
                );
              })
            ) : (
              <Area
                type="monotone"
                dataKey="totalUsed"
                stroke="#00ff88"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTotal)"
                name="Total Used ($)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
