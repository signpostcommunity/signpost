import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { emailTemplate, EmailContentBlock } from '@/lib/email-template'
import { sendSms } from '@/lib/sms'
import { smsTemplates } from '@/lib/sms-templates'

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
  | 'preferred_list_requested'
  | 'preferred_list_shared'

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
  if (type === 'preferred_list_requested' || type === 'preferred_list_shared') {
    return 'preferred_list_requested'
  }
  return type
}

/** Truncate text to maxLen chars, appending "..." if truncated. */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.substring(0, maxLen) + '...'
}

/** Generate an SMS message for a given notification type using metadata. */
function getSmsMessage(type: NotificationType, metadata: Record<string, unknown>): string | null {
  const date = (metadata.booking_date as string) || (metadata.date as string) || ''
  const time = (metadata.booking_time as string) || (metadata.time as string) || ''
  const location = (metadata.booking_location as string) || (metadata.location as string) || ''
  const interpreterName = (metadata.interpreter_name as string) || ''
  const senderName = (metadata.sender_name as string) || ''

  switch (type) {
    case 'new_request':
      return smsTemplates.newRequest(date, time, location || 'TBD')
    case 'booking_confirmed': {
      const recipientRole = (metadata.recipient_role as string) || ''
      if (recipientRole === 'interpreter') {
        return smsTemplates.bookingConfirmed(date, time, location || 'TBD')
      }
      return smsTemplates.bookingConfirmedRequester(interpreterName || 'Your interpreter', date)
    }
    case 'booking_cancelled':
    case 'cancelled_by_requester':
    case 'cancelled_by_you':
      return smsTemplates.bookingCancelled(date, time)
    case 'rate_response':
      return smsTemplates.interpreterResponded(interpreterName || 'An interpreter')
    case 'new_message':
      return smsTemplates.newMessage(senderName || 'Someone')
    default:
      return null
  }
}

/** Determine the correct preferences URL for a given role. */
function preferencesUrlForRole(role?: string): string {
  if (role === 'deaf') return 'https://signpost.community/dhh/dashboard/preferences'
  if (role === 'requester' || role === 'org') return 'https://signpost.community/request/dashboard/profile'
  return 'https://signpost.community/interpreter/dashboard/profile?tab=account-settings'
}

/**
 * Generate rich email content for specific notification types.
 * Returns structured data with content blocks for inline email rendering.
 */
