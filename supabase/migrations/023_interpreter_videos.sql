-- Migration 023: Interpreter multi-language intro videos

CREATE TABLE interpreter_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interpreter_id uuid NOT NULL REFERENCES interpreter_profiles(id) ON DELETE CASCADE,
  language text NOT NULL,
  label text,
  video_url text NOT NULL,
  video_source text NOT NULL DEFAULT 'url' CHECK (video_source IN ('recorded', 'uploaded', 'url')),
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_interpreter_videos_interpreter ON interpreter_videos(interpreter_id);

ALTER TABLE interpreter_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "interpreters_manage_own_videos" ON interpreter_videos
  FOR ALL USING (
    interpreter_id IN (SELECT id FROM interpreter_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "public_read_videos" ON interpreter_videos
  FOR SELECT USING (
    interpreter_id IN (SELECT id FROM interpreter_profiles WHERE status = 'approved')
  );

-- Migrate existing video_url data
INSERT INTO interpreter_videos (interpreter_id, language, label, video_url, video_source)
SELECT id, COALESCE(sign_languages[1], 'ASL'), video_desc, video_url, 'url'
FROM interpreter_profiles
WHERE video_url IS NOT NULL AND video_url != '';
