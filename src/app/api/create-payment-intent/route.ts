import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import type { CreatePaymentIntentResponse, ApiResponse } from '@/lib/types';
import { calculateFees, isValidEmail, getCauseName } from '@/lib/utils';
import { DONATION_LIMITS, STRIPE_CONFIG, WIDGET_DEFAULTS } from '@/lib/constants';

/**
 * POST /api/create-payment-intent
 * Creates a Stripe Payment Intent for one-time donations
 * Request body:
 *   - amount: Amount in cents
 *   - causeId: What they're donating to
 *   - coverFees: If true, adjust amount to cover Stripe fees
 *   - email: Donor email address
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_JSON',
          message: 'Request body must be valid JSON',
        },
      };
      return NextResponse.json(errorResponse, {
        status: 400,
        headers: getCorsHeaders(),
      });
    }

    const { amount, causeId, coverFees, email, siteId } = body;

    // Validate required fields
    if (!amount || !causeId || coverFees === undefined || !email || !siteId) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'amount, causeId, coverFees, email, and siteId are required',
        },
      };
      return NextResponse.json(errorResponse, {
        status: 400,
        headers: getCorsHeaders(),
      });
    }

    // Validate amount type and value
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_AMOUNT',
          message: 'amount must be a positive number',
        },
      };
      return NextResponse.json(errorResponse, {
        status: 400,
        headers: getCorsHeaders(),
      });
    }

    // Validate amount limits
    if (amount < DONATION_LIMITS.MIN_AMOUNT || amount > DONATION_LIMITS.MAX_AMOUNT) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'AMOUNT_OUT_OF_BOUNDS',
          message: `amount must be between ${DONATION_LIMITS.MIN_AMOUNT} and ${DONATION_LIMITS.MAX_AMOUNT} cents`,
        },
      };
      return NextResponse.json(errorResponse, {
        status: 400,
        headers: getCorsHeaders(),
      });
    }

    // Validate email
    if (!isValidEmail(email)) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'email must be a valid email address',
        },
      };
      return NextResponse.json(errorResponse, {
        status: 400,
        headers: getCorsHeaders(),
      });
    }

    // Validate causeId
    if (typeof causeId !== 'string' || causeId.trim().length === 0) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_CAUSE_ID',
          message: 'causeId must be a non-empty string',
        },
      };
      return NextResponse.json(errorResponse, {
        status: 400,
        headers: getCorsHeaders(),
      });
    }

    // Fetch widget config to get connected account info
    let widgetConfig;
    try {
      widgetConfig = await prisma.widgetConfig.findUnique({
        where: { siteId },
      });
    } catch (error) {
      console.error('Error fetching widget config:', error);
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: 'Failed to fetch widget configuration',
        },
      };
      return NextResponse.json(errorResponse, {
        status: 500,
        headers: getCorsHeaders(),
      });
    }

    if (!widgetConfig) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'CONFIG_NOT_FOUND',
          message: 'Widget configuration not found for this siteId',
        },
      };
      return NextResponse.json(errorResponse, {
        status: 404,
        headers: getCorsHeaders(),
      });
    }

    if (!widgetConfig.isActive) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'WIDGET_INACTIVE',
          message: 'This widget is currently inactive',
        },
      };
      return NextResponse.json(errorResponse, {
        status: 403,
        headers: getCorsHeaders(),
      });
    }

    // Check if connected account is configured and onboarded
    const useConnectedAccount = widgetConfig.stripeConnectAccountId && widgetConfig.stripeConnectOnboarded;
    const connectedAccountId = widgetConfig.stripeConnectAccountId;
    const platformFeePercentage = widgetConfig.platformFeePercentage;

    // Calculate final amount (with fees if needed)
    let finalAmount = amount;
    let feeAmount = 0;
    if (coverFees === true) {
      const feeCalculation = calculateFees(
        amount,
        STRIPE_CONFIG.FEE_PERCENTAGE,
        STRIPE_CONFIG.FEE_FIXED
      );
      finalAmount = feeCalculation.totalAmount;
      feeAmount = feeCalculation.feeAmount;
    }

    // Calculate platform fee if using connected account
    const platformFee = useConnectedAccount
      ? Math.round(finalAmount * (platformFeePercentage / 100))
      : 0;

    // Get or create Stripe customer
    let customer;
    try {
      const existingCustomers = await stripe.customers.list({
        email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        customer = await stripe.customers.create({
          email,
          metadata: {
            source: 'donation_widget',
          },
        });
      }
    } catch (error) {
      console.error('Error creating/retrieving customer:', error);
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'CUSTOMER_ERROR',
          message: 'Failed to create or retrieve customer',
        },
      };
      return NextResponse.json(errorResponse, {
        status: 500,
        headers: getCorsHeaders(),
      });
    }

    // Create Payment Intent
    // TODO: Add idempotency key support for retry safety
    let paymentIntent;
    try {
      const baseParams = {
        amount: finalAmount,
        currency: WIDGET_DEFAULTS.CURRENCY,
        customer: customer.id,
        receipt_email: email,
        metadata: {
          causeId,
          causeName: getCauseName(causeId),
          feesCovered: String(coverFees),
          originalAmount: String(amount),
          feeAmount: String(feeAmount),
          platformFee: String(platformFee),
          siteId,
          organizationName: widgetConfig.organizationName,
          source: 'donation_widget',
          useConnectedAccount: String(useConnectedAccount),
        },
        statement_descriptor_suffix: 'DONATION',
        automatic_payment_methods: {
          enabled: true,
        },
      };

      // If using connected account, add Stripe Connect parameters
      const paymentIntentParams = useConnectedAccount && connectedAccountId
        ? {
            ...baseParams,
            application_fee_amount: platformFee,
            on_behalf_of: connectedAccountId,
          }
        : baseParams;

      paymentIntent = await stripe.paymentIntents.create(
        paymentIntentParams,
        useConnectedAccount && connectedAccountId
          ? { stripeAccount: connectedAccountId }
          : undefined
      );
    } catch (error) {
      console.error('Error creating payment intent:', error);

      // Handle specific Stripe errors safely without using `any`
      let stripeErrorMessage = 'Failed to create payment intent';
      let stripeErrorType: string | undefined = undefined;

      if (error instanceof Error) {
        stripeErrorMessage = error.message || stripeErrorMessage;
        // Some Stripe errors include a 'type' property; attempt to read it safely
        const maybeTyped = error as unknown as { type?: string };
        stripeErrorType = maybeTyped.type;
      } else if (typeof error === 'object' && error !== null) {
        const errObj = error as { message?: unknown; type?: unknown };
        if (typeof errObj.message === 'string') stripeErrorMessage = errObj.message;
        if (typeof errObj.type === 'string') stripeErrorType = errObj.type;
      }

      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'PAYMENT_INTENT_ERROR',
          message: stripeErrorMessage,
          details: stripeErrorType,
        },
      };

      return NextResponse.json(errorResponse, {
        status: 500,
        headers: getCorsHeaders(),
      });
    }

    // Return successful response
    const successResponse: ApiResponse<CreatePaymentIntentResponse> = {
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
        amount: finalAmount,
        fee: feeAmount,
      },
    };

    return NextResponse.json(successResponse, {
      status: 200,
      headers: getCorsHeaders(),
    });
  } catch (error) {
    console.error('Unexpected error in /api/create-payment-intent:', error);

    const errorResponse: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    };

    return NextResponse.json(errorResponse, {
      status: 500,
      headers: getCorsHeaders(),
    });
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return NextResponse.json({}, { headers: getCorsHeaders() });
}

// ============= Helper Functions =============

/**
 * Get CORS headers to allow cross-origin requests
 * TODO: In production, restrict to specific domains
 */
function getCorsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-cache',
  };
}