function getEmailContent(
  type: NotificationType,
  metadata: Record<string, unknown>,
  params: CreateNotificationParams
): { subject: string; htmlBody: string; ctaText: string; ctaUrl: string; contentBlocks?: EmailContentBlock[]; preferencesUrl?: string } | null {
  if (type === 'welcome') {
    const vanitySlug = metadata.vanity_slug as string | undefined
    const bookMeSection = vanitySlug
      ? `<p>Your Book Me link is ready: <a href="https://signpost.community/book/${vanitySlug}" style="color: #00e5ff; text-decoration: none; font-weight: 600;">signpost.community/book/${vanitySlug}</a></p>
<p>Share it in your email signature, on social media, or anywhere clients can find you.</p>`
      : `<p>Set up your Book Me link from your dashboard to get a shareable URL for your profile.</p>`
    return {
      subject: 'Welcome to signpost',
      htmlBody: `<p>Thanks for joining signpost! Your interpreter profile is live.</p>
<p><strong>What comes next:</strong></p>
<p>Your profile is live in the directory. Requesters will find you when you match their search filters (language, specialization, location, certification) or when a Deaf/DB/HH client includes you on their preferred interpreter list.</p>
<p>When you receive a new request, you'll be notified via in-app notification, email, and/or SMS depending on your preferences. You can review the request details and respond with your rate, decline, or ask questions. <a href="https://signpost.community/interpreter/dashboard/profile?tab=account-settings" style="color: #00e5ff; text-decoration: none;">Manage your notification preferences</a></p>
<p>You control your rates and terms. Set your standard rate, minimum hours, and cancellation policy from your dashboard. You can also create custom rates for specific jobs.</p>
${bookMeSection}
<p>This is free for interpreters. When requesters book you via signpost, they pay a simple flat platform fee (currently $15 per booking) to help support this site. They never pay an additional percentage added to your rates, or any hidden fees. It's that simple.</p>
<p>Keep your profile up to date. The more complete your profile (photo, intro video, credentials, specializations, bio), the easier it is for the right clients to find you.</p>
<p>Questions? Reach us anytime at hello@signpost.community.</p>`,
      ctaText: 'Go to My Dashboard',
      ctaUrl: 'https://signpost.community/interpreter/dashboard',
    }
  }

  if (type === 'new_message') {
    const senderName = (metadata.sender_name as string) || 'Someone'
    const messageBody = metadata.message_body as string | undefined
    const messageTimestamp = metadata.message_timestamp as string | undefined
    const conversationId = metadata.conversationId as string | undefined
    const recipientRole = metadata.recipient_role as string | undefined

    // Determine best CTA URL based on recipient role
    let ctaUrl = (metadata.conversation_url as string) || (params.ctaUrl as string) || 'https://signpost.community'
    if (conversationId && !ctaUrl.includes('/conversation/')) {
      if (recipientRole === 'deaf') {
        ctaUrl = `https://signpost.community/dhh/dashboard/inbox/conversation/${conversationId}`
      } else if (recipientRole === 'requester' || recipientRole === 'org') {
        ctaUrl = `https://signpost.community/request/dashboard/inbox/conversation/${conversationId}`
      } else {
        ctaUrl = `https://signpost.community/interpreter/dashboard/inbox/conversation/${conversationId}`
      }
    }

    const contentBlocks: EmailContentBlock[] = []
    if (messageBody) {
      contentBlocks.push({
        type: 'message_preview',
        data: {
          senderName,
          messageBody: truncate(messageBody, 500),
          ...(messageTimestamp ? { timestamp: messageTimestamp } : {}),
        },
      })
    }

    return {
      subject: `New message from ${senderName} on signpost`,
      htmlBody: messageBody ? '' : `<p>${senderName} sent you a message on signpost.</p>`,
      ctaText: 'Read and Reply',
      ctaUrl,
      contentBlocks,
      preferencesUrl: preferencesUrlForRole(recipientRole),
    }
  }

  if (type === 'new_request') {
    const bookingTitle = (metadata.booking_title as string) || (metadata.title as string) || 'Interpreter request'
    const bookingDate = (metadata.booking_date as string) || (metadata.date as string) || ''
    const bookingTime = (metadata.booking_time as string) || (metadata.time as string) || ''
    const bookingLocation = (metadata.booking_location as string) || (metadata.location as string) || ''
    const bookingFormat = (metadata.booking_format as string) || (metadata.format as string) || ''
    const requesterName = (metadata.requester_name as string) || (metadata.dhhClientName as string) || ''

    const contentBlocks: EmailContentBlock[] = [{
      type: 'booking_details',
      data: {
        title: bookingTitle,
        date: bookingDate,
        time: bookingTime,
        location: bookingLocation || (bookingFormat === 'remote' ? 'Remote' : ''),
        format: bookingFormat === 'in_person' ? 'In Person' : bookingFormat === 'remote' ? 'Remote' : bookingFormat,
        ...(requesterName ? { requesterName } : {}),
      },
    }]

    const subjectDate = bookingDate ? `, ${bookingDate}` : ''
    return {
      subject: `New request on signpost: ${bookingTitle}${subjectDate}`,
      htmlBody: requesterName
        ? `<p>${requesterName} has sent you a request. Review the details and respond with your rate.</p>`
        : `<p>You have a new interpreter request. Review the details and respond with your rate.</p>`,
      ctaText: 'Review and Respond',
      ctaUrl: 'https://signpost.community/interpreter/dashboard/inquiries',
      contentBlocks,
    }
  }

  if (type === 'booking_confirmed') {
    const bookingTitle = (metadata.booking_title as string) || ''
    const bookingDate = (metadata.booking_date as string) || ''
    const bookingTime = (metadata.booking_time as string) || ''
    const bookingLocation = (metadata.booking_location as string) || ''
    const bookingFormat = (metadata.booking_format as string) || ''
    const requesterName = (metadata.requester_name as string) || ''
    const interpreterName = (metadata.interpreter_name as string) || ''
    const recipientRole = (metadata.recipient_role as string) || ''

    const contentBlocks: EmailContentBlock[] = [{
      type: 'booking_details',
      data: {
        title: bookingTitle,
        date: bookingDate,
        time: bookingTime,
        location: bookingLocation,
        format: bookingFormat === 'in_person' ? 'In Person' : bookingFormat === 'remote' ? 'Remote' : bookingFormat,
        ...(requesterName ? { requesterName } : {}),
        ...(interpreterName ? { interpreterName } : {}),
      },
    }]

    const subjectDate = bookingDate ? `, ${bookingDate}` : ''
    const isInterpreter = recipientRole === 'interpreter'
    const bodyText = isInterpreter
      ? (requesterName ? `Your booking with ${requesterName} has been confirmed.` : 'Your booking has been confirmed.')
      : (interpreterName ? `${interpreterName} has been confirmed for your request.` : 'An interpreter has been confirmed for your request.')

    const ctaText = isInterpreter ? 'View Confirmed Booking' : 'View Booking Details'
    const ctaUrl = isInterpreter
      ? 'https://signpost.community/interpreter/dashboard/confirmed'
      : 'https://signpost.community/request/dashboard/requests'

    return {
      subject: `Booking confirmed: ${bookingTitle || 'Booking'}${subjectDate}`,
      htmlBody: `<p>${bodyText}</p>`,
      ctaText,
      ctaUrl,
      contentBlocks,
      preferencesUrl: preferencesUrlForRole(recipientRole),
    }
  }

  if (type === 'booking_cancelled' || type === 'cancelled_by_requester' || type === 'cancelled_by_you') {
    const bookingTitle = (metadata.booking_title as string) || ''
    const bookingDate = (metadata.booking_date as string) || ''
    const bookingTime = (metadata.booking_time as string) || ''
    const bookingLocation = (metadata.booking_location as string) || ''
    const bookingFormat = (metadata.booking_format as string) || ''
    const requesterName = (metadata.requester_name as string) || ''
    const interpreterName = (metadata.interpreter_name as string) || ''
    const cancellerName = (metadata.canceller_name as string) || ''
    const cancellationReason = (metadata.cancellation_reason as string) || ''
    const cancelledByRole = (metadata.cancelled_by_role as string) || ''
    const recipientRole = (metadata.recipient_role as string) || ''

    const contentBlocks: EmailContentBlock[] = [{
      type: 'booking_details',
      data: {
        title: bookingTitle,
        date: bookingDate,
        time: bookingTime,
        location: bookingLocation,
        format: bookingFormat === 'in_person' ? 'In Person' : bookingFormat === 'remote' ? 'Remote' : bookingFormat,
        ...(requesterName ? { requesterName } : {}),
        ...(interpreterName ? { interpreterName } : {}),
      },
    }]

    // Warning card with reason + policy info
    let warningTitle = 'Cancellation'
    let warningMessage = ''
    if (cancellationReason) {
      warningMessage = `Reason: ${cancellationReason}`
    }
    if (cancelledByRole === 'requester') {
      warningTitle = 'Cancelled by requester'
      if (warningMessage) warningMessage += '<br><br>'
      warningMessage += 'The $15 platform fee is non-refundable.'
    } else if (cancelledByRole === 'interpreter') {
      warningTitle = 'Cancelled by interpreter'
      if (warningMessage) warningMessage += '<br><br>'
      warningMessage += 'A $15 booking credit has been applied to the requester\'s account.'
    }
    if (warningMessage) {
      contentBlocks.push({ type: 'warning_card', data: { title: warningTitle, message: warningMessage } })
    }

    const subjectDate = bookingDate ? `, ${bookingDate}` : ''
    const cancellerDisplay = cancellerName || (cancelledByRole === 'interpreter' ? 'The interpreter' : 'The requester')
    const bodyText = `${cancellerDisplay} has cancelled the booking for ${bookingTitle || 'this request'}${bookingDate ? ' on ' + bookingDate : ''}.`

    return {
      subject: `Booking cancelled: ${bookingTitle || 'Booking'}${subjectDate}`,
      htmlBody: `<p>${bodyText}</p>`,
      ctaText: 'View Details',
      ctaUrl: recipientRole === 'interpreter'
        ? 'https://signpost.community/interpreter/dashboard/confirmed'
        : 'https://signpost.community/request/dashboard/requests',
      contentBlocks,
      preferencesUrl: preferencesUrlForRole(recipientRole),
    }
  }

  if (type === 'rate_response') {
    const interpreterName = (metadata.interpreter_name as string) || ''
    const rate = (metadata.rate as string) || ''
    const minHours = (metadata.min_hours as string) || ''
    const cancellationPolicy = (metadata.cancellation_policy as string) || ''
    const interpreterNote = (metadata.interpreter_note as string) || ''
    const bookingTitle = (metadata.booking_title as string) || ''
    const bookingDate = (metadata.booking_date as string) || ''
    const bookingTime = (metadata.booking_time as string) || ''
    const bookingLocation = (metadata.booking_location as string) || ''
    const bookingFormat = (metadata.booking_format as string) || ''
    const bookingId = (metadata.booking_id as string) || ''
    const recipientId = (metadata.recipient_id as string) || ''

    const contentBlocks: EmailContentBlock[] = []

    if (rate || minHours || cancellationPolicy || interpreterNote) {
      contentBlocks.push({
        type: 'rate_details',
        data: {
          ...(rate ? { rate: `$${rate}` } : {}),
          ...(minHours ? { minHours } : {}),
          ...(cancellationPolicy ? { cancellationPolicy } : {}),
          ...(interpreterNote ? { interpreterNote } : {}),
        },
      })
    }

    if (bookingTitle || bookingDate) {
      contentBlocks.push({
        type: 'booking_details',
        data: {
          title: bookingTitle,
          date: bookingDate,
          time: bookingTime,
          location: bookingLocation,
          format: bookingFormat === 'in_person' ? 'In Person' : bookingFormat === 'remote' ? 'Remote' : bookingFormat,
        },
      })
    }

    const displayName = interpreterName || 'An interpreter'
    const ctaUrl = bookingId && recipientId
      ? `https://signpost.community/request/dashboard/accept/${bookingId}/${recipientId}`
      : 'https://signpost.community/request/dashboard'

    return {
      subject: interpreterName
        ? `${interpreterName} responded to your request on signpost`
        : `Interpreter responded to your request on signpost`,
      htmlBody: `<p>${displayName} sent their rate. Review their rate and terms, then accept or decline.</p>`,
      ctaText: 'Review and Accept',
      ctaUrl,
      contentBlocks,
      preferencesUrl: preferencesUrlForRole('requester'),
    }
  }

  if (type === 'invoice_paid') {
    const invoiceNumber = (metadata.invoice_number as string) || ''
    const amount = (metadata.amount as string) || ''
    const bookingTitle = (metadata.booking_title as string) || ''
    const bookingDate = (metadata.booking_date as string) || ''
    const invoiceId = (metadata.invoice_id as string) || ''

    const contentBlocks: EmailContentBlock[] = []
    const infoData: Record<string, string> = {}
    if (invoiceNumber) infoData['Invoice'] = invoiceNumber
    if (amount) infoData['Amount'] = amount
    if (bookingTitle) infoData['Booking'] = bookingTitle
    if (bookingDate) infoData['Date'] = bookingDate

    if (Object.keys(infoData).length > 0) {
      contentBlocks.push({ type: 'info_card', data: infoData })
    }

    return {
      subject: invoiceNumber ? `Invoice marked as paid: ${invoiceNumber}` : 'Invoice marked as paid',
      htmlBody: `<p>Your invoice ${invoiceNumber || ''} has been marked as paid.</p>`,
      ctaText: 'View Invoice',
      ctaUrl: invoiceId
        ? `https://signpost.community/interpreter/dashboard/invoices/${invoiceId}`
        : 'https://signpost.community/interpreter/dashboard/invoices',
      contentBlocks,
    }
  }

  if (type === 'preferred_list_requested') {
    const requesterName = (metadata.requester_name as string) || 'A requester'
    const bookingTitle = (metadata.booking_title as string) || ''
    const bookingDate = (metadata.booking_date as string) || ''
    const bookingTime = (metadata.booking_time as string) || ''
    const bookingLocation = (metadata.booking_location as string) || ''

    const contentBlocks: EmailContentBlock[] = []
    if (bookingTitle || bookingDate) {
      contentBlocks.push({
        type: 'booking_details',
        data: {
          title: bookingTitle,
          date: bookingDate,
          time: bookingTime,
          location: bookingLocation,
        },
      })
    }

    const requesterId = (metadata.requester_id as string) || ''
    return {
      subject: `${requesterName} is booking an interpreter for you`,
      htmlBody: `<p>${requesterName} is booking an interpreter and wants to use your preferred list.</p>
<p>Sharing your preferred interpreter list helps them find interpreters you know and trust. Interpreters on your preferred list are much more likely to accept.</p>`,
      ctaText: 'Share My Preferred List',
      ctaUrl: `https://signpost.community/dhh/dashboard/interpreters?share_to=${requesterId}`,
      contentBlocks,
      preferencesUrl: preferencesUrlForRole('deaf'),
    }
  }

  if (type === 'preferred_list_shared') {
    const dhhName = (metadata.dhh_name as string) || 'A Deaf/DB/HH user'
    const bookingId = (metadata.booking_id as string) || ''

    return {
      subject: `${dhhName} shared their preferred interpreter list`,
      htmlBody: `<p>${dhhName} shared their preferred interpreter list for your booking. Their preferred interpreters have been highlighted in your request.</p>`,
      ctaText: 'View Request',
      ctaUrl: bookingId
        ? `https://signpost.community/request/dashboard`
        : 'https://signpost.community/request/dashboard',
      preferencesUrl: preferencesUrlForRole('requester'),
    }
  }

  // Preferred list variants
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
      subject: 'You were added to a preferred interpreter list on signpost',
      htmlBody: `<p>A Deaf/DB/HH user has added you to their preferred interpreter list. You may receive direct requests from them.</p>`,
      ctaText: 'View Your Dashboard',
      ctaUrl: 'https://signpost.community/interpreter/dashboard',
    }
  }

  if (type === 'added_to_preferred_list') {
    return {
      subject: 'You were added to a preferred interpreter list on signpost',
      htmlBody: `<p>A Deaf/DB/HH user has added you to their preferred interpreter list. You may receive direct requests from them.</p>`,
      ctaText: 'View Your Dashboard',
      ctaUrl: 'https://signpost.community/interpreter/dashboard',
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
    const emailSubject = emailContent?.subject ?? params.subject
    const html = emailTemplate({
      heading: emailContent?.subject ?? params.subject,
      body: emailContent?.htmlBody ?? `<p>${params.body}</p>`,
      ctaText: emailContent?.ctaText ?? params.ctaText,
      ctaUrl: emailContent?.ctaUrl ?? params.ctaUrl,
      preferencesUrl: emailContent?.preferencesUrl ?? 'https://signpost.community/interpreter/dashboard/profile?tab=account-settings',
      contentBlocks: emailContent?.contentBlocks,
    })

    try {
      console.log(`[notifications] attempting Resend send to: ${recipientEmail}`)

      const result = await sendEmail({
        to: recipientEmail,
        subject: emailSubject,
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

  // 3. Send SMS (fire-and-forget, never blocks)
  if (channel === 'email' || channel === 'both') {
    try {
      // Look up notification phone and SMS preference
      let smsPhone: string | null = null
      let smsEnabled = false

      // Check interpreter_profiles first
      const { data: interpProfile } = await admin
        .from('interpreter_profiles')
        .select('notification_phone, notification_preferences')
        .eq('user_id', params.recipientUserId)
        .maybeSingle()

      if (interpProfile?.notification_phone) {
        smsPhone = interpProfile.notification_phone
        const prefs = interpProfile.notification_preferences as {
          sms_enabled?: boolean
          categories?: Record<string, { sms?: boolean }>
        } | null
        const globalSms = prefs?.sms_enabled !== false
        const prefKey = getPreferenceCategoryKey(params.type)
        const categorySms = prefs?.categories?.[prefKey]?.sms !== false
        smsEnabled = globalSms && categorySms
      }

      // Fallback: check requester_profiles phone
      if (!smsPhone) {
        const { data: reqProfile } = await admin
          .from('requester_profiles')
          .select('phone')
          .eq('user_id', params.recipientUserId)
          .maybeSingle()

        if (reqProfile?.phone) {
          smsPhone = reqProfile.phone
          smsEnabled = true // Requesters opt in by having a phone number
        }
      }

      if (smsEnabled && smsPhone) {
        const smsMessage = getSmsMessage(params.type, params.metadata ?? {})
        if (smsMessage) {
          sendSms({ to: smsPhone, message: smsMessage })
            .catch(e => console.error('[notifications] SMS failed:', e))
        }
      }
    } catch (e) {
      console.error('[notifications] SMS lookup error:', e)
    }
  }

  return inAppNotif
}
