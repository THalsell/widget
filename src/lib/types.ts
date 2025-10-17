// src/lib/types.ts

// ============= Configuration Types =============
export interface DonationConfig {
  siteId: string;
  organizationName: string;
  amounts: PresetAmount[];
  causes: DonationCause[];
  allowRecurring: boolean;
  allowCoverageFee: boolean;
  feePercentage: number; // Stripe fee percentage (e.g., 2.9)
  feeFixed: number; // Fixed fee in cents (e.g., 30)
  minAmount: number; // Minimum donation in cents
  maxAmount: number; // Maximum donation in cents
  defaultAmount?: number;
  currency: 'usd' | 'eur' | 'gbp';
  theme?: WidgetTheme;
}

export interface WidgetTheme {
  mode: 'light' | 'dark';
  primaryColor?: string;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg';
  fontFamily?: string;
}

// ============= Donation Form Types =============
export interface PresetAmount {
  value: number; // Amount in cents (500 = $5.00)
  label: string; // Display label like "$5"
  default?: boolean;
}

export interface DonationCause {
  id: string;
  name: string;
  description?: string;
}

export interface FrequencyOption {
  id: string;
  label: string;
  description?: string;
  default?: boolean;
}

export interface DonationLimits {
  minAmount: number;
  maxAmount: number;
  minCustomAmount: number;
  maxCustomAmount: number;
}

export interface FeeOptions {
  allowCoverageFee: boolean;
  feePercentage: number;
  feeFixed: number;
  description?: string;
}

export interface DonationOptions {
  amounts: PresetAmount[];
  frequencies: FrequencyOption[];
  limits: DonationLimits;
  fees: FeeOptions;
  currency: 'usd' | 'eur' | 'gbp';
  customAmountEnabled: boolean;
}

export interface DonationFormData {
  amount: number; // In cents
  isRecurring: boolean;
  frequency?: 'monthly' | 'yearly'; // Only if recurring
  causeId: string;
  coverFees: boolean;
  totalAmount: number; // Amount + fees if covered
  email: string;
  paymentMethod: PaymentMethod;
}

export type PaymentMethod = 'card' | 'bank';
export type DonationType = 'one-time' | 'recurring';

// ============= Payment Types =============
export interface PaymentIntentRequest {
  amount: number; // In cents
  causeId: string;
  coverFees: boolean;
  email: string;
  metadata?: Record<string, string>;
}

export interface SubscriptionRequest {
  amount: number; // In cents
  causeId: string;
  frequency: 'monthly' | 'yearly';
  coverFees: boolean;
  email: string;
  metadata?: Record<string, string>;
}

export interface FeeCalculation {
  originalAmount: number;
  feeAmount: number;
  totalAmount: number;
  breakdown: {
    stripeFeePercentage: number;
    stripeFeeFixed: number;
    platformFee?: number;
  };
}

// ============= Stripe Response Types =============
export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  fee: number;
}

export interface CreateSubscriptionResponse {
  clientSecret: string;
  subscriptionId: string;
  amount: number;
}

// ============= Widget State Types =============
export interface WidgetState {
  isOpen: boolean;
  currentStep: DonationStep;
  formData: Partial<DonationFormData>;
  error?: string;
  isLoading: boolean;
}

export type DonationStep =
  | 'amount'
  | 'type'
  | 'cause'
  | 'fees'
  | 'payment'
  | 'processing'
  | 'success'
  | 'error';

// ============= API Response Types =============
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// ============= Event Types for Widget Communication =============
export interface WidgetEvent {
  type: WidgetEventType;
  payload?: unknown;
}

export type WidgetEventType =
  | 'widget:opened'
  | 'widget:closed'
  | 'donation:started'
  | 'donation:completed'
  | 'donation:failed'
  | 'payment:processing';

// ============= Webhook Types =============
export interface StripeWebhookEvent {
  id: string;
  object: string;
  type: string;
  data: {
    object: unknown;
  };
}

// ============= Database Types (if you add a database later) =============
export interface DonationRecord {
  id: string;
  siteId: string;
  amount: number;
  feesCovered: boolean;
  totalAmount: number;
  causeId: string;
  causeName: string;
  donorEmail: string;
  paymentMethod: PaymentMethod;
  stripePaymentIntentId?: string;
  stripeSubscriptionId?: string;
  status: DonationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type DonationStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded';

// ============= Embed Configuration =============
export interface EmbedConfig {
  siteId: string;
  containerId?: string;
  trigger?: 'button' | 'auto' | 'custom';
  buttonText?: string;
  buttonStyle?: Partial<CSSStyleDeclaration>;
  position?: 'bottom-right' | 'bottom-left' | 'center';
  onSuccess?: (donation: DonationRecord) => void;
  onError?: (error: ApiError) => void;
  onClose?: () => void;
}
