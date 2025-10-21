import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/widget-configs/[id]
 * Returns a specific widget configuration for the authenticated user's organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get authenticated user
    const supabaseAuth = await createServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Use service role for database queries
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user's organization
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('organizationId')
      .eq('userId', user.id)
      .single();

    if (!userOrg) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get widget config - must belong to user's organization
    const { data: config, error } = await supabase
      .from('widget_configs')
      .select('*')
      .eq('id', id)
      .eq('organizationId', userOrg.organizationId)
      .single();

    if (error || !config) {
      return NextResponse.json(
        { error: 'Widget configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error fetching widget config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch widget configuration' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/widget-configs/[id]
 * Updates a widget configuration
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get authenticated user
    const supabaseAuth = await createServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Use service role for database queries
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user's organization
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('organizationId')
      .eq('userId', user.id)
      .single();

    if (!userOrg) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Verify widget belongs to user's organization
    const { data: existingConfig } = await supabase
      .from('widget_configs')
      .select('id, organizationId')
      .eq('id', id)
      .eq('organizationId', userOrg.organizationId)
      .single();

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'Widget configuration not found or access denied' },
        { status: 404 }
      );
    }

    // Update the config
    const now = new Date().toISOString();
    const { data: config, error } = await supabase
      .from('widget_configs')
      .update({
        siteId: body.siteId,
        organizationName: body.organizationName,
        amounts: body.amounts || [],
        allowRecurring: body.allowRecurring ?? true,
        allowCoverageFee: body.allowCoverageFee ?? true,
        feePercentage: body.feePercentage ?? 2.9,
        feeFixed: body.feeFixed ?? 30,
        minAmount: body.minAmount ?? 100,
        maxAmount: body.maxAmount ?? 99999900,
        currency: body.currency || 'usd',
        causes: body.causes || null,
        theme: body.theme || null,
        isActive: body.isActive ?? true,
        updatedAt: now,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error updating widget config:', error);
    return NextResponse.json(
      { error: 'Failed to update widget configuration' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/widget-configs/[id]
 * Deletes a widget configuration
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get authenticated user
    const supabaseAuth = await createServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Use service role for database queries
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user's organization
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('organizationId')
      .eq('userId', user.id)
      .single();

    if (!userOrg) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Delete widget - must belong to user's organization
    const { error } = await supabase
      .from('widget_configs')
      .delete()
      .eq('id', id)
      .eq('organizationId', userOrg.organizationId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting widget config:', error);
    return NextResponse.json(
      { error: 'Failed to delete widget configuration' },
      { status: 500 }
    );
  }
}
