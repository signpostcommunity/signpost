-- 043_invite_tracking_sender_role_requester.sql
-- Add 'requester' to sender_role CHECK constraint (Monday 11834572796)

DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'invite_tracking'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%sender_role%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE invite_tracking DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE invite_tracking
ADD CONSTRAINT invite_tracking_sender_role_check
CHECK (sender_role IN ('interpreter', 'deaf', 'requester'));
