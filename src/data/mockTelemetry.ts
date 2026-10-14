import type { TelemetryRecord, TraceSpan, HttpMethod, AlertRule } from '../types/telemetry';

interface RouteDefinition {
  method: HttpMethod;
  endpoint: string;
  service: string;
  baseLatencyMs: number;
  jitterMs: number;
  errorProbability: number;
  requestBodySample?: string;
  responseBodySample?: string;
}

const ROUTE_DEFINITIONS: RouteDefinition[] = [
  {
    method: 'POST',
    endpoint: '/api/v1/payments/charge',
    service: 'billing-service',
    baseLatencyMs: 240,
    jitterMs: 160,
    errorProbability: 0.08,
    requestBodySample: JSON.stringify({ amount: 4900, currency: 'usd', customerId: 'cus_88fa02', paymentMethod: 'pm_card_visa' }, null, 2),
    responseBodySample: JSON.stringify({ chargeId: 'ch_92a71f', status: 'succeeded', amountRefunded: 0 }, null, 2),
  },
  {
    method: 'GET',
    endpoint: '/api/v1/users/me',
    service: 'identity-service',
    baseLatencyMs: 38,
    jitterMs: 25,
    errorProbability: 0.02,
    responseBodySample: JSON.stringify({ id: 'usr_49102', email: 'alex.sre@company.internal', role: 'admin', team: 'platform' }, null, 2),
  },
  {
    method: 'POST',
    endpoint: '/api/v1/auth/login',
    service: 'identity-service',
    baseLatencyMs: 85,
    jitterMs: 40,
    errorProbability: 0.07,
    requestBodySample: JSON.stringify({ email: 'eng.lead@corp.io', clientVersion: '2.4.0' }, null, 2),
    responseBodySample: JSON.stringify({ tokenType: 'Bearer', expiresIn: 3600, scope: 'read:all write:all' }, null, 2),
  },
  {
    method: 'GET',
    endpoint: '/api/v1/search',
    service: 'search-service',
    baseLatencyMs: 110,
    jitterMs: 90,
    errorProbability: 0.04,
    responseBodySample: JSON.stringify({ query: 'latency anomalies', hits: 38, tookMs: 14, page: 1 }, null, 2),
  },
  {
    method: 'GET',
    endpoint: '/api/v1/workspaces/ws_dev_core',
    service: 'workspace-service',
    baseLatencyMs: 62,
    jitterMs: 35,
    errorProbability: 0.03,
    responseBodySample: JSON.stringify({ id: 'ws_dev_core', name: 'Engineering Operations', membersCount: 24, plan: 'enterprise' }, null, 2),
  },
  {
    method: 'POST',
    endpoint: '/api/v1/analytics/events',
    service: 'ingestion-service',
    baseLatencyMs: 22,
    jitterMs: 18,
    errorProbability: 0.01,
    requestBodySample: JSON.stringify({ event: 'ui_dashboard_view', device: 'desktop_chrome', durationMs: 120 }, null, 2),
    responseBodySample: JSON.stringify({ ingested: true, queueOffset: 489102 }, null, 2),
  },
  {
    method: 'DELETE',
    endpoint: '/api/v1/tokens/tok_sess_99',
    service: 'identity-service',
    baseLatencyMs: 45,
    jitterMs: 30,
    errorProbability: 0.05,
    responseBodySample: JSON.stringify({ revoked: true, timestamp: '2026-10-14T12:00:00Z' }, null, 2),
  },
];

const REGIONS: Array<'us-east-1' | 'us-west-2' | 'eu-central-1' | 'ap-southeast-1'> = [
  'us-east-1',
  'us-west-2',
  'eu-central-1',
  'ap-southeast-1',
];

const CLIENT_IPS = [
  '198.51.100.42',
  '203.0.113.19',
  '192.0.2.88',
  '172.56.21.104',
  '185.199.108.153',
  '104.244.42.1',
];

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'TraceForge-Agent/1.4.0 (Linux x86_64; Node/22.0.0)',
  'PostmanRuntime/7.42.0',
  'Go-http-client/2.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
];

