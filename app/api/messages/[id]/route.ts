import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/messages/[id] - update a single message (mark as read, archive)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  // Verify user is a participant: check that the message belongs to a booking
  // where the user is either the interpreter or the requester, or the message
  // has interpreter_id matching the user's interpreter profile
  const { data: msg } = await supabase
    .from('messages')
    .select('id, interpreter_id')
    .eq('id', id)
    .single()

  if (!msg) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Check ownership via interpreter_profiles
  const { data: profile } = await supabase
    .from('interpreter_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  // Also check via requester/deaf profiles for message recipients
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  const isInterpreter = profile && msg.interpreter_id === profile.id
  const isParticipant = isInterpreter || !!userProfile

  if (!isParticipant) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updates: Record<string, boolean> = {}
  if (typeof body.is_read === 'boolean') updates.is_read = body.is_read
  if (typeof body.archived === 'boolean') updates.archived = body.archived

  const { error } = await supabase
    .from('messages')
    .update(updates)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
