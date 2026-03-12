-- Create notifications table for in-app and email notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  type            text NOT NULL,
  channel         text NOT NULL DEFAULT 'in_app',
  subject         text,
  body            text,
  metadata        jsonb DEFAULT '{}',
  status          text NOT NULL DEFAULT 'sent',
  sent_at         timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (recipient_user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (recipient_user_id = auth.uid());

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (recipient_user_id = auth.uid());

-- Service role can insert notifications for any user
CREATE POLICY "Service role can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);
