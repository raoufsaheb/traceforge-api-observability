import React from 'react';
import { useObservabilityStore } from '../../store/observabilityStore';
import { LayoutDashboard, Server, ListFilter, AlertCircle } from 'lucide-react';

export const TabsNav: React.FC = () => {
  const { activeTab, setActiveTab, records, activeIncidents } = useObservabilityStore();

  const tabs = [
    {
      id: 'overview' as const,
      label: 'Telemetry Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'endpoints' as const,
      label: 'Endpoint Registry',
      icon: Server,
      badge: '7 services',
    },
    {
      id: 'traces' as const,
      label: 'Request Traces',
      icon: ListFilter,
      badge: `${records.length}`,
    },
    {
      id: 'alerts' as const,
      label: 'Alert Rules & Incidents',
      icon: AlertCircle,
      badge: activeIncidents.length > 0 ? `${activeIncidents.length} alert` : null,
      badgeDanger: activeIncidents.length > 0,
    },
  ];

  return (
    <nav className="border-b border-slate-800 bg-[#080B11]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    tab.badgeDanger
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
