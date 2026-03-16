export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

const COMPLETED_SEED_TITLES = [
  'Benefits Meeting',
  'PT Session',
]

const COMPLETED_SEED_BOOKINGS = [
  {
    title: 'Benefits Meeting',
    requester_name: 'Lakewood Community College — HR Dept',
    specialization: 'Workplace & Professional',
    date: '2026-02-28',
    time_start: '09:00',
    time_end: '11:30',
    location: 'Lakewood Community College, Admin Building Room 204',
    format: 'in_person' as const,
    status: 'completed' as const,
    description: 'Annual open enrollment benefits presentation for all employees. Two Deaf staff members attending. HR will present slides — interpreter may want to request materials in advance.',
    notes: 'D/HH Client: Marcus Webb. Communication prefs: ASL preferred, uses some gestures for technical terms.',
    recurrence: 'one-time',
    interpreter_count: 1,
    is_seed: true,
  },
  {
    title: 'PT Session',
    requester_name: 'Dr. Sarah Kim, PT — Bayside Physical Therapy',
    specialization: 'Medical & Wellness',
    date: '2026-03-03',
    time_start: '14:00',
    time_end: '15:00',
    location: 'Bayside Physical Therapy, 4200 Stone Way N, Seattle WA',
    format: 'in_person' as const,
    status: 'completed' as const,
    description: 'Ongoing PT session — shoulder rehab. Interpreter needs to be comfortable with medical/anatomical terminology. Client will be doing physical exercises during session.',
    notes: 'D/HH Client: Jordan Rivera. Communication prefs: Black ASL preferred. Prefers interpreter positioned on left side.',
    recurrence: 'one-time',
    interpreter_count: 1,
    is_seed: true,
  },
]

export async function POST(request: NextRequest) {
  try {
    const { interpreterProfileId } = await request.json()
    if (!interpreterProfileId || typeof interpreterProfileId !== 'string') {
      return NextResponse.json({ error: 'Missing interpreterProfileId' }, { status: 400 })
    }

    // Verify the caller is authenticated and owns this profile
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('interpreter_profiles')
      .select('id')
      .eq('id', interpreterProfileId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found or not yours' }, { status: 403 })
    }

    const admin = getSupabaseAdmin()

    // Check if completed seed bookings already exist for this interpreter via booking_recipients
    const { data: recipientRows } = await admin
      .from('booking_recipients')
      .select('booking_id')
      .eq('interpreter_id', interpreterProfileId)

    const recipientBookingIds = (recipientRows || []).map(r => r.booking_id)

    let existingTitles = new Set<string>()
    if (recipientBookingIds.length > 0) {
      const { data: existing, error: checkErr } = await admin
        .from('bookings')
        .select('title')
        .in('id', recipientBookingIds)
        .eq('is_seed', true)
        .eq('status', 'completed')
        .in('title', COMPLETED_SEED_TITLES)

      if (checkErr) {
        console.error('[seed-completed] check failed:', checkErr.message)
        return NextResponse.json({ error: 'Check failed' }, { status: 500 })
      }

      existingTitles = new Set((existing || []).map(b => b.title))
    }

    const toInsert = COMPLETED_SEED_BOOKINGS
      .filter(b => !existingTitles.has(b.title))
      .map(b => ({ ...b, requester_id: null }))

    if (toInsert.length === 0) {
      return NextResponse.json({ inserted: 0 })
    }

    const { data: inserted, error: insertErr } = await admin
      .from('bookings')
      .insert(toInsert)
      .select('id, title')

    if (insertErr) {
      console.error('[seed-completed] insert failed:', insertErr.message)
      return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
    }

    // Create booking_recipients for each inserted booking
    if (inserted && inserted.length > 0) {
      const recipientsPayload = inserted.map(b => ({
        booking_id: b.id,
        interpreter_id: interpreterProfileId,
        status: 'confirmed',
        sent_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
      }))

      const { error: recipErr } = await admin
        .from('booking_recipients')
        .insert(recipientsPayload)

      if (recipErr) {
        console.error('[seed-completed] booking_recipients insert failed:', recipErr.message)
      }
    }

    console.log(`[seed-completed] inserted ${toInsert.length} completed bookings + recipients for ${interpreterProfileId}`)
    return NextResponse.json({ inserted: toInsert.length })
  } catch (err) {
    console.error('[seed-completed] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
