# TraceForge — Technical Architecture & System Design

> **Document Version**: 1.0.0  
> **Target System**: API Observability & Telemetry Console  
> **Status**: Approved for Implementation

---

## 1. Architectural Philosophy

TraceForge is engineered for high-throughput, low-latency client-side telemetry analysis. Unlike general analytics tools, API observability requires:
1. **Mathematical Precision**: Percentiles ($p50, p90, p95, p99$) must be calculated dynamically across filtered slices rather than pre-aggregated averages (which conceal latency spikes).
2. **Instant Correlation**: Seamless jumping from an aggregated endpoint health anomaly directly down to individual root-cause request traces and child waterfall spans.
3. **Deterministic Benchmarking**: Reproducible test fixtures alongside a controllable synthetic traffic generator that never masquerades as a fake live production system.
4. **Zero-Overhead Rendering**: Custom responsive SVG visualizations engineered directly with Tailwind CSS, avoiding heavy chart dependencies and achieving 60fps telemetry rendering.

---

## 2. High-Level Component Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TraceForge UI Shell                             │
│   (Top Bar, Simulation Controls, Quick Filter Strip, View Selector)    │
├────────────────────────────────────────────────────────────────────────┤
│                           View Panels                                  │
│  ┌───────────────────────┬──────────────────────┬───────────────────┐  │
│  │  Telemetry Overview   │  Endpoint Registry   │  Live Trace Log   │  │
│  │  - Stat Banners       │  - Service Health    │  - Filterable Grid│  │
│  │  - Latency Charts     │  - Error Rates       │  - Method Badges  │  │
│  │  - Status Doughnut    │  - P95 / P99 Columns │  - Latency Pills  │  │
│  └───────────────────────┴──────────────────────┴───────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │             Request & Waterfall Trace Inspector Drawer           │  │
│  │  - Headers & Payloads   - Span Timeline (Gateway/DB/Cache/API)   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────┤
│                       Zustand Telemetry Store                          │
│  - Circular Ring Buffer (1,000 items)    - Filter Predicates           │
│  - Alert Rules & Active Incidents        - Playback State (1x/2x/5x)   │
├────────────────────────────┬───────────────────────────────────────────┤
│    Statistical Engine      │        Telemetry Ingestion Engine         │
│  - p50/p90/p95/p99 Math    │  - Deterministic 500-Item Benchmark Seed  │
│  - Time-series Bucketing   │  - Synthetic Random Tick Generator        │
│  - Error Distribution %    │  - LocalStorage Persistence Adapter       │
└────────────────────────────┴───────────────────────────────────────────┘
```

---

## 3. Data Model & Type Definitions

```typescript
// Core HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Status Code Classifications
export type StatusClass = '2xx' | '4xx' | '5xx';

// Distributed Trace Span Breakdown
export interface TraceSpan {
  id: string;
  name: string;
  service: string;
  startTimeMs: number; // offset from request start
  durationMs: number;
  status: 'ok' | 'error';
  metadata?: Record<string, string | number>;
}

// Full Telemetry Log Entry
export interface TelemetryRecord {
  id: string;
  traceId: string;
  timestamp: string; // ISO 8601
  method: HttpMethod;
  endpoint: string;
  statusCode: number;
  durationMs: number;
  clientIp: string;
  region: 'us-east-1' | 'us-west-2' | 'eu-central-1' | 'ap-southeast-1';
  userAgent: string;
  requestHeaders: Record<string, string>;
  requestBody?: string | null;
  responseHeaders: Record<string, string>;
  responseBody?: string | null;
  spans: TraceSpan[];
  errorMessage?: string;
}

// Endpoint Registry Summary
export interface EndpointSummary {
  endpoint: string;
  methods: HttpMethod[];
  totalRequests: number;
  errorCount: number;
  errorRate: number; // percentage 0-100
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  health: 'healthy' | 'degraded' | 'critical';
}

// Alert Definition & Incident State
export interface AlertRule {
  id: string;
  name: string;
  targetEndpoint: string; // specific endpoint or '*' for all
  metric: 'p95_latency' | 'error_rate' | 'throughput';
  operator: '>' | '<';
  threshold: number;
  severity: 'warning' | 'critical';
  enabled: boolean;
}

export interface ActiveIncident {
  id: string;
  ruleId: string;
  ruleName: string;
  endpoint: string;
  severity: 'warning' | 'critical';
  currentValue: number;
  threshold: number;
  triggeredAt: string;
  resolvedAt?: string;
}
```

---

## 4. Latency Percentile Mathematical Formulation

Averages ($mean$) are fundamentally misleading in distributed systems because a small fraction of catastrophic queries (e.g. 1% running at 4,000ms) will be completely washed out in a sea of 10ms queries. TraceForge computes the nearest-rank order percentiles:

Given a set of $N$ recorded latencies sorted in ascending order $L = [d_1, d_2, \dots, d_N]$:

$$\text{Rank } R_p = \lceil \frac{p}{100} \times N \rceil$$

$$P_p = L[\max(0, R_p - 1)]$$

The statistical module (`src/lib/analytics.ts`) implements pure functions for:
- `computePercentiles(latencies: number[]): { p50, p90, p95, p99, min, max, avg }`
- `computeStatusDistribution(records: TelemetryRecord[]): { total2xx, total4xx, total5xx, errorRate }`
- `bucketTimeSeries(records: TelemetryRecord[], intervalMinutes: number): TimeSeriesBucket[]`

---

## 5. Synthetic Traffic Simulation Engine

TraceForge maintains two modes of operation:
1. **Deterministic Benchmark Mode**:
   - Seeded with 500 immutable requests covering a representative production curve: 88% 2xx, 8% 4xx (auth failures, missing resources), 4% 5xx (database timeouts, downstream API errors).
   - Allows deterministic unit testing and verifiable UI snapshots.
2. **Interactive Simulation Mode**:
   - Web Worker or `setInterval` ticking at selected frequencies (1x = 1 req/sec, 2x = 3 req/sec, 5x = 8 req/sec).
   - Generates realistic traffic across 7 standard microservice routes with synthetic latency jitter (Gaussian distributed base + occasional tail spike).
   - Appends to the in-memory circular buffer (capped at 1,000 items) and immediately evaluates active alert rules.

---

## 6. Accessibility & Visual Design

- **Dark Theme Palette**: Engineered for long working sessions in SRE command centers.
  - Main background: `#080B11`
  - Container surfaces: `#0F172A` / `#111827`
  - Borders: `#1E293B`
  - High contrast text: `#F8FAFC` (Headers), `#94A3B8` (Muted labels)
- **Status Contrast Ratio**:
  - `2xx Success`: `#10B981` (Emerald) — Contrast ratio > 5.5:1 against slate
  - `4xx Client Error`: `#F59E0B` (Amber) — Contrast ratio > 6.0:1
  - `5xx Server Error`: `#F43F5E` (Rose) — Contrast ratio > 5.2:1
  - `Accent / Focus`: `#06B6D4` (Cyan) — Contrast ratio > 7.1:1
- **Screen Reader Support**:
  - Semantic `<table role="table">` and accessible ARIA labels on all SVG charts.
  - Visual status badges paired with text indicators (`200 OK`, `500 Internal Error`).
