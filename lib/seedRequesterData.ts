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

    // Look up celebrity interpreter profiles
    const { data: interpreters } = await supabase
      .from('interpreter_profiles')
      .select('id, first_name')
      .in('first_name', ['Betty', 'Keanu', 'Idris', 'Oprah'])

    const bettyId = interpreters?.find(i => i.first_name === 'Betty')?.id
    const keanuId = interpreters?.find(i => i.first_name === 'Keanu')?.id
    const idrisId = interpreters?.find(i => i.first_name === 'Idris')?.id

    // Look up Jordan Rivera's deaf profile UUID for tagging
    const { data: jordanProfile } = await supabase
      .from('deaf_profiles')
      .select('id')
      .eq('email', 'jordan.rivera.test@signpost.community')
      .maybeSingle()

    const jordanId = jordanProfile?.id

    // Get requester profile name for requester_name field
    const { data: reqProfile } = await supabase
      .from('requester_profiles')
      .select('name, org_name')
      .or(`user_id.eq.${requesterId},id.eq.${requesterId}`)
      .maybeSingle()

    const requesterName = reqProfile?.org_name || reqProfile?.name || 'Beta Requester'

    // ── Booking 1: [Sample] Staff Training Workshop (open) ──
    const { data: booking1, error: b1Err } = await supabase
      .from('bookings')
      .insert({
        requester_id: requesterId,
        requester_name: requesterName,
        title: '[Sample] Staff Training Workshop',
        status: 'open',
        date: daysFromNow(14),
        time_start: '09:00',
        time_end: '12:00',
        format: 'in_person',
        event_category: 'Employment',
        specialization: 'Education',
        interpreter_count: 2,
        is_seed: true,
        platform_fee_amount: 30.00,
        request_type: 'professional',
        description: 'Staff training workshop with ASL interpretation needed.',
        location: 'Conference Room B, 500 Pine Street, Seattle WA',
        recurrence: 'one-time',
        tagged_deaf_user_ids: jordanId ? [jordanId] : [],
      })
      .select('id')
      .single()

    if (b1Err) console.error('[seed-requester] booking 1 insert failed:', b1Err.message)

    // Create 3 booking_recipients for booking 1
    if (booking1?.id) {
      const recipients = []
      if (bettyId) recipients.push({ booking_id: booking1.id, interpreter_id: bettyId, status: 'responded', sent_at: new Date().toISOString(), responded_at: new Date().toISOString(), response_rate: 75.00, wave_number: 1 })
      if (keanuId) recipients.push({ booking_id: booking1.id, interpreter_id: keanuId, status: 'responded', sent_at: new Date().toISOString(), responded_at: new Date().toISOString(), response_rate: 85.00, wave_number: 1 })
      if (idrisId) recipients.push({ booking_id: booking1.id, interpreter_id: idrisId, status: 'declined', sent_at: new Date().toISOString(), declined_at: new Date().toISOString(), wave_number: 1 })
      if (recipients.length > 0) {
        const { error: brErr } = await supabase.from('booking_recipients').insert(recipients)
        if (brErr) console.error('[seed-requester] booking 1 recipients failed:', brErr.message)
      }
    }

    // ── Booking 2: [Sample] Patient Intake Appointment (confirmed) ──
    const { data: booking2, error: b2Err } = await supabase
      .from('bookings')
      .insert({
        requester_id: requesterId,
        requester_name: requesterName,
        title: '[Sample] Patient Intake Appointment',
        status: 'filled',
        date: daysFromNow(7),
        time_start: '14:00',
        time_end: '15:00',
        format: 'in_person',
        event_category: 'Medical',
        specialization: 'Medical',
        interpreter_count: 1,
        is_seed: true,
        platform_fee_amount: 15.00,
        request_type: 'professional',
        description: 'New patient intake for a Deaf client. Medical terminology expected.',
        location: 'Seattle Medical Center, Room 204',
        recurrence: 'one-time',
      })
      .select('id')
      .single()

    if (b2Err) console.error('[seed-requester] booking 2 insert failed:', b2Err.message)

    if (booking2?.id && bettyId) {
      const { error: brErr } = await supabase
        .from('booking_recipients')
        .insert({
          booking_id: booking2.id,
          interpreter_id: bettyId,
          status: 'confirmed',
          sent_at: new Date().toISOString(),
          confirmed_at: new Date().toISOString(),
          response_rate: 70.00,
          wave_number: 1,
        })
      if (brErr) console.error('[seed-requester] booking 2 recipient failed:', brErr.message)
    }

    // ���─ Booking 3: [Sample] Community Event Planning (open, remote) ──
    const { data: booking3, error: b3Err } = await supabase
      .from('bookings')
      .insert({
        requester_id: requesterId,
        requester_name: requesterName,
        title: '[Sample] Community Event Planning',
        status: 'open',
        date: daysFromNow(21),
        time_start: '10:00',
        time_end: '12:00',
        format: 'remote',
        event_category: 'Community',
        specialization: 'Conference',
        interpreter_count: 2,
        is_seed: true,
        platform_fee_amount: 30.00,
        request_type: 'professional',
        description: 'Community event planning meeting via Zoom.',
        location: 'Zoom',
        recurrence: 'one-time',
      })
      .select('id')
      .single()

    if (b3Err) console.error('[seed-requester] booking 3 insert failed:', b3Err.message)

    if (booking3?.id) {
      const recipients = []
      if (bettyId) recipients.push({ booking_id: booking3.id, interpreter_id: bettyId, status: 'sent', sent_at: new Date().toISOString(), wave_number: 1 })
      if (keanuId) recipients.push({ booking_id: booking3.id, interpreter_id: keanuId, status: 'sent', sent_at: new Date().toISOString(), wave_number: 1 })
      if (recipients.length > 0) {
        const { error: brErr } = await supabase.from('booking_recipients').insert(recipients)
        if (brErr) console.error('[seed-requester] booking 3 recipients failed:', brErr.message)
      }
    }

    // ── Requester roster entries ──
    if (bettyId) {
      await supabase.from('requester_roster').insert({
        requester_user_id: requesterId,
        interpreter_id: bettyId,
        tier: 'preferred',
        notes: 'Excellent with medical terminology',
      })
    }

    if (keanuId) {
      await supabase.from('requester_roster').insert({
        requester_user_id: requesterId,
        interpreter_id: keanuId,
        tier: 'secondary',
        notes: 'Great for corporate events',
      })
    }

    console.log(`[seed-requester] seeded 3 bookings + roster entries for requester ${requesterId}`)
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown seed error'
    console.error('[seed-requester] unexpected error:', msg)
    return { success: false, error: msg }
  }
}
