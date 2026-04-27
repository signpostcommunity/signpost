-- Partial unique index for real-member rows
CREATE UNIQUE INDEX interpreter_preferred_team_member_pair_uidx
  ON interpreter_preferred_team (interpreter_id, member_interpreter_id)
  WHERE member_interpreter_id IS NOT NULL;

-- Partial unique index for placeholder rows (case-insensitive email)
CREATE UNIQUE INDEX interpreter_preferred_team_email_pair_uidx
  ON interpreter_preferred_team (interpreter_id, lower(email))
  WHERE member_interpreter_id IS NULL AND email IS NOT NULL AND email <> '';
