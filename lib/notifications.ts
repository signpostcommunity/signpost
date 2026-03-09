import { createClient } from '@/lib/supabase/client'

export type NotificationType =
  | 'profile_saved' | 'profile_approved' | 'profile_denied'
  | 'new_request' | 'booking_confirmed' | 'rate_response'
  | 'cancelled_by_requester' | 'cancelled_by_you'
  | 'sub_search_update' | 'booking_reminder'
  | 'new_message' | 'invoice_paid'
  | 'team_invite' | 'added_to_preferred_list'

interface NotificationPreferences {
  email_enabled: boolean
  sms_enabled: boolean
  categories: Record<string, { email: boolean; sms: boolean }>
}

interface SendNotificationParams {
  recipientUserId: string
  type: NotificationType
  subject: string
  body: string
  metadata?: Record<string, unknown>
}

/**
 * Send a notification. Creates a row in the notifications table and
 * attempts email delivery if the recipient has it enabled.
 * SMS delivery is deferred (row created, delivery not yet implemented).
 */
export async function sendNotification(params: SendNotificationParams) {
  const supabase = createClient()

  // 1. Look up recipient's notification_preferences from interpreter_profiles
  const { data: profile, error: profileErr } = await supabase
    .from('interpreter_profiles')
    .select('notification_preferences')
    .eq('user_id', params.recipientUserId)
    .maybeSingle()

  if (profileErr) {
    console.error('[notifications] failed to fetch prefs:', profileErr.message)
  }

  const prefs: NotificationPreferences = profile?.notification_preferences ?? {
    email_enabled: true,
    sms_enabled: false,
    categories: {},
  }

  const categoryPref = prefs.categories?.[params.type] ?? { email: true, sms: false }
  const emailEnabled = prefs.email_enabled && categoryPref.email
  const smsEnabled = prefs.sms_enabled && categoryPref.sms

  // 2. Always create in-app notification row
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

  // 3. If email enabled, attempt delivery via API route
  if (emailEnabled) {
    const { error: emailInsertErr } = await supabase
      .from('notifications')
      .insert({
        recipient_user_id: params.recipientUserId,
        type: params.type,
        channel: 'email',
        subject: params.subject,
        body: params.body,
        metadata: params.metadata ?? {},
        status: 'pending',
      })

    if (emailInsertErr) {
      console.error('[notifications] email insert failed:', emailInsertErr.message)
    } else {
      // Fire-and-forget email delivery attempt
      try {
        await fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientUserId: params.recipientUserId,
            subject: params.subject,
            body: params.body,
            type: params.type,
          }),
        })
      } catch (e) {
        console.error('[notifications] email send request failed:', e instanceof Error ? e.message : e)
      }
    }
  }

  // 4. If SMS enabled, create pending row (delivery not yet implemented)
  if (smsEnabled) {
    const { error: smsInsertErr } = await supabase
      .from('notifications')
      .insert({
        recipient_user_id: params.recipientUserId,
        type: params.type,
        channel: 'sms',
        subject: params.subject,
        body: params.body,
        metadata: params.metadata ?? {},
        status: 'pending',
        // SMS delivery not yet implemented — row created for future processing
      })

    if (smsInsertErr) {
      console.error('[notifications] sms insert failed:', smsInsertErr.message)
    }
  }
}
