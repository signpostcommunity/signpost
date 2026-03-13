-- Add DHH client fields to bookings (all additive, no existing columns changed)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS dhh_client_id uuid REFERENCES auth.users(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS request_type text DEFAULT 'professional';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/Los_Angeles';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS comm_prefs_snapshot jsonb;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS event_type text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS event_category text;

-- Add CHECK constraint for request_type
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_request_type_check'
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_request_type_check
    CHECK (request_type IN ('personal', 'professional'));
  END IF;
END $$;

-- Update format constraint to also allow 'hybrid'
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_format_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_format_check CHECK (format IN ('in_person', 'remote', 'hybrid'));

-- Index for DHH client lookups
CREATE INDEX IF NOT EXISTS idx_bookings_dhh_client ON bookings(dhh_client_id) WHERE dhh_client_id IS NOT NULL;

-- RLS: DHH users can see bookings where they are the client
DROP POLICY IF EXISTS "dhh_client_view_bookings" ON bookings;
CREATE POLICY "dhh_client_view_bookings" ON bookings FOR SELECT USING (
  dhh_client_id = auth.uid()
);

-- RLS: DHH users can create personal requests
DROP POLICY IF EXISTS "dhh_client_create_bookings" ON bookings;
CREATE POLICY "dhh_client_create_bookings" ON bookings FOR INSERT WITH CHECK (
  dhh_client_id = auth.uid() AND request_type = 'personal'
);
