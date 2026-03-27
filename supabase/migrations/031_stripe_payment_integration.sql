-- Stripe Payment Integration
-- Adds Stripe columns to requester_profiles and bookings,
-- creates booking_credits table for interpreter-cancellation credits.
-- Applied via Supabase MCP on 2026-03-27.

-- requester_profiles: Stripe customer and payment method
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'requester_profiles' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE requester_profiles ADD COLUMN stripe_customer_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'requester_profiles' AND column_name = 'stripe_default_payment_method_id'
  ) THEN
    ALTER TABLE requester_profiles ADD COLUMN stripe_default_payment_method_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'stripe_payment_intent_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN stripe_payment_intent_id TEXT;
  END IF;
END $$;

-- Booking credits (interpreter-cancellation refund credits)
CREATE TABLE IF NOT EXISTS booking_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES auth.users(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 15.00,
  reason TEXT NOT NULL,
  source_booking_id UUID REFERENCES bookings(id),
  applied_to_booking_id UUID REFERENCES bookings(id),
  status TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '12 months')
);

ALTER TABLE booking_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "requester_read_own_credits" ON booking_credits;
CREATE POLICY "requester_read_own_credits" ON booking_credits
  FOR SELECT USING (auth.uid() = requester_id);

DROP POLICY IF EXISTS "admin_all_credits" ON booking_credits;
CREATE POLICY "admin_all_credits" ON booking_credits
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
  );
