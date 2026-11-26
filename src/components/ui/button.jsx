// src/components/ui/button.jsx
'use client';

import { cn } from '@/lib/utils';

const VARIANTS = {
  default: 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
  outline: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
  ghost: 'text-slate-700 hover:bg-slate-100',
  destructive: 'bg-rose-600 text-white hover:bg-rose-700',
};

const SIZES = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-10 px-5 text-sm',
};

export function Button({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}) {
  return (
    <button
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant] || VARIANTS.default,
        SIZES[size] || SIZES.md,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
