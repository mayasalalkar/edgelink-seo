// src/app/api/audit/[id]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  try {
    const { id } = params;
    const audit = await prisma.audit.findUnique({
      where: { id },
      include: {
        client: true,
        notifications: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: audit.id,
      clientId: audit.clientId,
      client: audit.client,
      status: audit.status,
      progress: audit.progress,
      currentStep: audit.currentStep,
      triggeredBy: audit.triggeredBy,
      overallScore: audit.overallScore,
      scoreBreakdown: audit.scoreBreakdown,
      signals: audit.signals,
      result: audit.result,
      pdfPath: audit.pdfPath,
      pdfUrl: audit.status === 'COMPLETED' ? `/api/audit/${audit.id}/pdf` : null,
      errorMessage: audit.errorMessage,
      createdAt: audit.createdAt,
      completedAt: audit.completedAt,
      notifications: audit.notifications,
    });
  } catch (error) {
    console.error('[GET /api/audit/[id]] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch audit status' },
      { status: 500 }
    );
  }
}