// Linear Congruential Generator for reproducible deterministic seed data
let seed = 42;
function deterministicRandom(): number {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}

function generateSpans(
  route: RouteDefinition,
  totalDurationMs: number,
  isError: boolean,
  traceId: string
): TraceSpan[] {
  const spans: TraceSpan[] = [];

  // Span 1: Gateway Routing & Rate Limiting
  const gwDuration = Math.max(4, Math.round(totalDurationMs * 0.08));
  spans.push({
    id: `span-${traceId}-gw`,
    name: 'api-gateway.ingress',
    service: 'api-gateway',
    startTimeMs: 0,
    durationMs: gwDuration,
    status: 'ok',
    metadata: { rateLimitRemaining: 980, edgePop: 'EWR-50' },
  });

  // Span 2: Auth Verification
  const authDuration = Math.max(6, Math.round(totalDurationMs * 0.14));
  spans.push({
    id: `span-${traceId}-auth`,
    name: 'auth.verifyJwt',
    service: 'identity-service',
    startTimeMs: gwDuration,
    durationMs: authDuration,
    status: isError && totalDurationMs % 2 === 0 ? 'error' : 'ok',
    metadata: { algorithm: 'RS256', cachedToken: true },
  });

  // Span 3: Primary Service Handler
  const handlerStart = gwDuration + authDuration;
  const dbDuration = Math.max(12, Math.round(totalDurationMs * 0.45));
  spans.push({
    id: `span-${traceId}-db`,
    name: route.endpoint.includes('payment') ? 'postgres.execPaymentTransaction' : 'postgres.querySelect',
    service: 'postgres-db',
    startTimeMs: handlerStart,
    durationMs: dbDuration,
    status: isError && totalDurationMs % 3 === 0 ? 'error' : 'ok',
    metadata: { poolConnectionsActive: 18, table: route.service },
  });

  // Span 4: External dependency or Cache
  const extStart = handlerStart + Math.round(dbDuration * 0.7);
  const extDuration = Math.max(8, totalDurationMs - extStart - 6);
  if (route.endpoint.includes('payments')) {
    spans.push({
      id: `span-${traceId}-ext`,
      name: 'stripe.charges.create',
      service: 'stripe-api',
      startTimeMs: extStart,
      durationMs: extDuration,
      status: isError ? 'error' : 'ok',
      metadata: { idempotencyKey: `idem_${traceId.slice(0, 8)}` },
    });
  } else {
    spans.push({
      id: `span-${traceId}-cache`,
      name: 'redis.cacheSet',
      service: 'redis-cache',
      startTimeMs: extStart,
      durationMs: extDuration,
      status: 'ok',
      metadata: { ttlSeconds: 300, keyHit: true },
    });
  }

  // Span 5: JSON Serialization
  spans.push({
    id: `span-${traceId}-ser`,
    name: 'http.serializeResponse',
    service: route.service,
    startTimeMs: totalDurationMs - 5,
    durationMs: 5,
    status: 'ok',
  });

  return spans;
}

