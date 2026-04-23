-- 042_pending_invites_redesign.sql
-- Add 'cancelled' status + resend_count for Pending Invites redesign (Monday 11824449245)

-- 1. Add 'cancelled' to status CHECK constraint
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'invite_tracking'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%status%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE invite_tracking DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE invite_tracking
ADD CONSTRAINT invite_tracking_status_check
CHECK (status IN ('sent', 'clicked', 'signed_up', 'accepted', 'cancelled'));

-- 2. Add resend_count column
ALTER TABLE invite_tracking
ADD COLUMN IF NOT EXISTS resend_count integer NOT NULL DEFAULT 0;

-- 3. Index for sender + status lookups (used by GET /api/invites)
CREATE INDEX IF NOT EXISTS idx_invite_tracking_sender_status
ON invite_tracking (sender_user_id, status);
