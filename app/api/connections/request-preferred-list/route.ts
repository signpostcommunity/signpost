import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications-server'
import { sendEmail } from '@/lib/email'
import { emailTemplate } from '@/lib/email-template'
import type { EmailContentBlock } from '@/lib/email-template'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { dhhEmail, dhhName, bookingTitle, bookingDate, bookingTime, bookingLocation } = body

    if (!dhhEmail || typeof dhhEmail !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Get requester info
    const { data: reqProfile } = await admin
      .from('requester_profiles')
      .select('name, org_name')
      .eq('id', user.id)
      .maybeSingle()

    const requesterName = reqProfile?.org_name || reqProfile?.name || 'A requester'

    // Check if the email matches an existing auth.users account
    const { data: { users: matchedUsers }, error: listError } = await admin.auth.admin.listUsers()

    if (listError) {
      console.error('[request-preferred-list] listUsers error:', listError.message)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }

    const matchedUser = matchedUsers?.find(u => u.email?.toLowerCase() === dhhEmail.toLowerCase())

    // Build booking details content block
    const contentBlocks: EmailContentBlock[] = []
    if (bookingTitle || bookingDate) {
      contentBlocks.push({
        type: 'booking_details',
        data: {
          title: bookingTitle || '',
          date: bookingDate || '',
          time: bookingTime || '',
          location: bookingLocation || '',
        },
      })
    }

    if (matchedUser) {
      // Existing user - check if they have a deaf_profiles row
      const { data: deafProfile } = await admin
        .from('deaf_profiles')
        .select('id')
        .or(`user_id.eq.${matchedUser.id},id.eq.${matchedUser.id}`)
        .maybeSingle()

      const dhhUserId = deafProfile?.id || matchedUser.id

      // Create or find a dhh_requester_connections row
      const { data: existingConn } = await admin
        .from('dhh_requester_connections')
        .select('id, status')
        .eq('dhh_user_id', dhhUserId)
        .eq('requester_id', user.id)
        .in('status', ['active', 'pending'])
        .maybeSingle()

      if (!existingConn) {
        const { error: connErr } = await admin
          .from('dhh_requester_connections')
          .insert({
            dhh_user_id: dhhUserId,
            requester_id: user.id,
            status: 'pending',
            initiated_by: 'requester',
            requester_org_name: reqProfile?.org_name || null,
          })

        if (connErr) {
          console.error('[request-preferred-list] connection insert error:', connErr.message)
        }
      }

      // Send notification to D/HH user
      await createNotification({
        recipientUserId: matchedUser.id,
        type: 'preferred_list_requested',
        subject: `${requesterName} is booking an interpreter for you`,
        body: `${requesterName} is booking an interpreter and wants to use your preferred list. Sharing your preferred interpreter list helps them find interpreters you know and trust. Interpreters on your preferred list are much more likely to accept.`,
        metadata: {
          requester_name: requesterName,
          requester_id: user.id,
          booking_title: bookingTitle || '',
          booking_date: bookingDate || '',
          booking_time: bookingTime || '',
          booking_location: bookingLocation || '',
        },
        ctaText: 'Share My Preferred List',
        ctaUrl: `https://signpost.community/dhh/dashboard/interpreters?share_to=${user.id}`,
        channel: 'both',
      })

      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined
      try {
        logAudit({ user_id: user.id, action: 'request', resource_type: 'connection', resource_id: undefined, metadata: { deaf_user_id: dhhUserId }, ip_address: ip })
      } catch (auditErr) {
        console.error('[audit] request preferred list (existing user):', auditErr)
      }

      return NextResponse.json({ success: true, userExists: true })
    } else {
      // Non-user - send invitation email via Resend
      const html = emailTemplate({
        heading: `${requesterName} wants to book an interpreter for you`,
        body: `<p>${requesterName} is booking an interpreter for you and wants to find someone you trust. signpost lets you build a preferred interpreter list so the right interpreters are always contacted first.</p>
<p>Create a free account and build your preferred interpreter list. Interpreters who see they're on your list are far more likely to accept.</p>`,
        ctaText: 'Create My Account',
        ctaUrl: `https://signpost.community/dhh/signup?redirect=/dhh/dashboard/interpreters`,
        contentBlocks,
      })

      await sendEmail({
        to: dhhEmail,
        subject: `${requesterName} wants to book an interpreter for you`,
        html,
      })

      // Create off-platform connection record
      const { error: connErr } = await admin
        .from('dhh_requester_connections')
        .insert({
          requester_id: user.id,
          status: 'pending_offplatform',
          initiated_by: 'requester',
          requester_org_name: reqProfile?.org_name || null,
          offplatform_name: dhhName || null,
          offplatform_email: dhhEmail,
        })

      if (connErr) {
        console.error('[request-preferred-list] offplatform connection insert error:', connErr.message)
      }

      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined
      try {
        logAudit({ user_id: user.id, action: 'request', resource_type: 'connection', resource_id: undefined, metadata: { deaf_user_id: dhhEmail }, ip_address: ip })
      } catch (auditErr) {
        console.error('[audit] request preferred list (offplatform):', auditErr)
      }

      return NextResponse.json({ success: true, userExists: false })
    }
  } catch (err) {
    console.error('[request-preferred-list] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
