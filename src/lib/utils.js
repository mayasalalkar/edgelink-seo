// src/lib/utils.js
const { clsx } = require('clsx');
const { twMerge } = require('tailwind-merge');

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function getScoreColor(score) {
  if (score === null || score === undefined) return 'text-slate-400';
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-rose-600';
}

function getScoreBadgeClasses(score) {
  if (score === null || score === undefined) return 'bg-slate-100 text-slate-600';
  if (score >= 80) return 'bg-emerald-100 text-emerald-800';
  if (score >= 60) return 'bg-amber-100 text-amber-800';
  return 'bg-rose-100 text-rose-800';
}

function getPriorityBadgeClasses(priority) {
  switch (String(priority || '').toUpperCase()) {
    case 'CRITICAL':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'HIGH':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'MEDIUM':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

function formatDateTime(dateInput) {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

module.exports = {
  cn,
  getScoreColor,
  getScoreBadgeClasses,
  getPriorityBadgeClasses,
  formatDateTime,
};
