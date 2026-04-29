import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { rewardId, notes } = await req.json()
  if (!rewardId) return NextResponse.json({ error: 'rewardId required' }, { status: 400 })

  const admin = getSupabaseAdmin()
  const { error } = await admin
    .from('invite_rewards')
    .update({
      gift_card_sent_at: new Date().toISOString(),
      gift_card_sent_by: user.id,
      ...(notes !== undefined ? { notes } : {}),
    })
    .eq('id', rewardId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
