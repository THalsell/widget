'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface PaymentDetails {
  amount: number;
  currency: string;
  status: string;
  customerEmail?: string;
  metadata?: {
    causeName?: string;
    frequency?: string;
    originalAmount?: string;
    feeAmount?: string;
  };
  created?: number;
}

export default function DonationSuccessPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);

  // Get intent IDs from URL params
  const paymentIntentId = searchParams.get('payment_intent');
  const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
  const setupIntentId = searchParams.get('setup_intent');
  const setupIntentClientSecret = searchParams.get('setup_intent_client_secret');
  const redirectStatus = searchParams.get('redirect_status');

  useEffect(() => {
    const verifyPayment = async () => {
      // Check if we have the necessary params
      if (!paymentIntentId && !setupIntentId) {
        setError('No payment information found');
        setLoading(false);
        return;
      }

      // Check redirect status
      if (redirectStatus === 'failed') {
        setError('Payment failed. Please try again.');
        setLoading(false);
        return;
      }

      try {
        // Verify payment with your backend
        const endpoint = paymentIntentId
          ? '/api/verify-payment'
          : '/api/verify-setup';

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            intentId: paymentIntentId || setupIntentId,
          }),
        });

        const data = await response.json();

        if (data.success && data.data) {
          setPaymentDetails(data.data);
        } else {
          // Even if verification endpoint doesn't exist, show success based on redirect_status
          if (redirectStatus === 'succeeded') {
            setPaymentDetails({
              amount: 0,
              currency: 'usd',
              status: 'succeeded',
            });
          } else {
            setError(data.error?.message || 'Could not verify payment');
          }
        }
      } catch (err) {
        console.error('Error verifying payment:', err);
        // If verification fails but redirect status is success, still show success
        if (redirectStatus === 'succeeded') {
          setPaymentDetails({
            amount: 0,
            currency: 'usd',
            status: 'succeeded',
          });
        } else {
          setError('Failed to verify payment status');
        }
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [paymentIntentId, setupIntentId, redirectStatus]);

  const isRecurring = !!setupIntentId;
  const causeName = paymentDetails?.metadata?.causeName || 'General Fund';
  const frequency = paymentDetails?.metadata?.frequency;

  // Share functionality
  const handleShare = async () => {
    const shareText = `I just donated to support a great cause! Join me in making a difference.`;
    const shareUrl = window.location.origin;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'I Made a Donation!',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Share cancelled or failed:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Verifying your donation...</p>
        </div>
      </div>
    );
  }

  if (error || !paymentDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 text-center">
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Verification Failed
          </h1>

          <p className="text-gray-600 mb-6">{error}</p>

          <div className="flex gap-3 justify-center">
            <Link
              href="/demo"
              className="px-6 py-3 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Try Again
            </Link>
            <Link
              href="/"
              className="px-6 py-3 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-12 text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-20 w-20 text-white"
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
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Thank You for Your Donation!
          </h1>
          <p className="text-green-100">
            Your generosity makes a real difference
          </p>
        </div>

        {/* Donation Details */}
        <div className="px-8 py-6">
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-sm font-medium text-gray-600 mb-4">
              Donation Summary
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-gray-600">Amount:</span>
                <span className="text-2xl font-bold text-gray-900">
                  {paymentDetails.amount > 0
                    ? formatCurrency(paymentDetails.amount, paymentDetails.currency)
                    : 'Processing...'}
                  {isRecurring && frequency && (
                    <span className="text-base font-normal text-gray-600">
                      {' '}
                      / {frequency}
                    </span>
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="text-gray-900 font-medium">
                  {isRecurring ? `Recurring (${frequency})` : 'One-time'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Cause:</span>
                <span className="text-gray-900 font-medium">{causeName}</span>
              </div>

              {paymentDetails.customerEmail && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="text-gray-900 font-medium">
                    {paymentDetails.customerEmail}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  ✓ {paymentDetails.status === 'succeeded' ? 'Completed' : paymentDetails.status}
                </span>
              </div>

              {paymentIntentId && (
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Transaction ID:</span>
                  <span className="text-gray-500 text-sm font-mono">
                    {paymentIntentId.substring(0, 20)}...
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Receipt Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
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
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Receipt on the way
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  {paymentDetails.customerEmail
                    ? `A confirmation email has been sent to ${paymentDetails.customerEmail}`
                    : 'A confirmation email will be sent to you shortly'}
                </p>
              </div>
            </div>
          </div>

          {/* Recurring Notice */}
          {isRecurring && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-purple-900">
                    Recurring Donation Active
                  </p>
                  <p className="text-sm text-purple-700 mt-1">
                    Your {frequency} donation will automatically renew. You can
                    manage or cancel anytime from your account.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleShare}
              className="px-6 py-3 rounded-lg font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors flex items-center justify-center"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Share Your Impact
            </button>

            <Link
              href="/demo"
              className="px-6 py-3 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors text-center"
            >
              Make Another Donation
            </Link>
          </div>

          <div className="mt-4">
            <Link
              href="/"
              className="block text-center px-6 py-3 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Questions about your donation? Contact us at support@example.com
          </p>
        </div>
      </div>
    </div>
  );
}
