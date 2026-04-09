import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { token } = await req.json()

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Token required' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  // Look up invite and update to 'clicked' if currently 'sent'
  const { data: invite } = await admin
    .from('invite_tracking')
    .select('id, status')
    .eq('invite_token', token)
    .maybeSingle()

  if (!invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  }

  if (invite.status === 'sent') {
    await admin
      .from('invite_tracking')
      .update({ status: 'clicked', clicked_at: new Date().toISOString() })
      .eq('id', invite.id)
  }

  return NextResponse.json({ success: true })
}
