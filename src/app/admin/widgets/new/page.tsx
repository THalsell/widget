'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import WidgetPreview from '@/components/admin/WidgetPreview';
import CausesEditor from '@/components/admin/CausesEditor';

export default function NewWidgetConfigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    siteId: '',
    organizationName: '',
    currency: 'usd',
    allowRecurring: true,
    allowCoverageFee: true,
    feePercentage: 2.9,
    feeFixed: 30,
    minAmount: 100,
    maxAmount: 99999900,
    isActive: true,
    primaryColor: '#0070f3',
    borderRadius: 'md',
    causes: [
      { id: 'general', name: 'General Fund', description: 'Support our general operations' },
    ],
  });

  // Fetch user's organization on mount
  useEffect(() => {
    async function fetchOrganization() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        // Get user's organization
        const { data: userOrg } = await supabase
          .from('user_organizations')
          .select('organizationId, organization:organizations(id, name)')
          .eq('userId', user.id)
          .single();

        if (userOrg && userOrg.organization) {
          const org = userOrg.organization as { id: string; name: string };
          setOrganizationId(org.id);
          setFormData(prev => ({
            ...prev,
            organizationName: org.name,
          }));
        }
      } catch (err) {
        console.error('Error fetching organization:', err);
      }
    }

    fetchOrganization();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!organizationId) {
      setError('Organization not found. Please try refreshing the page.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/widget-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: formData.siteId,
          organizationId: organizationId, // Include organization ID
          organizationName: formData.organizationName,
          currency: formData.currency,
          allowRecurring: formData.allowRecurring,
          allowCoverageFee: formData.allowCoverageFee,
          feePercentage: formData.feePercentage,
          feeFixed: formData.feeFixed,
          minAmount: formData.minAmount,
          maxAmount: formData.maxAmount,
          isActive: formData.isActive,
          amounts: [
            { value: 500, label: '$5', default: false },
            { value: 1000, label: '$10', default: false },
            { value: 1500, label: '$15', default: false },
            { value: 2000, label: '$20', default: true },
            { value: 2500, label: '$25', default: false },
            { value: 3000, label: '$30', default: false },
          ],
          causes: formData.causes,
          theme: {
            mode: 'light',
            primaryColor: formData.primaryColor,
            borderRadius: formData.borderRadius,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create widget configuration');
      }

      router.push('/admin/widgets');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/widgets"
            className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block"
          >
            ← Back to Widgets
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Create Widget Configuration
          </h1>
          <p className="text-gray-600 mt-2">
            Set up a new customizable donation widget and see a live preview
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Split Layout: Form + Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Basic Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Site ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.siteId}
                    onChange={(e) =>
                      setFormData({ ...formData, siteId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., my-nonprofit"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Unique identifier for this widget (alphanumeric, hyphens, underscores)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={formData.organizationName}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    placeholder="Loading organization..."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    From your organization account
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) =>
                      setFormData({ ...formData, currency: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="usd">USD - US Dollar</option>
                    <option value="eur">EUR - Euro</option>
                    <option value="gbp">GBP - British Pound</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Features
              </h2>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.allowRecurring}
                    onChange={(e) =>
                      setFormData({ ...formData, allowRecurring: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Allow recurring donations (monthly/yearly)
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.allowCoverageFee}
                    onChange={(e) =>
                      setFormData({ ...formData, allowCoverageFee: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Allow donors to cover processing fees
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Active (widget is available for use)
                  </span>
                </label>
              </div>
            </div>

            {/* Theme */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Appearance
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) =>
                        setFormData({ ...formData, primaryColor: e.target.value })
                      }
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) =>
                        setFormData({ ...formData, primaryColor: e.target.value })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                      placeholder="#0070f3"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Border Radius
                  </label>
                  <select
                    value={formData.borderRadius}
                    onChange={(e) =>
                      setFormData({ ...formData, borderRadius: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="none">None (sharp corners)</option>
                    <option value="sm">Small (slightly rounded)</option>
                    <option value="md">Medium (rounded)</option>
                    <option value="lg">Large (very rounded)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Causes */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Donation Causes
              </h2>
              <CausesEditor
                causes={formData.causes}
                onChange={(causes) => setFormData({ ...formData, causes })}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-end gap-3">
            <Link
              href="/admin/widgets"
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Widget'}
            </button>
          </div>
        </form>

        {/* Preview Panel */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <WidgetPreview
            organizationName={formData.organizationName || 'Your Organization'}
            primaryColor={formData.primaryColor}
            borderRadius={formData.borderRadius}
            allowRecurring={formData.allowRecurring}
            allowCoverageFee={formData.allowCoverageFee}
            causes={formData.causes}
          />
        </div>
      </div>
      </div>
    </div>
  );
}
