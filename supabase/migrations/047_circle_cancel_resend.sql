-- Add columns for cancel/resend tracking on trusted_deaf_circle
ALTER TABLE public.trusted_deaf_circle ADD COLUMN IF NOT EXISTS resend_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.trusted_deaf_circle ADD COLUMN IF NOT EXISTS last_sent_at timestamptz;
ALTER TABLE public.trusted_deaf_circle ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- If there's a CHECK constraint on status, we need to allow 'cancelled'.
-- Drop and recreate with expanded values. This is safe because the constraint
-- name may vary; use a DO block to handle it gracefully.
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON con.conrelid = rel.oid
  WHERE rel.relname = 'trusted_deaf_circle'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) LIKE '%status%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.trusted_deaf_circle DROP CONSTRAINT ' || quote_ident(constraint_name);
    ALTER TABLE public.trusted_deaf_circle
      ADD CONSTRAINT trusted_deaf_circle_status_check
      CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled'));
  END IF;
END $$;
