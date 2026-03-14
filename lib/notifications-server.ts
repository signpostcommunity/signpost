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
  | 'added_to_preferred_list_by_interpreter'
  | 'added_to_preferred_list_by_org'
  | 'added_to_preferred_list_by_dhh'

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
 * Map variant notification types to their base preference category key.
 * All preferred list variants share the same user preference toggle.
 */
function getPreferenceCategoryKey(type: NotificationType): string {
  if (
    type === 'added_to_preferred_list_by_interpreter' ||
    type === 'added_to_preferred_list_by_org' ||
    type === 'added_to_preferred_list_by_dhh'
  ) {
    return 'added_to_preferred_list'
  }
  return type
}

/**
 * Generate rich email content for specific notification types.
 * Returns null for types that should use the default params-based content.
 */
function getEmailContent(
  type: NotificationType,
  metadata: Record<string, unknown>,
  params: CreateNotificationParams
): { subject: string; htmlBody: string; ctaText: string; ctaUrl: string } | null {
  if (type === 'welcome') {
    const vanitySlug = metadata.vanity_slug as string | undefined
    const bookMeSection = vanitySlug
      ? `<p>Your Book Me link is ready: <a href="https://signpost.community/book/${vanitySlug}" style="color: #00e5ff; text-decoration: none; font-weight: 600;">signpost.community/book/${vanitySlug}</a></p>
<p>Share it in your email signature, on social media, or anywhere clients can find you.</p>`
      : `<p>Set up your Book Me link from your dashboard to get a shareable URL for your profile.</p>`
    return {
      subject: 'Welcome to signpost!',
      htmlBody: `<p>Thanks for joining signpost! Your interpreter profile is live.</p>
<p><strong>What comes next:</strong></p>
<p>Your profile is live in the directory. Requesters will find you when you match their search filters (language, specialization, location, certification) or when a Deaf/DB/HH client includes you on their preferred interpreter list.</p>
<p>When you receive a new request, you'll be notified via in-app notification, email, and/or SMS depending on your preferences. You can review the request details and respond with your rate, decline, or ask questions. <a href="https://signpost.community/interpreter/dashboard/profile?tab=account-settings" style="color: #00e5ff; text-decoration: none;">Update your notification preferences</a></p>
<p>You control your rates and terms. Set your standard rate, minimum hours, and cancellation policy from your dashboard. You can also create custom rates for specific jobs.</p>
${bookMeSection}
<p>This is free for interpreters. When requesters book you via signpost, they pay a simple flat platform fee (currently $15 per booking) to help support this site. They never pay an additional percentage added to your rates, or any hidden fees. It's that simple.</p>
<p>Keep your profile up to date. The more complete your profile (photo, intro video, credentials, specializations, bio), the easier it is for the right clients to find you.</p>
<p>Questions? Reach us anytime at hello@signpost.community.</p>`,
      ctaText: 'Go to My Dashboard',
      ctaUrl: 'https://signpost.community/interpreter/dashboard',
    }
  }

  const adderName = (metadata.adder_name as string) || (metadata.organization_name as string) || 'Someone'

  if (type === 'added_to_preferred_list_by_interpreter') {
    return {
      subject: `You've been added to ${adderName}'s Preferred Team`,
      htmlBody: `<p>${adderName} has added you to their Preferred Team Interpreter list on signpost. This means they trust your work and want to team with you on future bookings. Thank you for being a trusted colleague.</p>`,
      ctaText: 'View My Dashboard',
      ctaUrl: 'https://signpost.community/interpreter/dashboard',
    }
  }

  if (type === 'added_to_preferred_list_by_org') {
    const orgName = (metadata.organization_name as string) || adderName
    return {
      subject: `You've been added to ${orgName}'s preferred interpreter list`,
      htmlBody: `<p>${orgName} has added you to their preferred interpreter list on signpost. This means they value your work and may reach out for future bookings directly. Thank you for being a trusted interpreter to this organization.</p>`,
      ctaText: 'View My Dashboard',
      ctaUrl: 'https://signpost.community/interpreter/dashboard',
    }
  }

  if (type === 'added_to_preferred_list_by_dhh') {
    return {
      subject: `You've been added to ${adderName}'s preferred interpreter list`,
      htmlBody: `<p>${adderName} has added you to their preferred interpreter list on signpost. This means they trust you and want you for their future bookings. When ${adderName} or someone booking on their behalf sends a request, you will be among the first interpreters contacted. Thank you for being a trusted interpreter to this client.</p>`,
      ctaText: 'View My Dashboard',
      ctaUrl: 'https://signpost.community/interpreter/dashboard',
    }
  }

  if (type === 'new_message') {
    const senderName = (metadata.sender_name as string) || 'Someone'
    const conversationUrl = (metadata.conversation_url as string) || (params.ctaUrl as string) || 'https://signpost.community'
    return {
      subject: `New message from ${senderName} on signpost`,
      htmlBody: `<p>${senderName} sent you a message on signpost.</p>`,
      ctaText: 'Read and Reply',
      ctaUrl: conversationUrl,
    }
  }

  return null
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
      const prefKey = getPreferenceCategoryKey(params.type)
      const categoryPref = prefs.categories?.[prefKey]
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
    const emailContent = getEmailContent(params.type, params.metadata ?? {}, params)
    const html = emailTemplate({
      heading: emailContent?.subject ?? params.subject,
      body: emailContent?.htmlBody ?? `<p>${params.body}</p>`,
      ctaText: emailContent?.ctaText ?? params.ctaText,
      ctaUrl: emailContent?.ctaUrl ?? params.ctaUrl,
      preferencesUrl: 'https://signpost.community/interpreter/dashboard/profile?tab=account-settings',
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
