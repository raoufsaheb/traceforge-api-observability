import React from 'react';
import { useObservabilityStore } from '../../store/observabilityStore';
import { computeStatusDistribution } from '../../lib/analytics';
import type { StatusClassFilter } from '../../types/telemetry';

export const StatusDistributionChart: React.FC = () => {
  const { records, setFilter, setActiveTab } = useObservabilityStore();
  const dist = computeStatusDistribution(records);

  const radius = 64;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;

  // Calculate segment lengths
  const total = dist.total || 1;
  const pct2xx = dist.count2xx / total;
  const pct4xx = dist.count4xx / total;
  const pct5xx = dist.count5xx / total;

  const len2xx = pct2xx * circumference;
  const len4xx = pct4xx * circumference;
  const len5xx = pct5xx * circumference;

  // Offsets (starting from top: -90deg rotation)
  const offset2xx = 0;
  const offset4xx = -len2xx;
  const offset5xx = -(len2xx + len4xx);

  const handleFilterClick = (statusClass: StatusClassFilter) => {
    setFilter({ statusClass });
    setActiveTab('traces');
  };

  return (
    <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-white tracking-tight">
          Status Code Breakdown
        </h2>
        <p className="text-xs text-slate-400">
          Proportion of successful vs failed HTTP transactions
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-2">
        {/* SVG Doughnut */}
        <div className="relative flex items-center justify-center">
          <svg
            width="160"
            height="160"
            viewBox="0 0 160 160"
            className="transform -rotate-90"
            role="img"
            aria-label={`Status code breakdown: ${dist.successRate}% success rate`}
          >
            {/* Background track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="#1E293B"
              strokeWidth={strokeWidth}
            />

            {/* 2xx Success (Emerald) */}
            {dist.count2xx > 0 && (
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke="#10B981"
                strokeWidth={strokeWidth}
                strokeDasharray={`${len2xx} ${circumference - len2xx}`}
                strokeDashoffset={offset2xx}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            )}

            {/* 4xx Client Errors (Amber) */}
            {dist.count4xx > 0 && (
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke="#F59E0B"
                strokeWidth={strokeWidth}
                strokeDasharray={`${len4xx} ${circumference - len4xx}`}
                strokeDashoffset={offset4xx}
                className="transition-all duration-500"
              />
            )}

            {/* 5xx Server Errors (Rose) */}
            {dist.count5xx > 0 && (
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke="#F43F5E"
                strokeWidth={strokeWidth}
                strokeDasharray={`${len5xx} ${circumference - len5xx}`}
                strokeDashoffset={offset5xx}
                className="transition-all duration-500"
              />
            )}
          </svg>

          {/* Centered Stat */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-mono font-bold text-white tracking-tight">
              {dist.successRate}%
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
              2xx OK
            </span>
          </div>
        </div>

        {/* Legend Breakdown & Click to Filter */}
        <div className="flex flex-col gap-2.5 w-full sm:w-auto text-xs">
          {/* 2xx */}
          <button
            onClick={() => handleFilterClick('2xx')}
            className="flex items-center justify-between gap-4 p-2 rounded-lg bg-slate-900/40 hover:bg-slate-800 border border-slate-800 transition-colors text-left group"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-slate-300 font-medium">2xx Success</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-slate-200 font-bold">{dist.count2xx}</span>
              <span className="text-slate-500 text-[11px]">
                ({(pct2xx * 100).toFixed(1)}%)
              </span>
            </div>
          </button>

          {/* 4xx */}
          <button
            onClick={() => handleFilterClick('4xx')}
            className="flex items-center justify-between gap-4 p-2 rounded-lg bg-slate-900/40 hover:bg-slate-800 border border-slate-800 transition-colors text-left group"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-slate-300 font-medium">4xx Client Errors</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-slate-200 font-bold">{dist.count4xx}</span>
              <span className="text-slate-500 text-[11px]">
                ({(pct4xx * 100).toFixed(1)}%)
              </span>
            </div>
          </button>

          {/* 5xx */}
          <button
            onClick={() => handleFilterClick('5xx')}
            className="flex items-center justify-between gap-4 p-2 rounded-lg bg-slate-900/40 hover:bg-slate-800 border border-slate-800 transition-colors text-left group"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span className="text-slate-300 font-medium">5xx Server Faults</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-slate-200 font-bold">{dist.count5xx}</span>
              <span className="text-slate-500 text-[11px]">
                ({(pct5xx * 100).toFixed(1)}%)
              </span>
            </div>
          </button>
        </div>
      </div>

      <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-3 text-center">
        Tip: Click any status class in the legend to drill into filtered request traces.
      </div>
    </div>
  );
};
