import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { emailTemplate } from '@/lib/email-template'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { interpreter_id } = await request.json()

    if (!interpreter_id || typeof interpreter_id !== 'string') {
      return NextResponse.json({ error: 'interpreter_id required' }, { status: 400 })
    }

    // Verify this user owns this interpreter profile
    const { data: profile } = await supabase
      .from('interpreter_profiles')
      .select('id, first_name, last_name')
      .eq('id', interpreter_id)
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = getSupabaseAdmin()
    const interpreterName = [profile.first_name, profile.last_name].filter(Boolean).join(' ')

    // Mark all unfulfilled requests as fulfilled
    const { data: fulfilledRequests } = await admin
      .from('video_requests')
      .update({ fulfilled_at: new Date().toISOString() })
      .eq('interpreter_id', interpreter_id)
      .is('fulfilled_at', null)
      .select('id, requester_user_id, anonymous')

    if (!fulfilledRequests || fulfilledRequests.length === 0) {
      return NextResponse.json({ success: true, notified: 0 })
    }

    // Send notifications to requesters
    let notifiedCount = 0
    for (const req of fulfilledRequests) {
      // Look up requester contact info
      const { data: deafProfile } = await admin
        .from('deaf_profiles')
        .select('first_name, email')
        .or(`id.eq.${req.requester_user_id},user_id.eq.${req.requester_user_id}`)
        .limit(1)
        .maybeSingle()

      const requesterEmail = deafProfile?.email
      const requesterFirstName = deafProfile?.first_name

      if (!requesterEmail && !requesterFirstName) {
        // Try requester_profiles
        const { data: reqProfile } = await admin
          .from('requester_profiles')
          .select('name')
          .eq('user_id', req.requester_user_id)
          .maybeSingle()

        // We need an email — check auth.users
        const { data: authUser } = await admin.auth.admin.getUserById(req.requester_user_id)
        const email = authUser?.user?.email
        const name = reqProfile?.name || deafProfile?.first_name || 'there'

        if (email) {
          await sendEmail({
            to: email,
            subject: `${interpreterName} just added their intro video!`,
            html: emailTemplate({
              heading: `${interpreterName} just added their intro video!`,
              body: `
                <p>Hi ${name},</p>
                <p>Great news — ${interpreterName} just added their intro video on signpost.</p>
                <p>Check out their profile to see it.</p>
              `,
              ctaText: `View ${interpreterName}'s profile`,
              ctaUrl: `https://signpost.community/directory/${interpreter_id}`,
            }),
          })
          notifiedCount++
        }
      } else if (requesterEmail) {
        await sendEmail({
          to: requesterEmail,
          subject: `${interpreterName} just added their intro video!`,
          html: emailTemplate({
            heading: `${interpreterName} just added their intro video!`,
            body: `
              <p>Hi ${requesterFirstName || 'there'},</p>
              <p>Great news — ${interpreterName} just added their intro video on signpost.</p>
              <p>Check out their profile to see it.</p>
            `,
            ctaText: `View ${interpreterName}'s profile`,
            ctaUrl: `https://signpost.community/directory/${interpreter_id}`,
          }),
        })
        notifiedCount++
      }

      // Update requester_notified_at
      await admin
        .from('video_requests')
        .update({ requester_notified_at: new Date().toISOString() })
        .eq('id', req.id)
    }

    return NextResponse.json({ success: true, notified: notifiedCount })
  } catch (err) {
    console.error('[video-request/fulfilled] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
