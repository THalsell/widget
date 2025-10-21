'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminNav from '@/components/admin/AdminNav';

interface WidgetConfig {
  id: string;
  siteId: string;
  organizationName: string;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function WidgetConfigsPage() {
  const [configs, setConfigs] = useState<WidgetConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  async function fetchConfigs() {
    try {
      const response = await fetch('/api/admin/widget-configs');
      if (!response.ok) {
        throw new Error('Failed to fetch widget configurations');
      }
      const data = await response.json();
      setConfigs(data.configs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function deleteConfig(id: string) {
    if (!confirm('Are you sure you want to delete this widget configuration?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/widget-configs/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete configuration');
      }

      // Refresh the list
      fetchConfigs();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading configurations...</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Widget Configurations</h1>
            <p className="text-gray-600 mt-2">
              Manage and customize your donation widgets
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/admin"
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ← Back to Dashboard
            </Link>
            <Link
              href="/admin/widgets/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + New Widget
            </Link>
          </div>
        </div>

        {/* Configurations List */}
        {configs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="max-w-md mx-auto">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No widget configurations yet
              </h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first customizable donation widget.
              </p>
              <Link
                href="/admin/widgets/new"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + New Widget
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                    Site ID
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                    Organization
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                    Currency
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                    Created
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {configs.map((config) => (
                  <tr key={config.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-4 px-6">
                      <span className="font-mono text-sm font-medium text-gray-900">
                        {config.siteId}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-700">
                      {config.organizationName}
                    </td>
                    <td className="py-4 px-6 text-gray-700 uppercase">
                      {config.currency}
                    </td>
                    <td className="py-4 px-6">
                      {config.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-gray-700 text-sm">
                      {new Date(config.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/demo?siteId=${config.siteId}`}
                          target="_blank"
                          className="px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded"
                        >
                          Test
                        </Link>
                        <Link
                          href={`/admin/widgets/${config.id}`}
                          className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => deleteConfig(config.id)}
                          className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
                        >
                          Delete
                        </button>
                      </div>
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
