import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { emailTemplate } from '@/lib/email-template'
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
    const { email } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address required' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Cannot invite yourself
    if (normalizedEmail === user.email?.toLowerCase()) {
      return NextResponse.json({ error: 'You cannot invite yourself' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Check for existing invite (either direction)
    const { data: existing } = await admin
      .from('trusted_deaf_circle')
      .select('id, status')
      .or(`and(inviter_id.eq.${user.id},invitee_email.eq.${normalizedEmail}),and(invitee_id.eq.${user.id},invitee_email.eq.${normalizedEmail})`)
      .maybeSingle()

    if (existing) {
      if (existing.status === 'accepted') {
        return NextResponse.json({ error: 'You are already connected with this person' }, { status: 400 })
      }
      if (existing.status === 'pending') {
        return NextResponse.json({ error: 'An invite is already pending for this email' }, { status: 400 })
      }
    }

    // Also check if the invitee has already invited the current user
    const { data: reverseExisting } = await admin
      .from('trusted_deaf_circle')
      .select('id, status, invitee_email')
      .eq('invitee_id', user.id)
      .maybeSingle()

    // Look up if invitee has an account
    const { data: inviteeAuth } = await admin.auth.admin.listUsers()
    const inviteeUser = inviteeAuth?.users?.find(
      (u: { email?: string }) => u.email?.toLowerCase() === normalizedEmail
    )

    // Get inviter's name
    const { data: inviterProfile } = await admin
      .from('deaf_profiles')
      .select('first_name, last_name, name')
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle()

    const inviterName = inviterProfile?.first_name
      ? `${inviterProfile.first_name} ${inviterProfile.last_name || ''}`.trim()
      : inviterProfile?.name || 'A signpost user'

    // Create the invite
    const { data: invite, error: insertError } = await admin
      .from('trusted_deaf_circle')
      .insert({
        inviter_id: user.id,
        invitee_id: inviteeUser?.id || null,
        invitee_email: normalizedEmail,
        status: 'pending',
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('[dhh/circle/invite] insert failed:', insertError.message)
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined
    try {
      logAudit({ user_id: user.id, action: 'create', resource_type: 'circle_invite', resource_id: invite.id, metadata: { invitee_email: normalizedEmail, channel: 'email' }, ip_address: ip })
    } catch (auditErr) {
      console.error('[audit] circle invite:', auditErr)
    }

    // Send email
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
        to: normalizedEmail,
        subject: `${inviterName} invited you to their trusted Deaf circle on signpost`,
        html,
      })
    } catch (emailErr) {
      console.error('[dhh/circle/invite] email send failed:', emailErr instanceof Error ? emailErr.message : emailErr)
      // Don't fail the invite if email fails
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[dhh/circle/invite] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
