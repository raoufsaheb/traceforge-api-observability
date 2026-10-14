import type { AlertRule } from '../types/telemetry';
import { DEFAULT_ALERT_RULES } from '../data/mockTelemetry';

const ALERT_RULES_KEY = 'traceforge_alert_rules_v1';
const SIM_SPEED_KEY = 'traceforge_sim_speed_v1';

export class LocalStorageAdapter {
  static loadAlertRules(): AlertRule[] {
    if (typeof window === 'undefined') return DEFAULT_ALERT_RULES;
    try {
      const raw = localStorage.getItem(ALERT_RULES_KEY);
      if (!raw) return DEFAULT_ALERT_RULES;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      return DEFAULT_ALERT_RULES;
    } catch {
      return DEFAULT_ALERT_RULES;
    }
  }

  static saveAlertRules(rules: AlertRule[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(ALERT_RULES_KEY, JSON.stringify(rules));
    } catch {
      // storage quota or private browsing error handled safely
    }
  }

  static loadSimSpeed(): 1 | 2 | 5 {
    if (typeof window === 'undefined') return 1;
    try {
      const raw = localStorage.getItem(SIM_SPEED_KEY);
      if (raw === '1' || raw === '2' || raw === '5') {
        return Number(raw) as 1 | 2 | 5;
      }
      return 1;
    } catch {
      return 1;
    }
  }

  static saveSimSpeed(speed: 1 | 2 | 5): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SIM_SPEED_KEY, String(speed));
    } catch {
      // safe
    }
  }

  static resetStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(ALERT_RULES_KEY);
      localStorage.removeItem(SIM_SPEED_KEY);
    } catch {
      // safe
    }
  }
}
