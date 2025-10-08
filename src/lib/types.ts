// TypeScript types for the donation widget

export interface DonationOption {
  id: string;
  amount: number;
  label: string;
  recurring?: boolean;
}

export interface PaymentData {
  amount: number;
  currency: string;
  recurring: boolean;
  email?: string;
}

export interface WidgetConfig {
  apiKey: string;
  organizationId: string;
  theme?: 'light' | 'dark';
}
