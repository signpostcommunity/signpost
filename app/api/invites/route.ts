import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { sendSms } from '@/lib/sms'
import { normalizePhone } from '@/lib/phone'
import { render } from '@react-email/components'
import { InterpreterInviteEmail } from '@/emails/InterpreterInviteEmail'

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    recipientName,
    recipientEmail,
    recipientPhone,
    senderName,
    senderEmail,
    senderRole,
    channel, // 'email' | 'sms' | 'clipboard'
    targetListRole, // 'interpreter_team' | 'dhh_pref_list' | 'requester_pref_list'
  } = body

  if (!recipientName) {
    return NextResponse.json({ error: 'Recipient name is required' }, { status: 400 })
  }
  if (channel === 'email' && !recipientEmail) {
    return NextResponse.json({ error: 'Email is required for email channel' }, { status: 400 })
  }
  if (channel === 'sms' && !recipientPhone) {
    return NextResponse.json({ error: 'Phone is required for SMS channel' }, { status: 400 })
  }
  if (!channel || !['email', 'sms', 'clipboard'].includes(channel)) {
    return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })
  }

  // Get sender user ID if authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const senderUserId = user?.id || null

  // Determine sender role from profile if authenticated
  let resolvedSenderRole = senderRole || 'interpreter'
  let resolvedSenderName = senderName || ''
  let resolvedSenderEmail = senderEmail || ''

  if (senderUserId) {
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, email')
      .eq('id', senderUserId)
      .maybeSingle()

    if (userProfile) {
      resolvedSenderRole = userProfile.role || resolvedSenderRole
      resolvedSenderEmail = resolvedSenderEmail || userProfile.email || ''
    }

    // Get sender name from the appropriate profile
    if (resolvedSenderRole === 'deaf') {
      const { data: deafProfile } = await supabase
        .from('deaf_profiles')
        .select('first_name, last_name, email')
        .or(`id.eq.${senderUserId},user_id.eq.${senderUserId}`)
        .maybeSingle()
      if (deafProfile) {
        resolvedSenderName = resolvedSenderName || `${deafProfile.first_name || ''} ${deafProfile.last_name || ''}`.trim()
        resolvedSenderEmail = resolvedSenderEmail || deafProfile.email || ''
      }
    } else {
      const { data: interpProfile } = await supabase
        .from('interpreter_profiles')
        .select('first_name, last_name, email')
        .eq('user_id', senderUserId)
        .maybeSingle()
      if (interpProfile) {
        resolvedSenderName = resolvedSenderName || `${interpProfile.first_name || ''} ${interpProfile.last_name || ''}`.trim()
        resolvedSenderEmail = resolvedSenderEmail || interpProfile.email || ''
      }
    }
  }

  const token = generateToken()
  const admin = getSupabaseAdmin()

  // Create invite_tracking record
  const { data: invite, error: insertError } = await admin
    .from('invite_tracking')
    .insert({
      invite_token: token,
      sender_user_id: senderUserId,
      sender_name: resolvedSenderName,
      sender_email: resolvedSenderEmail,
      sender_role: resolvedSenderRole,
      recipient_name: recipientName,
      recipient_email: recipientEmail || null,
      recipient_phone: recipientPhone || null,
      channel,
      target_list_role: targetListRole || 'interpreter_team',
      status: channel === 'clipboard' ? 'sent' : 'sent',
      sent_at: new Date().toISOString(),
    })
    .select('id, invite_token')
    .single()

  if (insertError) {
    console.error('[invites] Insert error:', insertError)
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
  }

  const signupUrl = `https://signpost.community/interpreter/signup?invite=${token}`

  // Send via chosen channel
  if (channel === 'email' && recipientEmail) {
    try {
      const html = await render(
        InterpreterInviteEmail({
          recipientName,
          senderName: resolvedSenderName,
          inviteToken: token,
        })
      )
      await sendEmail({
        to: recipientEmail,
        subject: `${resolvedSenderName || 'Someone'} wants to add you to their preferred interpreter team on signpost`,
        html,
      })
    } catch (emailErr) {
      console.error('[invites] Email send error:', emailErr)
      // Record still created, just email failed
    }
  }

  if (channel === 'sms' && recipientPhone) {
    const e164 = normalizePhone(recipientPhone)
    if (!e164) {
      console.error(`[invites] Invalid phone number: ${recipientPhone}`)
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
    }
    const smsBody = `${resolvedSenderName || 'Someone'} wants to add you to their preferred interpreter team on signpost. Set your own rates, connect directly with clients. Join: signpost.community/interpreter/signup?invite=${token}`
    try {
      await sendSms({ to: e164, message: smsBody })
    } catch (smsErr) {
      console.error('[invites] SMS send error:', smsErr)
    }
  }

  return NextResponse.json({
    success: true,
    invite_token: token,
    signup_url: signupUrl,
  })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: invites, error } = await supabase
    .from('invite_tracking')
    .select('*')
    .eq('sender_user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[invites] Fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 })
  }

  return NextResponse.json({ invites: invites || [] })
}
