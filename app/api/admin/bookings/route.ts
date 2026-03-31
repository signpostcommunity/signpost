import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = getSupabaseAdmin()
  const params = request.nextUrl.searchParams
  const page = parseInt(params.get('page') || '1', 10)
  const perPage = 25
  const status = params.get('status') || ''
  const feeStatus = params.get('feeStatus') || ''
  const search = params.get('search') || ''

  // Build bookings query
  let query = admin
    .from('bookings')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1)

  if (status) {
    query = query.eq('status', status)
  }
  if (feeStatus) {
    query = query.eq('platform_fee_status', feeStatus)
  }
  if (search) {
    query = query.or(`description.ilike.%${search}%`)
  }

  const { data: bookings, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ bookings: [], total: 0 })
  }

  // Get requester names
  const requesterIds = [...new Set(bookings.map(b => b.requester_id).filter(Boolean))]
  const { data: requesters } = await admin
    .from('requester_profiles')
    .select('id, name')
    .in('id', requesterIds)
  const requesterMap = new Map((requesters || []).map(r => [r.id, r.name]))

  // Get requester emails from user_profiles
  const { data: requesterEmails } = await admin
    .from('user_profiles')
    .select('id, email')
    .in('id', requesterIds)
  const requesterEmailMap = new Map((requesterEmails || []).map(r => [r.id, r.email]))

  // Get booking_recipients for interpreter names
  const bookingIds = bookings.map(b => b.id)
  const { data: recipients } = await admin
    .from('booking_recipients')
    .select('booking_id, interpreter_id')
    .in('booking_id', bookingIds)

  const interpIds = [...new Set((recipients || []).map(r => r.interpreter_id).filter(Boolean))]
  const { data: interpreters } = interpIds.length > 0
    ? await admin.from('interpreter_profiles').select('id, first_name, last_name').in('id', interpIds)
    : { data: [] }
  const interpNameMap = new Map((interpreters || []).map(i => [i.id, `${i.first_name || ''} ${i.last_name || ''}`.trim()]))

  // Build recipients map: booking_id -> interpreter names[]
  const recipientMap = new Map<string, string[]>()
  for (const r of (recipients || [])) {
    const names = recipientMap.get(r.booking_id) || []
    names.push(interpNameMap.get(r.interpreter_id) || 'Unknown')
    recipientMap.set(r.booking_id, names)
  }

  // Also check legacy interpreter_id on bookings
  const legacyInterpIds = [...new Set(bookings.map(b => b.interpreter_id).filter(Boolean))]
  let legacyInterpMap = new Map<string, string>()
  if (legacyInterpIds.length > 0) {
    const { data: legacyInterps } = await admin
      .from('interpreter_profiles')
      .select('id, first_name, last_name')
      .in('id', legacyInterpIds)
    legacyInterpMap = new Map((legacyInterps || []).map(i => [i.id, `${i.first_name || ''} ${i.last_name || ''}`.trim()]))
  }

  // Filter by search on requester name if description search returned all
  let enriched = bookings.map(b => ({
    id: b.id,
    description: b.description || '',
    requester_name: requesterMap.get(b.requester_id) || '',
    requester_email: requesterEmailMap.get(b.requester_id) || '',
    interpreter_names: recipientMap.get(b.id) || (b.interpreter_id ? [legacyInterpMap.get(b.interpreter_id) || 'Unknown'] : []),
    date: b.date,
    time_start: b.time_start,
    time_end: b.time_end,
    status: b.status,
    platform_fee_status: b.platform_fee_status || '',
    platform_fee_amount: b.platform_fee_amount || 0,
    created_at: b.created_at,
    format: b.format || '',
    location: b.location || '',
    event_type: b.event_type || '',
    timezone: b.timezone || '',
  }))

  // Client-side search on requester name (description already filtered by DB)
  if (search) {
    const q = search.toLowerCase()
    enriched = enriched.filter(b =>
      b.description.toLowerCase().includes(q) ||
      b.requester_name.toLowerCase().includes(q)
    )
  }

  return NextResponse.json({ bookings: enriched, total: count || enriched.length })
}
