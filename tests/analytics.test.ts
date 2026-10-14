import { describe, it, expect } from 'vitest';
import {
  computePercentiles,
  computeStatusDistribution,
  computeEndpointSummaries,
  bucketTimeSeries,
  evaluateAlertRules,
} from '../src/lib/analytics';
import type { TelemetryRecord, AlertRule } from '../src/types/telemetry';

describe('Analytics & Math Engine', () => {
  describe('computePercentiles', () => {
    it('returns zeroes for empty latencies array', () => {
      const stats = computePercentiles([]);
      expect(stats.p50).toBe(0);
      expect(stats.p90).toBe(0);
      expect(stats.p95).toBe(0);
      expect(stats.p99).toBe(0);
      expect(stats.min).toBe(0);
      expect(stats.max).toBe(0);
      expect(stats.avg).toBe(0);
    });

    it('returns exact values for a single item array', () => {
      const stats = computePercentiles([150]);
      expect(stats.p50).toBe(150);
      expect(stats.p90).toBe(150);
      expect(stats.p95).toBe(150);
      expect(stats.p99).toBe(150);
      expect(stats.min).toBe(150);
      expect(stats.max).toBe(150);
      expect(stats.avg).toBe(150);
    });

    it('computes exact nearest-rank percentiles on known 10-element distribution', () => {
      // 10 elements: 10, 20, 30, 40, 50, 60, 70, 80, 90, 100
      const latencies = [100, 20, 80, 40, 10, 90, 30, 70, 50, 60];
      const stats = computePercentiles(latencies);

      // p50: rank = ceil(0.50 * 10) = 5 -> sorted[4] = 50
      expect(stats.p50).toBe(50);
      // p90: rank = ceil(0.90 * 10) = 9 -> sorted[8] = 90
      expect(stats.p90).toBe(90);
      // p95: rank = ceil(0.95 * 10) = 10 -> sorted[9] = 100
      expect(stats.p95).toBe(100);
      // p99: rank = ceil(0.99 * 10) = 10 -> sorted[9] = 100
      expect(stats.p99).toBe(100);
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(100);
      expect(stats.avg).toBe(55);
    });
  });

  describe('computeStatusDistribution', () => {
    it('returns zeroes for empty records', () => {
      const dist = computeStatusDistribution([]);
      expect(dist.total).toBe(0);
      expect(dist.errorRate).toBe(0);
      expect(dist.successRate).toBe(0);
    });

    it('correctly aggregates 2xx, 4xx, 5xx and calculates percentages', () => {
      const mockRecords: Partial<TelemetryRecord>[] = [
        { statusCode: 200 },
        { statusCode: 201 },
        { statusCode: 204 },
        { statusCode: 400 },
        { statusCode: 404 },
        { statusCode: 500 },
        { statusCode: 200 },
        { statusCode: 200 },
        { statusCode: 429 },
        { statusCode: 504 },
      ];

      const dist = computeStatusDistribution(mockRecords as TelemetryRecord[]);

      expect(dist.total).toBe(10);
      expect(dist.count2xx).toBe(5);
      expect(dist.count4xx).toBe(3);
      expect(dist.count5xx).toBe(2);
      expect(dist.errorRate).toBe(50); // (3+2)/10 * 100
      expect(dist.successRate).toBe(50); // 5/10 * 100
    });
  });

  describe('computeEndpointSummaries', () => {
    it('groups endpoints and assigns health categories correctly', () => {
      const mockRecords: Partial<TelemetryRecord>[] = [
        // Healthy endpoint
        { endpoint: '/api/v1/users', method: 'GET', statusCode: 200, durationMs: 40 },
        { endpoint: '/api/v1/users', method: 'GET', statusCode: 200, durationMs: 45 },
        { endpoint: '/api/v1/users', method: 'POST', statusCode: 201, durationMs: 60 },
        // Degraded endpoint (high p95 or moderate error rate)
        { endpoint: '/api/v1/search', method: 'GET', statusCode: 200, durationMs: 120 },
        { endpoint: '/api/v1/search', method: 'GET', statusCode: 404, durationMs: 310 },
        // Critical endpoint (error rate >= 6% or p95 > 500ms)
        { endpoint: '/api/v1/payments', method: 'POST', statusCode: 500, durationMs: 620 },
        { endpoint: '/api/v1/payments', method: 'POST', statusCode: 200, durationMs: 580 },
      ];

      const summaries = computeEndpointSummaries(mockRecords as TelemetryRecord[]);

      expect(summaries.length).toBe(3);
      const userSummary = summaries.find((s) => s.endpoint === '/api/v1/users');
      expect(userSummary).toBeDefined();
      expect(userSummary?.methods).toContain('GET');
      expect(userSummary?.methods).toContain('POST');
      expect(userSummary?.health).toBe('healthy');

      const paymentSummary = summaries.find((s) => s.endpoint === '/api/v1/payments');
      expect(paymentSummary?.health).toBe('critical');
    });
  });

  describe('bucketTimeSeries', () => {
    it('returns bucketCount intervals from sorted chronological records', () => {
      const baseTime = new Date('2026-10-14T12:00:00Z').getTime();
      const records: Partial<TelemetryRecord>[] = Array.from({ length: 60 }, (_, i) => ({
        timestamp: new Date(baseTime + i * 60000).toISOString(),
        durationMs: 50 + (i % 20),
        statusCode: i % 10 === 0 ? 500 : 200,
      }));

      const buckets = bucketTimeSeries(records as TelemetryRecord[], 6);

      expect(buckets.length).toBe(6);
      expect(buckets[0].label).toBeDefined();
      expect(buckets[0].requestCount).toBeGreaterThan(0);
    });
  });

  describe('evaluateAlertRules', () => {
    it('detects threshold violations and skips disabled rules', () => {
      const records: Partial<TelemetryRecord>[] = [
        { endpoint: '/api/v1/payments', statusCode: 500, durationMs: 600 },
        { endpoint: '/api/v1/payments', statusCode: 500, durationMs: 700 },
        { endpoint: '/api/v1/payments', statusCode: 200, durationMs: 500 },
      ];

      const rules: AlertRule[] = [
        {
          id: 'rule_1',
          name: 'Payment Latency',
          targetEndpoint: '/api/v1/payments',
          metric: 'p95_latency',
          operator: '>',
          threshold: 400,
          severity: 'critical',
          enabled: true,
        },
        {
          id: 'rule_2',
          name: 'Disabled Rule',
          targetEndpoint: '/api/v1/payments',
          metric: 'p95_latency',
          operator: '>',
          threshold: 100,
          severity: 'warning',
          enabled: false,
        },
      ];

      const incidents = evaluateAlertRules(records as TelemetryRecord[], rules);

      expect(incidents.length).toBe(1);
      expect(incidents[0].ruleId).toBe('rule_1');
      expect(incidents[0].severity).toBe('critical');
    });
  });
});
