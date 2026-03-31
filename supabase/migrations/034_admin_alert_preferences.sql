-- Admin alert preferences: JSONB column on user_profiles
-- Only meaningful when is_admin = true. Each admin opts into alerts independently.
-- Default structure per alert type: { "email": false, "sms": false }

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS admin_alert_preferences JSONB DEFAULT '{}'::jsonb;

-- Phone number for SMS alerts (nullable, only used by admins)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS admin_phone TEXT DEFAULT NULL;
