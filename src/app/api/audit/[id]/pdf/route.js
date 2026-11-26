// src/app/api/audit/[id]/pdf/route.js
import fs from 'fs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAuditPdf } from '@/services/pdfGenerator';

export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  try {
    const { id } = params;
    const audit = await prisma.audit.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    if (audit.status !== 'COMPLETED' || !audit.result) {
      return NextResponse.json(
        { error: 'Audit report is not ready yet' },
        { status: 409 }
      );
    }

    let pdfPath = audit.pdfPath;
    if (!pdfPath || !fs.existsSync(pdfPath)) {
      // Regenerate seamlessly if ephemeral /tmp/reports was cleared on serverless host
      const generated = await generateAuditPdf(audit.client, audit, audit.result);
      pdfPath = generated.pdfPath;
    }

    const pdfBuffer = fs.readFileSync(pdfPath);
    const safeName = audit.client.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="seo-audit-${safeName || audit.id}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[GET /api/audit/[id]/pdf] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to serve PDF report' },
      { status: 500 }
    );
  }
}
