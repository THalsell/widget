# Database Integration - Complete! ✅

## What Was Set Up

### 1. Database Schema (PostgreSQL + Prisma)
**Location:** `prisma/schema.prisma`

Created 4 tables:
- **Donors** - Stores donor information (email, name)
- **Donations** - Individual donation records
- **Subscriptions** - Recurring subscription tracking
- **WebhookEvents** - Idempotency tracking for Stripe webhooks

### 2. Prisma Client
**Location:** `src/lib/prisma.ts`

Configured Prisma client with proper singleton pattern for Next.js development.

### 3. Updated Stripe Webhook Handler
**Location:** `src/app/api/webhooks/stripe/route.ts`

Now automatically saves to database:
- ✅ One-time donations (`payment_intent.succeeded`)
- ✅ Recurring donation payments (`invoice.payment_succeeded`)
- ✅ Subscription creation (`customer.subscription.created`)
- ✅ Subscription updates (`customer.subscription.updated`)
- ✅ Subscription cancellations (`customer.subscription.deleted`)
- ✅ Webhook event tracking (prevents duplicate processing)

## Database Connection

The local Prisma Postgres database is running on:
- HTTP: `localhost:51213`
- TCP: `localhost:51214`

**Connection string is already in your `.env` file!**

## How to Use

### View Your Data

You can explore your database using Prisma Studio:

```bash
npx prisma studio
```

This opens a GUI at `http://localhost:5555` where you can:
- Browse all donors
- View donation history
- Check subscription status
- See webhook events

### Query Examples

In your code, you can now query donations like this:

```typescript
import { prisma } from '@/lib/prisma';

// Get all donations
const donations = await prisma.donation.findMany({
  include: {
    donor: true, // Include donor info
  },
  orderBy: {
    createdAt: 'desc',
  },
});

// Get total donations
const total = await prisma.donation.aggregate({
  where: {
    status: 'succeeded',
  },
  _sum: {
    amount: true, // Sum in cents
  },
});

// Get donor with all their donations
const donor = await prisma.donor.findUnique({
  where: { email: 'donor@example.com' },
  include: {
    donations: true,
    subscriptions: true,
  },
});

// Get active subscriptions
const activeSubscriptions = await prisma.subscription.findMany({
  where: {
    status: 'active',
  },
  include: {
    donor: true,
  },
});
```

## What Happens Now

Every time someone donates:
1. Stripe processes the payment
2. Stripe sends webhook to your endpoint
3. Webhook handler saves to database automatically
4. You can query the data anytime!

## Next Steps (Optional)

### 1. Create an Admin Dashboard
Create a new page to view donations:

```bash
# Example: src/app/admin/page.tsx
```

Display:
- Total raised
- Recent donations
- Top donors
- Subscription metrics

### 2. Generate Reports
Query your database to create:
- Monthly donation reports
- Donor retention stats
- Cause-specific breakdowns

### 3. Send Custom Receipts
Use the donor email from the database to send:
- Thank you emails
- Tax receipts
- Impact reports

## Database Commands

```bash
# View data in browser
npx prisma studio

# Create new migration after schema changes
npx prisma migrate dev --name description

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Generate Prisma Client after schema changes
npx prisma generate

# Check database connection
npx prisma db push
```

## Important Notes

### Local Development
- The Prisma Postgres database is running locally
- It will persist data between restarts
- Run `npx prisma dev` if the database stops

### Production Deployment
When deploying to production, you'll need to:
1. Set up a production PostgreSQL database (Vercel Postgres, Supabase, Railway, etc.)
2. Update `DATABASE_URL` in production environment variables
3. Run migrations: `npx prisma migrate deploy`

### Database Location
Your local database is stored in Docker and managed by Prisma. To stop it:

```bash
# The Prisma dev server is running in the background
# It will persist until you explicitly stop it
```

## Schema Overview

```
Donor
├── id (UUID)
├── email (unique)
├── name
├── donations []
└── subscriptions []

Donation
├── id (UUID)
├── donorId → Donor
├── stripePaymentIntentId
├── stripeSubscriptionId
├── amount (cents)
├── currency
├── frequency
├── causeId
├── causeName
├── feesCovered
├── feeAmount
├── status
└── metadata (JSON)

Subscription
├── id (UUID)
├── donorId → Donor
├── stripeSubscriptionId
├── amount (cents per period)
├── frequency
├── status
├── currentPeriodStart
├── currentPeriodEnd
└── canceledAt

WebhookEvent
├── id (UUID)
├── stripeEventId (unique)
├── type
├── processed
└── processedAt
```

## Success! 🎉

Your donation widget now has full database integration. Every donation is automatically tracked and stored!
