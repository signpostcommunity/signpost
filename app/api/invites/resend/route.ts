import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { sendSms } from '@/lib/sms'
import { normalizePhone } from '@/lib/phone'
import { render } from '@react-email/components'
import { InterpreterInviteEmail } from '@/emails/InterpreterInviteEmail'

const MAX_RESENDS = 5
const RESEND_COOLDOWN_DAYS = 7

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { invite_id } = await req.json()
  if (!invite_id) {
    return NextResponse.json({ error: 'invite_id is required' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  const { data: invite, error: fetchErr } = await admin
    .from('invite_tracking')
    .select('*')
    .eq('id', invite_id)
    .maybeSingle()

  if (fetchErr || !invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  }

  if (invite.sender_user_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  if (invite.status !== 'sent') {
    return NextResponse.json({ error: 'Only sent invites can be resent' }, { status: 400 })
  }

  const daysSinceSent = (Date.now() - new Date(invite.sent_at).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceSent < RESEND_COOLDOWN_DAYS) {
    return NextResponse.json({ error: 'Invite was sent less than 7 days ago' }, { status: 400 })
  }

  if ((invite.resend_count || 0) >= MAX_RESENDS) {
    return NextResponse.json({ error: 'Maximum resends reached' }, { status: 400 })
  }

  // Update sent_at and increment resend_count
  const { error: updateErr } = await admin
    .from('invite_tracking')
    .update({
      sent_at: new Date().toISOString(),
      resend_count: (invite.resend_count || 0) + 1,
    })
    .eq('id', invite_id)

  if (updateErr) {
    console.error('[invites/resend] Update error:', updateErr)
    return NextResponse.json({ error: 'Failed to update invite' }, { status: 500 })
  }

  // Re-send via original channel
  const signupUrl = `https://signpost.community/invite?token=${invite.invite_token}`

  if (invite.channel === 'email' && invite.recipient_email) {
    try {
      const html = await render(
        InterpreterInviteEmail({
          recipientName: invite.recipient_name,
          senderName: invite.sender_name || 'Someone',
          inviteToken: invite.invite_token,
        })
      )
      await sendEmail({
        to: invite.recipient_email,
        subject: `Reminder: ${invite.sender_name || 'Someone'} wants to add you to their team on signpost`,
        html,
      })
    } catch (emailErr) {
      console.error('[invites/resend] Email error:', emailErr)
    }
  } else if (invite.channel === 'sms' && invite.recipient_phone) {
    const e164 = normalizePhone(invite.recipient_phone)
    if (e164) {
      const smsBody = `Reminder: ${invite.sender_name || 'Someone'} wants to add you to their preferred interpreter team on signpost. Join: ${signupUrl}`
      try {
        await sendSms({ to: e164, message: smsBody })
      } catch (smsErr) {
        console.error('[invites/resend] SMS error:', smsErr)
      }
    }
  }
  // clipboard channel: no delivery action, client handles re-copy

  return NextResponse.json({
    success: true,
    signup_url: signupUrl,
  })
}
