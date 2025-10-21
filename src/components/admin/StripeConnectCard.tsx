'use client';

import { useState, useEffect, useCallback } from 'react';

interface StripeConnectCardProps {
  widgetConfigId: string;
  initialStatus?: {
    connected: boolean;
    onboarded: boolean;
    accountId: string | null;
  };
}

export default function StripeConnectCard({
  widgetConfigId,
  initialStatus,
}: StripeConnectCardProps) {
  const [status, setStatus] = useState(initialStatus || {
    connected: false,
    onboarded: false,
    accountId: null,
  });
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkStatus = useCallback(async () => {
    setChecking(true);
    try {
      const response = await fetch(
        `/api/admin/stripe-connect/status?widgetConfigId=${widgetConfigId}`
      );
      const data = await response.json();
      setStatus({
        connected: data.connected,
        onboarded: data.onboarded,
        accountId: data.accountId,
      });
    } catch (error) {
      console.error('Error checking Stripe Connect status:', error);
    } finally {
      setChecking(false);
    }
  }, [widgetConfigId]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  async function handleConnect() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/stripe-connect/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgetConfigId }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        // Redirect to Stripe onboarding
        window.location.href = data.url;
      } else {
        alert('Failed to start Stripe Connect onboarding');
      }
    } catch (error) {
      console.error('Error starting onboarding:', error);
      alert('Failed to start Stripe Connect onboarding');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Stripe Connect
          </h2>
          <p className="text-sm text-gray-600">
            Connect your Stripe account to receive donations directly
          </p>
        </div>
        <button
          onClick={checkStatus}
          disabled={checking}
          className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          {checking ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {/* Status Display */}
      <div className="mb-4">
        {!status.connected ? (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <svg
              className="w-5 h-5 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-sm text-yellow-800">
              No Stripe account connected
            </span>
          </div>
        ) : status.onboarded ? (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <span className="text-sm font-medium text-green-800">
                Connected & Ready
              </span>
              <p className="text-xs text-green-700 mt-0.5">
                Account: {status.accountId}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm text-blue-800">
              Connected but onboarding incomplete
            </span>
          </div>
        )}
      </div>

      {/* Action Button */}
      {!status.onboarded && (
        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading
            ? 'Redirecting...'
            : status.connected
            ? 'Complete Stripe Onboarding'
            : 'Connect with Stripe'}
        </button>
      )}

      {/* Info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>How it works:</strong> Donations will go directly to your
          Stripe account. A 3% platform fee will be deducted automatically.
        </p>
      </div>
    </div>
  );
}
