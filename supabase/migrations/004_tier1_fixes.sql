-- Tier 1 beta fixes: add missing columns for photo and other_specializations

ALTER TABLE public.interpreter_profiles ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.interpreter_profiles ADD COLUMN IF NOT EXISTS other_specializations text;

NOTIFY pgrst, 'reload schema';
