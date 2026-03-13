-- ============================================================
-- Conversations
-- ============================================================
CREATE TABLE public.conversations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz,
  subject         text
);

-- ============================================================
-- Conversation Participants
-- ============================================================
CREATE TABLE public.conversation_participants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at       timestamptz NOT NULL DEFAULT now(),
  last_read_at    timestamptz,
  UNIQUE(conversation_id, user_id)
);

-- ============================================================
-- Direct Messages
-- ============================================================
CREATE TABLE public.direct_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL REFERENCES auth.users(id),
  body            text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  edited_at       timestamptz,
  is_deleted      boolean NOT NULL DEFAULT false
);

-- ============================================================
-- Message Attachments
-- ============================================================
CREATE TABLE public.message_attachments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id   uuid NOT NULL REFERENCES public.direct_messages(id) ON DELETE CASCADE,
  file_name    text NOT NULL,
  file_type    text NOT NULL,
  file_size    integer NOT NULL,
  storage_path text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Storage Bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('message-attachments', 'message-attachments', false);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- conversations: SELECT if user is a participant
CREATE POLICY "users view own conversations"
  ON public.conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
    )
  );

-- conversation_participants: SELECT if user is a participant in the same conversation
CREATE POLICY "users view conversation participants"
  ON public.conversation_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id AND cp.user_id = auth.uid()
    )
  );

-- direct_messages: SELECT if user is participant in that conversation
CREATE POLICY "users view conversation messages"
  ON public.direct_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = direct_messages.conversation_id AND cp.user_id = auth.uid()
    )
  );

-- direct_messages: INSERT if sender_id = auth.uid() AND user is participant
CREATE POLICY "users send messages in own conversations"
  ON public.direct_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = direct_messages.conversation_id AND cp.user_id = auth.uid()
    )
  );

-- message_attachments: SELECT if user is participant in the conversation containing the message
CREATE POLICY "users view message attachments"
  ON public.message_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.direct_messages dm
      JOIN public.conversation_participants cp ON cp.conversation_id = dm.conversation_id
      WHERE dm.id = message_attachments.message_id AND cp.user_id = auth.uid()
    )
  );

-- message_attachments: INSERT if user is the sender of the message
CREATE POLICY "users attach files to own messages"
  ON public.message_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.direct_messages dm
      WHERE dm.id = message_attachments.message_id AND dm.sender_id = auth.uid()
    )
  );

-- Storage policies for message-attachments bucket
CREATE POLICY "authenticated users upload message attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'message-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "authenticated users view message attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'message-attachments' AND auth.uid() IS NOT NULL);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX idx_direct_messages_conversation_created ON public.direct_messages(conversation_id, created_at DESC);
CREATE INDEX idx_direct_messages_sender_id ON public.direct_messages(sender_id);
CREATE INDEX idx_message_attachments_message_id ON public.message_attachments(message_id);

-- ============================================================
-- Trigger: auto-update conversations.last_message_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET updated_at = now(), last_message_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_conversation_on_message
AFTER INSERT ON direct_messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();
