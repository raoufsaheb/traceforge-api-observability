import React, { useEffect } from 'react';
import { useObservabilityStore } from '../../store/observabilityStore';
import { generateSyntheticRecord } from '../../data/mockTelemetry';
import { Activity, Play, Pause, RotateCcw, Bell } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    isSimulating,
    simulationSpeed,
    toggleSimulation,
    setSimulationSpeed,
    addSyntheticRecord,
    resetTelemetryData,
    activeIncidents,
    setAlertModalOpen,
  } = useObservabilityStore();

  // Handle simulation interval
  useEffect(() => {
    if (!isSimulating) return;

    // Speeds: 1x = 1000ms, 2x = 400ms, 5x = 150ms
    const intervalMs = simulationSpeed === 5 ? 150 : simulationSpeed === 2 ? 400 : 1000;

    const interval = setInterval(() => {
      const record = generateSyntheticRecord();
      addSyntheticRecord(record);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isSimulating, simulationSpeed, addSyntheticRecord]);

  return (
    <header className="border-b border-slate-800 bg-[#0B0F19]/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand & Mode */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                TraceForge
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 uppercase">
                  APM
                </span>
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-800">
            {isSimulating ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live Stream Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-cyan-500/80" />
                Benchmark Mode (500 traces)
              </span>
            )}
          </div>
        </div>

        {/* Live Simulation Controls & Actions */}
        <div className="flex items-center gap-2">
          {/* Simulation Play/Pause */}
          <button
            onClick={toggleSimulation}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
              isSimulating
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
            }`}
            title={isSimulating ? 'Pause traffic generator' : 'Start live synthetic traffic generator'}
          >
            {isSimulating ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulate</span>
              </>
            )}
          </button>

          {/* Speed Selector */}
          {isSimulating && (
            <div className="hidden sm:flex items-center gap-0.5 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
              {([1, 2, 5] as const).map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSimulationSpeed(spd)}
                  className={`px-2 py-1 rounded font-mono text-[11px] transition-colors ${
                    simulationSpeed === spd
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          )}

          {/* Reset Demo */}
          <button
            onClick={resetTelemetryData}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-800 transition-colors"
            title="Reset telemetry buffer to default 500-request benchmark"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Alert Incidents Bell */}
          <button
            onClick={() => setAlertModalOpen(true)}
            className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            title="Configure Alert Rules & View Incidents"
          >
            <Bell className="w-4 h-4" />
            {activeIncidents.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg animate-pulse">
                {activeIncidents.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
