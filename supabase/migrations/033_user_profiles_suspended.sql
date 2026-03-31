-- Add suspended column to user_profiles for universal suspension across all roles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS suspended boolean DEFAULT false;
