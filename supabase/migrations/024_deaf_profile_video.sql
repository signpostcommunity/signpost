-- Migration 024: Deaf profile video + booking context video columns

-- Deaf "Who I Am" profile video
ALTER TABLE deaf_profiles ADD COLUMN IF NOT EXISTS profile_video_url text;

-- Booking context video (columns may already exist but adding IF NOT EXISTS)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS context_video_url text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS context_video_visible_before_accept boolean DEFAULT true;
