import React from 'react';
import { useObservabilityStore } from './store/observabilityStore';
import { Header } from './components/layout/Header';
import { TabsNav } from './components/layout/TabsNav';
import { MetricsBanner } from './components/overview/MetricsBanner';
import { LatencyChart } from './components/overview/LatencyChart';
import { StatusDistributionChart } from './components/overview/StatusDistributionChart';
import { EndpointRegistry } from './components/endpoints/EndpointRegistry';
import { TraceStreamTable } from './components/traces/TraceStreamTable';
import { RequestInspectorDrawer } from './components/traces/RequestInspectorDrawer';
import { AlertRulesModal } from './components/alerts/AlertRulesModal';
import { ArrowRight } from 'lucide-react';

export const App: React.FC = () => {
  const { activeTab, setActiveTab } = useObservabilityStore();

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Application Header */}
      <Header />

      {/* Primary Navigation Tabs */}
      <TabsNav />

      {/* Main Dashboard Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top KPI Cards */}
            <MetricsBanner />

            {/* Time-Series Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <LatencyChart />
              </div>
              <div className="lg:col-span-1">
                <StatusDistributionChart />
              </div>
            </div>

            {/* Recent Telemetry Stream Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight">
                    Live Telemetry Ingestion Log
                  </h3>
                  <p className="text-xs text-slate-400">
                    Latest HTTP requests captured across microservices
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('traces')}
                  className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                >
                  <span>Open Full Trace Stream</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <TraceStreamTable />
            </div>
          </div>
        )}

        {activeTab === 'endpoints' && <EndpointRegistry />}

        {activeTab === 'traces' && <TraceStreamTable />}

        {activeTab === 'alerts' && <AlertRulesModal isModal={false} />}
      </main>

      {/* Request & Waterfall Trace Deep Dive Drawer */}
      <RequestInspectorDrawer />

      {/* Alert Rules Modal (when triggered from Header bell) */}
      <AlertRulesModal isModal={true} />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#080B11] py-4 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-slate-400">TraceForge APM v1.0</span>
            <span>•</span>
            <span>Deterministic Microservice Observability Platform</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Client-side statistical computation ($p50/p90/p95/p99$)</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
