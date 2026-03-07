-- Full schema reconciliation: interpreter_profiles
-- Adds every column referenced by ProfileClient.tsx, Step6Review.tsx,
-- and FormContext.tsx that doesn't exist in the original schema.
--
-- Existing DB columns (confirmed via OpenAPI introspection):
--   id, user_id, name, location, state, country, city, interpreter_type,
--   work_mode, years_experience (int), bio, website_url, linkedin_url,
--   event_coordination, event_coordination_desc, available, avatar_color,
--   video_url, video_desc, rating, review_count, status, created_at, updated_at

-- ── New scalar columns ──────────────────────────────────────────────────────
ALTER TABLE public.interpreter_profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.interpreter_profiles ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE public.interpreter_profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.interpreter_profiles ADD COLUMN IF NOT EXISTS phone text;

-- ── Signup / draft columns ──────────────────────────────────────────────────
ALTER TABLE public.interpreter_profiles ADD COLUMN IF NOT EXISTS draft_step int;
ALTER TABLE public.interpreter_profiles ADD COLUMN IF NOT EXISTS draft_data jsonb;
ALTER TABLE public.interpreter_profiles ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

-- ── Denormalized array columns ──────────────────────────────────────────────
-- The profile editor and signup form save these directly on the row
-- rather than using the separate junction tables.
ALTER TABLE public.interpreter_profiles ADD COLUMN IF NOT EXISTS sign_languages text[] DEFAULT '{}';
ALTER TABLE public.interpreter_profiles ADD COLUMN IF NOT EXISTS spoken_languages text[] DEFAULT '{}';
ALTER TABLE public.interpreter_profiles ADD COLUMN IF NOT EXISTS specializations text[] DEFAULT '{}';
ALTER TABLE public.interpreter_profiles ADD COLUMN IF NOT EXISTS regions text[] DEFAULT '{}';

-- ── Type fix ────────────────────────────────────────────────────────────────
-- years_experience was integer but the editor stores human-readable strings
-- like "5–10 years". Change to text.
ALTER TABLE public.interpreter_profiles ALTER COLUMN years_experience TYPE text USING years_experience::text;

-- ── Allow 'draft' as a valid status ─────────────────────────────────────────
-- The original CHECK constraint only allows: pending, approved, suspended.
-- The signup flow sets status='draft' for auto-save.
ALTER TABLE public.interpreter_profiles DROP CONSTRAINT IF EXISTS interpreter_profiles_status_check;
ALTER TABLE public.interpreter_profiles ADD CONSTRAINT interpreter_profiles_status_check
  CHECK (status IN ('draft', 'pending', 'approved', 'suspended'));

-- ── Unique constraint on user_id ─────────────────────────────────────────
-- Required for upsert({ onConflict: 'user_id' }) to work correctly.
-- Without this, every upsert attempts INSERT instead of UPDATE.
CREATE UNIQUE INDEX IF NOT EXISTS interpreter_profiles_user_id_key ON public.interpreter_profiles(user_id);

-- Reload PostgREST schema cache so new columns are immediately available
NOTIFY pgrst, 'reload schema';
