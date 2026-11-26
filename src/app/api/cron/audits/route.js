// src/app/api/cron/audits/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditQueue } from '@/lib/queue';
import { runAuditPipeline } from '@/services/auditPipeline';

export const dynamic = 'force-dynamic';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function isAuthorizedCron(req) {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) return false;

  const headerSecret = req.headers.get('x-cron-secret');
  const authHeader = req.headers.get('authorization');
  const bearerSecret = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : null;

  return headerSecret === expectedSecret || bearerSecret === expectedSecret;
}

/**
 * GET /api/cron/audits
 * Called by cron-job.org every minute with secret header (CRON_SECRET).
 * 1. Enqueues monthly audits that are due (no audit in the last 30 days).
 * 2. If RUN_INLINE_WORKER=true (Vercel-only mode without separate worker),
 *    processes a bounded batch of QUEUED jobs cleanly within the function budget.
 */
export async function GET(req) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: 'Unauthorized: invalid CRON_SECRET' }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - THIRTY_DAYS_MS);
    const clients = await prisma.client.findMany({
      include: {
        audits: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { id: true, status: true, createdAt: true },
        },
      },
    });

    const enqueued = [];
    for (const client of clients) {
      const latest = client.audits[0];
      const hasRecentOrActive =
        latest &&
        (latest.status === 'QUEUED' ||
          latest.status === 'RUNNING' ||
          new Date(latest.createdAt) >= cutoff);

      if (!hasRecentOrActive) {
        const audit = await prisma.audit.create({
          data: {
            clientId: client.id,
            status: 'QUEUED',
            progress: 0,
            currentStep: 'Queued by monthly cron',
            triggeredBy: 'cron',
          },
        });
        await auditQueue.add('run-audit', { auditId: audit.id });
        enqueued.push({ clientId: client.id, auditId: audit.id });
      }
    }

    const processedInline = [];
    const runInline = process.env.RUN_INLINE_WORKER === 'true';
    const maxBatch = Math.max(1, Math.min(Number(process.env.CRON_BATCH_SIZE || 1), 3));

    if (runInline) {
      const queuedAudits = await prisma.audit.findMany({
        where: { status: 'QUEUED' },
        orderBy: { createdAt: 'asc' },
        take: maxBatch,
      });

      for (const jobAudit of queuedAudits) {
        try {
          const done = await runAuditPipeline(jobAudit.id);
          processedInline.push({
            auditId: done.id,
            status: done.status,
            overallScore: done.overallScore,
          });
        } catch (err) {
          processedInline.push({
            auditId: jobAudit.id,
            status: 'FAILED',
            error: err?.message || 'Inline execution failed',
          });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      enqueuedCount: enqueued.length,
      enqueued,
      inlineWorkerEnabled: runInline,
      processedInlineCount: processedInline.length,
      processedInline,
    });
  } catch (error) {
    console.error('[GET /api/cron/audits] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Cron execution failed' },
      { status: 500 }
    );
  }
}
