import React from 'react';
import { useObservabilityStore } from '../../store/observabilityStore';
import { MethodBadge } from '../common/MethodBadge';
import { StatusBadge } from '../common/StatusBadge';
import { Search, X, Filter, Clock, ChevronRight } from 'lucide-react';
import type { HttpMethod, StatusClassFilter, TimeWindowFilter } from '../../types/telemetry';

export const TraceStreamTable: React.FC = () => {
  const { records, filters, setFilter, resetFilters, selectRecord, selectedRecord } =
    useObservabilityStore();

  // Apply filters
  const filtered = records
    .filter((r) => {
      // Search filter (path, traceId, IP)
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matches =
          r.endpoint.toLowerCase().includes(q) ||
          r.traceId.toLowerCase().includes(q) ||
          r.clientIp.includes(q);
        if (!matches) return false;
      }

      // Method filter
      if (filters.method !== 'all' && r.method !== filters.method) {
        return false;
      }

      // Status Class filter
      if (filters.statusClass !== 'all') {
        if (filters.statusClass === '2xx' && (r.statusCode < 200 || r.statusCode >= 300))
          return false;
        if (filters.statusClass === '4xx' && (r.statusCode < 400 || r.statusCode >= 500))
          return false;
        if (filters.statusClass === '5xx' && (r.statusCode < 500 || r.statusCode >= 600))
          return false;
      }

      // Specific Endpoint filter
      if (filters.endpoint && r.endpoint !== filters.endpoint) {
        return false;
      }

      // Time window filter
      if (filters.timeWindow !== 'all') {
        const recordTime = new Date(r.timestamp).getTime();
        const now = Date.now();
        const minutes =
          filters.timeWindow === '15m'
            ? 15
            : filters.timeWindow === '1h'
            ? 60
            : filters.timeWindow === '6h'
            ? 360
            : 1440;
        if (now - recordTime > minutes * 60 * 1000) {
          // If record is older than window (note: relative to the latest record)
          const latestTime = new Date(records[records.length - 1]?.timestamp || now).getTime();
          if (latestTime - recordTime > minutes * 60 * 1000) return false;
        }
      }

      return true;
    })
    // Sort descending (most recent first)
    .reverse();

  // Relative time formatter
  const formatTimeAgo = (iso: string) => {
    const ms = Date.now() - new Date(iso).getTime();
    const sec = Math.floor(ms / 1000);
    if (sec < 60) return `${Math.max(1, sec)}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hrs = Math.floor(min / 60);
    return `${hrs}h ago`;
  };

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search traces by endpoint, traceId (trc_...), or client IP..."
              value={filters.search}
              onChange={(e) => setFilter({ search: e.target.value })}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
            {filters.search && (
              <button
                onClick={() => setFilter({ search: '' })}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Method Filter */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs">
            {(['all', 'GET', 'POST', 'PUT', 'DELETE'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setFilter({ method: m as HttpMethod | 'all' })}
                className={`px-2 py-1 rounded font-mono text-[11px] transition-colors ${
                  filters.method === m
                    ? 'bg-slate-800 text-cyan-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Status Class Filter */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs">
            {(['all', '2xx', '4xx', '5xx'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter({ statusClass: s as StatusClassFilter })}
                className={`px-2 py-1 rounded font-mono text-[11px] transition-colors ${
                  filters.statusClass === s
                    ? 'bg-slate-800 text-cyan-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Time Window */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs">
            <Clock className="w-3 h-3 text-slate-500 ml-1.5 mr-0.5" />
            {(['15m', '1h', '6h', 'all'] as const).map((w) => (
              <button
                key={w}
                onClick={() => setFilter({ timeWindow: w as TimeWindowFilter })}
                className={`px-2 py-1 rounded font-mono text-[11px] transition-colors ${
                  filters.timeWindow === w
                    ? 'bg-slate-800 text-cyan-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Active Filter Pills Bar */}
        {(filters.endpoint ||
          filters.method !== 'all' ||
          filters.statusClass !== 'all' ||
          filters.search) && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
            <Filter className="w-3 h-3 text-slate-500" />
            <span className="text-slate-400">Active filters:</span>

            {filters.endpoint && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800 text-cyan-300 font-mono text-[11px]">
                endpoint: {filters.endpoint}
                <button
                  onClick={() => setFilter({ endpoint: '' })}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.method !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px]">
                method: {filters.method}
                <button
                  onClick={() => setFilter({ method: 'all' })}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.statusClass !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px]">
                status: {filters.statusClass}
                <button
                  onClick={() => setFilter({ statusClass: 'all' })}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={resetFilters}
              className="ml-auto text-xs text-slate-500 hover:text-slate-300 underline"
            >
              Reset all
            </button>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing <strong className="text-white font-mono">{filtered.length}</strong> of{' '}
          <span className="font-mono">{records.length}</span> recorded traces
        </span>
        <span className="text-[11px] text-slate-500">
          Click any trace row to inspect distributed waterfall spans
        </span>
      </div>

      {/* Trace Table */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-medium">
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Endpoint Path</th>
                <th className="py-2.5 px-3">Latency Duration</th>
                <th className="py-2.5 px-3 font-mono">Trace ID</th>
                <th className="py-2.5 px-3">Region</th>
                <th className="py-2.5 px-3 text-right">Time</th>
                <th className="py-2.5 px-2 text-center w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    No traces matched your filter criteria
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 100).map((record) => {
                  const isSelected = selectedRecord?.id === record.id;
                  const latencyRatio = Math.min(100, (record.durationMs / 600) * 100);

                  return (
                    <tr
                      key={record.id}
                      onClick={() => selectRecord(record)}
                      className={`cursor-pointer transition-colors group ${
                        isSelected
                          ? 'bg-cyan-950/30 border-l-2 border-l-cyan-400'
                          : 'hover:bg-slate-800/30'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <MethodBadge method={record.method} />
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge code={record.statusCode} />
                      </td>
                      <td className="py-2.5 px-3 text-slate-200 group-hover:text-cyan-300 transition-colors">
                        <span className="font-semibold">{record.endpoint}</span>
                        {record.errorMessage && (
                          <span className="block text-[10px] text-rose-400 truncate max-w-xs font-sans">
                            {record.errorMessage}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 min-w-[130px]">
                        <div className="flex items-center justify-between text-[11px] mb-0.5">
                          <span
                            className={
                              record.durationMs > 400
                                ? 'text-rose-400 font-bold'
                                : record.durationMs > 200
                                ? 'text-amber-400 font-semibold'
                                : 'text-slate-300'
                            }
                          >
                            {record.durationMs}ms
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              record.durationMs > 400
                                ? 'bg-rose-500'
                                : record.durationMs > 200
                                ? 'bg-amber-400'
                                : 'bg-cyan-500'
                            }`}
                            style={{ width: `${Math.max(5, latencyRatio)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                        {record.traceId}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {record.region}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400 text-[11px]">
                        {formatTimeAgo(record.timestamp)}
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-600 group-hover:text-cyan-400 transition-colors">
                        <ChevronRight className="w-4 h-4 inline" />
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
