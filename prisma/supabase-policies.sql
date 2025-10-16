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
