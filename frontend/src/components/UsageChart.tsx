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
import { TrendingUp } from 'lucide-react';

interface UsageChartProps {
  data: ChartDataPoint[];
}

export const UsageChart: React.FC<UsageChartProps> = ({ data }) => {
  // Collect all provider keys present in the chart data (excluding 'time' and 'totalUsed')
  const providerKeys = Array.from(
    new Set(
      data.flatMap((d) =>
        Object.keys(d).filter((k) => k !== 'time' && k !== 'totalUsed')
      )
    )
  );

  const colors = [
    { stroke: '#10b981', fill: '#10b981' }, // Emerald (OpenAI)
    { stroke: '#6366f1', fill: '#6366f1' }, // Indigo (Gemini)
    { stroke: '#f59e0b', fill: '#f59e0b' }, // Amber
    { stroke: '#06b6d4', fill: '#06b6d4' }, // Cyan
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">Usage & Quota Consumption Trends</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time tracking of consumed API credits across AI providers
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>Live Telemetry</span>
          </span>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
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

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(val) => `$${val}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                color: '#f8fafc',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                fontSize: '12px',
              }}
              formatter={(value: any, name: any) => [`$${Number(value).toFixed(2)}`, name]}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              formatter={(val) => <span className="text-slate-300">{val}</span>}
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
                stroke="#10b981"
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
