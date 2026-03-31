import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Verify the requesting user has an accepted connection with this user
    const { data: connection } = await admin
      .from('trusted_deaf_circle')
      .select('id')
      .eq('status', 'accepted')
      .or(
        `and(inviter_id.eq.${user.id},invitee_id.eq.${userId}),and(inviter_id.eq.${userId},invitee_id.eq.${user.id})`
      )
      .maybeSingle()

    if (!connection) {
      return NextResponse.json({ error: 'Not authorized to view this list' }, { status: 403 })
    }

    // Step 1: Fetch the roster entries directly.
    // Ratings are intentionally excluded from shared list views.
    // Tier placement (preferred / approved) communicates preference without exposing private ratings.
    const { data: rosterRows, error: rosterError } = await admin
      .from('deaf_roster')
      .select('id, interpreter_id, tier, notes')
      .eq('deaf_user_id', userId)

    if (rosterError) {
      console.error('[dhh/circle/roster] roster fetch error:', rosterError.message)
      return NextResponse.json({ error: 'Failed to fetch roster' }, { status: 500 })
    }

    if (!rosterRows || rosterRows.length === 0) {
      return NextResponse.json({ roster: [] })
    }

    // Step 2: Fetch interpreter profiles for those IDs
    const interpIds = rosterRows.map(r => r.interpreter_id)

    const { data: profiles, error: profilesErr } = await admin
      .from('interpreter_profiles')
      .select('id, name, first_name, last_name, photo_url, color')
      .in('id', interpIds)

    if (profilesErr) {
      console.error('[dhh/circle/roster] profiles fetch error:', profilesErr.message)
    }

    // Step 3: Fetch certs and specializations separately
    const { data: certs, error: certsErr } = await admin
      .from('interpreter_certifications')
      .select('interpreter_id, name')
      .in('interpreter_id', interpIds)

    if (certsErr) {
      console.error('[dhh/circle/roster] certs fetch error:', certsErr.message)
    }

    const { data: specs, error: specsErr } = await admin
      .from('interpreter_specializations')
      .select('interpreter_id, specialization')
      .in('interpreter_id', interpIds)

    if (specsErr) {
      console.error('[dhh/circle/roster] specs fetch error:', specsErr.message)
    }

    // Build lookup maps
    const profileMap = new Map((profiles || []).map(p => [p.id, p]))
    const certsByInterp = new Map<string, string[]>()
    for (const c of certs || []) {
      const arr = certsByInterp.get(c.interpreter_id) || []
      arr.push(c.name)
      certsByInterp.set(c.interpreter_id, arr)
    }
    const specsByInterp = new Map<string, string[]>()
    for (const s of specs || []) {
      const arr = specsByInterp.get(s.interpreter_id) || []
      arr.push(s.specialization)
      specsByInterp.set(s.interpreter_id, arr)
    }

    // Combine roster + profiles
    const roster = rosterRows.map(row => {
      const interp = profileMap.get(row.interpreter_id)
      const interpName = interp
        ? (interp.first_name
          ? `${interp.first_name} ${interp.last_name || ''}`.trim()
          : interp.name || 'Interpreter')
        : 'Interpreter'
      const initials = interpName.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase()

      return {
        id: row.id,
        interpreter_id: row.interpreter_id,
        tier: row.tier,
        notes: row.notes,
        name: interpName,
        photo_url: interp?.photo_url || null,
        color: interp?.color || '',
        initials,
        certs: (certsByInterp.get(row.interpreter_id) || []).join(', '),
        domains: (specsByInterp.get(row.interpreter_id) || []).join(', '),
      }
    })

    return NextResponse.json({ roster })
  } catch (err) {
    console.error('[dhh/circle/roster] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
