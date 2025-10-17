import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/widget-configs
 * Returns all widget configurations
 */
export async function GET() {
  try {
    const configs = await prisma.widgetConfig.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ configs });
  } catch (error) {
    console.error('Error fetching widget configs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch widget configurations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/widget-configs
 * Creates a new widget configuration
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.siteId || !body.organizationName) {
      return NextResponse.json(
        { error: 'siteId and organizationName are required' },
        { status: 400 }
      );
    }

    // Check if siteId already exists
    const existing = await prisma.widgetConfig.findUnique({
      where: { siteId: body.siteId },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A widget config with this siteId already exists' },
        { status: 409 }
      );
    }

    // Create new config
    const config = await prisma.widgetConfig.create({
      data: {
        siteId: body.siteId,
        organizationName: body.organizationName,
        amounts: body.amounts || [],
        allowRecurring: body.allowRecurring ?? true,
        allowCoverageFee: body.allowCoverageFee ?? true,
        feePercentage: body.feePercentage ?? 2.9,
        feeFixed: body.feeFixed ?? 30,
        minAmount: body.minAmount ?? 100,
        maxAmount: body.maxAmount ?? 99999900,
        currency: body.currency || 'usd',
        causes: body.causes || null,
        theme: body.theme || null,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json({ config }, { status: 201 });
  } catch (error) {
    console.error('Error creating widget config:', error);
    return NextResponse.json(
      { error: 'Failed to create widget configuration' },
      { status: 500 }
    );
  }
}
