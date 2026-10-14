import React, { useState } from 'react';
import { useObservabilityStore } from '../../store/observabilityStore';
import type { AlertRule } from '../../types/telemetry';
import { Bell, AlertTriangle, AlertOctagon, Trash2, Plus, X, Check } from 'lucide-react';

interface AlertRulesModalProps {
  isModal?: boolean;
}

export const AlertRulesModal: React.FC<AlertRulesModalProps> = ({ isModal = false }) => {
  const {
    alertRules,
    activeIncidents,
    addAlertRule,
    toggleAlertRule,
    deleteAlertRule,
    alertModalOpen,
    setAlertModalOpen,
  } = useObservabilityStore();

  const [isAdding, setIsAdding] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [targetEndpoint, setTargetEndpoint] = useState('*');
  const [metric, setMetric] = useState<AlertRule['metric']>('p95_latency');
  const [operator, setOperator] = useState<AlertRule['operator']>('>');
  const [threshold, setThreshold] = useState<number>(300);
  const [severity, setSeverity] = useState<AlertRule['severity']>('warning');

  if (isModal && !alertModalOpen) return null;

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    addAlertRule({
      name: ruleName.trim(),
      targetEndpoint,
      metric,
      operator,
      threshold: Number(threshold),
      severity,
      enabled: true,
    });

    setIsAdding(false);
    setRuleName('');
    setThreshold(300);
  };

  const content = (
    <div className="space-y-6">
      {/* Active Incidents Banner */}
      <div>
        <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-cyan-400" />
          Active Incident Alerts
          {activeIncidents.length > 0 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
              {activeIncidents.length} Triggered
            </span>
          )}
        </h3>

        {activeIncidents.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>All systems nominal. No alert thresholds currently breached.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {activeIncidents.map((inc) => (
              <div
                key={inc.id}
                className="p-3 rounded-xl bg-slate-900 border border-rose-500/30 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.2 rounded-full uppercase ${
                        inc.severity === 'critical'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {inc.severity === 'critical' ? (
                        <AlertOctagon className="w-3 h-3" />
                      ) : (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      {inc.severity}
                    </span>
                    <span className="font-semibold text-slate-100">{inc.ruleName}</span>
                  </div>
                  <div className="font-mono text-slate-400 text-[11px]">
                    Target: <span className="text-cyan-300">{inc.endpoint}</span> | Observed:{' '}
                    <span className="text-rose-400 font-bold">{inc.currentValue}</span> (Threshold:{' '}
                    {inc.threshold})
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(inc.triggeredAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rules List & Creator */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white tracking-tight">
            Configured Alert Rules
          </h3>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 transition-colors font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Rule</span>
            </button>
          )}
        </div>

        {/* Create Rule Form */}
        {isAdding && (
          <form
            onSubmit={handleCreateRule}
            className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-3 mb-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-semibold text-slate-200">Create New Telemetry Alert Rule</span>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Rule Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ingestion Spikes (> 400 reqs)"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Target Endpoint</label>
                <select
                  value={targetEndpoint}
                  onChange={(e) => setTargetEndpoint(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500/50 font-mono text-[11px]"
                >
                  <option value="*">* (All Microservices)</option>
                  <option value="/api/v1/payments/charge">/api/v1/payments/charge</option>
                  <option value="/api/v1/auth/login">/api/v1/auth/login</option>
                  <option value="/api/v1/search">/api/v1/search</option>
                  <option value="/api/v1/users/me">/api/v1/users/me</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Metric Condition</label>
                <div className="flex gap-2">
                  <select
                    value={metric}
                    onChange={(e) => setMetric(e.target.value as AlertRule['metric'])}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  >
                    <option value="p95_latency">P95 Latency (ms)</option>
                    <option value="error_rate">Error Rate (%)</option>
                    <option value="throughput">Total Throughput</option>
                  </select>
                  <select
                    value={operator}
                    onChange={(e) => setOperator(e.target.value as AlertRule['operator'])}
                    className="w-16 bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-center"
                  >
                    <option value=">">&gt;</option>
                    <option value="<">&lt;</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Threshold Value</label>
                <input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Severity Tier</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as AlertRule['severity'])}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold"
              >
                Save Rule
              </button>
            </div>
          </form>
        )}

        {/* Existing Rules List */}
        <div className="space-y-2">
          {alertRules.map((rule) => (
            <div
              key={rule.id}
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                rule.enabled
                  ? 'bg-slate-900/60 border-slate-800'
                  : 'bg-slate-950/40 border-slate-900 opacity-60'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded uppercase ${
                      rule.severity === 'critical'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {rule.severity}
                  </span>
                  <span className="font-semibold text-slate-200">{rule.name}</span>
                </div>
                <div className="font-mono text-slate-400 text-[11px]">
                  Target: <span className="text-cyan-400">{rule.targetEndpoint}</span> | When{' '}
                  <span className="text-slate-300">{rule.metric}</span> {rule.operator}{' '}
                  <span className="text-white font-bold">{rule.threshold}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Toggle switch */}
                <button
                  onClick={() => toggleAlertRule(rule.id)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                    rule.enabled ? 'bg-cyan-500' : 'bg-slate-800'
                  }`}
                  title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      rule.enabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>

                {/* Delete button */}
                <button
                  onClick={() => deleteAlertRule(rule.id)}
                  className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                  title="Delete rule"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (!isModal) {
    return <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">{content}</div>;
  }

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan-400" />
            Alerting Rules & Incident Manager
          </h2>
          <button
            onClick={() => setAlertModalOpen(false)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{content}</div>
      </div>
    </div>
  );
};