export function generateSyntheticRecord(
  baseDate?: Date,
  useDeterministicRng: boolean = false
): TelemetryRecord {
  const rand = useDeterministicRng ? deterministicRandom : Math.random;

  const routeIndex = Math.floor(rand() * ROUTE_DEFINITIONS.length);
  const route = ROUTE_DEFINITIONS[routeIndex];

  const now = baseDate || new Date();
  const hexPart = Math.floor(rand() * 0xffffffff).toString(16).padStart(8, '0');
  const traceId = `trc_${hexPart}`;

  const isError = rand() < route.errorProbability;
  let statusCode = route.method === 'POST' ? 201 : 200;
  let errorMessage: string | undefined = undefined;

  if (isError) {
    const errorType = rand();
    if (errorType < 0.4) {
      statusCode = 401;
      errorMessage = 'Unauthorized: invalid bearer token credentials';
    } else if (errorType < 0.65) {
      statusCode = 404;
      errorMessage = 'Resource not found in target namespace';
    } else if (errorType < 0.85) {
      statusCode = 429;
      errorMessage = 'Too many requests: rate limit exceeded for client tier';
    } else {
      statusCode = rand() > 0.5 ? 500 : 504;
      errorMessage =
        statusCode === 500
          ? 'Internal server error: connection to primary database replica timed out'
          : 'Gateway timeout: upstream service failed to respond within 5000ms';
    }
  }

  // Calculate realistic latency with occasional long-tail spike
  const isTailSpike = rand() < 0.05;
  const baseJitter = Math.floor(rand() * route.jitterMs);
  const tailSpikeMs = isTailSpike ? Math.floor(300 + rand() * 450) : 0;
  const durationMs = route.baseLatencyMs + baseJitter + tailSpikeMs;

  const clientIp = CLIENT_IPS[Math.floor(rand() * CLIENT_IPS.length)];
  const region = REGIONS[Math.floor(rand() * REGIONS.length)];
  const userAgent = USER_AGENTS[Math.floor(rand() * USER_AGENTS.length)];

  const requestHeaders = {
    'host': 'api.traceforge.internal',
    'x-request-id': `req_${traceId}`,
    'x-forwarded-for': clientIp,
    'authorization': 'Bearer ********************',
    'content-type': 'application/json',
    'user-agent': userAgent,
    'x-region': region,
  };

  const responseHeaders = {
    'content-type': 'application/json; charset=utf-8',
    'x-trace-id': traceId,
    'x-response-time': `${durationMs}ms`,
    'cache-control': route.method === 'GET' ? 'public, max-age=60' : 'no-store',
  };

  const spans = generateSpans(route, durationMs, isError, traceId);

  return {
    id: `rec_${traceId}`,
    traceId,
    timestamp: now.toISOString(),
    method: route.method,
    endpoint: route.endpoint,
    statusCode,
    durationMs,
    clientIp,
    region,
    userAgent,
    requestHeaders,
    requestBody: route.requestBodySample || null,
    responseHeaders,
    responseBody: isError ? JSON.stringify({ error: errorMessage, code: statusCode }, null, 2) : route.responseBodySample || null,
    spans,
    errorMessage,
  };
}

/**
 * Generates a deterministic benchmark dataset containing exactly 500 requests
 * distributed across the last 60 minutes.
 */
export function generateBenchmarkSeed(): TelemetryRecord[] {
  seed = 1337; // Fixed RNG seed
  const totalRecords = 500;
  const records: TelemetryRecord[] = [];
  const baseTimestamp = new Date('2026-10-14T14:00:00Z').getTime();

  // 60 minutes window = 3600 seconds
  const stepMs = Math.floor((60 * 60 * 1000) / totalRecords);

  for (let i = 0; i < totalRecords; i++) {
    const recordTime = new Date(baseTimestamp - (totalRecords - i) * stepMs);
    records.push(generateSyntheticRecord(recordTime, true));
  }

  return records;
}

export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: 'rule_p95_global',
    name: 'Global P95 Latency Breach (> 350ms)',
    targetEndpoint: '*',
    metric: 'p95_latency',
    operator: '>',
    threshold: 350,
    severity: 'warning',
    enabled: true,
  },
  {
    id: 'rule_error_rate_payments',
    name: 'Payment Service High Error Rate (> 6%)',
    targetEndpoint: '/api/v1/payments/charge',
    metric: 'error_rate',
    operator: '>',
    threshold: 6.0,
    severity: 'critical',
    enabled: true,
  },
  {
    id: 'rule_p95_search',
    name: 'Search Index Latency Degradation (> 220ms)',
    targetEndpoint: '/api/v1/search',
    metric: 'p95_latency',
    operator: '>',
    threshold: 220,
    severity: 'warning',
    enabled: true,
  },
];
