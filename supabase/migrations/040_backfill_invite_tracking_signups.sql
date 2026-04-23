-- Backfill signed_up_user_id / signed_up_at / status='signed_up' for invites
-- where the recipient later created an account.
-- Idempotent: only updates rows still at status='sent'.
-- Cannot reconstruct clicked_at -- that data is lost for historical rows.

UPDATE invite_tracking it
SET
  signed_up_user_id = u.id,
  signed_up_at = u.created_at,
  status = 'signed_up'
FROM auth.users u
WHERE
  it.recipient_email IS NOT NULL
  AND LOWER(it.recipient_email) = LOWER(u.email)
  AND u.created_at > it.sent_at
  AND it.status = 'sent';
