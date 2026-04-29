-- Backfill: copy auth.users.email to profile tables where email is NULL
-- Fixes gap where OAuth signups did not populate profile.email

UPDATE user_profiles
SET email = au.email
FROM auth.users au
WHERE user_profiles.id = au.id
  AND user_profiles.email IS NULL
  AND au.email IS NOT NULL;

UPDATE interpreter_profiles
SET email = au.email
FROM auth.users au
WHERE interpreter_profiles.user_id = au.id
  AND interpreter_profiles.email IS NULL
  AND au.email IS NOT NULL;

UPDATE deaf_profiles
SET email = au.email
FROM auth.users au
WHERE deaf_profiles.id = au.id
  AND deaf_profiles.email IS NULL
  AND au.email IS NOT NULL;

UPDATE requester_profiles
SET email = au.email
FROM auth.users au
WHERE requester_profiles.user_id = au.id
  AND requester_profiles.email IS NULL
  AND au.email IS NOT NULL;
