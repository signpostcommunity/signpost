import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { emailTemplate } from '@/lib/email-template'

export type NotificationType =
  | 'welcome' | 'profile_approved' | 'profile_denied'
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
  channel?: 'in_app' | 'email' | 'both'
}

/**
 * Server-side notification service.
 * Inserts into the notifications table, checks user prefs, and sends email via Resend.
 * Must be called from API routes or server actions (uses admin client).
 */
export async function createNotification(params: CreateNotificationParams) {
  const admin = getSupabaseAdmin()
  const channel = params.channel ?? 'both'

  let inAppNotif: { id: string } | null = null

  // 1. Insert in-app notification (if channel includes in_app)
  if (channel === 'in_app' || channel === 'both') {
    const { data, error: insertErr } = await admin
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
      console.error('[notifications] in_app insert failed:', insertErr.message)
    }
    inAppNotif = data
  }

  // 2. Send email (if channel includes email)
  if (channel === 'email' || channel === 'both') {
    // Insert email notification row with status 'pending'
    const { data: emailNotif, error: emailInsertErr } = await admin
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
      .select('id')
      .single()

    if (emailInsertErr) {
      console.error('[notifications] email insert failed:', emailInsertErr.message)
      return inAppNotif
    }

    // Look up user email from auth.users
    const { data: authUser, error: authErr } = await admin.auth.admin.getUserById(params.recipientUserId)

    if (authErr || !authUser?.user?.email) {
      console.error('[notifications] could not resolve email for user:', params.recipientUserId)
      if (emailNotif?.id) {
        await admin.from('notifications').update({ status: 'failed', error: 'Could not resolve recipient email' }).eq('id', emailNotif.id)
      }
      return inAppNotif
    }

    const recipientEmail = authUser.user.email

    // Check notification preferences
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

    if (!emailEnabled) {
      // User opted out — mark as skipped, not failed
      if (emailNotif?.id) {
        await admin.from('notifications').update({ status: 'skipped' }).eq('id', emailNotif.id)
      }
      return inAppNotif
    }

    // Build and send email
    const html = emailTemplate({
      heading: params.subject,
      body: `<p>${params.body}</p>`,
      ctaText: params.ctaText,
      ctaUrl: params.ctaUrl,
    })

    try {
      await sendEmail({
        to: recipientEmail,
        subject: params.subject,
        html,
      })

      // Success: update status to 'sent'
      if (emailNotif?.id) {
        await admin.from('notifications').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', emailNotif.id)
      }
    } catch (err) {
      // Failure: update status to 'failed' with error message
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error('[notifications] email send failed:', errorMsg)
      if (emailNotif?.id) {
        await admin.from('notifications').update({ status: 'failed', error: errorMsg }).eq('id', emailNotif.id)
      }
    }
  }

  return inAppNotif
}
