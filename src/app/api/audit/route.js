// src/app/api/audit/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditQueue } from '@/lib/queue';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const { clientId, triggeredBy = 'manual' } = body || {};

    if (!clientId) {
      return NextResponse.json({ error: 'clientId required' }, { status: 400 });
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const audit = await prisma.audit.create({
      data: {
        clientId,
        status: 'QUEUED',
        progress: 0,
        currentStep: 'Queued in BullMQ (seo-audit-jobs)',
        triggeredBy,
      },
    });

    await auditQueue.add('run-audit', { auditId: audit.id });

    return NextResponse.json({ auditId: audit.id }, { status: 202 });
  } catch (error) {
    console.error('[POST /api/audit] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to enqueue audit' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const audits = await prisma.audit.findMany({
      take: 30,
      orderBy: { createdAt: 'desc' },
      include: {
        client: true,
        notifications: true,
      },
    });
    return NextResponse.json({ audits });
  } catch (error) {
    console.error('[GET /api/audit] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to list audits' },
      { status: 500 }
    );
  }
}
