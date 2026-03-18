-- Add vanity_slug column to deaf_profiles
ALTER TABLE deaf_profiles
  ADD COLUMN IF NOT EXISTS vanity_slug text;

-- Unique case-insensitive index
CREATE UNIQUE INDEX IF NOT EXISTS idx_deaf_profiles_vanity_slug
  ON deaf_profiles (lower(vanity_slug));

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_deaf_profiles_vanity_slug_lookup
  ON deaf_profiles (vanity_slug);

-- Create dhh_requester_connections table
CREATE TABLE IF NOT EXISTS dhh_requester_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dhh_user_id uuid NOT NULL REFERENCES deaf_profiles(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'revoked')),
  initiated_by text NOT NULL CHECK (initiated_by IN ('dhh', 'requester')),
  requester_org_name text,
  confirmed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Unique index: only one active/pending connection per pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_dhh_requester_connections_unique
  ON dhh_requester_connections (dhh_user_id, requester_id)
  WHERE status IN ('active', 'pending');

-- RLS
ALTER TABLE dhh_requester_connections ENABLE ROW LEVEL SECURITY;

-- DHH users can see their own connections
CREATE POLICY "dhh_read_own_connections" ON dhh_requester_connections
  FOR SELECT USING (
    dhh_user_id IN (
      SELECT dp.id FROM deaf_profiles dp
      WHERE dp.id = auth.uid() OR dp.user_id = auth.uid()
    )
  );

-- DHH users can update (revoke) their own connections
CREATE POLICY "dhh_update_own_connections" ON dhh_requester_connections
  FOR UPDATE USING (
    dhh_user_id IN (
      SELECT dp.id FROM deaf_profiles dp
      WHERE dp.id = auth.uid() OR dp.user_id = auth.uid()
    )
  );

-- Requesters can see connections they created
CREATE POLICY "requester_read_own_connections" ON dhh_requester_connections
  FOR SELECT USING (requester_id = auth.uid());

-- Requesters can create connections
CREATE POLICY "requester_insert_connections" ON dhh_requester_connections
  FOR INSERT WITH CHECK (requester_id = auth.uid());

-- Requesters can update their own connections
CREATE POLICY "requester_update_own_connections" ON dhh_requester_connections
  FOR UPDATE USING (requester_id = auth.uid());
