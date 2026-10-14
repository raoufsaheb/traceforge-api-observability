import React from 'react';
import { useObservabilityStore } from '../../store/observabilityStore';
import { computePercentiles, computeStatusDistribution } from '../../lib/analytics';
import { Gauge, AlertTriangle, Zap, CheckCircle2 } from 'lucide-react';

export const MetricsBanner: React.FC = () => {
  const { records, activeIncidents, setAlertModalOpen } = useObservabilityStore();

  const latencies = records.map((r) => r.durationMs);
  const percentiles = computePercentiles(latencies);
  const distribution = computeStatusDistribution(records);

  const errorRate = distribution.errorRate;
  let errorColor = 'text-emerald-400';
  let errorBg = 'bg-emerald-500/10 border-emerald-500/20';

  if (errorRate >= 5.0) {
    errorColor = 'text-rose-400';
    errorBg = 'bg-rose-500/10 border-rose-500/20';
  } else if (errorRate >= 2.0) {
    errorColor = 'text-amber-400';
    errorBg = 'bg-amber-500/10 border-amber-500/20';
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Volume */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Total Telemetry</span>
          <span className="p-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Zap className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-mono font-bold text-white tracking-tight">
            {records.length.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400 font-mono">requests</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-2">
          <span>Success rate</span>
          <span className="font-mono text-emerald-400 font-medium">
            {distribution.successRate}%
          </span>
        </div>
      </div>

      {/* Error Rate */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Error Rate</span>
          <span className={`p-1 rounded border ${errorBg} ${errorColor}`}>
            <AlertTriangle className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-mono font-bold tracking-tight ${errorColor}`}>
            {errorRate}%
          </span>
          <span className="text-xs text-slate-400">4xx / 5xx</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-2 font-mono">
          <span>{distribution.count4xx} client / {distribution.count5xx} server</span>
          <span className="text-slate-500">SLA &lt; 2.0%</span>
        </div>
      </div>

      {/* P95 Latency */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>P95 Latency</span>
          <span className="p-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Gauge className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-mono font-bold text-white tracking-tight">
            {percentiles.p95}ms
          </span>
          <span className="text-xs text-slate-400 font-mono">p50: {percentiles.p50}ms</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-2 font-mono">
          <span>p99: {percentiles.p99}ms</span>
          <span className="text-slate-500">Target &lt; 350ms</span>
        </div>
      </div>

      {/* Active Incidents */}
      <div
        onClick={() => setAlertModalOpen(true)}
        className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all group"
      >
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Active Incidents</span>
          <span
            className={`p-1 rounded border ${
              activeIncidents.length > 0
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}
          >
            {activeIncidents.length > 0 ? (
              <AlertTriangle className="w-3.5 h-3.5" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className={`text-2xl font-mono font-bold tracking-tight ${
              activeIncidents.length > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {activeIncidents.length}
          </span>
          <span className="text-xs text-slate-400">
            {activeIncidents.length === 1 ? 'incident' : 'incidents'}
          </span>
        </div>
        <div className="mt-2 text-[11px] text-cyan-400/80 group-hover:text-cyan-300 flex items-center justify-between border-t border-slate-800/60 pt-2">
          <span>Configure alert rules</span>
          <span>→</span>
        </div>
      </div>
    </div>
  );
};
