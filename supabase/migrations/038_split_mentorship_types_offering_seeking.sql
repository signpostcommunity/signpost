-- Split mentorship_types into separate offering/seeking columns
-- so interpreters can have independent knowledge area selections

ALTER TABLE interpreter_profiles
  ADD COLUMN IF NOT EXISTS mentorship_types_offering text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS mentorship_types_seeking text[] DEFAULT '{}';

-- Migrate existing data: copy current mentorship_types to both columns
UPDATE interpreter_profiles
SET mentorship_types_offering = mentorship_types,
    mentorship_types_seeking = mentorship_types
WHERE mentorship_types IS NOT NULL AND array_length(mentorship_types, 1) > 0;

-- Keep mentorship_types as safety net (drop later after verifying migration)
