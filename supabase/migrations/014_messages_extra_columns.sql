-- Add columns to messages table for inbox display and seed data tracking
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS sender_name text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS preview text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_seed boolean DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS interpreter_id uuid REFERENCES public.interpreter_profiles(id) ON DELETE CASCADE;
