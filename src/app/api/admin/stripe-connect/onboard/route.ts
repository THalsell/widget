import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

/**
 * POST /api/admin/stripe-connect/onboard
 * Creates or retrieves Stripe Connect account and generates onboarding link
 */
export async function POST(request: NextRequest) {
  try {
    const { widgetConfigId } = await request.json();

    if (!widgetConfigId) {
      return NextResponse.json(
        { error: 'Widget config ID is required' },
        { status: 400 }
      );
    }

    // Get widget config
    const config = await prisma.widgetConfig.findUnique({
      where: { id: widgetConfigId },
    });

    if (!config) {
      return NextResponse.json(
        { error: 'Widget configuration not found' },
        { status: 404 }
      );
    }

    let accountId = config.stripeConnectAccountId;

    // Create Connect account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'standard', // Use 'standard' for full Stripe Dashboard access
        email: request.headers.get('x-user-email') || undefined,
        metadata: {
          widgetConfigId: config.id,
          siteId: config.siteId,
          organizationName: config.organizationName,
        },
      });

      accountId = account.id;

      // Save account ID to database
      await prisma.widgetConfig.update({
        where: { id: widgetConfigId },
        data: { stripeConnectAccountId: accountId },
      });
    }

    // Generate account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/widgets/${config.id}?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/widgets/${config.id}?onboarding=success`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      success: true,
      url: accountLink.url,
      accountId,
    });
  } catch (error) {
    console.error('Error creating Connect onboarding link:', error);
    return NextResponse.json(
      { error: 'Failed to create onboarding link' },
      { status: 500 }
    );
  }
}
