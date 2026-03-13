-- Add do_not_book column to deaf_roster
ALTER TABLE public.deaf_roster ADD COLUMN IF NOT EXISTS do_not_book boolean DEFAULT false;

-- Update deaf_roster tier constraint to also allow 'dnb'
ALTER TABLE public.deaf_roster DROP CONSTRAINT IF EXISTS deaf_roster_tier_check;
ALTER TABLE public.deaf_roster ADD CONSTRAINT deaf_roster_tier_check CHECK (tier IN ('preferred', 'approved', 'dnb', 'secondary'));

-- Add non_recommended column to interpreter_preferred_team (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interpreter_preferred_team') THEN
    ALTER TABLE public.interpreter_preferred_team ADD COLUMN IF NOT EXISTS non_recommended boolean DEFAULT false;
  END IF;
END $$;
