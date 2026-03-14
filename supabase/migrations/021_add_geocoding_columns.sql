ALTER TABLE interpreter_profiles ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE interpreter_profiles ADD COLUMN IF NOT EXISTS longitude double precision;

-- Index for distance queries
CREATE INDEX IF NOT EXISTS idx_interpreter_profiles_geo
ON interpreter_profiles(latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
