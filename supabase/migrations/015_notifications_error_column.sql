-- Add error column to notifications table (may already exist via 013)
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS error text;
