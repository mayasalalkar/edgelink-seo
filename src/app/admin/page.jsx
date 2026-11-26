// src/app/admin/page.jsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Code2,
  Download,
  ExternalLink,
  Play,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AuditProgressBar } from '@/components/AuditProgressBar';
import { AuditDetailPanel } from '@/components/AuditDetailPanel';
import { formatDateTime, getScoreBadgeClasses } from '@/lib/utils';

const INITIAL_FORM = {
  name: '',
  websiteUrl: '',
  businessType: 'Dental Clinic',
  city: 'Pune',
  state: 'Maharashtra',
  whatsapp: '',
  email: '',
};

export default function AdminPortalPage() {
  const [clients, setClients] = useState([]);
  const [audits, setAudits] = useState([]);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [submittingClient, setSubmittingClient] = useState(false);
  const [triggeringClientId, setTriggeringClientId] = useState(null);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      const [clientsRes, auditsRes] = await Promise.all([
        fetch('/api/clients', { cache: 'no-store' }),
        fetch('/api/audits?limit=30', { cache: 'no-store' }),
      ]);
      const clientsData = await clientsRes.json();
      const auditsData = await auditsRes.json();

      if (clientsRes.ok) setClients(clientsData.clients || []);
      if (auditsRes.ok) {
        const list = auditsData.audits || [];
        setAudits(list);
        setSelectedAudit((prev) => {
          if (!prev) return list.find((a) => a.status === 'COMPLETED') || list[0] || null;
          return list.find((a) => a.id === prev.id) || prev;
        });
      }
    } catch (err) {
      setError(err?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Poll GET /api/audit/[id] every 1.5s while any audit is QUEUED or RUNNING
  useEffect(() => {
    const activeAudits = audits.filter(
      (a) => a.status === 'QUEUED' || a.status === 'RUNNING'
    );
    if (activeAudits.length === 0) return undefined;

    const timer = setInterval(async () => {
      try {
        const updates = await Promise.all(
          activeAudits.map((a) =>
            fetch(`/api/audit/${a.id}`, { cache: 'no-store' }).then((r) =>
              r.ok ? r.json() : null
            )
          )
        );

        const validUpdates = updates.filter(Boolean);
        if (validUpdates.length === 0) return;

        const updateMap = new Map(validUpdates.map((u) => [u.id, u]));
        let anyFinished = false;

        setAudits((prev) =>
          prev.map((item) => {
            const fresh = updateMap.get(item.id);
            if (!fresh) return item;
            if (fresh.status === 'COMPLETED' || fresh.status === 'FAILED') {
              anyFinished = true;
            }
            return { ...item, ...fresh };
          })
        );

        setSelectedAudit((prev) => {
          if (!prev) return prev;
          const fresh = updateMap.get(prev.id);
          return fresh ? { ...prev, ...fresh } : prev;
        });

        if (anyFinished) {
          fetchDashboardData();
        }
      } catch {
        // Ignore transient polling errors
      }
    }, 1500);

    return () => clearInterval(timer);
  }, [audits, fetchDashboardData]);

  async function handleTriggerAudit(clientId) {
    setError('');
    setTriggeringClientId(clientId);
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to queue audit');

      // Fetch the newly created audit and start live polling immediately
      const statusRes = await fetch(`/api/audit/${data.auditId}`, { cache: 'no-store' });
      const newAudit = await statusRes.json();
      if (statusRes.ok) {
        setAudits((prev) => [newAudit, ...prev.filter((a) => a.id !== newAudit.id)]);
        setSelectedAudit(newAudit);
      }
      fetchDashboardData();
    } catch (err) {
      setError(err.message);
    } finally {
      setTriggeringClientId(null);
    }
  }

  async function handleCreateClient(e) {
    e.preventDefault();
    setError('');
    setSubmittingClient(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add client');
      setForm(INITIAL_FORM);
      setShowAddForm(false);
      await fetchDashboardData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingClient(false);
    }
  }

  async function handleDeleteClient(clientId, name) {
    if (!window.confirm(`Delete client "${name}" and all its audit records?`)) return;
    try {
      const res = await fetch(`/api/clients/${clientId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete client');
      }
      if (selectedAudit?.clientId === clientId) setSelectedAudit(null);
      await fetchDashboardData();
    } catch (err) {
      setError(err.message);
    }
  }

  const activeCount = audits.filter(
    (a) => a.status === 'QUEUED' || a.status === 'RUNNING'
  ).length;
  const completedCount = audits.filter((a) => a.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Admin Portal — SEO Audit Operations
          </h1>
          <p className="text-sm text-slate-600">
            Manage clients, trigger BullMQ audit jobs, track real-time progress, and inspect reports.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchDashboardData}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowAddForm((v) => !v)}>
            <Plus className="h-4 w-4" />
            {showAddForm ? 'Close Form' : 'Add Client'}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {/* Top KPI Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium text-slate-500">Total Clients</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{clients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium text-slate-500">Active Queue Jobs</div>
            <div className="mt-1 text-2xl font-bold text-amber-600">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium text-slate-500">Completed Audits</div>
            <div className="mt-1 text-2xl font-bold text-emerald-700">{completedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium text-slate-500">Queue Name</div>
            <div className="mt-1 font-mono text-sm font-semibold text-slate-800">
              seo-audit-jobs
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Client Form */}
      {showAddForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Register New Client</CardTitle>
            <CardDescription>
              Client details are injected into the Claude Master SEO Audit Prompt at runtime.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateClient} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Business Name *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="SmileCare Dental Clinic"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Website URL *
                </label>
                <input
                  required
                  value={form.websiteUrl}
                  onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                  placeholder="https://example-dental-clinic.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Business Type *
                </label>
                <input
                  required
                  value={form.businessType}
                  onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                  placeholder="Dental Clinic / Healthcare / Real Estate"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">City *</label>
                <input
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Pune"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">State *</label>
                <input
                  required
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="Maharashtra"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  WhatsApp Number
                </label>
                <input
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="+919820000001"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Client Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="owner@clinic.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={submittingClient} className="w-full sm:w-auto">
                  {submittingClient ? 'Saving...' : 'Save Client'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Clients</CardTitle>
          <CardDescription>
            Click &ldquo;Run Audit&rdquo; to enqueue a new job in BullMQ and watch live progress below.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading clients...</div>
          ) : clients.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              No clients yet. Click &ldquo;Add Client&rdquo; or run <code>npm run db:seed</code>.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-4 py-3">Sector &amp; Location</th>
                  <th className="px-4 py-3">Latest Score</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.map((client) => {
                  const latest = client.audits?.[0];
                  return (
                    <tr key={client.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{client.name}</div>
                        <div className="text-xs text-slate-500">{client.websiteUrl}</div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        <div>{client.businessType}</div>
                        <div className="text-slate-500">
                          {client.city}, {client.state}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {latest ? (
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getScoreBadgeClasses(latest.overallScore)}`}
                          >
                            {latest.overallScore !== null && latest.overallScore !== undefined
                              ? `${latest.overallScore}/100`
                              : latest.status}
                          </span>
                        ) : (
                          <Badge>No audits yet</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            disabled={triggeringClientId === client.id}
                            onClick={() => handleTriggerAudit(client.id)}
                          >
                            <Play className="h-3.5 w-3.5" />
                            {triggeringClientId === client.id ? 'Queuing...' : 'Run Audit'}
                          </Button>
                          <Link
                            href={`/client/${client.id}`}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Client Portal
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                          <button
                            onClick={() => handleDeleteClient(client.id, client.name)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            title="Delete client"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Recent Audits & Live Polling */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Pipeline Queue &amp; History</CardTitle>
          <CardDescription>
            Automatically polls <code>GET /api/audit/[id]</code> every 1.5s for active jobs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {audits.length === 0 ? (
            <p className="text-sm text-slate-500">
              No audit jobs yet. Trigger an audit above to see live progress.
            </p>
          ) : (
            audits.map((audit) => {
              const isSelected = selectedAudit?.id === audit.id;
              return (
                <div
                  key={audit.id}
                  onClick={() => setSelectedAudit(audit)}
                  className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        {audit.client?.name || audit.clientId}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatDateTime(audit.createdAt)}
                      </span>
                      <Badge>{audit.triggeredBy}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {audit.overallScore !== null && audit.overallScore !== undefined ? (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${getScoreBadgeClasses(audit.overallScore)}`}
                        >
                          Score: {audit.overallScore}/100
                        </span>
                      ) : null}
                      {audit.status === 'COMPLETED' ? (
                        <a
                          href={`/api/audit/${audit.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Download className="h-3 w-3" />
                          PDF
                        </a>
                      ) : null}
                    </div>
                  </div>
                  <AuditProgressBar
                    status={audit.status}
                    progress={audit.progress}
                    currentStep={audit.errorMessage || audit.currentStep}
                  />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Selected Audit Inspector */}
      {selectedAudit && selectedAudit.status === 'COMPLETED' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Selected Audit Report</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRawJson((v) => !v)}
            >
              <Code2 className="h-4 w-4" />
              {showRawJson ? 'Hide Claude JSON' : 'Inspect Claude JSON'}
            </Button>
          </div>

          {showRawJson ? (
            <Card>
              <CardHeader>
                <CardTitle>Raw Claude Structured JSON Output</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="max-h-96 overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-emerald-300">
                  {JSON.stringify(selectedAudit.result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ) : null}

          <AuditDetailPanel audit={selectedAudit} />
        </div>
      ) : null}
    </div>
  );
}
