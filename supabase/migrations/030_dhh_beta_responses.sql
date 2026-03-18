-- ============================================================
-- DHH Beta Responses table
-- ============================================================
CREATE TABLE dhh_beta_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  page_path text NOT NULL,
  question_key text NOT NULL,
  response_type text NOT NULL CHECK (response_type IN ('free_text', 'multiple_choice')),
  response_text text,
  response_choice text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for upsert lookups
CREATE UNIQUE INDEX idx_dhh_beta_responses_upsert
  ON dhh_beta_responses (user_id, page_path, question_key);

-- RLS
ALTER TABLE dhh_beta_responses ENABLE ROW LEVEL SECURITY;

-- Users can insert their own rows
CREATE POLICY "dhh_beta_responses_insert_own"
  ON dhh_beta_responses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own rows
CREATE POLICY "dhh_beta_responses_update_own"
  ON dhh_beta_responses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can select their own rows
CREATE POLICY "dhh_beta_responses_select_own"
  ON dhh_beta_responses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can read all
CREATE POLICY "dhh_beta_responses_admin_read"
  ON dhh_beta_responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.is_admin = true
    )
  );

-- ============================================================
-- DHH Beta Status table (tracks progress)
-- ============================================================
CREATE TABLE dhh_beta_status (
  user_id uuid PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  welcome_dismissed boolean NOT NULL DEFAULT false,
  pages_visited text[] NOT NULL DEFAULT '{}',
  final_completed boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE dhh_beta_status ENABLE ROW LEVEL SECURITY;

-- Users can insert their own row
CREATE POLICY "dhh_beta_status_insert_own"
  ON dhh_beta_status FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own row
CREATE POLICY "dhh_beta_status_select_own"
  ON dhh_beta_status FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own row
CREATE POLICY "dhh_beta_status_update_own"
  ON dhh_beta_status FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all
CREATE POLICY "dhh_beta_status_admin_read"
  ON dhh_beta_status FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.is_admin = true
    )
  );
