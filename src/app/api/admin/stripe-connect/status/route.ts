import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

/**
 * GET /api/admin/stripe-connect/status?widgetConfigId=xxx
 * Checks Stripe Connect account status and updates onboarding status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const widgetConfigId = searchParams.get('widgetConfigId');

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

    if (!config.stripeConnectAccountId) {
      return NextResponse.json({
        connected: false,
        onboarded: false,
        accountId: null,
      });
    }

    // Fetch account details from Stripe
    const account = await stripe.accounts.retrieve(config.stripeConnectAccountId);

    // Check if charges are enabled (onboarding complete)
    const onboarded = account.charges_enabled && account.payouts_enabled;

    // Update database if onboarding status changed
    if (onboarded !== config.stripeConnectOnboarded) {
      await prisma.widgetConfig.update({
        where: { id: widgetConfigId },
        data: { stripeConnectOnboarded: onboarded },
      });
    }

    return NextResponse.json({
      connected: true,
      onboarded,
      accountId: config.stripeConnectAccountId,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    });
  } catch (error) {
    console.error('Error checking Connect status:', error);
    return NextResponse.json(
      { error: 'Failed to check Connect status' },
      { status: 500 }
    );
  }
}
