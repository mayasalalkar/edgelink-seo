// src/app/api/health/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditQueue } from '@/lib/queue';
import { USE_MOCKS } from '@/mocks';

export const dynamic = 'force-dynamic';

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    useMocks: USE_MOCKS,
    database: 'unknown',
    queue: 'unknown',
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database = 'connected';
  } catch (err) {
    health.database = `error: ${err.message}`;
    health.status = 'degraded';
  }

  try {
    const counts = await auditQueue.getJobCounts('waiting', 'active', 'completed', 'failed');
    health.queue = counts;
  } catch (err) {
    health.queue = `error: ${err.message}`;
    health.status = 'degraded';
  }

  return NextResponse.json(health, { status: health.status === 'ok' ? 200 : 503 });
}
