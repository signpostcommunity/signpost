import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
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
    const { inviteId, action } = body

    if (!inviteId || !action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Fetch the invite - must be addressed to this user (by invitee_id or invitee_email)
    const { data: invite, error: fetchError } = await admin
      .from('trusted_deaf_circle')
      .select('*')
      .eq('id', inviteId)
      .single()

    if (fetchError || !invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    // Check ownership: invitee_id matches, or invitee_email matches user's email
    const isInvitee = invite.invitee_id === user.id ||
      (invite.invitee_email && invite.invitee_email === user.email?.toLowerCase())

    if (!isInvitee) {
      return NextResponse.json({ error: 'Not authorized to respond to this invite' }, { status: 403 })
    }

    const newStatus = action === 'accept' ? 'accepted' : 'declined'
    const updateData: Record<string, unknown> = {
      status: newStatus,
      invitee_id: user.id, // Ensure invitee_id is set (for email-only invites)
    }
    if (action === 'accept') {
      updateData.accepted_at = new Date().toISOString()
    }

    const { error: updateError } = await admin
      .from('trusted_deaf_circle')
      .update(updateData)
      .eq('id', inviteId)

    if (updateError) {
      console.error('[dhh/circle/respond] update failed:', updateError.message)
      return NextResponse.json({ error: 'Failed to update invite' }, { status: 500 })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined
    try {
      logAudit({ user_id: user.id, action: action === 'accept' ? 'accept' : 'decline', resource_type: 'circle_invite', resource_id: inviteId, metadata: { inviter_id: invite.inviter_id }, ip_address: ip })
    } catch (auditErr) {
      console.error('[audit] circle respond:', auditErr)
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (err) {
    console.error('[dhh/circle/respond] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
