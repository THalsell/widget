import { NextRequest, NextResponse } from 'next/server';
import type { FeeCalculation, ApiResponse } from '@/lib/types';
import { calculateFees } from '@/lib/utils';
import { STRIPE_CONFIG, DONATION_LIMITS } from '@/lib/constants';

/**
 * POST /api/calculate-fees
 * Calculate Stripe processing fees for a donation amount
 * Request body:
 *   - amount (required): Amount in cents
 *   - currency (optional): Currency code (default: 'usd')
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
      return NextResponse.json(errorResponse, {
        status: 400,
        headers: getCorsHeaders(),
      });
    }

    const { amount, currency = 'usd' } = body;

    // Validate amount exists
    if (amount === undefined || amount === null) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_AMOUNT',
          message: 'amount is required in request body',
        },
      };
      return NextResponse.json(errorResponse, {
        status: 400,
        headers: getCorsHeaders(),
      });
    }

    // Validate amount is a number
    if (typeof amount !== 'number' || isNaN(amount)) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_AMOUNT',
          message: 'amount must be a valid number',
        },
      };
      return NextResponse.json(errorResponse, {
        status: 400,
        headers: getCorsHeaders(),
      });
    }

    // Validate amount is positive
    if (amount <= 0) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_AMOUNT',
          message: 'amount must be greater than 0',
        },
      };
      return NextResponse.json(errorResponse, {
        status: 400,
        headers: getCorsHeaders(),
      });
    }

    // Validate amount is within bounds
    if (amount < DONATION_LIMITS.MIN_AMOUNT) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'AMOUNT_TOO_LOW',
          message: `amount must be at least ${DONATION_LIMITS.MIN_AMOUNT} cents ($${DONATION_LIMITS.MIN_AMOUNT / 100})`,
        },
      };
      return NextResponse.json(errorResponse, {
        status: 400,
        headers: getCorsHeaders(),
      });
    }

    if (amount > DONATION_LIMITS.MAX_AMOUNT) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'AMOUNT_TOO_HIGH',
          message: `amount must be at most ${DONATION_LIMITS.MAX_AMOUNT} cents ($${DONATION_LIMITS.MAX_AMOUNT / 100})`,
        },
      };
      return NextResponse.json(errorResponse, {
        status: 400,
        headers: getCorsHeaders(),
      });
    }

    // Validate currency format (basic validation)
    if (typeof currency !== 'string' || currency.length !== 3) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_CURRENCY',
          message: 'currency must be a 3-letter currency code (e.g., "usd")',
        },
      };
      return NextResponse.json(errorResponse, {
        status: 400,
        headers: getCorsHeaders(),
      });
    }

    // Calculate fees
    const feeCalculation: FeeCalculation = calculateFees(
      amount,
      STRIPE_CONFIG.FEE_PERCENTAGE,
      STRIPE_CONFIG.FEE_FIXED
    );

    // Return successful response
    const successResponse: ApiResponse<FeeCalculation> = {
      success: true,
      data: feeCalculation,
    };

    return NextResponse.json(successResponse, {
      status: 200,
      headers: getCorsHeaders(),
    });
  } catch (error) {
    console.error('Error in /api/calculate-fees:', error);

    const errorResponse: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while calculating fees',
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
    'Cache-Control': 'no-cache', // Don't cache fee calculations
  };
}
