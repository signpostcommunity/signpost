export type NotificationType =
  | 'welcome' | 'profile_approved' | 'profile_denied'
  | 'new_request' | 'booking_confirmed' | 'rate_response'
  | 'booking_cancelled'
  | 'cancelled_by_requester' | 'cancelled_by_you'
  | 'sub_search_update' | 'booking_reminder'
  | 'new_message' | 'invoice_paid'
  | 'team_invite' | 'added_to_preferred_list'
  | 'added_to_preferred_list_by_interpreter'
  | 'added_to_preferred_list_by_org'
  | 'added_to_preferred_list_by_dhh'

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
 * Routes ALL notification creation through the server-side API route,
 * which handles both in-app insert and email delivery via Resend.
 */
export async function sendNotification(params: SendNotificationParams) {
  try {
    const res = await fetch('/api/notifications/send', {
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
        channel: 'both',
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      console.error('[notifications] API error:', data.error || res.statusText)
    }
  } catch (e) {
    console.error('[notifications] send request failed:', e instanceof Error ? e.message : e)
  }
}
