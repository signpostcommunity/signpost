import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { logAudit } from '@/lib/audit'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dhhUserId = request.nextUrl.searchParams.get('dhh_user_id')
  if (!dhhUserId) {
    return NextResponse.json({ error: 'Missing dhh_user_id' }, { status: 400 })
  }

  // Verify active connection exists
  const { data: connection } = await supabase
    .from('dhh_requester_connections')
    .select('id, status')
    .eq('dhh_user_id', dhhUserId)
    .eq('requester_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!connection) {
    return NextResponse.json({ error: 'no_active_connection' }, { status: 403 })
  }

  logAudit({
    user_id: user.id,
    action: 'view',
    resource_type: 'deaf_profile',
    resource_id: dhhUserId,
  })

  // Use service role to read deaf_roster (RLS only allows Deaf user to read)
  const admin = getSupabaseAdmin()

  // Fetch deaf user info
  const { data: dhhUser } = await admin
    .from('deaf_profiles')
    .select('name, first_name, comm_prefs, pronouns')
    .eq('id', dhhUserId)
    .single()

  // Fetch roster entries.
  // Ratings are intentionally excluded from shared list views.
  // Tier placement (preferred / approved) communicates preference without exposing private ratings.
  const { data: rosterEntries, error: rosterError } = await admin
    .from('deaf_roster')
    .select('id, interpreter_id, tier, approve_work, approve_personal, notes, do_not_book')
    .eq('deaf_user_id', dhhUserId)

  if (rosterError) {
    console.error('[connections/preferences] roster fetch error:', rosterError.message)
    return NextResponse.json({
      dhh_user: dhhUser || null,
      preferred: [],
      approved: [],
      do_not_book: [],
    })
  }

  // Fetch interpreter details for all roster entries
  const interpreterIds = (rosterEntries || []).map(r => r.interpreter_id).filter(Boolean)

  let interpreterMap: Record<string, Record<string, unknown>> = {}
  if (interpreterIds.length > 0) {
    const { data: interpreters } = await admin
      .from('interpreter_profiles')
      .select('id, name, first_name, last_name, photo_url, vanity_slug, sign_languages, specializations, city, state, available, rating, review_count')
      .in('id', interpreterIds)

    if (interpreters) {
      for (const i of interpreters) {
        interpreterMap[i.id] = i
      }
    }
  }

  // Group by tier
  const preferred: Record<string, unknown>[] = []
  const approved: Record<string, unknown>[] = []
  const doNotBook: Record<string, unknown>[] = []

  for (const entry of rosterEntries || []) {
    const interp = interpreterMap[entry.interpreter_id]
    if (!interp) continue

    if (entry.do_not_book) {
      // DNB: IDs only for silent exclusion - no names, no details
      doNotBook.push({
        interpreter_id: entry.interpreter_id,
      })
    } else if (entry.tier === 'preferred') {
      preferred.push({
        ...interp,
        roster_notes: entry.notes,
        approve_work: entry.approve_work,
        approve_personal: entry.approve_personal,
      })
    } else if (entry.tier === 'approved') {
      approved.push({
        ...interp,
        roster_notes: entry.notes,
        approve_work: entry.approve_work,
        approve_personal: entry.approve_personal,
      })
    }
  }

  return NextResponse.json({
    dhh_user: dhhUser || null,
    preferred,
    approved,
    do_not_book_ids: doNotBook.map(d => d.interpreter_id),
  })
}
