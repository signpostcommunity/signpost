-- ============================================================
-- Add columns to deaf_profiles
-- ============================================================
ALTER TABLE public.deaf_profiles ADD COLUMN IF NOT EXISTS pronouns text;
ALTER TABLE public.deaf_profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.deaf_profiles ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.deaf_profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.deaf_profiles ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.deaf_profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.deaf_profiles ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE public.deaf_profiles ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.deaf_profiles ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.deaf_profiles ADD COLUMN IF NOT EXISTS country_name text;
ALTER TABLE public.deaf_profiles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.deaf_profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Backfill user_id from id (since deaf_profiles.id = auth.users.id via user_profiles)
UPDATE public.deaf_profiles SET user_id = id WHERE user_id IS NULL;

-- ============================================================
-- Update deaf_roster tier values to match prototype
-- ============================================================
UPDATE public.deaf_roster SET tier = 'approved' WHERE tier = 'backup';

ALTER TABLE public.deaf_roster DROP CONSTRAINT IF EXISTS deaf_roster_tier_check;
ALTER TABLE public.deaf_roster ADD CONSTRAINT deaf_roster_tier_check CHECK (tier IN ('preferred', 'approved', 'dnb'));

-- ============================================================
-- RLS policies on deaf_profiles
-- ============================================================
DROP POLICY IF EXISTS "deaf users read own profile" ON public.deaf_profiles;
DROP POLICY IF EXISTS "deaf users insert own profile" ON public.deaf_profiles;
DROP POLICY IF EXISTS "deaf users update own profile" ON public.deaf_profiles;

CREATE POLICY "deaf users read own profile"
  ON public.deaf_profiles FOR SELECT
  USING (id = auth.uid() OR user_id = auth.uid());

CREATE POLICY "deaf users insert own profile"
  ON public.deaf_profiles FOR INSERT
  WITH CHECK (id = auth.uid() OR user_id = auth.uid());

CREATE POLICY "deaf users update own profile"
  ON public.deaf_profiles FOR UPDATE
  USING (id = auth.uid() OR user_id = auth.uid());

CREATE POLICY "public read deaf profiles"
  ON public.deaf_profiles FOR SELECT
  USING (true);

-- ============================================================
-- RLS policies on deaf_roster
-- ============================================================
DROP POLICY IF EXISTS "deaf users read own roster" ON public.deaf_roster;
DROP POLICY IF EXISTS "deaf users write own roster" ON public.deaf_roster;

CREATE POLICY "deaf users read own roster"
  ON public.deaf_roster FOR SELECT
  USING (deaf_user_id IN (SELECT id FROM public.deaf_profiles WHERE id = auth.uid() OR user_id = auth.uid()));

CREATE POLICY "deaf users manage own roster"
  ON public.deaf_roster FOR ALL
  USING (deaf_user_id IN (SELECT id FROM public.deaf_profiles WHERE id = auth.uid() OR user_id = auth.uid()));
