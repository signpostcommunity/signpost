export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

const COMPLETED_SEED_TITLES = [
  'Annual Employee Benefits Meeting',
  'Physical Therapy Session',
]

const COMPLETED_SEED_BOOKINGS = [
  {
    title: 'Annual Employee Benefits Meeting',
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
    title: 'Physical Therapy Session',
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

    // Check if completed seed bookings already exist
    const admin = getSupabaseAdmin()
    const { data: existing, error: checkErr } = await admin
      .from('bookings')
      .select('title')
      .eq('interpreter_id', interpreterProfileId)
      .eq('is_seed', true)
      .eq('status', 'completed')
      .in('title', COMPLETED_SEED_TITLES)

    if (checkErr) {
      console.error('[seed-completed] check failed:', checkErr.message)
      return NextResponse.json({ error: 'Check failed' }, { status: 500 })
    }

    const existingTitles = new Set((existing || []).map(b => b.title))
    const toInsert = COMPLETED_SEED_BOOKINGS
      .filter(b => !existingTitles.has(b.title))
      .map(b => ({ ...b, interpreter_id: interpreterProfileId, requester_id: null }))

    if (toInsert.length === 0) {
      return NextResponse.json({ inserted: 0 })
    }

    const { error: insertErr } = await admin
      .from('bookings')
      .insert(toInsert)

    if (insertErr) {
      console.error('[seed-completed] insert failed:', insertErr.message)
      return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
    }

    console.log(`[seed-completed] inserted ${toInsert.length} completed bookings for ${interpreterProfileId}`)
    return NextResponse.json({ inserted: toInsert.length })
  } catch (err) {
    console.error('[seed-completed] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
