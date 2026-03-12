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

// Only these status values are allowed by the notifications_status_check constraint
type NotificationStatus = 'pending' | 'sent' | 'failed' | 'read'

/**
 * Update notification status safely.
 * Separates status from optional extra columns to handle missing columns gracefully.
 */
async function updateNotificationStatus(
  admin: ReturnType<typeof getSupabaseAdmin>,
  id: string,
  status: NotificationStatus,
  extra?: { sent_at?: string; error?: string }
) {
  const payload = extra ? { status, ...extra } : { status }
  console.log(`[notifications] updating ${id} → status=${status}`, extra ? JSON.stringify(extra) : '')

  const { error: updateErr } = await admin
    .from('notifications')
    .update(payload)
    .eq('id', id)

  if (updateErr) {
    console.warn(`[notifications] update failed (${updateErr.message}), retrying status-only`)
    // Retry with just status (in case extra columns like 'error' don't exist)
    const { error: retryErr } = await admin
      .from('notifications')
      .update({ status })
      .eq('id', id)
    if (retryErr) {
      console.error(`[notifications] status-only retry also failed: ${retryErr.message}`)
    }
  }
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
        status: 'sent' as NotificationStatus,
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
        status: 'pending' as NotificationStatus,
      })
      .select('id')
      .single()

    if (emailInsertErr) {
      console.error('[notifications] email insert failed:', emailInsertErr.message)
      return inAppNotif
    }

    const emailNotifId = emailNotif?.id
    console.log(`[notifications] email notification row created: ${emailNotifId}`)

    // Look up recipient email — try auth.users first, then interpreter_profiles as fallback
    let recipientEmail: string | null = null

    try {
      const { data: authUser, error: authErr } = await admin.auth.admin.getUserById(params.recipientUserId)
      if (!authErr && authUser?.user?.email) {
        recipientEmail = authUser.user.email
      } else if (authErr) {
        console.warn('[notifications] getUserById error:', authErr.message)
      }
    } catch (e) {
      console.warn('[notifications] getUserById threw:', e instanceof Error ? e.message : e)
    }

    // Fallback: check interpreter_profiles.email
    if (!recipientEmail) {
      const { data: profileRow } = await admin
        .from('interpreter_profiles')
        .select('email')
        .eq('user_id', params.recipientUserId)
        .maybeSingle()
      if (profileRow?.email) {
        recipientEmail = profileRow.email
      }
    }

    if (!recipientEmail) {
      console.error('[notifications] could not resolve email for user:', params.recipientUserId)
      if (emailNotifId) {
        await updateNotificationStatus(admin, emailNotifId, 'failed', {
          error: 'Could not resolve recipient email',
        })
      }
      return inAppNotif
    }

    // Check notification preferences
    let emailEnabled = true

    const { data: prefProfile } = await admin
      .from('interpreter_profiles')
      .select('notification_preferences')
      .eq('user_id', params.recipientUserId)
      .maybeSingle()

    if (prefProfile?.notification_preferences) {
      const prefs = prefProfile.notification_preferences as {
        email_enabled?: boolean
        categories?: Record<string, { email?: boolean }>
      }
      const globalEnabled = prefs.email_enabled !== false
      const categoryPref = prefs.categories?.[params.type]
      emailEnabled = globalEnabled && (categoryPref?.email !== false)
    }

    if (!emailEnabled) {
      console.log(`[notifications] email disabled by user preferences for ${params.recipientUserId}`)
      if (emailNotifId) {
        // Use 'failed' (allowed by CHECK constraint) instead of 'skipped'
        await updateNotificationStatus(admin, emailNotifId, 'failed', {
          error: 'Email disabled by user notification preferences',
        })
      }
      return inAppNotif
    }

    // Build and send email via Resend
    const html = emailTemplate({
      heading: params.subject,
      body: `<p>${params.body}</p>`,
      ctaText: params.ctaText,
      ctaUrl: params.ctaUrl,
    })

    try {
      console.log(`[notifications] attempting Resend send to: ${recipientEmail}`)

      const result = await sendEmail({
        to: recipientEmail,
        subject: params.subject,
        html,
      })

      console.log(`[notifications] Resend send SUCCESS, id: ${result?.id ?? 'no-id'}`)

      // Success: update status to 'sent'
      if (emailNotifId) {
        await updateNotificationStatus(admin, emailNotifId, 'sent', {
          sent_at: new Date().toISOString(),
        })
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      console.error(`[notifications] Resend send FAILED: ${errorMsg}`)
      if (emailNotifId) {
        await updateNotificationStatus(admin, emailNotifId, 'failed', {
          error: errorMsg,
        })
      }
    }
  }

  return inAppNotif
}
