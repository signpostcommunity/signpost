import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { dhh_user_id?: string; initiated_by?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { dhh_user_id, initiated_by } = body

  if (!dhh_user_id || !initiated_by || !['dhh', 'requester'].includes(initiated_by)) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
  }

  // Look up requester's org_name
  const { data: reqProfile } = await supabase
    .from('requester_profiles')
    .select('org_name')
    .eq('id', user.id)
    .maybeSingle()

  // Check for existing active connection
  const { data: existing } = await supabase
    .from('dhh_requester_connections')
    .select('*')
    .eq('dhh_user_id', dhh_user_id)
    .eq('requester_id', user.id)
    .in('status', ['active', 'pending'])
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ connection: existing })
  }

  // Create new connection
  const status = initiated_by === 'dhh' ? 'active' : 'pending'
  const confirmedAt = initiated_by === 'dhh' ? new Date().toISOString() : null

  const { data: connection, error } = await supabase
    .from('dhh_requester_connections')
    .insert({
      dhh_user_id,
      requester_id: user.id,
      status,
      initiated_by,
      requester_org_name: reqProfile?.org_name || null,
      confirmed_at: confirmedAt,
    })
    .select()
    .single()

  if (error) {
    console.error('[connections/create] Insert error:', error.message)
    // Could be unique constraint - check for existing again
    if (error.code === '23505') {
      const { data: existingRetry } = await supabase
        .from('dhh_requester_connections')
        .select('*')
        .eq('dhh_user_id', dhh_user_id)
        .eq('requester_id', user.id)
        .in('status', ['active', 'pending'])
        .maybeSingle()

      if (existingRetry) {
        return NextResponse.json({ connection: existingRetry })
      }
    }
    return NextResponse.json({ error: 'Failed to create connection' }, { status: 500 })
  }

  return NextResponse.json({ connection })
}
