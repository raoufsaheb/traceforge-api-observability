import React from 'react';
import type { ServiceHealth } from '../../types/telemetry';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

interface HealthBadgeProps {
  health: ServiceHealth;
  className?: string;
}

export const HealthBadge: React.FC<HealthBadgeProps> = ({ health, className = '' }) => {
  if (health === 'healthy') {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${className}`}
      >
        <ShieldCheck className="w-3 h-3 text-emerald-400" />
        Healthy
      </span>
    );
  }

  if (health === 'degraded') {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 ${className}`}
      >
        <AlertTriangle className="w-3 h-3 text-amber-400" />
        Degraded
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 ${className}`}
    >
      <AlertOctagon className="w-3 h-3 text-rose-400" />
      Critical
    </span>
  );
};
