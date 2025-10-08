'use client';

import { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe as StripeType } from '@stripe/stripe-js';
import AmountSelector from './AmountSelector';
import PaymentForm from './PaymentForm';
import type {
  DonationOptions,
  DonationCause,
  ApiResponse,
  CreatePaymentIntentResponse,
  CreateSubscriptionResponse,
  FeeCalculation,
} from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  organizationName?: string;
  causes?: DonationCause[];
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

type DonationStep = 'amount' | 'cause' | 'fees' | 'email' | 'payment' | 'success' | 'error';

export default function DonationModal({
  isOpen,
  onClose,
  siteId,
  organizationName = 'Organization',
  causes,
  onSuccess,
  onError,
}: DonationModalProps) {
  const [step, setStep] = useState<DonationStep>('amount');
  const [donationOptions, setDonationOptions] = useState<DonationOptions | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [selectedFrequency, setSelectedFrequency] = useState<string>('once');
  const [selectedCause, setSelectedCause] = useState<DonationCause | null>(null);
  const [coverFees, setCoverFees] = useState<boolean>(false);
  const [feeCalculation, setFeeCalculation] = useState<FeeCalculation | null>(null);
  const [email, setEmail] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [stripePromise, setStripePromise] = useState<Promise<StripeType | null> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Initialize Stripe
  useEffect(() => {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (publishableKey) {
      setStripePromise(loadStripe(publishableKey));
    }
  }, []);

  // Fetch donation options on mount
  useEffect(() => {
    if (isOpen && !donationOptions) {
      fetchDonationOptions();
    }
  }, [isOpen]);

  // Set initial cause if provided
  useEffect(() => {
    if (causes && causes.length > 0 && !selectedCause) {
      setSelectedCause(causes[0]);
    }
  }, [causes]);

  const fetchDonationOptions = async () => {
    try {
      const response = await fetch(
        `/api/donation-options?siteId=${encodeURIComponent(siteId)}`
      );
      const data: ApiResponse<DonationOptions> = await response.json();

      if (data.success && data.data) {
        setDonationOptions(data.data);
      } else {
        setError(data.error?.message || 'Failed to load donation options');
      }
    } catch (err) {
      setError('Failed to load donation options');
      console.error('Error fetching donation options:', err);
    }
  };

  const calculateFees = async () => {
    if (!coverFees) {
      setFeeCalculation(null);
      return;
    }

    try {
      const response = await fetch('/api/calculate-fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: selectedAmount }),
      });

      const data: ApiResponse<FeeCalculation> = await response.json();

      if (data.success && data.data) {
        setFeeCalculation(data.data);
      }
    } catch (err) {
      console.error('Error calculating fees:', err);
    }
  };

  useEffect(() => {
    if (selectedAmount > 0 && coverFees) {
      calculateFees();
    }
  }, [selectedAmount, coverFees]);

  const createPaymentIntent = async () => {
    setIsLoading(true);
    setError('');

    try {
      const finalAmount = coverFees && feeCalculation
        ? feeCalculation.totalAmount
        : selectedAmount;

      const endpoint =
        selectedFrequency === 'once'
          ? '/api/create-payment-intent'
          : '/api/create-subscription';

      const body =
        selectedFrequency === 'once'
          ? {
              amount: finalAmount,
              causeId: selectedCause?.id || 'general',
              coverFees,
              email,
            }
          : {
              amount: finalAmount,
              causeId: selectedCause?.id || 'general',
              frequency: selectedFrequency as 'monthly' | 'yearly',
              coverFees,
              email,
            };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data: ApiResponse<
        CreatePaymentIntentResponse | CreateSubscriptionResponse
      > = await response.json();

      if (data.success && data.data) {
        setClientSecret(data.data.clientSecret);
        setStep('payment');
      } else {
        setError(data.error?.message || 'Failed to initialize payment');
        setStep('error');
      }
    } catch (err) {
      setError('Failed to initialize payment');
      setStep('error');
      console.error('Error creating payment intent:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountNext = () => {
    if (selectedAmount <= 0) {
      setError('Please select an amount');
      return;
    }
    setError('');

    if (causes && causes.length > 1) {
      setStep('cause');
    } else {
      setStep('fees');
    }
  };

  const handleCauseNext = () => {
    if (!selectedCause) {
      setError('Please select a cause');
      return;
    }
    setError('');
    setStep('fees');
  };

  const handleFeesNext = () => {
    setStep('email');
  };

  const handleEmailNext = () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    createPaymentIntent();
  };

  const handlePaymentSuccess = (intentId: string) => {
    setStep('success');
    if (onSuccess) {
      onSuccess({
        intentId,
        amount: selectedAmount,
        cause: selectedCause,
        frequency: selectedFrequency,
      });
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    setStep('error');
    if (onError) {
      onError(errorMessage);
    }
  };

  const handleClose = () => {
    // Reset state
    setStep('amount');
    setSelectedAmount(0);
    setSelectedFrequency('once');
    setSelectedCause(null);
    setCoverFees(false);
    setEmail('');
    setClientSecret('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const finalAmount = coverFees && feeCalculation
    ? feeCalculation.totalAmount
    : selectedAmount;

  const feeAmount = feeCalculation?.feeAmount || 0;

  return (
    <div className="donation-modal-overlay fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="donation-modal-content bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="modal-header sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl">
          <h2 className="text-2xl font-bold text-gray-900">
            {step === 'success' ? 'Thank You!' : `Donate to ${organizationName}`}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="modal-body px-6 py-6">
          {/* Amount Step */}
          {step === 'amount' && donationOptions && (
            <div>
              <AmountSelector
                amounts={donationOptions.amounts}
                frequencies={donationOptions.frequencies}
                allowCustomAmount={donationOptions.customAmountEnabled}
                minAmount={donationOptions.limits.minAmount}
                maxAmount={donationOptions.limits.maxAmount}
                currency={donationOptions.currency}
                onAmountChange={setSelectedAmount}
                onFrequencyChange={setSelectedFrequency}
              />

              {error && (
                <p className="mt-4 text-sm text-red-600">{error}</p>
              )}

              <button
                onClick={handleAmountNext}
                disabled={selectedAmount <= 0}
                className={`
                  mt-6 w-full px-6 py-3 rounded-lg font-medium text-white
                  transition-all
                  ${
                    selectedAmount <= 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }
                `}
              >
                Continue
              </button>
            </div>
          )}

          {/* Cause Step */}
          {step === 'cause' && causes && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Select a Cause
              </h3>
              <div className="space-y-3">
                {causes.map((cause) => (
                  <button
                    key={cause.id}
                    onClick={() => setSelectedCause(cause)}
                    className={`
                      w-full text-left p-4 rounded-lg border-2 transition-all
                      ${
                        selectedCause?.id === cause.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }
                    `}
                  >
                    <div className="font-medium text-gray-900">{cause.name}</div>
                    {cause.description && (
                      <div className="text-sm text-gray-600 mt-1">
                        {cause.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {error && (
                <p className="mt-4 text-sm text-red-600">{error}</p>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep('amount')}
                  className="flex-1 px-6 py-3 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                >
                  Back
                </button>
                <button
                  onClick={handleCauseNext}
                  className="flex-1 px-6 py-3 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Fees Step */}
          {step === 'fees' && donationOptions && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Cover Processing Fees?
              </h3>

              <div className="space-y-4">
                <div
                  className={`
                    p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${coverFees ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                  `}
                  onClick={() => setCoverFees(true)}
                >
                  <div className="flex items-start">
                    <input
                      type="radio"
                      checked={coverFees}
                      onChange={() => setCoverFees(true)}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        Yes, cover the {donationOptions.fees.feePercentage}% + $
                        {donationOptions.fees.feeFixed / 100} fee
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Total: {formatCurrency(feeCalculation?.totalAmount || selectedAmount, donationOptions.currency)}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`
                    p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${!coverFees ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                  `}
                  onClick={() => setCoverFees(false)}
                >
                  <div className="flex items-start">
                    <input
                      type="radio"
                      checked={!coverFees}
                      onChange={() => setCoverFees(false)}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        No, deduct fees from my donation
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Total: {formatCurrency(selectedAmount, donationOptions.currency)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(causes && causes.length > 1 ? 'cause' : 'amount')}
                  className="flex-1 px-6 py-3 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                >
                  Back
                </button>
                <button
                  onClick={handleFeesNext}
                  className="flex-1 px-6 py-3 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Email Step */}
          {step === 'email' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Enter Your Email
              </h3>

              <p className="text-sm text-gray-600 mb-4">
                We'll send your donation receipt to this email address.
              </p>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                autoFocus
              />

              {error && (
                <p className="mt-4 text-sm text-red-600">{error}</p>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep('fees')}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleEmailNext}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isLoading ? 'Loading...' : 'Continue to Payment'}
                </button>
              </div>
            </div>
          )}

          {/* Payment Step */}
          {step === 'payment' && clientSecret && stripePromise && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                },
              }}
            >
              <PaymentForm
                amount={finalAmount}
                currency={donationOptions?.currency || 'USD'}
                feeAmount={feeAmount}
                causeId={selectedCause?.id || 'general'}
                causeName={selectedCause?.name}
                isRecurring={selectedFrequency !== 'once'}
                frequency={selectedFrequency as 'monthly' | 'yearly'}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />

              <button
                onClick={() => setStep('email')}
                className="w-full mt-4 px-6 py-2 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                Back
              </button>
            </Elements>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="text-center">
              <div className="mb-6">
                <svg
                  className="mx-auto h-16 w-16 text-green-500"
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

              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Thank You for Your Donation!
              </h3>

              <p className="text-gray-600 mb-6">
                Your generous donation of {formatCurrency(finalAmount, donationOptions?.currency || 'USD')}
                {selectedFrequency !== 'once' && ` / ${selectedFrequency}`} has been received.
                We've sent a confirmation email to {email}.
              </p>

              <button
                onClick={handleClose}
                className="px-8 py-3 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          )}

          {/* Error Step */}
          {step === 'error' && (
            <div className="text-center">
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

              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Payment Failed
              </h3>

              <p className="text-gray-600 mb-6">{error}</p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setStep('email')}
                  className="px-6 py-3 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                >
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-3 rounded-lg font-medium text-white bg-gray-600 hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
