-- Add vanity_slug column to interpreter_profiles
ALTER TABLE interpreter_profiles
  ADD COLUMN IF NOT EXISTS vanity_slug text;

-- Unique constraint (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_interpreter_profiles_vanity_slug
  ON interpreter_profiles (lower(vanity_slug));

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_interpreter_profiles_vanity_slug_lookup
  ON interpreter_profiles (vanity_slug);
