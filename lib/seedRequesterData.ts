import { getSupabaseAdmin } from '@/lib/supabase/admin'

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

export async function seedRequesterData(requesterId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdmin()

    // Check if seed data already exists
    const { count } = await supabase
      .from('bookings')
      .select('id', { count: 'exact' }).limit(1)
      .eq('requester_id', requesterId)
      .eq('is_seed', true)

    if ((count ?? 0) > 0) {
      return { success: true } // already seeded
    }

    // Look up Betty White and Keanu Reeves interpreter profiles
    const { data: interpreters } = await supabase
      .from('interpreter_profiles')
      .select('id, first_name')
      .in('first_name', ['Betty', 'Keanu'])

    const bettyId = interpreters?.find(i => i.first_name === 'Betty')?.id
    const keanuId = interpreters?.find(i => i.first_name === 'Keanu')?.id

    // Get requester profile name for requester_name field
    const { data: reqProfile } = await supabase
      .from('requester_profiles')
      .select('name, org_name')
      .or(`user_id.eq.${requesterId},id.eq.${requesterId}`)
      .maybeSingle()

    const requesterName = reqProfile?.org_name || reqProfile?.name || 'Beta Requester'

    // ── Booking 1: Open ──
    const { data: booking1, error: b1Err } = await supabase
      .from('bookings')
      .insert({
        requester_id: requesterId,
        requester_name: requesterName,
        title: 'Quarterly all-hands meeting — ASL interpreters needed',
        status: 'open',
        date: daysFromNow(14),
        time_start: '09:00',
        time_end: '11:30',
        format: 'remote',
        specialization: 'Conference',
        interpreter_count: 2,
        is_seed: true,
        platform_fee_amount: 30.00,
        request_type: 'professional',
        description: 'Quarterly all-hands meeting with ASL interpretation needed for remote participants.',
        location: 'Zoom — link will be shared',
        recurrence: 'one-time',
      })
      .select('id')
      .single()

    if (b1Err) console.error('[seed-requester] booking 1 insert failed:', b1Err.message)

    // ── Booking 2: Filled ──
    const { data: booking2, error: b2Err } = await supabase
      .from('bookings')
      .insert({
        requester_id: requesterId,
        requester_name: requesterName,
        title: 'Patient intake appointment — Spanish-speaking Deaf client',
        status: 'filled',
        date: daysFromNow(7),
        time_start: '14:00',
        time_end: '15:00',
        format: 'in_person',
        specialization: 'Medical',
        interpreter_count: 1,
        is_seed: true,
        platform_fee_amount: 15.00,
        request_type: 'professional',
        description: 'New patient intake for a Spanish-speaking Deaf client. Medical terminology expected.',
        location: 'City Medical Center, Suite 204',
        recurrence: 'one-time',
      })
      .select('id')
      .single()

    if (b2Err) console.error('[seed-requester] booking 2 insert failed:', b2Err.message)

    // Create booking_recipients row for filled booking (Betty White = confirmed)
    if (booking2?.id && bettyId) {
      const { error: brErr } = await supabase
        .from('booking_recipients')
        .insert({
          booking_id: booking2.id,
          interpreter_id: bettyId,
          status: 'confirmed',
          sent_at: new Date().toISOString(),
          confirmed_at: new Date().toISOString(),
        })
      if (brErr) console.error('[seed-requester] booking_recipients insert failed:', brErr.message)
    }

    // ── Booking 3: Completed ──
    const { error: b3Err } = await supabase
      .from('bookings')
      .insert({
        requester_id: requesterId,
        requester_name: requesterName,
        title: 'Staff training — Deaf awareness workshop',
        status: 'completed',
        date: daysFromNow(-14),
        time_start: '10:00',
        time_end: '12:00',
        format: 'in_person',
        specialization: 'Education',
        interpreter_count: 1,
        is_seed: true,
        platform_fee_amount: 15.00,
        request_type: 'professional',
        description: 'Staff training workshop on Deaf awareness and communication strategies.',
        location: 'Company HQ, Training Room B',
        recurrence: 'one-time',
      })

    if (b3Err) console.error('[seed-requester] booking 3 insert failed:', b3Err.message)

    // ── Requester roster entries ──
    if (bettyId) {
      const { error: r1Err } = await supabase
        .from('requester_roster')
        .insert({
          requester_user_id: requesterId,
          interpreter_id: bettyId,
          tier: 'preferred',
          notes: 'Excellent with medical terminology',
        })
      if (r1Err) console.error('[seed-requester] roster betty insert failed:', r1Err.message)
    }

    if (keanuId) {
      const { error: r2Err } = await supabase
        .from('requester_roster')
        .insert({
          requester_user_id: requesterId,
          interpreter_id: keanuId,
          tier: 'secondary',
          notes: 'Great for corporate events',
        })
      if (r2Err) console.error('[seed-requester] roster keanu insert failed:', r2Err.message)
    }

    console.log(`[seed-requester] seeded 3 bookings + roster entries for requester ${requesterId}`)
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown seed error'
    console.error('[seed-requester] unexpected error:', msg)
    return { success: false, error: msg }
  }
}
