// src/components/ScoreRing.jsx
'use client';

export function ScoreRing({ score, size = 128, label = 'Overall SEO Score' }) {
  const numeric = typeof score === 'number' ? Math.max(0, Math.min(100, score)) : 0;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (numeric / 100) * circumference;

  const strokeColor =
    numeric >= 80 ? '#059669' : numeric >= 60 ? '#d97706' : '#e11d48';

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-slate-900">
            {score ?? '—'}
          </span>
          <span className="text-[11px] font-medium text-slate-500">/ 100</span>
        </div>
      </div>
      {label ? <span className="mt-2 text-xs font-medium text-slate-600">{label}</span> : null}
    </div>
  );
}
