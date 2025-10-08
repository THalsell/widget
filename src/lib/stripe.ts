import Stripe from 'stripe';
import { loadStripe, Stripe as StripeJs } from '@stripe/stripe-js';
import type {
  CreatePaymentIntentResponse,
  CreateSubscriptionResponse,
} from './types';

// Validate Stripe secret key exists
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    'STRIPE_SECRET_KEY is not set. Please add it to your .env.local file.'
  );
}

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
  appInfo: {
    name: 'Donation Widget',
    version: '1.0.0',
  },
});

// Client-side Stripe instance (singleton pattern)
let stripePromise: Promise<StripeJs | null>;

/**
 * Get Stripe.js instance for client-side use
 * Implements singleton pattern to reuse the same instance
 */
export const getStripe = (): Promise<StripeJs | null> => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      throw new Error(
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set. Please add it to your .env.local file.'
      );
    }

    stripePromise = loadStripe(publishableKey);
  }

  return stripePromise;
};

// ============= Helper Functions =============

// Zero-decimal currencies (no decimal places)
const ZERO_DECIMAL_CURRENCIES = ['jpy', 'krw', 'vnd', 'clp', 'pyg', 'xaf', 'xof', 'bif', 'djf', 'gnf', 'kmf', 'mga', 'rwf', 'xpf'];

/**
 * Format amount for Stripe (convert to smallest currency unit)
 * @param amount - Amount in standard units (e.g., dollars)
 * @param currency - Currency code
 */
export function formatAmountForStripe(amount: number, currency: string): number {
  const lowerCurrency = currency.toLowerCase();

  if (ZERO_DECIMAL_CURRENCIES.includes(lowerCurrency)) {
    return Math.round(amount);
  }

  return Math.round(amount * 100);
}

/**
 * Format amount from Stripe (convert from smallest currency unit)
 * @param amount - Amount in Stripe's smallest unit (e.g., cents)
 * @param currency - Currency code
 */
export function formatAmountFromStripe(amount: number, currency: string): number {
  const lowerCurrency = currency.toLowerCase();

  if (ZERO_DECIMAL_CURRENCIES.includes(lowerCurrency)) {
    return amount;
  }

  return amount / 100;
}

/**
 * Create a payment intent for one-time donations
 * @param amount - Amount in cents
 * @param email - Customer email
 * @param metadata - Additional metadata
 */
export async function createPaymentIntent(
  amount: number,
  email: string,
  metadata?: Record<string, string>
): Promise<CreatePaymentIntentResponse> {
  try {
    // Validate amount
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Create or retrieve customer if email is provided
    let customerId: string | undefined;
    if (email) {
      const customers = await stripe.customers.list({
        email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email,
          metadata: {
            source: 'donation_widget',
          },
        });
        customerId = customer.id;
      }
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: customerId,
      metadata: {
        ...metadata,
        email,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      fee: Math.round(amount * 0.029 + 30), // Approximate fee
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to create payment intent'
    );
  }
}

/**
 * Create a subscription for recurring donations
 * @param amount - Amount in cents
 * @param email - Customer email
 * @param frequency - Payment frequency
 * @param metadata - Additional metadata
 */
export async function createSubscription(
  amount: number,
  email: string,
  frequency: 'monthly' | 'yearly',
  metadata?: Record<string, string>
): Promise<CreateSubscriptionResponse> {
  try {
    // Validate amount
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (!email) {
      throw new Error('Email is required for subscriptions');
    }

    // Create or retrieve customer
    let customer: Stripe.Customer;
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email,
        metadata: {
          source: 'donation_widget',
        },
      });
    }

    // Create price for subscription
    const price = await stripe.prices.create({
      currency: 'usd',
      unit_amount: amount,
      recurring: {
        interval: frequency === 'monthly' ? 'month' : 'year',
      },
      product_data: {
        name: 'Recurring Donation',
        metadata: {
          ...metadata,
        },
      },
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        ...metadata,
        frequency,
      },
    });

    // Get payment intent from the latest invoice
    const latestInvoice = subscription.latest_invoice;
    if (!latestInvoice || typeof latestInvoice === 'string') {
      throw new Error('Failed to retrieve invoice from subscription');
    }

    // Type assertion for expanded invoice with payment_intent
    type ExpandedInvoice = Stripe.Invoice & {
      payment_intent: string | Stripe.PaymentIntent;
    };

    const paymentIntentId = (latestInvoice as ExpandedInvoice).payment_intent;
    if (!paymentIntentId) {
      throw new Error('Payment intent not found on invoice');
    }

    const paymentIntent = typeof paymentIntentId === 'string'
      ? await stripe.paymentIntents.retrieve(paymentIntentId)
      : paymentIntentId;

    return {
      clientSecret: paymentIntent.client_secret!,
      subscriptionId: subscription.id,
      amount: subscription.items.data[0].price.unit_amount!,
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to create subscription'
    );
  }
}

/**
 * Construct and verify webhook event from Stripe
 * @param payload - Raw request body
 * @param signature - Stripe signature header
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error(
      'STRIPE_WEBHOOK_SECRET is not set. Please add it to your .env.local file.'
    );
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );

    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new Error(
      error instanceof Error
        ? `Webhook Error: ${error.message}`
        : 'Webhook signature verification failed'
    );
  }
}
