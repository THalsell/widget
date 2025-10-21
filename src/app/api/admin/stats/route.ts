import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

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

    // Get user's organization
    const userOrg = await prisma.userOrganization.findFirst({
      where: { userId: user.id },
      include: { organization: true }
    });

    if (!userOrg) {
      return NextResponse.json({
        stats: {
          totalRaised: 0,
          donationCount: 0,
          activeSubscriptions: 0,
          totalDonors: 0,
        },
        recentDonations: [],
        topDonors: [],
        subscriptions: [],
      });
    }

    // Get all widgets for this organization
    const orgWidgets = await prisma.widgetConfig.findMany({
      where: { organizationId: userOrg.organizationId },
      select: { id: true }
    });

    const widgetIds = orgWidgets.map(w => w.id);

    // If no widgets yet, return empty stats
    if (widgetIds.length === 0) {
      return NextResponse.json({
        stats: {
          totalRaised: 0,
          donationCount: 0,
          activeSubscriptions: 0,
          totalDonors: 0,
        },
        recentDonations: [],
        topDonors: [],
        subscriptions: [],
      });
    }

    // Get stats for this organization's widgets
    // NOTE: Currently showing all donations because Donation model doesn't have
    // widgetConfigId field yet. TODO: Add widgetConfigId to Donation model to filter properly
    const donations = await prisma.donation.findMany({
      where: {
        status: 'succeeded',
      },
      include: {
        donor: true
      }
    });

    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
      },
      include: {
        donor: true
      }
    });

    // Calculate total raised
    const totalRaised = donations.reduce((sum, d) => sum + d.amount, 0);

    // Get unique donors
    const uniqueDonorIds = new Set(donations.map(d => d.donorId));
    const totalDonors = uniqueDonorIds.size;

    // Get recent donations (last 10)
    const recentDonations = await prisma.donation.findMany({
      where: {
        status: 'succeeded',
      },
      include: {
        donor: {
          select: {
            email: true,
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Get top donors
    const donorStats = await prisma.donor.findMany({
      include: {
        donations: {
          where: {
            status: 'succeeded',
          },
          select: {
            amount: true
          }
        },
        _count: {
          select: {
            donations: true
          }
        }
      }
    });

    const topDonors = donorStats
      .map(donor => ({
        ...donor,
        totalAmount: donor.donations.reduce((sum, d) => sum + d.amount, 0)
      }))
      .filter(donor => donor.totalAmount > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    return NextResponse.json({
      stats: {
        totalRaised,
        donationCount: donations.length,
        activeSubscriptions: activeSubscriptions.length,
        totalDonors,
      },
      recentDonations,
      topDonors,
      subscriptions: activeSubscriptions,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
