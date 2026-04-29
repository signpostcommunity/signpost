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

    const body = await request.json()
    const { inviteId } = body

    if (!inviteId || typeof inviteId !== 'string') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Fetch the invite to verify ownership and check rate limit
    const { data: invite, error: fetchError } = await admin
      .from('trusted_deaf_circle')
      .select('id, inviter_id, invitee_email, status, last_sent_at, resend_count')
      .eq('id', inviteId)
      .single()

    if (fetchError || !invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    // Fail-closed: only the inviter can resend
    if (invite.inviter_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to resend this invite' }, { status: 403 })
    }

    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending invites can be resent' }, { status: 400 })
    }

    // Rate limit: 60 second floor
    if (invite.last_sent_at) {
      const lastSent = new Date(invite.last_sent_at).getTime()
      const now = Date.now()
      const secondsSince = (now - lastSent) / 1000
      if (secondsSince < 60) {
        return NextResponse.json(
          { error: 'Please wait before resending' },
          { status: 429, headers: { 'Retry-After': String(Math.ceil(60 - secondsSince)) } }
        )
      }
    }

    const newResendCount = (invite.resend_count || 0) + 1

    // Update resend tracking
    const { error: updateError } = await admin
      .from('trusted_deaf_circle')
      .update({
        resend_count: newResendCount,
        last_sent_at: new Date().toISOString(),
      })
      .eq('id', inviteId)
      .eq('inviter_id', user.id)
      .eq('status', 'pending')

    if (updateError) {
      console.error('[dhh/circle/resend] update failed:', updateError.message)
      return NextResponse.json({ error: 'Failed to update invite' }, { status: 500 })
    }

    // Get inviter's name for the email
    const { data: inviterProfile } = await admin
      .from('deaf_profiles')
      .select('first_name, last_name, name')
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle()

    const inviterName = inviterProfile?.first_name
      ? `${inviterProfile.first_name} ${inviterProfile.last_name || ''}`.trim()
      : inviterProfile?.name || 'A signpost user'

    // Send email (same template as original invite)
    try {
      const html = emailTemplate({
        heading: `${inviterName} invited you to their trusted Deaf circle on signpost`,
        body: `
          <p>${inviterName} wants to connect with you on signpost's trusted Deaf circle.</p>
          <p>The trusted Deaf circle lets Deaf users privately share their preferred interpreter lists with each other. Once you accept, you can both see each other's preferred interpreters and helpful notes.</p>
          <p>This is a Deaf-to-Deaf feature built to help you find interpreters you will love, and avoid the ones you won't.</p>
        `,
        ctaText: 'View Invite',
        ctaUrl: 'https://signpost.community/dhh/dashboard/circle',
        preferencesUrl: 'https://signpost.community/dhh/dashboard/preferences',
      })

      await sendEmail({
        to: invite.invitee_email,
        subject: `${inviterName} invited you to their trusted Deaf circle on signpost`,
        html,
      })
    } catch (emailErr) {
      console.error('[dhh/circle/resend] email send failed:', emailErr instanceof Error ? emailErr.message : emailErr)
      // Don't fail the resend if email fails
    }

    console.log(`[audit] circle_invite_resent actor=${user.id} invite=${inviteId} target_email=${invite.invitee_email} resend_count=${newResendCount}`)

    return NextResponse.json({ ok: true, resend_count: newResendCount })
  } catch (err) {
    console.error('[dhh/circle/resend] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
