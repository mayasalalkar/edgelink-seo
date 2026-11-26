// src/components/ui/card.jsx
import { cn } from '@/lib/utils';

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={cn('border-b border-slate-100 px-5 py-4', className)}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={cn('text-base font-semibold text-slate-900', className)}>{children}</h3>;
}

export function CardDescription({ children, className = '' }) {
  return <p className={cn('mt-0.5 text-xs text-slate-500', className)}>{children}</p>;
}

export function CardContent({ children, className = '' }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}
