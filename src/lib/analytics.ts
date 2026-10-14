import type {
  TelemetryRecord,
  PercentileStats,
  StatusDistribution,
  EndpointSummary,
  TimeSeriesBucket,
  AlertRule,
  ActiveIncident,
  ServiceHealth,
  HttpMethod,
} from '../types/telemetry';

/**
 * Calculates nearest-rank percentiles on an array of latency numbers.
 */
export function computePercentiles(latencies: number[]): PercentileStats {
  if (!latencies || latencies.length === 0) {
    return { p50: 0, p90: 0, p95: 0, p99: 0, min: 0, max: 0, avg: 0 };
  }

  const sorted = [...latencies].sort((a, b) => a - b);
  const n = sorted.length;

  const getPercentile = (p: number): number => {
    const rank = Math.ceil((p / 100) * n);
    const index = Math.min(n - 1, Math.max(0, rank - 1));
    return sorted[index];
  };

  const sum = sorted.reduce((acc, val) => acc + val, 0);

  return {
    p50: getPercentile(50),
    p90: getPercentile(90),
    p95: getPercentile(95),
    p99: getPercentile(99),
    min: sorted[0],
    max: sorted[n - 1],
    avg: Math.round(sum / n),
  };
}

/**
 * Computes status code counts and error percentages.
 */
export function computeStatusDistribution(records: TelemetryRecord[]): StatusDistribution {
  if (!records || records.length === 0) {
    return {
      total: 0,
      count2xx: 0,
      count4xx: 0,
      count5xx: 0,
      errorRate: 0,
      successRate: 0,
    };
  }

  let count2xx = 0;
  let count4xx = 0;
  let count5xx = 0;

  for (const record of records) {
    const code = record.statusCode;
    if (code >= 200 && code < 300) {
      count2xx++;
    } else if (code >= 400 && code < 500) {
      count4xx++;
    } else if (code >= 500 && code < 600) {
      count5xx++;
    }
  }

  const total = records.length;
  const totalErrors = count4xx + count5xx;
  const errorRate = total > 0 ? Number(((totalErrors / total) * 100).toFixed(1)) : 0;
  const successRate = total > 0 ? Number(((count2xx / total) * 100).toFixed(1)) : 0;

  return {
    total,
    count2xx,
    count4xx,
    count5xx,
    errorRate,
    successRate,
  };
}

/**
 * Groups telemetry records by endpoint and computes per-service metrics.
 */
export function computeEndpointSummaries(records: TelemetryRecord[]): EndpointSummary[] {
  if (!records || records.length === 0) return [];

  const groups = new Map<string, TelemetryRecord[]>();

  for (const record of records) {
    const list = groups.get(record.endpoint) || [];
    list.push(record);
    groups.set(record.endpoint, list);
  }

  const summaries: EndpointSummary[] = [];

  for (const [endpoint, endpointRecords] of groups.entries()) {
    const methods = Array.from(new Set(endpointRecords.map((r) => r.method))) as HttpMethod[];
    const latencies = endpointRecords.map((r) => r.durationMs);
    const percentiles = computePercentiles(latencies);

    const errorCount = endpointRecords.filter((r) => r.statusCode >= 400).length;
    const errorRate = Number(((errorCount / endpointRecords.length) * 100).toFixed(1));

    let health: ServiceHealth = 'healthy';
    if (errorRate >= 6.0 || percentiles.p95 > 500) {
      health = 'critical';
    } else if (errorRate >= 2.5 || percentiles.p95 > 250) {
      health = 'degraded';
    }

    summaries.push({
      endpoint,
      methods,
      totalRequests: endpointRecords.length,
      errorCount,
      errorRate,
      p50: percentiles.p50,
      p90: percentiles.p90,
      p95: percentiles.p95,
      p99: percentiles.p99,
      health,
    });
  }

  // Sort by request volume descending
  return summaries.sort((a, b) => b.totalRequests - a.totalRequests);
}

/**
 * Divides chronological records into time buckets for area and bar charts.
 */
export function bucketTimeSeries(
  records: TelemetryRecord[],
  bucketCount: number = 24
): TimeSeriesBucket[] {
  if (!records || records.length === 0) return [];

  // Sort chronological ascending
  const sorted = [...records].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const startMs = new Date(sorted[0].timestamp).getTime();
  const endMs = new Date(sorted[sorted.length - 1].timestamp).getTime();
  const rangeMs = Math.max(1000, endMs - startMs);
  const stepMs = Math.ceil(rangeMs / bucketCount);

  const buckets: TimeSeriesBucket[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const bucketStart = startMs + i * stepMs;
    const bucketEnd = bucketStart + stepMs;

    const inBucket = sorted.filter((r) => {
      const t = new Date(r.timestamp).getTime();
      return t >= bucketStart && (i === bucketCount - 1 ? t <= bucketEnd : t < bucketEnd);
    });

    const date = new Date(bucketStart);
    const label = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

    const latencies = inBucket.map((r) => r.durationMs);
    const percentiles = computePercentiles(latencies);
    const errorCount = inBucket.filter((r) => r.statusCode >= 400).length;

    buckets.push({
      timestamp: date.toISOString(),
      label,
      requestCount: inBucket.length,
      errorCount,
      p95Latency: percentiles.p95,
      p50Latency: percentiles.p50,
    });
  }

  return buckets;
}

/**
 * Evaluates active alert rules against a telemetry dataset.
 */
export function evaluateAlertRules(
  records: TelemetryRecord[],
  rules: AlertRule[]
): ActiveIncident[] {
  if (!records || records.length === 0 || !rules || rules.length === 0) {
    return [];
  }

  const incidents: ActiveIncident[] = [];

  for (const rule of rules) {
    if (!rule.enabled) continue;

    // Filter by target endpoint
    const relevantRecords =
      rule.targetEndpoint === '*'
        ? records
        : records.filter((r) => r.endpoint === rule.targetEndpoint);

    if (relevantRecords.length === 0) continue;

    let currentValue = 0;
    if (rule.metric === 'p95_latency') {
      const stats = computePercentiles(relevantRecords.map((r) => r.durationMs));
      currentValue = stats.p95;
    } else if (rule.metric === 'error_rate') {
      const dist = computeStatusDistribution(relevantRecords);
      currentValue = dist.errorRate;
    } else if (rule.metric === 'throughput') {
      currentValue = relevantRecords.length;
    }

    const isTriggered =
      rule.operator === '>' ? currentValue > rule.threshold : currentValue < rule.threshold;

    if (isTriggered) {
      incidents.push({
        id: `inc-${rule.id}-${Date.now()}`,
        ruleId: rule.id,
        ruleName: rule.name,
        endpoint: rule.targetEndpoint,
        severity: rule.severity,
        currentValue,
        threshold: rule.threshold,
        triggeredAt: new Date().toISOString(),
      });
    }
  }

  return incidents;
}
