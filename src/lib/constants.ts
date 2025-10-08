// src/lib/constants.ts

export const DONATION_AMOUNTS = [
  { value: 500, label: '$5' },
  { value: 1000, label: '$10' },
  { value: 1500, label: '$15' },
  { value: 2000, label: '$20' },
  { value: 2500, label: '$25' },
  { value: 3000, label: '$30' },
] as const;

export const STRIPE_CONFIG = {
  FEE_PERCENTAGE: 2.9,
  FEE_FIXED: 30, // in cents
} as const;

export const DONATION_LIMITS = {
  MIN_AMOUNT: 100, // $1.00 in cents
  MAX_AMOUNT: 99999900, // $999,999.00 in cents
} as const;

export const TEST_CARDS = {
  SUCCESS: '4242424242424242',
  DECLINE: '4000000000000002',
  REQUIRES_AUTH: '4000002500003155',
} as const;

export const WIDGET_DEFAULTS = {
  THEME: 'light',
  POSITION: 'bottom-right',
  BUTTON_TEXT: 'Donate',
} as const;
