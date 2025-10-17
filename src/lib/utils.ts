// src/lib/utils.ts

import { FeeCalculation } from './types';
import { CAUSE_NAMES } from './constants';

/**
 * Format cents to display currency
 * @param cents Amount in cents
 * @param currency Currency code
 */
export function formatCurrency(cents: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(cents / 100);
}

/**
 * Convert dollars to cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Calculate Stripe fees
 * @param amountInCents Original amount in cents
 * @param feePercentage Stripe fee percentage (e.g., 2.9)
 * @param feeFixed Fixed fee in cents (e.g., 30)
 */
export function calculateFees(
  amountInCents: number,
  feePercentage: number = 2.9,
  feeFixed: number = 30
): FeeCalculation {
  // Calculate the total amount if user covers fees
  // We need to calculate this so that after Stripe takes their fee,
  // the organization receives the full intended donation
  const totalWithFees = Math.round((amountInCents + feeFixed) / (1 - feePercentage / 100));
  const actualFee = totalWithFees - amountInCents;

  return {
    originalAmount: amountInCents,
    feeAmount: actualFee,
    totalAmount: totalWithFees,
    breakdown: {
      stripeFeePercentage: feePercentage,
      stripeFeeFixed: feeFixed,
      platformFee: 0,
    },
  };
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate donation amount
 */
export function isValidAmount(
  amount: number,
  minAmount: number = 100, // $1.00 minimum
  maxAmount: number = 99999900 // $999,999.00 maximum
): boolean {
  return amount >= minAmount && amount <= maxAmount;
}

/**
 * Generate a unique widget instance ID
 */
export function generateWidgetId(): string {
  return `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function for input handlers
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Class names helper (similar to clsx)
 */
export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Get human-readable cause name from cause ID
 * @param causeId - Cause identifier
 */
export function getCauseName(causeId: string): string {
  return CAUSE_NAMES[causeId] || 'General Donation';
}
