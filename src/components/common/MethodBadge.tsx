import React from 'react';
import type { HttpMethod } from '../../types/telemetry';

interface MethodBadgeProps {
  method: HttpMethod;
  className?: string;
}

const METHOD_STYLES: Record<HttpMethod, { bg: string; text: string; border: string }> = {
  GET: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/20',
  },
  POST: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  PUT: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
  },
  DELETE: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/20',
  },
  PATCH: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/20',
  },
};

export const MethodBadge: React.FC<MethodBadgeProps> = ({ method, className = '' }) => {
  const style = METHOD_STYLES[method] || {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/20',
  };

  return (
    <span
      className={`inline-flex items-center justify-center font-mono font-bold text-[11px] px-2 py-0.5 rounded border uppercase tracking-wider min-w-[54px] ${style.bg} ${style.text} ${style.border} ${className}`}
    >
      {method}
    </span>
  );
};
