// src/components/ui/badge.jsx
import { cn } from '@/lib/utils';

const BADGE_VARIANTS = {
  default: 'bg-slate-100 text-slate-800 border-slate-200',
  success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  danger: 'bg-rose-100 text-rose-800 border-rose-200',
  info: 'bg-sky-100 text-sky-800 border-sky-200',
};

export function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        BADGE_VARIANTS[variant] || BADGE_VARIANTS.default,
        className
      )}
    >
      {children}
    </span>
  );
}
