// src/app/client/[clientId]/page.jsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AuditDetailPanel } from '@/components/AuditDetailPanel';
import { AuditProgressBar } from '@/components/AuditProgressBar';
import { formatDateTime, getScoreBadgeClasses } from '@/lib/utils';

export default function ClientDashboardPage({ params }) {
  const { clientId } = params;
  const [client, setClient] = useState(null);
  const [selectedAuditId, setSelectedAuditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/clients/${clientId}`, { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Client not found');
        setClient(data.client);
        const defaultAudit =
          data.client.audits?.find((a) => a.status === 'COMPLETED') ||
          data.client.audits?.[0] ||
          null;
        setSelectedAuditId(defaultAudit?.id || null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) {
    return <div className="text-sm text-slate-500">Loading client SEO dashboard...</div>;
  }

  if (error || !client) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6">
          <p className="text-sm text-rose-700">{error || 'Client not found.'}</p>
          <Link href="/client" className="text-sm font-semibold text-emerald-700 underline">
            Back to Client Directory
          </Link>
        </CardContent>
      </Card>
    );
  }

  const audits = client.audits || [];
  const activeAudit = audits.find((a) => a.id === selectedAuditId) || audits[0] || null;
  const enrichedAudit = activeAudit ? { ...activeAudit, client } : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/client"
            className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All Clients
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {client.name} — Client SEO Dashboard
          </h1>
          <p className="text-sm text-slate-600">
            {client.websiteUrl} • {client.businessType} • {client.city}, {client.state}, India
          </p>
        </div>
      </div>

      {!enrichedAudit ? (
        <Card>
          <CardContent className="p-6 text-sm text-slate-600">
            No SEO audits have been run for {client.name} yet. Trigger an audit from the{' '}
            <Link href="/admin" className="font-semibold text-emerald-700 underline">
              Admin Portal
            </Link>
            .
          </CardContent>
        </Card>
      ) : enrichedAudit.status !== 'COMPLETED' ? (
        <Card>
          <CardHeader>
            <CardTitle>Audit In Progress</CardTitle>
            <CardDescription>
              Your SEO report is currently being processed by the automated worker pipeline.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuditProgressBar
              status={enrichedAudit.status}
              progress={enrichedAudit.progress}
              currentStep={enrichedAudit.errorMessage || enrichedAudit.currentStep}
            />
          </CardContent>
        </Card>
      ) : (
        <AuditDetailPanel audit={enrichedAudit} />
      )}

      {/* Historical Audits Switcher */}
      {audits.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-700" />
              Audit History ({audits.length})
            </CardTitle>
            <CardDescription>
              Click any previous audit run to compare scores and recommendations over time.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {audits.map((a) => {
              const selected = a.id === activeAudit?.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setSelectedAuditId(a.id)}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left text-xs transition ${
                    selected
                      ? 'border-emerald-600 bg-emerald-50/50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-slate-900">
                      {formatDateTime(a.createdAt)}
                    </div>
                    <div className="mt-0.5 text-slate-500">
                      Trigger: {a.triggeredBy} • {a.status}
                    </div>
                  </div>
                  {a.overallScore !== null && a.overallScore !== undefined ? (
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-bold ${getScoreBadgeClasses(a.overallScore)}`}
                    >
                      {a.overallScore}/100
                    </span>
                  ) : (
                    <Badge>{a.status}</Badge>
                  )}
                </button>
              );
            })}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
