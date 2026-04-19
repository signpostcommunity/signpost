import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ValidRole = 'interpreter' | 'dhh' | 'requester'

const ROLE_CONFIG: Record<ValidRole, { table: string; keyColumn: string }> = {
  interpreter: { table: 'interpreter_profiles', keyColumn: 'user_id' },
  dhh: { table: 'deaf_profiles', keyColumn: 'user_id' },
  requester: { table: 'requester_profiles', keyColumn: 'id' },
}

const VALID_ROLES: ValidRole[] = ['interpreter', 'dhh', 'requester']

function isValidRole(value: string): value is ValidRole {
  return (VALID_ROLES as string[]).includes(value)
}

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
  if (!role || !isValidRole(role)) {
    return NextResponse.json({ error: 'Missing or invalid role' }, { status: 400 })
  }

  const { table, keyColumn } = ROLE_CONFIG[role]

  const { data, error } = await supabase
    .from(table)
    .update({ dismissed_prelaunch_notice_at: new Date().toISOString() })
    .eq(keyColumn, user.id)
    .select('id')

  if (error) {
    console.error('[prelaunch-notice/dismiss] update failed', {
      role,
      userIdPrefix: user.id.slice(0, 8),
      supabaseError: error.message,
    })
    return NextResponse.json({ error: 'Failed to dismiss notice' }, { status: 500 })
  }

  if (!data || data.length === 0) {
    console.error('[prelaunch-notice/dismiss] no rows affected', {
      role,
      userIdPrefix: user.id.slice(0, 8),
    })
    return NextResponse.json({ error: 'Failed to dismiss notice - no matching profile row' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
