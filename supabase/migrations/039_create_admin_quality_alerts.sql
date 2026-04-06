-- Admin Quality Alerts: holistic interpreter quality monitoring
CREATE TABLE IF NOT EXISTS admin_quality_alerts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  interpreter_id uuid NOT NULL,
  interpreter_name text,
  alert_level text NOT NULL CHECK (alert_level IN ('yellow', 'orange', 'red')),
  signal_type text NOT NULL CHECK (signal_type IN ('would_not_book', 'low_rating', 'dnb_frequency', 'cancellation_pattern', 'flags')),
  signal_details jsonb DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'reviewed', 'dismissed', 'action_taken')),
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_quality_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_manage_quality_alerts" ON admin_quality_alerts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE INDEX idx_quality_alerts_interpreter ON admin_quality_alerts(interpreter_id, created_at DESC);
CREATE INDEX idx_quality_alerts_active ON admin_quality_alerts(status) WHERE status = 'active';
