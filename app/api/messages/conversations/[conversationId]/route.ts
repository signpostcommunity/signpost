import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { decrypt } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getSupabaseAdmin()

    // Verify user is a participant
    const { data: participation } = await admin
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (!participation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Update last_read_at
    await admin
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)

    // Get conversation info
    const { data: conversation } = await admin
      .from('conversations')
      .select('id, subject, last_message_at')
      .eq('id', conversationId)
      .single()

    // Get all messages in chronological order
    const { data: messages } = await admin
      .from('direct_messages')
      .select('id, sender_id, body, created_at, edited_at, is_deleted')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    // Get attachments for all messages
    const messageIds = (messages || []).map((m: { id: string }) => m.id)
    const attachmentMap = new Map<string, Array<{ id: string; fileName: string; fileType: string; fileSize: number; storagePath: string }>>()

    if (messageIds.length > 0) {
      const { data: attachments } = await admin
        .from('message_attachments')
        .select('id, message_id, file_name, file_type, file_size, storage_path')
        .in('message_id', messageIds)

      if (attachments) {
        for (const a of attachments) {
          const existing = attachmentMap.get(a.message_id) || []
          existing.push({
            id: a.id,
            fileName: a.file_name,
            fileType: a.file_type,
            fileSize: a.file_size,
            storagePath: a.storage_path,
          })
          attachmentMap.set(a.message_id, existing)
        }
      }
    }

    // Get other participant info
    const { data: otherParticipant } = await admin
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .neq('user_id', user.id)
      .single()

    let otherUser: { userId: string; name: string; photoUrl: string | null } | null = null
    if (otherParticipant) {
      const uid = otherParticipant.user_id

      // Try interpreter_profiles
      const { data: interp } = await admin
        .from('interpreter_profiles')
        .select('name, photo_url')
        .eq('user_id', uid)
        .single()

      if (interp) {
        otherUser = { userId: uid, name: interp.name, photoUrl: interp.photo_url }
      } else {
        // Try deaf_profiles
        const { data: deaf } = await admin
          .from('deaf_profiles')
          .select('first_name, last_name, photo_url')
          .eq('user_id', uid)
          .single()

        if (deaf) {
          otherUser = {
            userId: uid,
            name: `${deaf.first_name || ''} ${deaf.last_name || ''}`.trim(),
            photoUrl: deaf.photo_url,
          }
        } else {
          // Try requester_profiles
          const { data: req } = await admin
            .from('requester_profiles')
            .select('name')
            .eq('id', uid)
            .single()

          otherUser = { userId: uid, name: req?.name || 'Unknown User', photoUrl: null }
        }
      }
    }

    // Assemble messages with attachments
    const messagesResult = (messages || []).map((m: { id: string; sender_id: string; body: string; created_at: string; edited_at: string | null; is_deleted: boolean }) => ({
      id: m.id,
      senderId: m.sender_id,
      body: m.is_deleted ? '[Message deleted]' : (decrypt(m.body) || m.body),
      createdAt: m.created_at,
      editedAt: m.edited_at,
      isDeleted: m.is_deleted,
      attachments: attachmentMap.get(m.id) || [],
    }))

    return NextResponse.json({
      conversation: {
        id: conversation?.id,
        subject: conversation?.subject,
        lastMessageAt: conversation?.last_message_at,
      },
      otherParticipant: otherUser,
      messages: messagesResult,
    })
  } catch (err) {
    console.error('[messages/conversation] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
