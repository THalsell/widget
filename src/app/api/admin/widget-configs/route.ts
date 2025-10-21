import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/widget-configs
 * Returns widget configurations for the authenticated user's organization
 */
export async function GET() {
  try {
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
      return NextResponse.json({ configs: [] });
    }

    // Get widgets for this organization only
    const { data: configs, error } = await supabase
      .from('widget_configs')
      .select('*')
      .eq('organizationId', userOrg.organizationId)
      .order('createdAt', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ configs: configs || [] });
  } catch (error) {
    console.error('Error fetching widget configs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch widget configurations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/widget-configs
 * Creates a new widget configuration
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.siteId || !body.organizationName) {
      return NextResponse.json(
        { error: 'siteId and organizationName are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if siteId already exists
    const { data: existing } = await supabase
      .from('widget_configs')
      .select('siteId')
      .eq('siteId', body.siteId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A widget config with this siteId already exists' },
        { status: 409 }
      );
    }

    // Generate UUID for the new config
    const { data: uuidData } = await supabase.rpc('gen_random_uuid');
    const newId = uuidData || crypto.randomUUID();

    // Create new config
    const now = new Date().toISOString();
    const { data: config, error } = await supabase
      .from('widget_configs')
      .insert({
        id: newId, // Explicitly set the ID
        siteId: body.siteId,
        organizationId: body.organizationId, // Must be provided
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
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ config }, { status: 201 });
  } catch (error) {
    console.error('Error creating widget config:', error);
    return NextResponse.json(
      { error: 'Failed to create widget configuration' },
      { status: 500 }
    );
  }
}
