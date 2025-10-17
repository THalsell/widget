import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import type { ApiResponse } from '@/lib/types';

/**
 * POST /api/verify-setup
 * Verifies a setup intent and returns subscription details
 * Used by the success page to show recurring donation confirmation
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Error parsing JSON in /api/verify-setup:', error);
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_JSON',
          message: 'Request body must be valid JSON',
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { intentId } = body;

    // Validate required fields
    if (!intentId || typeof intentId !== 'string') {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_INTENT_ID',
          message: 'intentId is required',
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Retrieve setup intent from Stripe
    let setupIntent;
    try {
      setupIntent = await stripe.setupIntents.retrieve(intentId);
    } catch (error) {
      console.error('Error retrieving setup intent:', error);
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'SETUP_INTENT_NOT_FOUND',
          message: 'Setup intent not found',
        },
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Get subscription ID from metadata
    const subscriptionId = setupIntent.metadata?.subscriptionId;

    // If we have subscription ID, fetch subscription details
    let subscription;
    if (subscriptionId) {
      try {
        subscription = await stripe.subscriptions.retrieve(subscriptionId);
      } catch (error) {
        console.error('Error retrieving subscription:', error);
      }
    }

    // Determine amount and currency
    let amount = 0;
    let currency = 'usd';

    if (subscription) {
      // Get from subscription
      amount = subscription.items.data[0]?.price.unit_amount || 0;
      currency = subscription.items.data[0]?.price.currency || 'usd';
    } else if (setupIntent.metadata?.originalAmount) {
      // Get from metadata
      amount = parseInt(setupIntent.metadata.originalAmount);
      currency = 'usd'; // Default, could be in metadata too
    }

    // Return setup details
    const successResponse: ApiResponse = {
      success: true,
      data: {
        amount,
        currency,
        status: setupIntent.status,
        customerEmail: subscription?.customer
          ? typeof subscription.customer === 'string'
            ? undefined
            : 'email' in subscription.customer && subscription.customer.email
            ? subscription.customer.email
            : undefined
          : undefined,
        metadata: setupIntent.metadata,
        created: setupIntent.created,
      },
    };

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in /api/verify-setup:', error);

    const errorResponse: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
