export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type StatusClassFilter = 'all' | '2xx' | '4xx' | '5xx';

export type TimeWindowFilter = '15m' | '1h' | '6h' | '24h' | 'all';

export type ServiceHealth = 'healthy' | 'degraded' | 'critical';

export interface TraceSpan {
  id: string;
  name: string;
  service: string;
  startTimeMs: number;
  durationMs: number;
  status: 'ok' | 'error';
  metadata?: Record<string, string | number | boolean>;
}

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
  health: ServiceHealth;
}

export interface PercentileStats {
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  avg: number;
}

export interface StatusDistribution {
  total: number;
  count2xx: number;
  count4xx: number;
  count5xx: number;
  errorRate: number; // percentage
  successRate: number; // percentage
}

export interface TimeSeriesBucket {
  timestamp: string;
  label: string;
  requestCount: number;
  errorCount: number;
  p95Latency: number;
  p50Latency: number;
}

export interface AlertRule {
  id: string;
  name: string;
  targetEndpoint: string; // specific route or '*' for all
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

export interface TelemetryFilter {
  search: string;
  method: HttpMethod | 'all';
  statusClass: StatusClassFilter;
  endpoint: string; // '' or specific endpoint
  timeWindow: TimeWindowFilter;
}
