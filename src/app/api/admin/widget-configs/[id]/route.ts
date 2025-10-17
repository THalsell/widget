import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/widget-configs/[id]
 * Returns a specific widget configuration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const config = await prisma.widgetConfig.findUnique({
      where: { id },
    });

    if (!config) {
      return NextResponse.json(
        { error: 'Widget configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error fetching widget config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch widget configuration' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/widget-configs/[id]
 * Updates a widget configuration
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if config exists
    const existing = await prisma.widgetConfig.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Widget configuration not found' },
        { status: 404 }
      );
    }

    // If siteId is being changed, check for conflicts
    if (body.siteId && body.siteId !== existing.siteId) {
      const conflict = await prisma.widgetConfig.findUnique({
        where: { siteId: body.siteId },
      });

      if (conflict) {
        return NextResponse.json(
          { error: 'A widget config with this siteId already exists' },
          { status: 409 }
        );
      }
    }

    // Update config
    const config = await prisma.widgetConfig.update({
      where: { id },
      data: {
        siteId: body.siteId,
        organizationName: body.organizationName,
        amounts: body.amounts,
        allowRecurring: body.allowRecurring,
        allowCoverageFee: body.allowCoverageFee,
        feePercentage: body.feePercentage,
        feeFixed: body.feeFixed,
        minAmount: body.minAmount,
        maxAmount: body.maxAmount,
        currency: body.currency,
        causes: body.causes,
        theme: body.theme,
        isActive: body.isActive,
      },
    });

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error updating widget config:', error);
    return NextResponse.json(
      { error: 'Failed to update widget configuration' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/widget-configs/[id]
 * Deletes a widget configuration
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if config exists
    const existing = await prisma.widgetConfig.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Widget configuration not found' },
        { status: 404 }
      );
    }

    // Delete config
    await prisma.widgetConfig.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Widget configuration deleted' });
  } catch (error) {
    console.error('Error deleting widget config:', error);
    return NextResponse.json(
      { error: 'Failed to delete widget configuration' },
      { status: 500 }
    );
  }
}
