// src/app/api/clients/[id]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        audits: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            notifications: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error('[GET /api/clients/[id]] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch client' },
      { status: 500 }
    );
  }
}

export async function DELETE(_req, { params }) {
  try {
    const clientId = params.id;
    const audits = await prisma.audit.findMany({
      where: { clientId },
      select: { id: true },
    });
    const auditIds = audits.map((a) => a.id);

    if (auditIds.length > 0) {
      await prisma.notification.deleteMany({ where: { auditId: { in: auditIds } } });
      await prisma.audit.deleteMany({ where: { clientId } });
    }

    await prisma.client.delete({ where: { id: clientId } });
    return NextResponse.json({ deleted: true, clientId });
  } catch (error) {
    console.error('[DELETE /api/clients/[id]] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete client' },
      { status: 500 }
    );
  }
}
