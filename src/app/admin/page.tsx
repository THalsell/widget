'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  totalRaised: number;
  donationCount: number;
  activeSubscriptions: number;
  totalDonors: number;
}

interface Donation {
  id: string;
  amount: number;
  currency: string;
  status: string;
  frequency: string;
  causeName: string | null;
  feesCovered: boolean;
  createdAt: string;
  donor: {
    email: string;
    name: string | null;
  };
}

interface Donor {
  id: string;
  email: string;
  name: string | null;
  totalAmount: number;
  donations: Array<{ amount: number }>;
  _count: {
    donations: number;
  };
}

interface Subscription {
  id: string;
  amount: number;
  currency: string;
  frequency: string;
  status: string;
  causeName: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
  donor: {
    email: string;
    name: string | null;
  };
}

interface DashboardData {
  stats: Stats;
  recentDonations: Donation[];
  topDonors: Donor[];
  subscriptions: Subscription[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/admin/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 text-xl font-semibold mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Monitor donations, subscriptions, and donor activity
            </p>
          </div>
          <Link
            href="/admin/widgets"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Manage Widgets
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Raised"
            value={formatCurrency(data.stats.totalRaised)}
            icon="💰"
          />
          <StatCard
            title="Total Donations"
            value={data.stats.donationCount.toString()}
            icon="🎁"
          />
          <StatCard
            title="Active Subscriptions"
            value={data.stats.activeSubscriptions.toString()}
            icon="🔄"
          />
          <StatCard
            title="Total Donors"
            value={data.stats.totalDonors.toString()}
            icon="👥"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Recent Donations */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recent Donations
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.recentDonations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No donations yet
                </p>
              ) : (
                data.recentDonations.map((donation) => (
                  <div
                    key={donation.id}
                    className="border-b border-gray-100 pb-3 last:border-0"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <p className="font-medium text-gray-900">
                          {donation.donor.name || donation.donor.email}
                        </p>
                        <p className="text-sm text-gray-500">
                          {donation.causeName || 'General'}
                          {donation.feesCovered && ' • Fees Covered'}
                        </p>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(donation.amount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="capitalize">{donation.frequency}</span>
                      <span>•</span>
                      <span>{formatDate(donation.createdAt)}</span>
                      <span>•</span>
                      <span
                        className={`capitalize ${
                          donation.status === 'succeeded'
                            ? 'text-green-600'
                            : 'text-gray-500'
                        }`}
                      >
                        {donation.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Donors */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Top Donors
            </h2>
            <div className="space-y-3">
              {data.topDonors.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No donors yet</p>
              ) : (
                data.topDonors.map((donor, index) => (
                  <div
                    key={donor.id}
                    className="border-b border-gray-100 pb-3 last:border-0"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">
                            {donor.name || donor.email}
                          </p>
                          <p className="text-sm text-gray-500">
                            {donor._count.donations} donation
                            {donor._count.donations !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(donor.totalAmount)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Active Subscriptions
          </h2>
          {data.subscriptions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No active subscriptions
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                      Donor
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                      Amount
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                      Frequency
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                      Cause
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                      Next Payment
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.subscriptions.map((sub) => (
                    <tr
                      key={sub.id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="py-3 px-2">
                        <p className="font-medium text-gray-900">
                          {sub.donor.name || sub.donor.email}
                        </p>
                      </td>
                      <td className="py-3 px-2 text-gray-700">
                        {formatCurrency(sub.amount)}
                      </td>
                      <td className="py-3 px-2 text-gray-700 capitalize">
                        {sub.frequency}
                      </td>
                      <td className="py-3 px-2 text-gray-700">
                        {sub.causeName || 'General'}
                      </td>
                      <td className="py-3 px-2 text-gray-700 text-sm">
                        {sub.currentPeriodEnd
                          ? formatDate(sub.currentPeriodEnd)
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
