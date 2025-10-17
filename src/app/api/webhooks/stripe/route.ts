import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

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
  const existingEvent = await prisma.webhookEvent.findUnique({
    where: { stripeEventId: event.id },
  });

  if (existingEvent?.processed) {
    console.log(`Event ${event.id} already processed, skipping`);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Create or update webhook event record
  await prisma.webhookEvent.upsert({
    where: { stripeEventId: event.id },
    create: {
      stripeEventId: event.id,
      type: event.type,
      processed: false,
    },
    update: {},
  });

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

        // Get customer details from Stripe
        const customerEmail = paymentIntent.receipt_email ||
          (paymentIntent.customer ?
            (await stripe.customers.retrieve(paymentIntent.customer as string) as Stripe.Customer).email
            : null);

        const customerName = paymentIntent.shipping?.name ||
          (paymentIntent.customer ?
            (await stripe.customers.retrieve(paymentIntent.customer as string) as Stripe.Customer).name
            : null);

        if (customerEmail) {
          // Find or create donor
          const donor = await prisma.donor.upsert({
            where: { email: customerEmail },
            create: {
              email: customerEmail,
              name: customerName || undefined,
            },
            update: {
              name: customerName || undefined,
            },
          });

          // Create donation record
          await prisma.donation.create({
            data: {
              donorId: donor.id,
              stripePaymentIntentId: paymentIntent.id,
              amount: paymentIntent.amount,
              currency: paymentIntent.currency,
              frequency: 'once',
              causeId: paymentIntent.metadata?.causeId || null,
              causeName: paymentIntent.metadata?.causeName || null,
              feesCovered: paymentIntent.metadata?.feesCovered === 'true',
              feeAmount: parseInt(paymentIntent.metadata?.feeAmount || '0'),
              status: 'succeeded',
              metadata: paymentIntent.metadata as Stripe.Metadata,
            },
          });

          console.log(`✅ Donation saved to database for ${customerEmail}`);
        }

        // TODO: Send receipt email to donor
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
        const invoiceSubscriptionId = (invoice as unknown as { subscription: string | Stripe.Subscription | null }).subscription;
        console.log('✅ Invoice paid:', {
          id: invoice.id,
          subscription: invoiceSubscriptionId,
          amount: invoice.amount_paid,
          customer: invoice.customer,
          metadata: invoice.metadata,
        });

        // This fires for every recurring subscription payment
        if (invoiceSubscriptionId) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(invoiceSubscriptionId as string);
          const customer = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer;

          if (customer.email) {
            // Find or create donor
            const donor = await prisma.donor.upsert({
              where: { email: customer.email },
              create: {
                email: customer.email,
                name: customer.name || undefined,
              },
              update: {
                name: customer.name || undefined,
              },
            });

            // Create donation record for this recurring payment
            await prisma.donation.create({
              data: {
                donorId: donor.id,
                stripeSubscriptionId: subscription.id,
                amount: invoice.amount_paid,
                currency: invoice.currency || 'usd',
                frequency: subscription.items.data[0]?.price.recurring?.interval || 'monthly',
                causeId: subscription.metadata?.causeId || null,
                causeName: subscription.metadata?.causeName || null,
                feesCovered: subscription.metadata?.feesCovered === 'true',
                feeAmount: parseInt(subscription.metadata?.feeAmount || '0'),
                status: 'succeeded',
                metadata: { invoiceId: invoice.id, ...subscription.metadata } as Stripe.Metadata,
              },
            });

            console.log(`✅ Recurring donation saved to database for ${customer.email}`);
          }
        }

        // TODO: Send thank you email for recurring donation
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceSubscriptionId = (invoice as unknown as { subscription: string | Stripe.Subscription | null }).subscription;
        console.log('❌ Invoice payment failed:', {
          id: invoice.id,
          subscription: invoiceSubscriptionId,
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

        // Get customer details
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;

        if (customer.email) {
          // Find or create donor
          const donor = await prisma.donor.upsert({
            where: { email: customer.email },
            create: {
              email: customer.email,
              name: customer.name || undefined,
            },
            update: {
              name: customer.name || undefined,
            },
          });

          // Create subscription record
          const subWithPeriods = subscription as unknown as { current_period_start: number; current_period_end: number };
          await prisma.subscription.upsert({
            where: { stripeSubscriptionId: subscription.id },
            create: {
              donorId: donor.id,
              stripeSubscriptionId: subscription.id,
              amount: subscription.items.data[0]?.price.unit_amount || 0,
              currency: subscription.currency || 'usd',
              frequency: subscription.items.data[0]?.price.recurring?.interval || 'monthly',
              causeId: subscription.metadata?.causeId || null,
              causeName: subscription.metadata?.causeName || null,
              status: subscription.status,
              currentPeriodStart: new Date(subWithPeriods.current_period_start * 1000),
              currentPeriodEnd: new Date(subWithPeriods.current_period_end * 1000),
            },
            update: {
              status: subscription.status,
              currentPeriodStart: new Date(subWithPeriods.current_period_start * 1000),
              currentPeriodEnd: new Date(subWithPeriods.current_period_end * 1000),
            },
          });

          console.log(`✅ Subscription saved to database for ${customer.email}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const subWithPeriods = subscription as unknown as { current_period_start: number; current_period_end: number };
        console.log('🔄 Subscription updated:', {
          id: subscription.id,
          customer: subscription.customer,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          metadata: subscription.metadata,
        });

        // Update subscription in database
        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: subscription.status,
            currentPeriodStart: new Date(subWithPeriods.current_period_start * 1000),
            currentPeriodEnd: new Date(subWithPeriods.current_period_end * 1000),
          },
        });

        console.log(`✅ Subscription ${subscription.id} updated in database`);
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

        // Mark subscription as canceled in database
        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: 'canceled',
            canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : new Date(),
          },
        });

        console.log(`✅ Subscription ${subscription.id} marked as canceled in database`);
        // TODO: Send cancellation confirmation email
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

    // Mark event as processed in database
    await prisma.webhookEvent.update({
      where: { stripeEventId: event.id },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });

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
