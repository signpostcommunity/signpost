-- Add notification_phone to requester_profiles for SMS notifications
-- interpreter_profiles already has notification_phone from a previous migration

ALTER TABLE requester_profiles
ADD COLUMN IF NOT EXISTS notification_phone TEXT DEFAULT NULL;
