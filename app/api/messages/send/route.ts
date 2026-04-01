import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sanitizeText } from '@/lib/sanitize'
import { encrypt } from '@/lib/encryption'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const raw = await request.json()
    const recipientId = raw.recipientId
    const body = sanitizeText(raw.body || '')
    const subject = raw.subject ? sanitizeText(raw.subject) : null
    const attachments = raw.attachments
    if (!recipientId || !body) {
      return NextResponse.json({ error: 'recipientId and body are required' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    const senderId = user.id

    // --- Access rules ---
    // Check if conversation already exists between these two users
    const { data: existingConvos } = await admin
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', senderId)

    let existingConversationId: string | null = null
    if (existingConvos && existingConvos.length > 0) {
      const convoIds = existingConvos.map((c: { conversation_id: string }) => c.conversation_id)
      const { data: recipientInConvo } = await admin
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', recipientId)
        .in('conversation_id', convoIds)

      if (recipientInConvo && recipientInConvo.length > 0) {
        existingConversationId = recipientInConvo[0].conversation_id
      }
    }

    // If conversation already exists, skip access rule checks (anyone can reply)
    if (!existingConversationId) {
      // Look up roles for sender and recipient
      const { data: senderProfile } = await admin
        .from('user_profiles')
        .select('role')
        .eq('id', senderId)
        .single()

      const { data: recipientProfile } = await admin
        .from('user_profiles')
        .select('role')
        .eq('id', recipientId)
        .single()

      if (!senderProfile || !recipientProfile) {
        return NextResponse.json({ error: 'User profiles not found' }, { status: 404 })
      }

      const senderRole = senderProfile.role
      const recipientRole = recipientProfile.role

      const allowed = await checkAccessRules(admin, senderId, recipientId, senderRole, recipientRole)
      if (!allowed) {
        return NextResponse.json(
          { error: `You cannot message this user. ${getAccessDeniedReason(senderRole, recipientRole)}` },
          { status: 403 }
        )
      }
    }

    // --- Create or reuse conversation ---
    let conversationId = existingConversationId

    if (!conversationId) {
      const { data: convo, error: convoErr } = await admin
        .from('conversations')
        .insert({ subject: subject || null, last_message_at: new Date().toISOString() })
        .select('id')
        .single()

      if (convoErr || !convo) {
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
      }
      conversationId = convo.id

      // Add both participants
      const { error: partErr } = await admin
        .from('conversation_participants')
        .insert([
          { conversation_id: conversationId, user_id: senderId },
          { conversation_id: conversationId, user_id: recipientId },
        ])

      if (partErr) {
        return NextResponse.json({ error: 'Failed to add participants' }, { status: 500 })
      }
    }

    // --- Insert message ---
    const { data: message, error: msgErr } = await admin
      .from('direct_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        body: encrypt(body) || body,
      })
      .select('id')
      .single()

    if (msgErr || !message) {
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    // --- Insert attachments ---
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      const attachmentRows = attachments.map((a: { fileName: string; fileType: string; fileSize: number; storagePath: string }) => ({
        message_id: message.id,
        file_name: a.fileName,
        file_type: a.fileType,
        file_size: a.fileSize,
        storage_path: a.storagePath,
      }))

      await admin.from('message_attachments').insert(attachmentRows)
    }

    // --- Send notification ---
    try {
      const senderName = await getSenderName(admin, senderId)
      const preview = body.length > 100 ? body.substring(0, 100) + '...' : body

      // Look up recipient role for deep linking
      const { data: recipientUserProfile } = await admin
        .from('user_profiles')
        .select('role')
        .eq('id', recipientId)
        .maybeSingle()
      const recipientRole = recipientUserProfile?.role || 'interpreter'

      const origin = request.headers.get('origin') || request.headers.get('host') || ''
      const baseUrl = origin.startsWith('http') ? origin : `https://${origin}`

      const now = new Date()
      const messageTimestamp = now.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit',
      })

      await fetch(`${baseUrl}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: request.headers.get('cookie') || '',
        },
        body: JSON.stringify({
          recipientUserId: recipientId,
          type: 'new_message',
          channel: 'both',
          subject: `New message from ${senderName} on signpost`,
          body: preview,
          metadata: {
            conversationId,
            senderId,
            sender_name: senderName,
            message_body: body,
            message_timestamp: messageTimestamp,
            recipient_role: recipientRole,
          },
          ctaText: 'Read and Reply',
          ctaUrl: `https://signpost.community/interpreter/dashboard/inbox/conversation/${conversationId}`,
        }),
      })
    } catch {
      // Non-critical — don't fail the message send if notification fails
      console.error('[messages/send] notification error')
    }

    return NextResponse.json({ conversationId, messageId: message.id })
  } catch (err) {
    console.error('[messages/send] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// --- Access rule helpers ---

async function checkAccessRules(
  admin: ReturnType<typeof getSupabaseAdmin>,
  senderId: string,
  recipientId: string,
  senderRole: string,
  recipientRole: string
): Promise<boolean> {
  // Interpreter <-> interpreter: ALLOW
  if (senderRole === 'interpreter' && recipientRole === 'interpreter') return true

  // Interpreter <-> deaf: ALLOW (both directions)
  if (senderRole === 'interpreter' && recipientRole === 'deaf') return true
  if (senderRole === 'deaf' && recipientRole === 'interpreter') return true

  // Requester -> interpreter: ALLOW only if active/past booking exists between them
  if (senderRole === 'requester' && recipientRole === 'interpreter') {
    return await hasBookingBetween(admin, senderId, recipientId)
  }

  // Interpreter -> requester: booking must exist
  if (senderRole === 'interpreter' && (recipientRole === 'requester' || recipientRole === 'org')) {
    return await hasBookingBetween(admin, recipientId, senderId)
  }

  // Deaf/dhh -> requester: ALLOW only if they share a booking via interpreter roster
  if (senderRole === 'deaf' && (recipientRole === 'requester' || recipientRole === 'org')) {
    return await hasSharedBooking(admin, senderId, recipientId)
  }

  // Requester -> deaf: same shared booking check
  if ((senderRole === 'requester' || senderRole === 'org') && recipientRole === 'deaf') {
    return await hasSharedBooking(admin, recipientId, senderId)
  }

  // All other combos: DENY
  return false
}

// Check if requester has a booking with this interpreter (via booking_recipients)
async function hasBookingBetween(
  admin: ReturnType<typeof getSupabaseAdmin>,
  requesterId: string,
  interpreterUserId: string
): Promise<boolean> {
  // interpreter_id in booking_recipients references interpreter_profiles.id (not auth.users.id)
  const { data: interpProfile } = await admin
    .from('interpreter_profiles')
    .select('id')
    .eq('user_id', interpreterUserId)
    .single()

  if (!interpProfile) return false

  // Get bookings where this interpreter is a recipient
  const { data: recipientRows } = await admin
    .from('booking_recipients')
    .select('booking_id')
    .eq('interpreter_id', interpProfile.id)

  if (!recipientRows || recipientRows.length === 0) return false
  const bookingIds = recipientRows.map(r => r.booking_id)

  // Check if any of those bookings belong to this requester
  const { data: booking } = await admin
    .from('bookings')
    .select('id')
    .eq('requester_id', requesterId)
    .in('id', bookingIds)
    .limit(1)
    .single()

  return !!booking
}

// Check if deaf user and requester share a connection through bookings
async function hasSharedBooking(
  admin: ReturnType<typeof getSupabaseAdmin>,
  deafUserId: string,
  requesterId: string
): Promise<boolean> {
  // Get interpreters on the deaf user's roster
  const { data: roster } = await admin
    .from('deaf_roster')
    .select('interpreter_id')
    .eq('deaf_user_id', deafUserId)

  if (!roster || roster.length === 0) return false

  const interpreterIds = roster.map((r: { interpreter_id: string }) => r.interpreter_id)

  // Get bookings where any roster interpreter is a recipient
  const { data: recipientRows } = await admin
    .from('booking_recipients')
    .select('booking_id')
    .in('interpreter_id', interpreterIds)

  if (!recipientRows || recipientRows.length === 0) return false
  const bookingIds = [...new Set(recipientRows.map(r => r.booking_id))]

  // Check if any of those bookings belong to this requester
  const { data: booking } = await admin
    .from('bookings')
    .select('id')
    .eq('requester_id', requesterId)
    .in('id', bookingIds)
    .limit(1)
    .single()

  return !!booking
}

async function getSenderName(
  admin: ReturnType<typeof getSupabaseAdmin>,
  senderId: string
): Promise<string> {
  // Try interpreter_profiles first
  const { data: interp } = await admin
    .from('interpreter_profiles')
    .select('name')
    .eq('user_id', senderId)
    .single()
  if (interp?.name) return interp.name

  // Try deaf_profiles
  const { data: deaf } = await admin
    .from('deaf_profiles')
    .select('first_name, last_name')
    .eq('user_id', senderId)
    .single()
  if (deaf?.first_name) return `${deaf.first_name} ${deaf.last_name || ''}`.trim()

  // Try requester_profiles
  const { data: req } = await admin
    .from('requester_profiles')
    .select('name')
    .eq('id', senderId)
    .single()
  if (req?.name) return req.name

  return 'Unknown User'
}

function getAccessDeniedReason(senderRole: string, recipientRole: string): string {
  if ((senderRole === 'requester' || senderRole === 'org') && recipientRole === 'interpreter') {
    return 'You can only message interpreters you have an active or past booking with.'
  }
  if ((senderRole === 'requester' || senderRole === 'org') && recipientRole === 'deaf') {
    return 'You can only message Deaf/DB/HH individuals who are connected to your bookings.'
  }
  if (senderRole === 'deaf' && (recipientRole === 'requester' || recipientRole === 'org')) {
    return 'You can only message requesters who have bookings with your preferred interpreters.'
  }
  return 'Messaging between these user types is not allowed.'
}
