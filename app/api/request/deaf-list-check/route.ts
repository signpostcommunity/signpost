import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications-server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { deafUserIdentifier } = body

    if (!deafUserIdentifier || typeof deafUserIdentifier !== 'string') {
      return NextResponse.json({ error: 'Missing identifier' }, { status: 400 })
    }

    const identifier = deafUserIdentifier.trim().toLowerCase()
    const admin = getSupabaseAdmin()

    // Get requester info
    const { data: reqProfile } = await admin
      .from('requester_profiles')
      .select('name, org_name')
      .eq('id', user.id)
      .maybeSingle()

    const requesterName = reqProfile?.org_name || reqProfile?.name || 'A requester'

    // IMPORTANT: Multi-role users always have their deaf_roster
    // queried when tagged. Lookup is by deaf_profiles existence,
    // never by current_role. A user can be an interpreter AND Deaf.

    // Look up the Deaf user by email in auth.users, or by phone in deaf_profiles
    let deafAuthUser: { id: string; email?: string } | null = null
    let deafProfile: { id: string; user_id: string; first_name: string | null; auto_share_pref_list: boolean } | null = null

    // Try email lookup via auth.users
    if (identifier.includes('@')) {
      const { data: { users }, error: listErr } = await admin.auth.admin.listUsers()
      if (!listErr && users) {
        const matched = users.find(u => u.email?.toLowerCase() === identifier)
        if (matched) {
          deafAuthUser = { id: matched.id, email: matched.email ?? undefined }
        }
      }
    }

    // If found by email, look up deaf_profiles
    if (deafAuthUser) {
      const { data: dp } = await admin
        .from('deaf_profiles')
        .select('id, user_id, first_name, auto_share_pref_list')
        .or(`user_id.eq.${deafAuthUser.id},id.eq.${deafAuthUser.id}`)
        .maybeSingle()

      deafProfile = dp
    } else {
      // Try phone lookup in deaf_profiles directly
      const { data: dp } = await admin
        .from('deaf_profiles')
        .select('id, user_id, first_name, auto_share_pref_list')
        .eq('phone', identifier)
        .maybeSingle()

      if (dp) {
        deafProfile = dp
        deafAuthUser = { id: dp.user_id }
      }
    }

    // Not found on signpost
    if (!deafProfile || !deafAuthUser) {
      return NextResponse.json({ status: 'not_on_signpost', userId: null })
    }

    const displayName = deafProfile.first_name || 'this person'
    const deafUserId = deafProfile.id

    // Check if a connection already exists
    const { data: existingConn } = await admin
      .from('dhh_requester_connections')
      .select('id, status')
      .eq('dhh_user_id', deafUserId)
      .eq('requester_id', user.id)
      .in('status', ['active', 'pending'])
      .maybeSingle()

    // If active connection exists, list is already accessible
    if (existingConn?.status === 'active') {
      const interpreters = await fetchDeafRoster(admin, deafUserId)
      return NextResponse.json({
        status: 'list_available',
        userId: deafUserId,
        displayName,
        interpreters,
      })
    }

    // If pending connection exists, return pending
    if (existingConn?.status === 'pending') {
      return NextResponse.json({
        status: 'approval_pending',
        userId: deafUserId,
        displayName,
      })
    }

    // No connection yet. Check auto_share_pref_list
    const autoShare = deafProfile.auto_share_pref_list !== false

    if (autoShare) {
      // Create active connection immediately
      await admin
        .from('dhh_requester_connections')
        .insert({
          dhh_user_id: deafUserId,
          requester_id: user.id,
          status: 'active',
          initiated_by: 'requester',
          requester_org_name: reqProfile?.org_name || null,
          confirmed_at: new Date().toISOString(),
        })

      // Fetch the roster
      const interpreters = await fetchDeafRoster(admin, deafUserId)

      // Informational notification to Deaf user
      await createNotification({
        recipientUserId: deafAuthUser.id,
        type: 'preferred_list_shared',
        subject: `${requesterName} is requesting an interpreter for you on signpost`,
        body: `${requesterName} is requesting an interpreter for you on signpost. Your preferred interpreter list was shared with them.`,
        metadata: {
          requester_name: requesterName,
          requester_id: user.id,
        },
        ctaText: 'View Your List',
        ctaUrl: 'https://signpost.community/dhh/dashboard/interpreters',
        channel: 'both',
      })

      return NextResponse.json({
        status: 'list_available',
        userId: deafUserId,
        displayName,
        interpreters,
      })
    } else {
      // Create pending connection
      await admin
        .from('dhh_requester_connections')
        .insert({
          dhh_user_id: deafUserId,
          requester_id: user.id,
          status: 'pending',
          initiated_by: 'requester',
          requester_org_name: reqProfile?.org_name || null,
        })

      // Send approval request notification
      await createNotification({
        recipientUserId: deafAuthUser.id,
        type: 'preferred_list_requested',
        subject: `${requesterName} is requesting an interpreter for you`,
        body: `${requesterName} is requesting an interpreter for you and would like access to your preferred interpreter list.`,
        metadata: {
          requester_name: requesterName,
          requester_id: user.id,
        },
        ctaText: 'Review Request',
        ctaUrl: `https://signpost.community/dhh/dashboard/interpreters?share_to=${user.id}`,
        channel: 'both',
      })

      return NextResponse.json({
        status: 'approval_pending',
        userId: deafUserId,
        displayName,
      })
    }
  } catch (err) {
    console.error('[deaf-list-check] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function fetchDeafRoster(
  admin: ReturnType<typeof getSupabaseAdmin>,
  deafUserId: string
) {
  // Fetch roster entries
  const { data: rosterRows } = await admin
    .from('deaf_roster')
    .select('interpreter_id, tier, do_not_book')
    .eq('deaf_user_id', deafUserId)

  if (!rosterRows || rosterRows.length === 0) return []

  // Separate preferred/approved from DNB
  const preferred = rosterRows.filter(r => !r.do_not_book && (r.tier === 'preferred' || r.tier === 'approved'))
  const dnbIds = rosterRows.filter(r => r.do_not_book).map(r => r.interpreter_id)

  if (preferred.length === 0) return []

  const interpIds = preferred.map(r => r.interpreter_id)
  const tierMap: Record<string, string> = {}
  for (const r of preferred) tierMap[r.interpreter_id] = r.tier

  // Fetch interpreter profiles
  const { data: profiles } = await admin
    .from('interpreter_profiles')
    .select('id, first_name, last_name, name, photo_url, avatar_color, specializations')
    .in('id', interpIds)

  // Fetch certifications
  const { data: certs } = await admin
    .from('interpreter_certifications')
    .select('interpreter_id, name')
    .in('interpreter_id', interpIds)

  const certsMap: Record<string, string[]> = {}
  for (const c of certs || []) {
    if (!certsMap[c.interpreter_id]) certsMap[c.interpreter_id] = []
    certsMap[c.interpreter_id].push(c.name)
  }

  return (profiles || []).map(p => {
    const firstName = p.first_name || ''
    const lastName = p.last_name || ''
    const displayName = firstName ? `${firstName} ${lastName}`.trim() : p.name || 'Interpreter'

    return {
      id: p.id,
      name: displayName,
      certifications: certsMap[p.id] || [],
      specializations: (p.specializations as string[]) || [],
      tier: tierMap[p.id] || 'approved',
      avatar_url: p.photo_url,
      avatar_color: (p as Record<string, unknown>).avatar_color as string | null,
      is_dnb: false,
    }
  }).concat(
    // Include DNB IDs as minimal entries for filtering (no names/details exposed)
    dnbIds.map(id => ({
      id,
      name: '',
      certifications: [],
      specializations: [],
      tier: 'dnb',
      avatar_url: null,
      avatar_color: null,
      is_dnb: true,
    }))
  )
}
