'use client';

import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { formatCurrency } from '@/lib/utils';

interface PaymentFormProps {
  amount: number;
  currency?: string;
  feeAmount?: number;
  causeId: string;
  causeName?: string;
  isRecurring: boolean;
  frequency?: 'monthly' | 'yearly';
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

export default function PaymentForm({
  amount,
  currency = 'USD',
  feeAmount = 0,
  causeId: _causeId, // eslint-disable-line @typescript-eslint/no-unused-vars
  causeName,
  isRecurring,
  frequency,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      // Submit payment/setup
      const { error: submitError } = await elements.submit();

      if (submitError) {
        setErrorMessage(submitError.message || 'Payment submission failed');
        onError(submitError.message || 'Payment submission failed');
        setIsProcessing(false);
        return;
      }

      // Confirm payment or setup
      let result: unknown;
      if (isRecurring) {
        // For subscriptions, confirm setup intent
        result = await stripe.confirmSetup({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/donation/success`,
          },
          redirect: 'if_required',
        });
      } else {
        // For one-time payments, confirm payment intent
        result = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/donation/success`,
          },
          redirect: 'if_required',
        });
      }

      if (result && typeof result === 'object' && 'error' in result) {
        const err = (result as { error?: { message?: string } }).error;
        if (err) {
          setErrorMessage(err.message || 'Payment failed');
          onError(err.message || 'Payment failed');
          setIsProcessing(false);
          return;
        }
      }

      // Payment succeeded
      let intentId: string | undefined;
      if (result && typeof result === 'object') {
        if ('setupIntent' in result) {
          intentId = (result as { setupIntent?: { id?: string } }).setupIntent?.id;
        } else if ('paymentIntent' in result) {
          intentId = (result as { paymentIntent?: { id?: string } }).paymentIntent?.id;
        }
      }

      if (intentId) {
        onSuccess(intentId);
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrorMessage(errorMsg);
      onError(errorMsg);
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      {/* Payment Summary */}
      <div className="payment-summary mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Donation Summary</h3>

        {causeName && (
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Cause:</span>
            <span className="text-gray-900 font-medium">{causeName}</span>
          </div>
        )}

        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Type:</span>
          <span className="text-gray-900">
            {isRecurring ? `${frequency} recurring` : 'One-time'}
          </span>
        </div>

        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Donation:</span>
          <span className="text-gray-900">{formatCurrency(amount - feeAmount, currency)}</span>
        </div>

        {feeAmount > 0 && (
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Processing fee:</span>
            <span className="text-gray-900">{formatCurrency(feeAmount, currency)}</span>
          </div>
        )}

        <div className="flex justify-between text-base font-bold border-t border-gray-300 pt-2 mt-2">
          <span className="text-gray-900">Total:</span>
          <span className="text-gray-900">
            {formatCurrency(amount, currency)}
            {isRecurring && <span className="text-sm font-normal"> / {frequency}</span>}
          </span>
        </div>
      </div>

      {/* Payment Element */}
      <div className="payment-element-wrapper mb-6">
        <PaymentElement
          options={{
            layout: {
              type: 'tabs',
              defaultCollapsed: false,
            },
          }}
        />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="error-message mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errorMessage}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className={`
          w-full px-6 py-3 rounded-lg font-medium text-white
          transition-all
          ${
            !stripe || isProcessing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          }
        `}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Processing...
          </span>
        ) : (
          `Donate ${formatCurrency(amount, currency)}${isRecurring ? ` / ${frequency}` : ''}`
        )}
      </button>

      {/* Security Notice */}
      <p className="text-xs text-gray-500 text-center mt-3">
        <svg
          className="inline-block w-3 h-3 mr-1"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd"
          />
        </svg>
        Secured by Stripe
      </p>
    </form>
  );
}
