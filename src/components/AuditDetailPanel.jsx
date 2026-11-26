// src/components/AuditDetailPanel.jsx
'use client';

import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Mail,
  MessageSquare,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScoreRing } from '@/components/ScoreRing';
import { formatDateTime, getPriorityBadgeClasses, getScoreBadgeClasses } from '@/lib/utils';

export function AuditDetailPanel({ audit }) {
  if (!audit) return null;

  const result = audit.result || {};
  const breakdown = result.score_breakdown || audit.scoreBreakdown || {};
  const breakdownItems = [
    { key: 'technical', label: 'Technical' },
    { key: 'on_page', label: 'On-Page' },
    { key: 'content', label: 'Content' },
    { key: 'core_web_vitals', label: 'Core Web Vitals' },
    { key: 'schema', label: 'Schema.org' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Summary Card */}
      <Card>
        <CardContent className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <ScoreRing score={audit.overallScore ?? result.overall_score} />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">
                  {audit.client?.name || 'SEO Audit Report'}
                </h2>
                <Badge variant="success">{result.audit_version || 'v1.0'}</Badge>
                <Badge variant="default">{audit.triggeredBy || 'manual'}</Badge>
              </div>
              <p className="text-sm text-slate-600">
                {audit.client?.websiteUrl} • {audit.client?.businessType} •{' '}
                {audit.client?.city}, {audit.client?.state}, India
              </p>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-700">
                {result.executive_summary || 'Audit summary will appear once Claude completes analysis.'}
              </p>
              <div className="text-xs text-slate-500">
                Completed: {formatDateTime(audit.completedAt || audit.createdAt)} • Audit ID:{' '}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px]">{audit.id}</code>
              </div>
            </div>
          </div>

          {audit.status === 'COMPLETED' ? (
            <div className="flex shrink-0 flex-col gap-2">
              <a
                href={`/api/audit/${audit.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-800"
              >
                <Download className="h-4 w-4" />
                Download PDF Report
              </a>
              <span className="text-center text-[11px] text-slate-500">
                Saved at {audit.pdfPath || '/tmp/reports/'}
              </span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {breakdownItems.map(({ key, label }) => {
          const val = breakdown[key];
          return (
            <Card key={key}>
              <CardContent className="p-4 text-center">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {label}
                </div>
                <div className="mt-2">
                  <span
                    className={`inline-block rounded-lg px-3 py-1 text-2xl font-bold ${getScoreBadgeClasses(val)}`}
                  >
                    {val ?? '—'}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Critical / Important / Quick Wins */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="bg-rose-50/60">
            <CardTitle className="flex items-center gap-2 text-rose-800">
              <AlertTriangle className="h-4 w-4" />
              Critical Issues ({result.critical_issues?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-700">
              {(result.critical_issues || []).map((issue, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-amber-50/60">
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <FileText className="h-4 w-4" />
              Important Issues ({result.important_issues?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-700">
              {(result.important_issues || []).map((issue, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-emerald-50/60">
            <CardTitle className="flex items-center gap-2 text-emerald-800">
              <Zap className="h-4 w-4" />
              Quick Wins ≤ 2 hrs ({result.quick_wins?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-700">
              {(result.quick_wins || []).map((win, idx) => (
                <li key={idx} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{win}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Prioritised SEO Recommendations</CardTitle>
          <CardDescription>
            Every recommendation includes a finding, exact fix, impact, effort, and falsifiability check.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Priority</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Finding &amp; Exact Fix</th>
                <th className="px-4 py-3">Impact / Effort</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(result.recommendations || []).map((rec, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="px-5 py-4 align-top">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getPriorityBadgeClasses(rec.priority)}`}
                    >
                      {rec.priority}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-top font-medium text-slate-800">
                    {rec.category}
                  </td>
                  <td className="px-4 py-4 align-top space-y-1.5">
                    <p className="font-medium text-slate-900">{rec.finding}</p>
                    <p className="text-slate-700">
                      <span className="font-semibold text-emerald-800">Fix:</span> {rec.fix}
                    </p>
                    <p className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">Falsifiability check:</span>{' '}
                      {rec.falsifiability_check}
                    </p>
                  </td>
                  <td className="px-4 py-4 align-top whitespace-nowrap text-xs">
                    <div className="font-semibold text-slate-800">Impact: {rec.estimated_impact}</div>
                    <div className="mt-1 text-slate-500">Effort: {rec.effort}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Delivery Notifications */}
      {audit.notifications?.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Report Delivery Notifications</CardTitle>
            <CardDescription>WhatsApp (Twilio mock) &amp; Email delivery logs</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {audit.notifications.map((n) => (
              <div
                key={n.id}
                className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs"
              >
                {n.channel === 'whatsapp' ? (
                  <MessageSquare className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Mail className="h-4 w-4 text-sky-600" />
                )}
                <div>
                  <div className="font-semibold capitalize text-slate-800">
                    {n.channel} — {n.status}
                  </div>
                  <div className="text-slate-500">
                    {n.providerId || 'N/A'} • {formatDateTime(n.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
