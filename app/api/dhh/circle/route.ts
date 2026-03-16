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

    // Look up names + location from deaf_profiles
    let profileMap: Record<string, { name: string; email: string; location: string }> = {}
    if (userIds.size > 0) {
      const { data: profiles } = await admin
        .from('deaf_profiles')
        .select('user_id, first_name, last_name, name, email, city, state')
        .in('user_id', Array.from(userIds))

      for (const p of profiles || []) {
        const displayName = p.first_name
          ? `${p.first_name} ${p.last_name || ''}`.trim()
          : p.name || 'User'
        const location = [p.city, p.state].filter(Boolean).join(', ')
        profileMap[p.user_id] = { name: displayName, email: p.email || '', location }
      }
    }

    // Count preferred interpreters per user from deaf_roster
    const preferredCounts: Record<string, number> = {}
    if (userIds.size > 0) {
      const { data: rosterCounts } = await admin
        .from('deaf_roster')
        .select('deaf_user_id, tier')
        .in('deaf_user_id', Array.from(userIds))
        .eq('tier', 'preferred')

      for (const r of rosterCounts || []) {
        preferredCounts[r.deaf_user_id] = (preferredCounts[r.deaf_user_id] || 0) + 1
      }
    }

    // Enrich connections with names, location, preferred count
    const enriched = (connections || []).map(c => {
      const otherUserId = c.inviter_id === user.id ? c.invitee_id : c.inviter_id
      const otherProfile = otherUserId ? profileMap[otherUserId] : null
      return {
        ...c,
        other_user_id: otherUserId,
        other_name: otherProfile?.name || c.invitee_email,
        other_location: otherProfile?.location || null,
        other_preferred_count: otherUserId ? (preferredCounts[otherUserId] || 0) : null,
        is_inviter: c.inviter_id === user.id,
      }
    })

    return NextResponse.json({ connections: enriched })
  } catch (err) {
    console.error('[dhh/circle] GET error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
