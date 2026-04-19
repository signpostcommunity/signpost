import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { role?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { role } = body
  if (!role || !['interpreter', 'dhh', 'requester'].includes(role)) {
    return NextResponse.json({ error: 'Missing or invalid role' }, { status: 400 })
  }

  const tableMap: Record<string, string> = {
    interpreter: 'interpreter_profiles',
    dhh: 'deaf_profiles',
    requester: 'requester_profiles',
  }

  const table = tableMap[role]

  const { data, error } = await supabase
    .from(table)
    .update({ dismissed_prelaunch_notice_at: new Date().toISOString() })
    .or(`user_id.eq.${user.id},id.eq.${user.id}`)
    .select('id')

  if (error) {
    console.error(`[prelaunch-notice] Failed to update ${table}:`, error.message)
    return NextResponse.json({ error: 'Failed to dismiss notice' }, { status: 500 })
  }

  if (!data || data.length === 0) {
    console.error(`[prelaunch-notice] No ${table} row found for user ${user.id}`)
    return NextResponse.json({ error: 'Profile not found' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
