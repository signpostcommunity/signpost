import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// PATCH /api/messages/conversations/mark-all-read — mark all conversations as read
export async function PATCH() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getSupabaseAdmin()

    const { error } = await admin
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[messages/mark-all-read] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
