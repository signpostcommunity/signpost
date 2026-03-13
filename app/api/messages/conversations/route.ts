import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getSupabaseAdmin()

    // Get all conversations the user participates in
    const { data: participations, error: partErr } = await admin
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', user.id)

    if (partErr || !participations) {
      return NextResponse.json({ conversations: [] })
    }

    const conversationIds = participations.map((p: { conversation_id: string }) => p.conversation_id)
    if (conversationIds.length === 0) {
      return NextResponse.json({ conversations: [] })
    }

    // Build a map of last_read_at per conversation
    const lastReadMap = new Map<string, string | null>()
    for (const p of participations) {
      lastReadMap.set(p.conversation_id, p.last_read_at)
    }

    // Get conversation details
    const { data: conversations } = await admin
      .from('conversations')
      .select('id, subject, last_message_at')
      .in('id', conversationIds)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ conversations: [] })
    }

    // Get the other participant for each conversation
    const { data: allParticipants } = await admin
      .from('conversation_participants')
      .select('conversation_id, user_id')
      .in('conversation_id', conversationIds)
      .neq('user_id', user.id)

    const otherUserMap = new Map<string, string>()
    if (allParticipants) {
      for (const p of allParticipants) {
        otherUserMap.set(p.conversation_id, p.user_id)
      }
    }

    // Get last message for each conversation
    const lastMessages = new Map<string, { body: string; sender_id: string }>()
    for (const convoId of conversationIds) {
      const { data: lastMsg } = await admin
        .from('direct_messages')
        .select('body, sender_id')
        .eq('conversation_id', convoId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (lastMsg) {
        lastMessages.set(convoId, lastMsg)
      }
    }

    // Get other participant profiles
    const otherUserIds = [...new Set(otherUserMap.values())]
    const profileMap = new Map<string, { name: string; photo_url: string | null }>()

    if (otherUserIds.length > 0) {
      // Try interpreter_profiles
      const { data: interpProfiles } = await admin
        .from('interpreter_profiles')
        .select('user_id, name, photo_url')
        .in('user_id', otherUserIds)

      if (interpProfiles) {
        for (const p of interpProfiles) {
          profileMap.set(p.user_id, { name: p.name, photo_url: p.photo_url })
        }
      }

      // Try deaf_profiles for users not found
      const missingIds = otherUserIds.filter(id => !profileMap.has(id))
      if (missingIds.length > 0) {
        const { data: deafProfiles } = await admin
          .from('deaf_profiles')
          .select('user_id, first_name, last_name, photo_url')
          .in('user_id', missingIds)

        if (deafProfiles) {
          for (const p of deafProfiles) {
            profileMap.set(p.user_id, {
              name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
              photo_url: p.photo_url,
            })
          }
        }
      }

      // Try requester_profiles for remaining
      const stillMissing = otherUserIds.filter(id => !profileMap.has(id))
      if (stillMissing.length > 0) {
        const { data: reqProfiles } = await admin
          .from('requester_profiles')
          .select('id, name')
          .in('id', stillMissing)

        if (reqProfiles) {
          for (const p of reqProfiles) {
            profileMap.set(p.id, { name: p.name, photo_url: null })
          }
        }
      }
    }

    // Assemble response
    const result = conversations.map((convo: { id: string; subject: string | null; last_message_at: string | null }) => {
      const otherUserId = otherUserMap.get(convo.id) || null
      const profile = otherUserId ? profileMap.get(otherUserId) : null
      const lastMsg = lastMessages.get(convo.id)
      const lastReadAt = lastReadMap.get(convo.id)
      const unread = convo.last_message_at && (!lastReadAt || convo.last_message_at > lastReadAt)

      return {
        id: convo.id,
        subject: convo.subject,
        lastMessageAt: convo.last_message_at,
        lastMessage: lastMsg ? { body: lastMsg.body, senderId: lastMsg.sender_id } : null,
        otherParticipant: {
          userId: otherUserId,
          name: profile?.name || 'Unknown User',
          photoUrl: profile?.photo_url || null,
        },
        unread: !!unread,
      }
    })

    return NextResponse.json({ conversations: result })
  } catch (err) {
    console.error('[messages/conversations] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
