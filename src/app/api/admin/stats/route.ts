import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get total stats
    const [
      totalDonations,
      donationCount,
      activeSubscriptions,
      totalDonors,
      recentDonations,
      topDonors,
      subscriptionsList,
    ] = await Promise.all([
      // Total amount raised (succeeded donations only)
      prisma.donation.aggregate({
        where: { status: 'succeeded' },
        _sum: { amount: true },
      }),

      // Total donation count
      prisma.donation.count({
        where: { status: 'succeeded' },
      }),

      // Active subscriptions count
      prisma.subscription.count({
        where: { status: 'active' },
      }),

      // Total unique donors
      prisma.donor.count(),

      // Recent donations (last 50)
      prisma.donation.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          donor: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      }),

      // Top donors by total amount
      prisma.donor.findMany({
        take: 10,
        include: {
          donations: {
            where: { status: 'succeeded' },
            select: {
              amount: true,
            },
          },
          _count: {
            select: {
              donations: true,
            },
          },
        },
      }),

      // Active subscriptions
      prisma.subscription.findMany({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
        include: {
          donor: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      }),
    ]);

    // Calculate total for top donors
    const topDonorsWithTotals = topDonors
      .map((donor) => ({
        ...donor,
        totalAmount: donor.donations.reduce((sum, d) => sum + d.amount, 0),
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    return NextResponse.json({
      stats: {
        totalRaised: totalDonations._sum.amount || 0,
        donationCount,
        activeSubscriptions,
        totalDonors,
      },
      recentDonations,
      topDonors: topDonorsWithTotals,
      subscriptions: subscriptionsList,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
