import { create } from 'zustand';
import type {
  TelemetryRecord,
  TelemetryFilter,
  AlertRule,
  ActiveIncident,
} from '../types/telemetry';
import { generateBenchmarkSeed } from '../data/mockTelemetry';
import { LocalStorageAdapter } from '../lib/storage';
import { evaluateAlertRules } from '../lib/analytics';

const MAX_BUFFER_SIZE = 1000;

export interface ObservabilityState {
  records: TelemetryRecord[];
  filters: TelemetryFilter;
  selectedRecord: TelemetryRecord | null;
  activeTab: 'overview' | 'endpoints' | 'traces' | 'alerts';
  isSimulating: boolean;
  simulationSpeed: 1 | 2 | 5;
  alertRules: AlertRule[];
  activeIncidents: ActiveIncident[];
  alertModalOpen: boolean;

  // Actions
  setFilter: (partial: Partial<TelemetryFilter>) => void;
  resetFilters: () => void;
  selectRecord: (record: TelemetryRecord | null) => void;
  setActiveTab: (tab: 'overview' | 'endpoints' | 'traces' | 'alerts') => void;
  setAlertModalOpen: (open: boolean) => void;
  startSimulation: () => void;
  stopSimulation: () => void;
  toggleSimulation: () => void;
  setSimulationSpeed: (speed: 1 | 2 | 5) => void;
  addSyntheticRecord: (record: TelemetryRecord) => void;
  resetTelemetryData: () => void;
  addAlertRule: (rule: Omit<AlertRule, 'id'>) => void;
  toggleAlertRule: (id: string) => void;
  deleteAlertRule: (id: string) => void;
}

const initialFilters: TelemetryFilter = {
  search: '',
  method: 'all',
  statusClass: 'all',
  endpoint: '',
  timeWindow: 'all',
};

export const useObservabilityStore = create<ObservabilityState>((set, get) => {
  const seedRecords = generateBenchmarkSeed();
  const loadedRules = LocalStorageAdapter.loadAlertRules();
  const loadedSpeed = LocalStorageAdapter.loadSimSpeed();
  const initialIncidents = evaluateAlertRules(seedRecords, loadedRules);

  return {
    records: seedRecords,
    filters: initialFilters,
    selectedRecord: null,
    activeTab: 'overview',
    isSimulating: false,
    simulationSpeed: loadedSpeed,
    alertRules: loadedRules,
    activeIncidents: initialIncidents,
    alertModalOpen: false,

    setFilter: (partial) => {
      set((state) => ({
        filters: { ...state.filters, ...partial },
      }));
    },

    resetFilters: () => {
      set({ filters: initialFilters });
    },

    selectRecord: (record) => {
      set({ selectedRecord: record });
    },

    setActiveTab: (tab) => {
      set({ activeTab: tab });
    },

    setAlertModalOpen: (open) => {
      set({ alertModalOpen: open });
    },

    startSimulation: () => {
      set({ isSimulating: true });
    },

    stopSimulation: () => {
      set({ isSimulating: false });
    },

    toggleSimulation: () => {
      set((state) => ({ isSimulating: !state.isSimulating }));
    },

    setSimulationSpeed: (speed) => {
      LocalStorageAdapter.saveSimSpeed(speed);
      set({ simulationSpeed: speed });
    },

    addSyntheticRecord: (record) => {
      set((state) => {
        const nextRecords = [...state.records, record];
        // Enforce circular ring buffer cap
        if (nextRecords.length > MAX_BUFFER_SIZE) {
          nextRecords.splice(0, nextRecords.length - MAX_BUFFER_SIZE);
        }
        const updatedIncidents = evaluateAlertRules(nextRecords, state.alertRules);
        return {
          records: nextRecords,
          activeIncidents: updatedIncidents,
        };
      });
    },

    resetTelemetryData: () => {
      const freshSeed = generateBenchmarkSeed();
      const rules = get().alertRules;
      const incidents = evaluateAlertRules(freshSeed, rules);
      set({
        records: freshSeed,
        filters: initialFilters,
        selectedRecord: null,
        activeIncidents: incidents,
      });
    },

    addAlertRule: (ruleData) => {
      const newRule: AlertRule = {
        ...ruleData,
        id: `rule_${Date.now()}`,
      };
      set((state) => {
        const nextRules = [...state.alertRules, newRule];
        LocalStorageAdapter.saveAlertRules(nextRules);
        const incidents = evaluateAlertRules(state.records, nextRules);
        return { alertRules: nextRules, activeIncidents: incidents };
      });
    },

    toggleAlertRule: (id) => {
      set((state) => {
        const nextRules = state.alertRules.map((r) =>
          r.id === id ? { ...r, enabled: !r.enabled } : r
        );
        LocalStorageAdapter.saveAlertRules(nextRules);
        const incidents = evaluateAlertRules(state.records, nextRules);
        return { alertRules: nextRules, activeIncidents: incidents };
      });
    },

    deleteAlertRule: (id) => {
      set((state) => {
        const nextRules = state.alertRules.filter((r) => r.id !== id);
        LocalStorageAdapter.saveAlertRules(nextRules);
        const incidents = evaluateAlertRules(state.records, nextRules);
        return { alertRules: nextRules, activeIncidents: incidents };
      });
    },
  };
});
