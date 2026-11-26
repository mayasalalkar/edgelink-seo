// src/components/AuditProgressBar.jsx
'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const STATUS_BADGE = {
  QUEUED: { variant: 'info', label: 'Queued' },
  RUNNING: { variant: 'warning', label: 'Running' },
  COMPLETED: { variant: 'success', label: 'Completed' },
  FAILED: { variant: 'danger', label: 'Failed' },
};

export function AuditProgressBar({ status, progress = 0, currentStep }) {
  const badge = STATUS_BADGE[status] || STATUS_BADGE.QUEUED;
  const barColor =
    status === 'FAILED'
      ? 'bg-rose-600'
      : status === 'COMPLETED'
        ? 'bg-emerald-600'
        : 'bg-amber-500';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Badge variant={badge.variant}>{badge.label}</Badge>
          <span className="truncate text-slate-600">
            {currentStep || 'Waiting for worker...'}
          </span>
        </div>
        <span className="font-mono font-semibold text-slate-700">{progress}%</span>
      </div>
      <Progress value={progress} barClassName={barColor} />
    </div>
  );
}
