// src/components/ui/progress.jsx
import { cn } from '@/lib/utils';

export function Progress({ value = 0, className = '', barClassName = '' }) {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div
      className={cn('h-2.5 w-full overflow-hidden rounded-full bg-slate-200', className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          'h-full rounded-full bg-emerald-600 transition-all duration-300 ease-out',
          barClassName
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
