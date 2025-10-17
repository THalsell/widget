'use client';

import { DonationButton } from '@/components/widget';
import type { DonationCause } from '@/lib/types';

export default function DemoPage() {
  // Example causes for the widget
  const causes: DonationCause[] = [
    {
      id: 'general',
      name: 'General Fund',
      description: 'Support our general operations and programs',
    },
    {
      id: 'education',
      name: 'Education Programs',
      description: 'Fund educational initiatives and scholarships',
    },
    {
      id: 'emergency',
      name: 'Emergency Relief',
      description: 'Provide immediate assistance to those in need',
    },
  ];

  const handleSuccess = (data: unknown) => {
    console.log('Donation successful!', data);
  };

  const handleError = (error: string) => {
    console.error('Donation error:', error);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Donation Widget Demo</h1>
          <p className="mt-2 text-gray-600">
            Test the donation widget with different configurations
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Support Our Mission
          </h2>
          <p className="text-gray-600 mb-6">
            Your donation helps us continue our important work. Every contribution
            makes a difference. Click the donate button in the bottom-right corner to get started.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-blue-600 mb-3">
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              One-Time & Recurring
            </h3>
            <p className="text-gray-600 text-sm">
              Support us with a one-time gift or set up monthly/yearly recurring
              donations.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-blue-600 mb-3">
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Secure Payments
            </h3>
            <p className="text-gray-600 text-sm">
              All donations are processed securely through Stripe with industry-standard encryption.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-blue-600 mb-3">
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Instant Receipts
            </h3>
            <p className="text-gray-600 text-sm">
              Receive an email receipt immediately after your donation is processed.
            </p>
          </div>
        </div>

        {/* API Endpoints */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Available API Endpoints
          </h2>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-mono rounded">
                GET
              </span>
              <code className="text-sm">/api/config?siteId=demo-site</code>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-mono rounded">
                GET
              </span>
              <code className="text-sm">/api/donation-options</code>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-mono rounded">
                POST
              </span>
              <code className="text-sm">/api/calculate-fees</code>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-mono rounded">
                POST
              </span>
              <code className="text-sm">/api/create-payment-intent</code>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-mono rounded">
                POST
              </span>
              <code className="text-sm">/api/create-subscription</code>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-mono rounded">
                POST
              </span>
              <code className="text-sm">/api/webhooks/stripe</code>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom-Right Button */}
      <DonationButton
        siteId="demo-site"
        organizationName="Demo Organization"
        causes={causes}
        buttonText="Donate"
        position="bottom-right"
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </main>
  );
}
