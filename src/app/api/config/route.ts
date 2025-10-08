import { NextRequest, NextResponse } from 'next/server';
import type { DonationConfig, ApiResponse } from '@/lib/types';
import { DONATION_AMOUNTS, STRIPE_CONFIG, DONATION_LIMITS } from '@/lib/constants';

/**
 * GET /api/config
 * Returns widget configuration for a given site
 * Query parameters:
 *   - siteId (required): Identifier for the site requesting configuration
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get('siteId');

    // Validate siteId
    if (!siteId) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_SITE_ID',
          message: 'siteId query parameter is required',
        },
      };
      return NextResponse.json(errorResponse, {
        status: 400,
        headers: getCorsHeaders(),
      });
    }

    // Validate siteId format (alphanumeric, hyphens, underscores, reasonable length)
    if (!isValidSiteId(siteId)) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_SITE_ID',
          message: 'siteId must be alphanumeric with hyphens/underscores (max 64 characters)',
        },
      };
      return NextResponse.json(errorResponse, {
        status: 400,
        headers: getCorsHeaders(),
      });
    }

    // Get configuration for the site
    const config = getConfigForSite(siteId);

    if (!config) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: 'SITE_NOT_FOUND',
          message: `No configuration found for siteId: ${siteId}`,
        },
      };
      return NextResponse.json(errorResponse, {
        status: 404,
        headers: getCorsHeaders(),
      });
    }

    // Return successful response
    const successResponse: ApiResponse<DonationConfig> = {
      success: true,
      data: config,
    };

    return NextResponse.json(successResponse, {
      status: 200,
      headers: getCorsHeaders(),
    });
  } catch (error) {
    console.error('Error in /api/config:', error);

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
 * Validate siteId format
 * @param siteId - Site identifier to validate
 */
function isValidSiteId(siteId: string): boolean {
  // Alphanumeric, hyphens, underscores, max 64 characters
  const regex = /^[a-zA-Z0-9_-]{1,64}$/;
  return regex.test(siteId);
}

/**
 * Get configuration for a specific site
 * TODO: Replace with database lookup in production
 * TODO: Add API key authentication
 * TODO: Add rate limiting
 * @param siteId - Site identifier
 */
function getConfigForSite(siteId: string): DonationConfig | null {
  // Static configurations for different sites
  // In production, this would query a database

  const baseConfig = {
    amounts: DONATION_AMOUNTS.map((amount) => ({
      value: amount.value,
      label: amount.label,
      default: amount.value === 2000, // $20 default
    })),
    allowRecurring: true,
    allowCoverageFee: true,
    feePercentage: STRIPE_CONFIG.FEE_PERCENTAGE,
    feeFixed: STRIPE_CONFIG.FEE_FIXED,
    minAmount: DONATION_LIMITS.MIN_AMOUNT,
    maxAmount: DONATION_LIMITS.MAX_AMOUNT,
    currency: 'usd' as const,
  };

  // Example configurations for different sites
  const configs: Record<string, DonationConfig> = {
    'test-site': {
      siteId: 'test-site',
      organizationName: 'Test Organization',
      ...baseConfig,
      causes: [
        { id: 'general', name: 'General Fund', description: 'Support our general operations' },
        { id: 'education', name: 'Education Programs', description: 'Fund educational initiatives' },
        { id: 'emergency', name: 'Emergency Relief', description: 'Provide emergency assistance' },
      ],
      theme: {
        mode: 'light',
        primaryColor: '#0070f3',
        borderRadius: 'md',
      },
    },
    'charity-demo': {
      siteId: 'charity-demo',
      organizationName: 'Demo Charity',
      ...baseConfig,
      causes: [
        { id: 'water', name: 'Clean Water', description: 'Provide clean water access' },
        { id: 'food', name: 'Food Security', description: 'Fight hunger and malnutrition' },
        { id: 'healthcare', name: 'Healthcare', description: 'Medical care for communities' },
      ],
      theme: {
        mode: 'light',
        primaryColor: '#10b981',
        borderRadius: 'lg',
      },
    },
    'nonprofit-org': {
      siteId: 'nonprofit-org',
      organizationName: 'Nonprofit Organization',
      ...baseConfig,
      causes: [
        { id: 'operations', name: 'Operations', description: 'Day-to-day operations' },
        { id: 'programs', name: 'Programs', description: 'Community programs' },
      ],
      theme: {
        mode: 'dark',
        primaryColor: '#8b5cf6',
        borderRadius: 'sm',
      },
    },
  };

  return configs[siteId] || null;
}
