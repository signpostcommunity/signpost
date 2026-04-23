import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

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
    .select('id, sender_user_id, status')
    .eq('id', invite_id)
    .maybeSingle()

  if (fetchErr || !invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  }

  if (invite.sender_user_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  if (!['sent', 'clicked'].includes(invite.status)) {
    return NextResponse.json({ error: 'Only pending invites can be cancelled' }, { status: 400 })
  }

  const { error: updateErr } = await admin
    .from('invite_tracking')
    .update({ status: 'cancelled' })
    .eq('id', invite_id)

  if (updateErr) {
    console.error('[invites/cancel] Update error:', updateErr)
    return NextResponse.json({ error: 'Failed to cancel invite' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
