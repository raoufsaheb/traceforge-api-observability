import { describe, it, expect, beforeEach } from 'vitest';
import { useObservabilityStore } from '../src/store/observabilityStore';
import { generateSyntheticRecord } from '../src/data/mockTelemetry';

describe('Observability Store', () => {
  beforeEach(() => {
    useObservabilityStore.getState().resetTelemetryData();
  });

  it('initializes with benchmark seed data', () => {
    const state = useObservabilityStore.getState();
    expect(state.records.length).toBe(500);
    expect(state.alertRules.length).toBeGreaterThan(0);
    expect(state.isSimulating).toBe(false);
  });

  it('updates filters and resets back to initial', () => {
    const store = useObservabilityStore.getState();
    store.setFilter({ method: 'POST', statusClass: '5xx', search: 'payment' });

    let updated = useObservabilityStore.getState();
    expect(updated.filters.method).toBe('POST');
    expect(updated.filters.statusClass).toBe('5xx');
    expect(updated.filters.search).toBe('payment');

    store.resetFilters();
    updated = useObservabilityStore.getState();
    expect(updated.filters.method).toBe('all');
    expect(updated.filters.statusClass).toBe('all');
    expect(updated.filters.search).toBe('');
  });

  it('adds synthetic records and maintains ring buffer limit', () => {
    const store = useObservabilityStore.getState();
    const newRecord = generateSyntheticRecord();

    store.addSyntheticRecord(newRecord);
    const updated = useObservabilityStore.getState();
    expect(updated.records.length).toBe(501);
    expect(updated.records[updated.records.length - 1].id).toBe(newRecord.id);
  });

  it('adds, toggles, and deletes alert rules', () => {
    const store = useObservabilityStore.getState();
    const initialRuleCount = store.alertRules.length;

    store.addAlertRule({
      name: 'Custom Auth Rule',
      targetEndpoint: '/api/v1/auth/login',
      metric: 'error_rate',
      operator: '>',
      threshold: 5,
      severity: 'critical',
      enabled: true,
    });

    let current = useObservabilityStore.getState();
    expect(current.alertRules.length).toBe(initialRuleCount + 1);
    const customRule = current.alertRules.find((r) => r.name === 'Custom Auth Rule');
    expect(customRule).toBeDefined();

    // Toggle
    if (customRule) {
      store.toggleAlertRule(customRule.id);
      current = useObservabilityStore.getState();
      const toggled = current.alertRules.find((r) => r.id === customRule.id);
      expect(toggled?.enabled).toBe(false);

      // Delete
      store.deleteAlertRule(customRule.id);
      current = useObservabilityStore.getState();
      expect(current.alertRules.length).toBe(initialRuleCount);
    }
  });
});
