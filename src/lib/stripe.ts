import Stripe from 'stripe';

// TODO: Add Stripe configuration
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});
