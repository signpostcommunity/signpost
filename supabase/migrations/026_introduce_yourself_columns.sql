-- Add sharing preference columns for intro text and video
ALTER TABLE deaf_profiles
  ADD COLUMN IF NOT EXISTS share_intro_text_before_confirm boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS share_intro_video_before_confirm boolean NOT NULL DEFAULT true;
