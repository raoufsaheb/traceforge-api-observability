import React from 'react';

interface StatusBadgeProps {
  code: number;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ code, className = '' }) => {
  let bg = 'bg-slate-500/10';
  let text = 'text-slate-400';
  let border = 'border-slate-500/20';
  let dotColor = 'bg-slate-400';

  if (code >= 200 && code < 300) {
    bg = 'bg-emerald-500/10';
    text = 'text-emerald-400';
    border = 'border-emerald-500/20';
    dotColor = 'bg-emerald-400';
  } else if (code >= 400 && code < 500) {
    bg = 'bg-amber-500/10';
    text = 'text-amber-400';
    border = 'border-amber-500/20';
    dotColor = 'bg-amber-400';
  } else if (code >= 500) {
    bg = 'bg-rose-500/10';
    text = 'text-rose-400';
    border = 'border-rose-500/20';
    dotColor = 'bg-rose-400';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-semibold text-[11px] px-2 py-0.5 rounded border ${bg} ${text} ${border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{code}</span>
    </span>
  );
};
