import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, DonationOptions } from '@/lib/types';
import { DONATION_AMOUNTS, DONATION_LIMITS, STRIPE_CONFIG, WIDGET_DEFAULTS } from '@/lib/constants';

/**
 * GET /api/donation-options
 * Returns available donation options (amounts, frequencies, limits, etc.)
 * Query parameters:
 *   - siteId (optional): Filter options for a specific site
 *   - currency (optional): Currency code (defaults to usd)
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const currency = searchParams.get('currency') || WIDGET_DEFAULTS.CURRENCY;

    // Validate currency if provided
    if (currency && !isValidCurrency(currency)) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_CURRENCY',
          message: 'currency must be one of: usd, eur, gbp',
        },
      };
      return NextResponse.json(errorResponse, {
        status: 400,
        headers: getCorsHeaders(),
      });
    }

    // Build donation options response (same for all sites)
    const donationOptions: DonationOptions = {
      amounts: DONATION_AMOUNTS.map((amount) => ({
        value: amount.value,
        label: amount.label,
        default: amount.value === 2000, // $20 default
      })),
      frequencies: [
        {
          id: 'once',
          label: 'One-time',
          description: 'Make a single donation',
          default: true,
        },
        {
          id: 'monthly',
          label: 'Monthly',
          description: 'Recurring monthly donation',
          default: false,
        },
        {
          id: 'yearly',
          label: 'Yearly',
          description: 'Recurring yearly donation',
          default: false,
        },
      ],
      limits: {
        minAmount: DONATION_LIMITS.MIN_AMOUNT,
        maxAmount: DONATION_LIMITS.MAX_AMOUNT,
        minCustomAmount: DONATION_LIMITS.MIN_AMOUNT,
        maxCustomAmount: DONATION_LIMITS.MAX_AMOUNT,
      },
      fees: {
        allowCoverageFee: true,
        feePercentage: STRIPE_CONFIG.FEE_PERCENTAGE,
        feeFixed: STRIPE_CONFIG.FEE_FIXED,
        description: `Help cover the ${STRIPE_CONFIG.FEE_PERCENTAGE}% + $${STRIPE_CONFIG.FEE_FIXED / 100} processing fee`,
      },
      currency: currency as 'usd' | 'eur' | 'gbp',
      customAmountEnabled: true,
    };

    // Return successful response
    const successResponse: ApiResponse<DonationOptions> = {
      success: true,
      data: donationOptions,
    };

    return NextResponse.json(successResponse, {
      status: 200,
      headers: getCorsHeaders(),
    });
  } catch (error) {
    console.error('Error in /api/donation-options:', error);

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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
  };
}

/**
 * Validate currency code
 * @param currency - Currency code to validate
 */
function isValidCurrency(currency: string): boolean {
  const validCurrencies = ['usd', 'eur', 'gbp'];
  return validCurrencies.includes(currency.toLowerCase());
}
