import React, { useState } from 'react';
import { useObservabilityStore } from '../../store/observabilityStore';
import { bucketTimeSeries } from '../../lib/analytics';
import type { TimeSeriesBucket } from '../../types/telemetry';

export const LatencyChart: React.FC = () => {
  const { records } = useObservabilityStore();
  const [hoveredBucket, setHoveredBucket] = useState<{
    bucket: TimeSeriesBucket;
    x: number;
    y: number;
  } | null>(null);

  const buckets = bucketTimeSeries(records, 24);

  if (buckets.length === 0) {
    return (
      <div className="h-64 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-center text-slate-500 text-xs">
        No telemetry data available
      </div>
    );
  }

  const maxLatency = Math.max(400, ...buckets.map((b) => b.p95Latency));
  const maxVolume = Math.max(10, ...buckets.map((b) => b.requestCount));

  // Chart Dimensions
  const width = 800;
  const height = 240;
  const padding = { top: 20, right: 30, bottom: 30, left: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Coordinate mapping
  const getX = (index: number) => padding.left + (index / (buckets.length - 1)) * chartWidth;
  const getY = (val: number, max: number) =>
    padding.top + chartHeight - (val / (max || 1)) * chartHeight;

  // Build SVG path for P95 latency curve
  const points = buckets.map((b, i) => `${getX(i)},${getY(b.p95Latency, maxLatency)}`);
  const pathD = points.length > 0 ? `M ${points.join(' L ')}` : '';

  // Closed area under the curve
  const areaD =
    points.length > 0
      ? `${pathD} L ${getX(buckets.length - 1)},${padding.top + chartHeight} L ${getX(0)},${
          padding.top + chartHeight
        } Z`
      : '';

  return (
    <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
            P95 Latency & Throughput Trend
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
              24 BUCKETS
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time computed latency percentiles correlated with request throughput
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-700/80" />
            <span className="text-slate-400">Throughput (Req)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyan-400" />
            <span className="text-cyan-400 font-mono">P95 Latency (ms)</span>
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-64 select-none"
          role="img"
          aria-label="Latency and throughput time-series chart"
        >
          <defs>
            <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + chartHeight * (1 - ratio);
            const latencyVal = Math.round(maxLatency * ratio);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#1E293B"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] fill-slate-500 font-mono"
                >
                  {latencyVal}ms
                </text>
              </g>
            );
          })}

          {/* Throughput Bar Columns */}
          {buckets.map((b, i) => {
            const barWidth = Math.max(4, (chartWidth / buckets.length) * 0.45);
            const barX = getX(i) - barWidth / 2;
            const barY = getY(b.requestCount, maxVolume);
            const barHeight = padding.top + chartHeight - barY;
            const hasErrors = b.errorCount > 0;

            return (
              <rect
                key={i}
                x={barX}
                y={barY}
                width={barWidth}
                height={barHeight}
                className={
                  hasErrors
                    ? 'fill-rose-500/30 hover:fill-rose-500/60 transition-colors'
                    : 'fill-slate-700/40 hover:fill-slate-600/60 transition-colors'
                }
                rx="1"
              />
            );
          })}

          {/* Area & Latency Line */}
          <path d={areaD} fill="url(#latencyGradient)" />
          <path d={pathD} fill="none" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" />

          {/* Hover hit targets */}
          {buckets.map((b, i) => {
            const cx = getX(i);
            const cy = getY(b.p95Latency, maxLatency);
            const isHovered = hoveredBucket?.bucket === b;

            return (
              <g key={i}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 4.5 : 2.5}
                  className={`${
                    isHovered
                      ? 'fill-cyan-300 stroke-cyan-900 stroke-2'
                      : 'fill-cyan-400'
                  } transition-all cursor-pointer`}
                  onMouseEnter={() => setHoveredBucket({ bucket: b, x: cx, y: cy })}
                  onMouseLeave={() => setHoveredBucket(null)}
                />
                {/* Hit box */}
                <rect
                  x={cx - chartWidth / buckets.length / 2}
                  y={padding.top}
                  width={chartWidth / buckets.length}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredBucket({ bucket: b, x: cx, y: cy })}
                  onMouseLeave={() => setHoveredBucket(null)}
                />
              </g>
            );
          })}

          {/* X Axis Time Labels */}
          {buckets.map((b, i) => {
            if (i % 4 !== 0 && i !== buckets.length - 1) return null;
            return (
              <text
                key={i}
                x={getX(i)}
                y={height - 10}
                textAnchor="middle"
                className="text-[10px] fill-slate-500 font-mono"
              >
                {b.label}
              </text>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredBucket && (
          <div
            className="absolute pointer-events-none bg-slate-900/95 border border-cyan-500/40 rounded-lg p-2.5 shadow-xl text-xs z-20 backdrop-blur"
            style={{
              left: `${Math.min(75, Math.max(15, (hoveredBucket.x / width) * 100))}%`,
              top: '15px',
            }}
          >
            <div className="text-[11px] font-mono text-slate-400 mb-1 border-b border-slate-800 pb-1 flex justify-between gap-4">
              <span>Time: {hoveredBucket.bucket.label}</span>
              <span className="text-cyan-400 font-semibold">
                P95: {hoveredBucket.bucket.p95Latency}ms
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-mono">
              <span className="text-slate-400">Volume:</span>
              <span className="text-right text-slate-200">
                {hoveredBucket.bucket.requestCount} reqs
              </span>
              <span className="text-slate-400">Errors:</span>
              <span
                className={`text-right ${
                  hoveredBucket.bucket.errorCount > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'
                }`}
              >
                {hoveredBucket.bucket.errorCount}
              </span>
              <span className="text-slate-400">P50 Latency:</span>
              <span className="text-right text-slate-200">
                {hoveredBucket.bucket.p50Latency}ms
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
