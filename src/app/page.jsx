// src/app/page.jsx
import Link from 'next/link';
import { ArrowRight, Bot, FileText, Layers, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  const pipelineHighlights = [
    {
      icon: Layers,
      title: '7-Step Async Crawler Pipeline',
      desc: 'Fetch + Cheerio, PageSpeed Insights, GSC, Schema.org validator, On-page, robots.txt/sitemap.xml, and DataForSEO queued on BullMQ + Upstash Redis.',
    },
    {
      icon: Bot,
      title: 'Claude Sonnet 4.6 Analysis',
      desc: 'Produces strict, falsifiable JSON SEO recommendations tailored for Indian local businesses behind a clean USE_MOCKS toggle.',
    },
    {
      icon: FileText,
      title: 'Automated PDF & Notifications',
      desc: 'Generates downloadable Puppeteer PDF audit reports in /tmp/reports/ and dispatches WhatsApp & Email notifications logged in Postgres.',
    },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 px-8 py-12 text-white shadow-md">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide">
            Edgelink Technology — SEO Automation Dashboard
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Automated Website SEO Audits, AI Recommendations &amp; PDF Delivery
          </h1>
          <p className="text-sm leading-relaxed text-emerald-50 sm:text-base">
            Dual-portal platform built with Next.js 14 App Router, BullMQ + Upstash Redis,
            Prisma (Supabase / Neon Postgres), Anthropic Claude API, and Puppeteer PDF generation.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-50"
            >
              <ShieldCheck className="h-4 w-4" />
              Open Admin Portal
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/client"
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <LayoutDashboard className="h-4 w-4" />
              Open Client Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {pipelineHighlights.map(({ icon: Icon, title, desc }) => (
          <Card key={title}>
            <CardHeader>
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <Icon className="h-5 w-5" />
              </div>
              <CardTitle>{title}</CardTitle>
              <CardDescription className="text-xs leading-relaxed text-slate-600">
                {desc}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Internal Admin Portal</CardTitle>
            <CardDescription>For SEO engineers and agency operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>
              Add clients, trigger manual BullMQ audit jobs, monitor live 0–100% worker step
              progress via polling, inspect Claude JSON outputs, and download PDF reports.
            </p>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Go to /admin <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client-Facing Dashboard</CardTitle>
            <CardDescription>Shareable executive SEO scorecard for clients</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>
              View overall SEO health score, category score breakdown, plain-English executive
              summary, quick wins, prioritized fixes with verification checks, and past audits.
            </p>
            <Link
              href="/client"
              className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Go to /client <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
