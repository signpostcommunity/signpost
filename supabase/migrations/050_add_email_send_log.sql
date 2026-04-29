-- Email send log: persists admin announcement send history across sessions
-- Applied via Supabase MCP on 2026-04-29

CREATE TABLE public.email_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  sender_email TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  resend_message_id TEXT,
  error_message TEXT,
  sent_by_user_id UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_email_send_log_sent_at ON public.email_send_log (sent_at DESC);
CREATE INDEX idx_email_send_log_recipient_template ON public.email_send_log (recipient_email, template_name);

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_email_send_log" ON public.email_send_log
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "admin_insert_email_send_log" ON public.email_send_log
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = true)
  );
