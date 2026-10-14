import React, { useState } from 'react';
import { useObservabilityStore } from '../../store/observabilityStore';
import { computeEndpointSummaries } from '../../lib/analytics';
import { MethodBadge } from '../common/MethodBadge';
import { HealthBadge } from '../common/HealthBadge';
import { Search, ArrowRight, Server } from 'lucide-react';

export const EndpointRegistry: React.FC = () => {
  const { records, setFilter, setActiveTab } = useObservabilityStore();
  const [search, setSearch] = useState('');
  const [healthFilter, setHealthFilter] = useState<'all' | 'healthy' | 'degraded' | 'critical'>('all');

  const summaries = computeEndpointSummaries(records);
  const totalVolume = records.length || 1;

  const filtered = summaries.filter((item) => {
    const matchesSearch = item.endpoint.toLowerCase().includes(search.toLowerCase());
    const matchesHealth = healthFilter === 'all' || item.health === healthFilter;
    return matchesSearch && matchesHealth;
  });

  const handleInspectEndpoint = (endpoint: string) => {
    setFilter({ endpoint, statusClass: 'all', search: '' });
    setActiveTab('traces');
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search endpoint paths..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Health:</span>
          {(['all', 'healthy', 'degraded', 'critical'] as const).map((h) => (
            <button
              key={h}
              onClick={() => setHealthFilter(h)}
              className={`px-2.5 py-1 rounded-lg border text-xs capitalize transition-colors ${
                healthFilter === h
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 font-medium'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* Endpoints Table */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-medium">
                <th className="py-3 px-4">Endpoint Path</th>
                <th className="py-3 px-4">Methods</th>
                <th className="py-3 px-4">Health Status</th>
                <th className="py-3 px-4">Traffic Share</th>
                <th className="py-3 px-4">Error Rate</th>
                <th className="py-3 px-4 font-mono">P50</th>
                <th className="py-3 px-4 font-mono">P95</th>
                <th className="py-3 px-4 font-mono">P99</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No matching API endpoints found
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const sharePct = ((item.totalRequests / totalVolume) * 100).toFixed(1);

                  return (
                    <tr
                      key={item.endpoint}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-slate-200 flex items-center gap-2">
                        <Server className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                        <span>{item.endpoint}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {item.methods.map((m) => (
                            <MethodBadge key={m} method={m} />
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <HealthBadge health={item.health} />
                      </td>
                      <td className="py-3 px-4 min-w-[140px]">
                        <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                          <span className="text-slate-300">{item.totalRequests} reqs</span>
                          <span className="text-slate-500">{sharePct}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-cyan-500 h-full rounded-full transition-all"
                            style={{ width: `${sharePct}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span
                          className={
                            item.errorRate >= 5.0
                              ? 'text-rose-400 font-bold'
                              : item.errorRate >= 2.0
                              ? 'text-amber-400 font-semibold'
                              : 'text-emerald-400'
                          }
                        >
                          {item.errorRate}%
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1">
                          ({item.errorCount})
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">{item.p50}ms</td>
                      <td className="py-3 px-4 font-mono font-semibold text-cyan-300">
                        {item.p95}ms
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">{item.p99}ms</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleInspectEndpoint(item.endpoint)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/30 transition-colors text-xs"
                          title={`View request stream for ${item.endpoint}`}
                        >
                          <span>Traces</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
