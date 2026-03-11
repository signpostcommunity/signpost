-- Add is_admin column to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Set admin flag for known admin users
UPDATE user_profiles SET is_admin = true WHERE id = 'ea178ba5-6e4b-436a-b18e-747702a7140b';

-- RLS policy: allow admins to read all user_profiles
CREATE POLICY "admins_read_all_profiles" ON user_profiles
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE is_admin = true)
    OR id = auth.uid()
  );
