import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import type { ApiResponse } from '@/lib/types';

/**
 * POST /api/verify-payment
 * Verifies a payment intent and returns payment details
 * Used by the success page to show donation confirmation
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
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

    // Retrieve payment intent from Stripe
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(intentId);
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'PAYMENT_INTENT_NOT_FOUND',
          message: 'Payment intent not found',
        },
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Return payment details
    const successResponse: ApiResponse = {
      success: true,
      data: {
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        customerEmail: paymentIntent.receipt_email,
        metadata: paymentIntent.metadata,
        created: paymentIntent.created,
      },
    };

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in /api/verify-payment:', error);

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
