import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getSupabaseAdmin()

    // Fetch all connections where user is inviter or invitee
    const { data: connections, error: fetchError } = await admin
      .from('trusted_deaf_circle')
      .select('*')
      .or(`inviter_id.eq.${user.id},invitee_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('[dhh/circle] GET failed:', fetchError.message)
      return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 })
    }

    // Collect all user IDs we need to look up names for
    const userIds = new Set<string>()
    for (const c of connections || []) {
      if (c.inviter_id) userIds.add(c.inviter_id)
      if (c.invitee_id) userIds.add(c.invitee_id)
    }

    // Look up names from deaf_profiles
    let nameMap: Record<string, { name: string; email: string }> = {}
    if (userIds.size > 0) {
      const { data: profiles } = await admin
        .from('deaf_profiles')
        .select('user_id, first_name, last_name, name, email')
        .in('user_id', Array.from(userIds))

      for (const p of profiles || []) {
        const displayName = p.first_name
          ? `${p.first_name} ${p.last_name || ''}`.trim()
          : p.name || 'User'
        nameMap[p.user_id] = { name: displayName, email: p.email || '' }
      }
    }

    // Enrich connections with names
    const enriched = (connections || []).map(c => {
      const otherUserId = c.inviter_id === user.id ? c.invitee_id : c.inviter_id
      const otherProfile = otherUserId ? nameMap[otherUserId] : null
      return {
        ...c,
        other_user_id: otherUserId,
        other_name: otherProfile?.name || c.invitee_email,
        is_inviter: c.inviter_id === user.id,
      }
    })

    return NextResponse.json({ connections: enriched })
  } catch (err) {
    console.error('[dhh/circle] GET error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
