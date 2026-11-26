// src/app/api/clients/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        audits: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            progress: true,
            currentStep: true,
            overallScore: true,
            createdAt: true,
            completedAt: true,
          },
        },
      },
    });

    return NextResponse.json({ clients });
  } catch (error) {
    console.error('[GET /api/clients] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to list clients' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, websiteUrl, businessType, city, state, whatsapp, email } = body || {};

    if (!name || !websiteUrl || !businessType || !city || !state) {
      return NextResponse.json(
        { error: 'name, websiteUrl, businessType, city, and state are required' },
        { status: 400 }
      );
    }

    const normalizedUrl = /^https?:\/\//i.test(websiteUrl.trim())
      ? websiteUrl.trim()
      : `https://${websiteUrl.trim()}`;

    const client = await prisma.client.create({
      data: {
        name: name.trim(),
        websiteUrl: normalizedUrl,
        businessType: businessType.trim(),
        city: city.trim(),
        state: state.trim(),
        whatsapp: whatsapp?.trim() || null,
        email: email?.trim() || null,
      },
    });

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'A client with this websiteUrl already exists' },
        { status: 409 }
      );
    }
    console.error('[POST /api/clients] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create client' },
      { status: 500 }
    );
  }
}
