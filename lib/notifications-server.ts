import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { emailTemplate } from '@/lib/email-template'

export type NotificationType =
  | 'profile_saved' | 'profile_approved' | 'profile_denied'
  | 'new_request' | 'booking_confirmed' | 'rate_response'
  | 'booking_cancelled'
  | 'cancelled_by_requester' | 'cancelled_by_you'
  | 'sub_search_update' | 'booking_reminder'
  | 'new_message' | 'invoice_paid'
  | 'team_invite' | 'added_to_preferred_list'

interface CreateNotificationParams {
  recipientUserId: string
  type: NotificationType
  subject: string
  body: string
  metadata?: Record<string, unknown>
  ctaText?: string
  ctaUrl?: string
}

/**
 * Server-side notification service.
 * Inserts into the notifications table, checks user prefs, and sends email via Resend.
 * Must be called from API routes or server actions (uses admin client).
 */
export async function createNotification(params: CreateNotificationParams) {
  const admin = getSupabaseAdmin()

  // 1. Insert in-app notification
  const { data: notif, error: insertErr } = await admin
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
    .select('id')
    .single()

  if (insertErr) {
    console.error('[notifications] insert failed:', insertErr.message)
  }

  // 2. Look up user email from auth.users
  const { data: authUser, error: authErr } = await admin.auth.admin.getUserById(params.recipientUserId)

  if (authErr || !authUser?.user?.email) {
    console.error('[notifications] could not resolve email for user:', params.recipientUserId)
    return notif
  }

  const recipientEmail = authUser.user.email

  // 3. Check notification preferences
  // Try interpreter_profiles first, then deaf_profiles, then default to email ON
  let emailEnabled = true

  const { data: interpProfile } = await admin
    .from('interpreter_profiles')
    .select('notification_preferences')
    .eq('user_id', params.recipientUserId)
    .maybeSingle()

  if (interpProfile?.notification_preferences) {
    const prefs = interpProfile.notification_preferences as {
      email_enabled?: boolean
      categories?: Record<string, { email?: boolean }>
    }
    const globalEnabled = prefs.email_enabled !== false
    const categoryPref = prefs.categories?.[params.type]
    emailEnabled = globalEnabled && (categoryPref?.email !== false)
  }
  // For deaf/requester users without interpreter_profiles, default email ON

  // 4. Send email if enabled
  if (emailEnabled) {
    const html = emailTemplate({
      heading: params.subject,
      body: `<p>${params.body}</p>`,
      ctaText: params.ctaText,
      ctaUrl: params.ctaUrl,
    })

    await sendEmail({
      to: recipientEmail,
      subject: params.subject,
      html,
    })

    // Update notification status
    if (notif?.id) {
      await admin
        .from('notifications')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', notif.id)
    }
  }

  return notif
}
