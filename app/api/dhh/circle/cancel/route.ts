import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

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

    // Fetch the invite to verify ownership
    const { data: invite, error: fetchError } = await admin
      .from('trusted_deaf_circle')
      .select('id, inviter_id, invitee_email, status')
      .eq('id', inviteId)
      .single()

    if (fetchError || !invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    // Fail-closed: only the inviter can cancel
    if (invite.inviter_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to cancel this invite' }, { status: 403 })
    }

    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending invites can be cancelled' }, { status: 400 })
    }

    const { error: updateError } = await admin
      .from('trusted_deaf_circle')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', inviteId)
      .eq('inviter_id', user.id)

    if (updateError) {
      console.error('[dhh/circle/cancel] update failed:', updateError.message)
      return NextResponse.json({ error: 'Failed to cancel invite' }, { status: 500 })
    }

    console.log(`[audit] circle_invite_cancelled actor=${user.id} invite=${inviteId} target_email=${invite.invitee_email}`)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[dhh/circle/cancel] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
