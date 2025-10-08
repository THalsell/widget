import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

// In-memory set to track processed events (for idempotency)
// TODO: In production, use a database to persist this
const processedEvents = new Set<string>();

/**
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events
 * This endpoint receives events when:
 * - Payments succeed/fail
 * - Subscriptions are created/updated/canceled
 * - Invoices are paid/failed
 */
export async function POST(request: NextRequest) {
  // Get raw body as text (required for signature verification)
  let body: string;
  try {
    body = await request.text();
  } catch (error) {
    console.error('Error reading request body:', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  // Get Stripe signature from headers
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  // Verify webhook signature and construct event
  let event: Stripe.Event;
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Idempotency check - have we already processed this event?
  if (processedEvents.has(event.id)) {
    console.log(`Event ${event.id} already processed, skipping`);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Log the event
  console.log(`Received Stripe webhook: ${event.type} (${event.id})`);

  // Process the event based on type
  try {
    switch (event.type) {
      // ========== Payment Intent Events ==========
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('✅ Payment succeeded:', {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          customer: paymentIntent.customer,
          metadata: paymentIntent.metadata,
        });

        // TODO: Send receipt email to donor
        // TODO: Update database with successful payment
        // TODO: Trigger any post-donation workflows
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('❌ Payment failed:', {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          customer: paymentIntent.customer,
          lastPaymentError: paymentIntent.last_payment_error?.message,
          metadata: paymentIntent.metadata,
        });

        // TODO: Send payment failure notification
        // TODO: Log failure for analytics
        break;
      }

      // ========== Invoice Events ==========
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('✅ Invoice paid:', {
          id: invoice.id,
          subscription: invoice.subscription,
          amount: invoice.amount_paid,
          customer: invoice.customer,
          metadata: invoice.metadata,
        });

        // This fires for every recurring subscription payment
        // TODO: Send thank you email for recurring donation
        // TODO: Update donor's contribution total
        // TODO: Log recurring payment for reports
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('❌ Invoice payment failed:', {
          id: invoice.id,
          subscription: invoice.subscription,
          amount: invoice.amount_due,
          customer: invoice.customer,
          attemptCount: invoice.attempt_count,
          metadata: invoice.metadata,
        });

        // Stripe will retry failed payments automatically
        // After multiple failures, subscription will be canceled
        // TODO: Send payment update reminder to donor
        // TODO: Log failed payment attempt
        break;
      }

      // ========== Subscription Events ==========
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('🔔 Subscription created:', {
          id: subscription.id,
          customer: subscription.customer,
          status: subscription.status,
          amount: subscription.items.data[0]?.price.unit_amount,
          interval: subscription.items.data[0]?.price.recurring?.interval,
          metadata: subscription.metadata,
        });

        // This is also handled in create-subscription endpoint
        // This is a redundancy check
        // TODO: Verify subscription exists in database
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('🔄 Subscription updated:', {
          id: subscription.id,
          customer: subscription.customer,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          metadata: subscription.metadata,
        });

        // Subscription was modified (payment method, amount, etc.)
        // TODO: Update database with new subscription details
        // TODO: If cancel_at_period_end changed, notify donor
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('🛑 Subscription canceled:', {
          id: subscription.id,
          customer: subscription.customer,
          canceledAt: subscription.canceled_at,
          metadata: subscription.metadata,
        });

        // Subscription was canceled (by donor or Stripe after failures)
        // TODO: Send cancellation confirmation email
        // TODO: Update database - mark subscription as canceled
        // TODO: Log cancellation reason for analytics
        break;
      }

      // ========== Customer Events ==========
      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer;
        console.log('👤 Customer created:', {
          id: customer.id,
          email: customer.email,
          metadata: customer.metadata,
        });

        // Customer created in Stripe
        // Already handled in payment/subscription endpoints
        break;
      }

      case 'customer.updated': {
        const customer = event.data.object as Stripe.Customer;
        console.log('👤 Customer updated:', {
          id: customer.id,
          email: customer.email,
          metadata: customer.metadata,
        });

        // Customer information updated
        // TODO: Sync any changes to local database
        break;
      }

      // ========== Charge Events (for additional tracking) ==========
      case 'charge.succeeded': {
        const charge = event.data.object as Stripe.Charge;
        console.log('💳 Charge succeeded:', {
          id: charge.id,
          amount: charge.amount,
          customer: charge.customer,
          paymentIntent: charge.payment_intent,
        });

        // Charge completed successfully
        // Already captured by payment_intent.succeeded
        break;
      }

      case 'charge.failed': {
        const charge = event.data.object as Stripe.Charge;
        console.log('💳 Charge failed:', {
          id: charge.id,
          amount: charge.amount,
          customer: charge.customer,
          failureCode: charge.failure_code,
          failureMessage: charge.failure_message,
        });

        // Charge failed
        // Already captured by payment_intent.payment_failed
        break;
      }

      // ========== Refund Events ==========
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        console.log('↩️ Charge refunded:', {
          id: charge.id,
          amount: charge.amount,
          amountRefunded: charge.amount_refunded,
          customer: charge.customer,
        });

        // Donation was refunded
        // TODO: Update database - mark donation as refunded
        // TODO: Send refund confirmation email
        // TODO: Update donor's contribution total
        break;
      }

      // ========== Unhandled Events ==========
      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    // Mark event as processed (idempotency)
    processedEvents.add(event.id);

    // Clean up old processed events (keep last 1000)
    // TODO: In production, use database with TTL or cleanup job
    if (processedEvents.size > 1000) {
      const toDelete = Array.from(processedEvents).slice(0, 500);
      toDelete.forEach(id => processedEvents.delete(id));
    }

    // Always return 200 OK to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    // Log error but still return 200 so Stripe doesn't retry
    console.error('Error processing webhook event:', error);

    // In production, you might want to:
    // - Store failed events in a dead letter queue
    // - Alert your team about processing failures
    // - Still return 200 to prevent retries

    return NextResponse.json(
      { received: true, error: 'Processing error' },
      { status: 200 }
    );
  }
}
