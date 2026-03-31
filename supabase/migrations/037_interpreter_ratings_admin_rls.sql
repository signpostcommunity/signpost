-- Admin read-all policy for interpreter_ratings.
-- Interpreters must NEVER see individual ratings.
-- Only the Deaf user who created the rating and admins can view rating data.

-- Drop if already exists (idempotent)
DROP POLICY IF EXISTS "admin_read_all_ratings" ON interpreter_ratings;

CREATE POLICY "admin_read_all_ratings" ON interpreter_ratings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- TODO: Surface interpreters with 3+ "would not book again" ratings to admin dashboard
