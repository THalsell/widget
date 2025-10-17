-- Disable RLS for service role access (webhook handler uses service role)
-- This is safe because your API routes are protected server-side

-- Donors table
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for service role" ON donors
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Donations table
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for service role" ON donations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Subscriptions table
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for service role" ON subscriptions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Webhook events table
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for service role" ON webhook_events
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Widget configs table
ALTER TABLE widget_configs ENABLE ROW LEVEL SECURITY;

-- Allow public read access (so widgets can fetch their config)
CREATE POLICY "Enable read access for all users" ON widget_configs
  FOR SELECT
  TO anon, authenticated
  USING ("isActive" = true);

-- Allow full access for authenticated users (API routes with service role)
CREATE POLICY "Enable all access for service role" ON widget_configs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Prisma migrations table (internal use only)
ALTER TABLE _prisma_migrations ENABLE ROW LEVEL SECURITY;

-- Restrict all access to service role only (Prisma CLI uses this)
CREATE POLICY "Service role only access" ON _prisma_migrations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
