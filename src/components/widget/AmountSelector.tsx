'use client';

import { useState, useEffect } from 'react';
import type { PresetAmount, FrequencyOption } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface AmountSelectorProps {
  amounts: PresetAmount[];
  frequencies?: FrequencyOption[];
  allowCustomAmount?: boolean;
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
  onAmountChange: (amount: number) => void;
  onFrequencyChange?: (frequency: string) => void;
  initialAmount?: number;
  initialFrequency?: string;
}

export default function AmountSelector({
  amounts,
  frequencies,
  allowCustomAmount = true,
  minAmount = 100, // $1.00
  maxAmount = 99999900, // $999,999.00
  currency = 'USD',
  onAmountChange,
  onFrequencyChange,
  initialAmount,
  initialFrequency = 'once',
}: AmountSelectorProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(
    initialAmount || amounts.find((a) => a.default)?.value || null
  );
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState(initialFrequency);
  const [error, setError] = useState<string>('');

  // Update parent when selection changes
  useEffect(() => {
    if (selectedAmount !== null && selectedAmount > 0) {
      onAmountChange(selectedAmount);
    }
  }, [selectedAmount, onAmountChange]);

  useEffect(() => {
    if (onFrequencyChange) {
      onFrequencyChange(selectedFrequency);
    }
  }, [selectedFrequency, onFrequencyChange]);

  const handlePresetClick = (amount: number) => {
    setIsCustom(false);
    setSelectedAmount(amount);
    setCustomAmount('');
    setError('');
  };

  const handleCustomClick = () => {
    setIsCustom(true);
    setSelectedAmount(null);
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomAmount(value);

    // Parse and validate
    const dollars = parseFloat(value);
    if (isNaN(dollars) || dollars <= 0) {
      setError('Please enter a valid amount');
      setSelectedAmount(null);
      return;
    }

    const cents = Math.round(dollars * 100);

    if (cents < minAmount) {
      setError(`Minimum donation is ${formatCurrency(minAmount, currency)}`);
      setSelectedAmount(null);
      return;
    }

    if (cents > maxAmount) {
      setError(`Maximum donation is ${formatCurrency(maxAmount, currency)}`);
      setSelectedAmount(null);
      return;
    }

    setError('');
    setSelectedAmount(cents);
  };

  const handleFrequencyChange = (frequency: string) => {
    setSelectedFrequency(frequency);
  };

  return (
    <div className="amount-selector">
      {/* Frequency Selection */}
      {frequencies && frequencies.length > 0 && (
        <div className="frequency-selector mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Donation Frequency
          </label>
          <div className="grid grid-cols-3 gap-2">
            {frequencies.map((freq) => (
              <button
                key={freq.id}
                type="button"
                onClick={() => handleFrequencyChange(freq.id)}
                className={`
                  px-4 py-2 rounded-lg border-2 transition-all
                  ${
                    selectedFrequency === freq.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }
                `}
                title={freq.description}
              >
                {freq.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Amount Selection */}
      <div className="amount-options">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Amount
        </label>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {amounts.map((amount) => (
            <button
              key={amount.value}
              type="button"
              onClick={() => handlePresetClick(amount.value)}
              className={`
                px-4 py-3 rounded-lg border-2 font-medium transition-all
                ${
                  !isCustom && selectedAmount === amount.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }
              `}
            >
              {amount.label}
            </button>
          ))}
          {allowCustomAmount && (
            <button
              type="button"
              onClick={handleCustomClick}
              className={`
                px-4 py-3 rounded-lg border-2 font-medium transition-all
                ${
                  isCustom
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }
              `}
            >
              Custom
            </button>
          )}
        </div>

        {/* Custom Amount Input */}
        {isCustom && allowCustomAmount && (
          <div className="custom-amount-input mt-3">
            <label htmlFor="custom-amount" className="sr-only">
              Custom amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                id="custom-amount"
                type="number"
                min={minAmount / 100}
                max={maxAmount / 100}
                step="0.01"
                value={customAmount}
                onChange={handleCustomAmountChange}
                placeholder="Enter amount"
                className={`
                  w-full pl-8 pr-4 py-2 border-2 rounded-lg
                  ${error ? 'border-red-500' : 'border-gray-300'}
                  focus:outline-none focus:border-blue-500
                `}
                autoFocus
              />
            </div>
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Min: {formatCurrency(minAmount, currency)} - Max:{' '}
              {formatCurrency(maxAmount, currency)}
            </p>
          </div>
        )}
      </div>

      {/* Selected Amount Display */}
      {selectedAmount !== null && !error && (
        <div className="selected-amount-display mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Selected donation:</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(selectedAmount, currency)}
            {selectedFrequency !== 'once' && (
              <span className="text-sm font-normal text-gray-600">
                {' '}
                / {selectedFrequency}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
