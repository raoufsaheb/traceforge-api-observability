import React, { useState, useEffect } from 'react';
import { useObservabilityStore } from '../../store/observabilityStore';
import { MethodBadge } from '../common/MethodBadge';
import { StatusBadge } from '../common/StatusBadge';
import { X, Layers, Code, Globe, Shield, Copy, Check } from 'lucide-react';

export const RequestInspectorDrawer: React.FC = () => {
  const { selectedRecord, selectRecord } = useObservabilityStore();
  const [activeTab, setActiveTab] = useState<'waterfall' | 'headers' | 'payloads' | 'client'>('waterfall');
  const [copied, setCopied] = useState(false);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') selectRecord(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectRecord]);

  if (!selectedRecord) return null;

  const totalDuration = selectedRecord.durationMs || 1;

  const handleCopyTraceId = () => {
    navigator.clipboard.writeText(selectedRecord.traceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[600px] bg-[#0B0F19] border-l border-slate-800 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MethodBadge method={selectedRecord.method} />
            <StatusBadge code={selectedRecord.statusCode} />
            <span className="font-mono text-xs font-bold text-white">
              {selectedRecord.durationMs}ms
            </span>
          </div>
          <h3 className="font-mono text-sm font-semibold text-slate-100 break-all">
            {selectedRecord.endpoint}
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>Trace: {selectedRecord.traceId}</span>
            <button
              onClick={handleCopyTraceId}
              className="text-slate-500 hover:text-cyan-400 transition-colors"
              title="Copy trace ID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <button
          onClick={() => selectRecord(null)}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="Close drawer (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-800 px-4 bg-slate-950/30 text-xs">
        <button
          onClick={() => setActiveTab('waterfall')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors ${
            activeTab === 'waterfall'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Waterfall Spans
        </button>

        <button
          onClick={() => setActiveTab('headers')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors ${
            activeTab === 'headers'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          Headers
        </button>

        <button
          onClick={() => setActiveTab('payloads')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors ${
            activeTab === 'payloads'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          Payloads
        </button>

        <button
          onClick={() => setActiveTab('client')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors ${
            activeTab === 'client'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          Client Info
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'waterfall' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
              <span>Span Name & Service</span>
              <span className="font-mono">Timeline (0ms → {totalDuration}ms)</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {selectedRecord.spans.map((span) => {
                const offsetPct = (span.startTimeMs / totalDuration) * 100;
                const widthPct = Math.max(3, (span.durationMs / totalDuration) * 100);

                let barColor = 'bg-cyan-500';
                if (span.status === 'error') barColor = 'bg-rose-500';
                else if (span.service.includes('postgres') || span.service.includes('db'))
                  barColor = 'bg-purple-500';
                else if (span.service.includes('auth')) barColor = 'bg-amber-500';
                else if (span.service.includes('stripe')) barColor = 'bg-emerald-500';

                return (
                  <div key={span.id} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{span.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-sans">
                          {span.service}
                        </span>
                        {span.status === 'error' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 font-sans">
                            error
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 font-semibold">{span.durationMs}ms</span>
                    </div>

                    {/* Timeline bar */}
                    <div className="relative w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div
                        className={`absolute top-0 bottom-0 rounded-full ${barColor}`}
                        style={{
                          left: `${offsetPct}%`,
                          width: `${widthPct}%`,
                        }}
                      />
                    </div>

                    {/* Span Metadata */}
                    {span.metadata && Object.keys(span.metadata).length > 0 && (
                      <div className="mt-2 pt-1.5 border-t border-slate-800/40 flex flex-wrap gap-2 text-[10px] text-slate-400">
                        {Object.entries(span.metadata).map(([k, v]) => (
                          <span key={k} className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                            <span className="text-slate-500">{k}:</span> {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="space-y-4 text-xs font-mono">
            {/* Request Headers */}
            <div>
              <h4 className="font-sans text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Request Headers
              </h4>
              <div className="rounded-lg bg-slate-950 border border-slate-800 overflow-hidden divide-y divide-slate-800/60">
                {Object.entries(selectedRecord.requestHeaders).map(([k, v]) => (
                  <div key={k} className="p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-cyan-400">{k}</span>
                    <span className="text-slate-300 break-all">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Response Headers */}
            <div>
              <h4 className="font-sans text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Response Headers
              </h4>
              <div className="rounded-lg bg-slate-950 border border-slate-800 overflow-hidden divide-y divide-slate-800/60">
                {Object.entries(selectedRecord.responseHeaders).map(([k, v]) => (
                  <div key={k} className="p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-emerald-400">{k}</span>
                    <span className="text-slate-300 break-all">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payloads' && (
          <div className="space-y-4 text-xs font-mono">
            {selectedRecord.requestBody && (
              <div>
                <h4 className="font-sans text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Request Payload (JSON)
                </h4>
                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto">
                  {selectedRecord.requestBody}
                </pre>
              </div>
            )}

            <div>
              <h4 className="font-sans text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Response Payload (JSON)
              </h4>
              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto">
                {selectedRecord.responseBody || '{\n  "status": "empty_body"\n}'}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'client' && (
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">Client IP Address</span>
                <span className="font-mono text-cyan-400">{selectedRecord.clientIp}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">Cloud Region</span>
                <span className="font-mono text-slate-200">{selectedRecord.region}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">Timestamp</span>
                <span className="font-mono text-slate-200">{selectedRecord.timestamp}</span>
              </div>
              <div className="pt-1">
                <span className="text-slate-400 block mb-1">User Agent</span>
                <span className="font-mono text-[11px] text-slate-300 break-all">
                  {selectedRecord.userAgent}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
