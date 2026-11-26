// src/app/api/audits/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId') || undefined;
    const limit = Math.min(Number(searchParams.get('limit') || 50), 100);

    const audits = await prisma.audit.findMany({
      where: clientId ? { clientId } : undefined,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        client: true,
        notifications: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json({ audits });
  } catch (error) {
    console.error('[GET /api/audits] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to load audits' },
      { status: 500 }
    );
  }
}
