import { createClient } from '@/lib/supabase/client'

export type NotificationType =
  | 'welcome' | 'profile_approved' | 'profile_denied'
  | 'new_request' | 'booking_confirmed' | 'rate_response'
  | 'booking_cancelled'
  | 'cancelled_by_requester' | 'cancelled_by_you'
  | 'sub_search_update' | 'booking_reminder'
  | 'new_message' | 'invoice_paid'
  | 'team_invite' | 'added_to_preferred_list'

interface SendNotificationParams {
  recipientUserId: string
  type: NotificationType
  subject: string
  body: string
  metadata?: Record<string, unknown>
  ctaText?: string
  ctaUrl?: string
}

/**
 * Client-side notification helper.
 * Creates an in-app notification row and fires the server-side
 * API route for email delivery via Resend.
 */
export async function sendNotification(params: SendNotificationParams) {
  const supabase = createClient()

  // 1. Always create in-app notification row
  const { error: inAppErr } = await supabase
    .from('notifications')
    .insert({
      recipient_user_id: params.recipientUserId,
      type: params.type,
      channel: 'in_app',
      subject: params.subject,
      body: params.body,
      metadata: params.metadata ?? {},
      status: 'sent',
      sent_at: new Date().toISOString(),
    })

  if (inAppErr) {
    console.error('[notifications] in_app insert failed:', inAppErr.message)
  }

  // 2. Fire email delivery via API route (server-side handles prefs + Resend)
  try {
    await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientUserId: params.recipientUserId,
        subject: params.subject,
        body: params.body,
        type: params.type,
        metadata: params.metadata,
        ctaText: params.ctaText,
        ctaUrl: params.ctaUrl,
      }),
    })
  } catch (e) {
    console.error('[notifications] email send request failed:', e instanceof Error ? e.message : e)
  }
}
