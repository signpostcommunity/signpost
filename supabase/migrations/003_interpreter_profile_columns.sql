-- Add missing columns to interpreter_profiles for the profile editor
ALTER TABLE public.interpreter_profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.interpreter_profiles ADD COLUMN IF NOT EXISTS draft_data jsonb;
