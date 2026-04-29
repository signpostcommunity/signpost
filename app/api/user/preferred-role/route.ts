import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'

const VALID_ROLES = ['interpreter', 'deaf', 'requester', 'admin'] as const
type PreferredRole = (typeof VALID_ROLES)[number]

const ROLE_PROFILE_TABLE: Record<string, { table: string; keyColumn: string }> = {
  interpreter: { table: 'interpreter_profiles', keyColumn: 'user_id' },
  deaf: { table: 'deaf_profiles', keyColumn: 'user_id' },
  requester: { table: 'requester_profiles', keyColumn: 'id' },
}

function isValidRole(value: string): value is PreferredRole {
  return (VALID_ROLES as readonly string[]).includes(value)
}

export async function PATCH(req: NextRequest) {
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

  // Verify user actually has this role
  if (role === 'admin') {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (!profile?.is_admin) {
      console.error('[preferred-role] user lacks admin role', {
        role,
        userIdPrefix: user.id.slice(0, 8),
      })
      return NextResponse.json({ error: 'You do not have that role' }, { status: 400 })
    }
  } else {
    const config = ROLE_PROFILE_TABLE[role]
    if (!config) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
    const { count, error: checkErr } = await supabase
      .from(config.table)
      .select('id', { count: 'exact' })
      .limit(1)
      .eq(config.keyColumn, user.id)
    if (checkErr || (count ?? 0) === 0) {
      console.error('[preferred-role] user lacks role profile', {
        role,
        userIdPrefix: user.id.slice(0, 8),
        error: checkErr?.message,
      })
      return NextResponse.json({ error: 'You do not have that role' }, { status: 400 })
    }
  }

  // Fetch old preferred_role for audit
  const { data: oldProfile } = await supabase
    .from('user_profiles')
    .select('preferred_role')
    .eq('id', user.id)
    .single()
  const oldRole = oldProfile?.preferred_role || null

  // The DB column uses 'dhh' for deaf role in the CHECK constraint
  const dbRole = role === 'deaf' ? 'dhh' : role
  const { error: updateErr } = await supabase
    .from('user_profiles')
    .update({ preferred_role: dbRole })
    .eq('id', user.id)

  if (updateErr) {
    console.error('[preferred-role] update failed', {
      role,
      userIdPrefix: user.id.slice(0, 8),
      supabaseError: updateErr.message,
    })
    return NextResponse.json({ error: 'Failed to update preferred role' }, { status: 500 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined
  try {
    logAudit({ user_id: user.id, action: 'set_preferred_role', resource_type: 'user_profile', resource_id: user.id, metadata: { from: oldRole, to: dbRole }, ip_address: ip })
  } catch (auditErr) {
    console.error('[audit] preferred role:', auditErr)
  }

  return NextResponse.json({ success: true })
}
