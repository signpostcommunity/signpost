-- Add missing created_at column to interpreter_rate_profiles
ALTER TABLE public.interpreter_rate_profiles
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

NOTIFY pgrst, 'reload schema';
