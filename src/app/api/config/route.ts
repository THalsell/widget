import { NextRequest, NextResponse } from 'next/server';
import type { DonationConfig, ApiResponse } from '@/lib/types';
import { DONATION_AMOUNTS, STRIPE_CONFIG, DONATION_LIMITS, WIDGET_DEFAULTS } from '@/lib/constants';
import { prisma } from '@/lib/prisma';

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
    const config = await getConfigForSite(siteId);

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
 * Reads from database, falls back to defaults if not found
 * TODO: Add API key authentication
 * TODO: Add rate limiting
 * @param siteId - Site identifier
 */
async function getConfigForSite(siteId: string): Promise<DonationConfig | null> {
  try {
    // Try to get config from database
    const widgetConfig = await prisma.widgetConfig.findFirst({
      where: {
        siteId,
        isActive: true,
      },
    });

    if (!widgetConfig) {
      // Return default config if not found in database
      return getDefaultConfig(siteId);
    }

    // Transform database config to API format
    return {
      siteId: widgetConfig.siteId,
      organizationName: widgetConfig.organizationName,
      amounts: widgetConfig.amounts as any,
      allowRecurring: widgetConfig.allowRecurring,
      allowCoverageFee: widgetConfig.allowCoverageFee,
      feePercentage: widgetConfig.feePercentage,
      feeFixed: widgetConfig.feeFixed,
      minAmount: widgetConfig.minAmount,
      maxAmount: widgetConfig.maxAmount,
      currency: widgetConfig.currency as 'usd' | 'eur' | 'gbp',
      causes: widgetConfig.causes as any,
      theme: widgetConfig.theme as any,
    };
  } catch (error) {
    console.error('Error fetching widget config from database:', error);
    return null;
  }
}

/**
 * Get default configuration (used when no database config exists)
 * @param siteId - Site identifier
 */
function getDefaultConfig(siteId: string): DonationConfig {
  return {
    siteId,
    organizationName: 'Default Organization',
    amounts: DONATION_AMOUNTS.map((amount) => ({
      value: amount.value,
      label: amount.label,
      default: amount.value === 2000,
    })),
    allowRecurring: true,
    allowCoverageFee: true,
    feePercentage: STRIPE_CONFIG.FEE_PERCENTAGE,
    feeFixed: STRIPE_CONFIG.FEE_FIXED,
    minAmount: DONATION_LIMITS.MIN_AMOUNT,
    maxAmount: DONATION_LIMITS.MAX_AMOUNT,
    currency: WIDGET_DEFAULTS.CURRENCY as 'usd' | 'eur' | 'gbp',
    causes: [
      { id: 'general', name: 'General Fund', description: 'Support our general operations' },
    ],
    theme: {
      mode: 'light',
      primaryColor: '#0070f3',
      borderRadius: 'md',
    },
  };
}
