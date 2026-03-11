-- Add pending_roles column to user_profiles for multi-role signup
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS pending_roles text[] DEFAULT '{}';
