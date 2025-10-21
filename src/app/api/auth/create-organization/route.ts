import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/auth/create-organization
 * Creates organization and user record after Supabase signup
 * Uses Supabase REST API (works over HTTPS, bypasses PostgreSQL port blocking)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, email, name, organizationName } = await request.json();

    if (!userId || !email || !organizationName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key for database operations via REST API
    // Service role bypasses RLS and works over HTTPS (no PostgreSQL port needed)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Generate slug from organization name
    const slug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('slug')
      .eq('slug', slug)
      .single();

    const finalSlug = existingOrg
      ? `${slug}-${Math.random().toString(36).substring(7)}`
      : slug;

    // Create user record
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        name,
      })
      .select()
      .single();

    if (userError) {
      console.error('Error creating user:', userError);
      throw new Error('Failed to create user record');
    }

    // Create organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: organizationName,
        slug: finalSlug,
      })
      .select()
      .single();

    if (orgError) {
      console.error('Error creating organization:', orgError);
      throw new Error('Failed to create organization');
    }

    // Link user to organization as admin
    const { error: linkError } = await supabase
      .from('user_organizations')
      .insert({
        userId: user.id,
        organizationId: organization.id,
        role: 'admin',
      });

    if (linkError) {
      console.error('Error linking user to organization:', linkError);
      throw new Error('Failed to link user to organization');
    }

    return NextResponse.json({
      success: true,
      user,
      organization,
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create organization' },
      { status: 500 }
    );
  }
}
