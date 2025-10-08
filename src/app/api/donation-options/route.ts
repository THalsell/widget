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
    const siteId = searchParams.get('siteId');
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

    // Build donation options response
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

    // If siteId is provided, add site-specific options
    if (siteId) {
      const siteOptions = getSiteSpecificOptions(siteId);
      if (siteOptions) {
        // Merge site-specific options
        Object.assign(donationOptions, siteOptions);
      }
    }

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

/**
 * Get site-specific donation options
 * TODO: Replace with database lookup in production
 * @param siteId - Site identifier
 */
function getSiteSpecificOptions(siteId: string): Partial<DonationOptions> | null {
  // Site-specific configurations
  // In production, this would query a database

  const siteConfigs: Record<string, Partial<DonationOptions>> = {
    'test-site': {
      // Use default amounts, but allow higher maximum for test site
      limits: {
        minAmount: DONATION_LIMITS.MIN_AMOUNT,
        maxAmount: 100000000, // $1,000,000 for testing
        minCustomAmount: DONATION_LIMITS.MIN_AMOUNT,
        maxCustomAmount: 100000000,
      },
    },
    'charity-demo': {
      // Suggest different default amounts for this site
      amounts: [
        { value: 500, label: '$5', default: false },
        { value: 1000, label: '$10', default: true }, // $10 default for this site
        { value: 2500, label: '$25', default: false },
        { value: 5000, label: '$50', default: false },
        { value: 10000, label: '$100', default: false },
      ],
    },
    'nonprofit-org': {
      // Disable custom amounts for this site
      customAmountEnabled: false,
      amounts: [
        { value: 1000, label: '$10', default: false },
        { value: 2000, label: '$20', default: false },
        { value: 5000, label: '$50', default: true }, // $50 default
        { value: 10000, label: '$100', default: false },
      ],
    },
  };

  return siteConfigs[siteId] || null;
}
