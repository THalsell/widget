import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import type { CreateSubscriptionResponse, ApiResponse, SubscriptionRequest } from '@/lib/types';
import { calculateFees, isValidEmail } from '@/lib/utils';
import { DONATION_LIMITS, STRIPE_CONFIG } from '@/lib/constants';

/**
 * POST /api/create-subscription
 * Creates a Stripe Subscription for recurring donations
 * Request body:
 *   - amount: Amount in cents
 *   - causeId: What they're donating to
 *   - frequency: Payment frequency (monthly or yearly)
 *   - coverFees: If true, adjust amount to cover Stripe fees
 *   - email: Donor email address
 *   - donorName: Optional donor name
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: SubscriptionRequest;
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

    const { amount, causeId, frequency, coverFees, email, metadata } = body;

    // Validate required fields
    if (!amount || !causeId || !frequency || coverFees === undefined || !email) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'amount, causeId, frequency, coverFees, and email are required',
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

    // Validate frequency
    if (!['monthly', 'yearly'].includes(frequency)) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_FREQUENCY',
          message: 'frequency must be either "monthly" or "yearly"',
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

    // Get or create Stripe customer
    let customer;
    try {
      const existingCustomers = await stripe.customers.list({
        email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];

        // Update customer name if provided and different
        if (metadata?.donorName && customer.name !== metadata.donorName) {
          customer = await stripe.customers.update(customer.id, {
            name: metadata.donorName,
          });
        }
      } else {
        customer = await stripe.customers.create({
          email,
          name: metadata?.donorName,
          metadata: {
            source: 'donation_widget',
            organizationId: 'widget-001',
            ...metadata,
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

    // Create or retrieve product for recurring donations
    let product;
    try {
      // Search for existing recurring donation product
      const products = await stripe.products.list({
        active: true,
        limit: 1,
      });

      const existingProduct = products.data.find(
        (p) => p.metadata.type === 'recurring_donation'
      );

      if (existingProduct) {
        product = existingProduct;
      } else {
        product = await stripe.products.create({
          name: 'Recurring Donation',
          description: 'Monthly or yearly recurring donation',
          metadata: {
            type: 'recurring_donation',
          },
        });
      }
    } catch (error) {
      console.error('Error creating/retrieving product:', error);
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'PRODUCT_ERROR',
          message: 'Failed to create or retrieve product',
        },
      };
      return NextResponse.json(errorResponse, {
        status: 500,
        headers: getCorsHeaders(),
      });
    }

    // Create price for this subscription
    let price;
    try {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: finalAmount,
        currency: 'usd',
        recurring: {
          interval: frequency === 'monthly' ? 'month' : 'year',
        },
        metadata: {
          causeId,
          causeName: getCauseName(causeId),
          feesCovered: String(coverFees),
          originalAmount: String(amount),
        },
      });
    } catch (error) {
      console.error('Error creating price:', error);
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'PRICE_ERROR',
          message: 'Failed to create price',
        },
      };
      return NextResponse.json(errorResponse, {
        status: 500,
        headers: getCorsHeaders(),
      });
    }

    // Create a setup intent first for collecting payment method
    // This is required for subscriptions to collect the payment method upfront
    let setupIntent;
    try {
      setupIntent = await stripe.setupIntents.create({
        customer: customer.id,
        payment_method_types: ['card'],
        metadata: {
          causeId,
          causeName: getCauseName(causeId),
          subscriptionType: 'recurring_donation',
          frequency,
        },
      });
    } catch (error) {
      console.error('Error creating setup intent:', error);
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'SETUP_INTENT_ERROR',
          message: 'Failed to create setup intent',
        },
      };
      return NextResponse.json(errorResponse, {
        status: 500,
        headers: getCorsHeaders(),
      });
    }

    // Create subscription with payment pending
    // TODO: Add idempotency key support for retry safety
    let subscription;
    try {
      subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [
          {
            price: price.id,
          },
        ],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
        metadata: {
          causeId,
          causeName: getCauseName(causeId),
          feesCovered: String(coverFees),
          originalAmount: String(amount),
          feeAmount: String(feeAmount),
          frequency,
          source: 'donation_widget',
          setupIntentId: setupIntent.id,
          ...metadata,
        },
      });
    } catch (error) {
      console.error('Error creating subscription:', error);

      // Handle specific Stripe errors
      const stripeError = error as unknown;
      let message = 'Failed to create subscription';
      let type: string | undefined = undefined;
      if (typeof stripeError === 'object' && stripeError !== null) {
        if ('message' in stripeError && typeof (stripeError as { message?: unknown }).message === 'string') {
          message = (stripeError as { message: string }).message;
        }
        if ('type' in stripeError && typeof (stripeError as { type?: unknown }).type === 'string') {
          type = (stripeError as { type: string }).type;
        }
      }
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'SUBSCRIPTION_ERROR',
          message,
          details: type,
        },
      };

      return NextResponse.json(errorResponse, {
        status: 500,
        headers: getCorsHeaders(),
      });
    }

    const clientSecret = setupIntent.client_secret ?? '';

    // Return successful response
    const successResponse: ApiResponse<CreateSubscriptionResponse> = {
      success: true,
      data: {
        clientSecret,
        subscriptionId: subscription.id,
        amount: finalAmount,
      },
    };

    return NextResponse.json(successResponse, {
      status: 200,
      headers: getCorsHeaders(),
    });
  } catch (error) {
    console.error('Unexpected error in /api/create-subscription:', error);

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

/**
 * Get human-readable cause name
 * TODO: Replace with actual database/config lookup
 * @param causeId - Cause identifier
 */
function getCauseName(causeId: string): string {
  // Static mapping for now
  const causeNames: Record<string, string> = {
    'general': 'General Fund',
    'education': 'Education Programs',
    'emergency': 'Emergency Relief',
    'water': 'Clean Water',
    'food': 'Food Security',
    'healthcare': 'Healthcare',
    'operations': 'Operations',
    'programs': 'Programs',
  };

  return causeNames[causeId] || 'General Donation';
}
