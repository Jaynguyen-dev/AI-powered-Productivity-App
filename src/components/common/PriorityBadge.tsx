import React from 'react';
import { PriorityLevel } from '../../types';
import { AlertCircle, Clock, ArrowDown } from 'lucide-react';

interface PriorityBadgeProps {
  priority: PriorityLevel;
  showBars?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = 'md',
  className = '',
}) => {
  const isSm = size === 'sm';
  const px = isSm ? 'px-1.5 py-0.5' : 'px-2 py-0.5';
  const text = isSm ? 'text-[9px]' : 'text-[10px]';
  const baseClasses = `inline-flex items-center gap-1.5 rounded uppercase tracking-wider font-bold ${px} ${text} ${className}`;

  if (priority === 'high') {
    return (
      <span
        className={`${baseClasses} bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]`}
        title="High Priority"
      >
        <AlertCircle className="w-3 h-3" />
        HIGH
      </span>
    );
  }

  if (priority === 'medium') {
    return (
      <span
        className={`${baseClasses} bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(251,191,36,0.1)]`}
        title="Medium Priority"
      >
        <Clock className="w-3 h-3" />
        MED
      </span>
    );
  }

  return (
    <span
      className={`${baseClasses} bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]`}
      title="Low Priority"
    >
      <ArrowDown className="w-3 h-3" />
      LOW
    </span>
  );
};