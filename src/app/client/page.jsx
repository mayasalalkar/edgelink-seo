// src/app/client/page.jsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Globe, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime, getScoreBadgeClasses } from '@/lib/utils';

export default function ClientDirectoryPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/clients', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setClients(data.clients || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Client SEO Dashboards
        </h1>
        <p className="text-sm text-slate-600">
          Select a business to view its client-facing SEO scorecard, AI recommendations, and PDF reports.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Loading client portals...</div>
      ) : clients.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-slate-600">
            No clients found. Add a client in the{' '}
            <Link href="/admin" className="font-semibold text-emerald-700 underline">
              Admin Portal
            </Link>{' '}
            first.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => {
            const latest = client.audits?.[0];
            return (
              <Link key={client.id} href={`/client/${client.id}`} className="group">
                <Card className="h-full transition-all group-hover:border-emerald-500 group-hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="group-hover:text-emerald-700">
                        {client.name}
                      </CardTitle>
                      {latest?.overallScore !== null && latest?.overallScore !== undefined ? (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${getScoreBadgeClasses(latest.overallScore)}`}
                        >
                          {latest.overallScore}/100
                        </span>
                      ) : (
                        <Badge>Pending</Badge>
                      )}
                    </div>
                    <CardDescription>{client.businessType}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate">{client.websiteUrl}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        {client.city}, {client.state}, India
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-3 text-xs font-semibold text-emerald-700">
                      <span>
                        {latest ? `Last audit: ${formatDateTime(latest.createdAt)}` : 'No audits yet'}
                      </span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
