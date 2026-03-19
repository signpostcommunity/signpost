export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const admin = getSupabaseAdmin()

    // ── Idempotency check: skip if seed bookings already exist ──
    const { data: existingSeed } = await admin
      .from('booking_dhh_clients')
      .select('id')
      .eq('dhh_user_id', userId)
      .limit(1)

    if (existingSeed && existingSeed.length > 0) {
      return NextResponse.json({ success: true, skipped: true, reason: 'seed data already exists' })
    }

    // Also check deaf_roster to avoid duplicate roster entries
    const { data: existingRoster } = await admin
      .from('deaf_roster')
      .select('id')
      .eq('deaf_user_id', userId)
      .limit(1)

    const rosterAlreadySeeded = existingRoster && existingRoster.length > 0

    // ── Look up seed interpreter profiles by first_name ──
    const { data: interpreters } = await admin
      .from('interpreter_profiles')
      .select('id, first_name')
      .in('first_name', ['Betty', 'Keanu', 'Idris', 'Sandra', 'Dwayne', 'Oprah', 'Dolly', 'Denzel'])

    const interpMap: Record<string, string> = {}
    for (const ip of interpreters || []) {
      if (ip.first_name) interpMap[ip.first_name] = ip.id
    }

    const errors: string[] = []

    // ── STEP 1: Create 4 seed bookings ──

    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    const threeWeeks = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000)

    const toDateStr = (d: Date) => d.toISOString().split('T')[0]

    interface BookingSeed {
      title: string
      requesterName: string | null
      date: string
      timeStart: string
      timeEnd: string
      location: string
      format: 'in_person' | 'remote'
      status: string
      description: string
      specialization: string
      eventType: string
      requestType: 'professional' | 'personal'
      interpreterFirstName: string | null // null = no confirmed interpreter
      recipientStatus: string | null
    }

    const bookingSeeds: BookingSeed[] = [
      {
        title: 'Weekly team standup',
        requesterName: 'Cascade Communications',
        date: toDateStr(oneWeekAgo),
        timeStart: '09:00',
        timeEnd: '09:30',
        location: 'Cascade Communications HQ, 4th Floor Conference Room',
        format: 'in_person',
        status: 'completed',
        description: 'Weekly team standup meeting. Standard business communication, no specialized vocabulary needed.',
        specialization: 'Corporate',
        eventType: 'employment',
        requestType: 'professional',
        interpreterFirstName: 'Betty',
        recipientStatus: 'confirmed',
      },
      {
        title: 'Doctor appointment',
        requesterName: 'Cascade Communications',
        date: toDateStr(nextWeek),
        timeStart: '14:00',
        timeEnd: '15:00',
        location: 'Telehealth — Zoom link will be provided',
        format: 'remote',
        status: 'filled',
        description: 'Follow-up appointment with primary care physician. Discussion of recent lab results.',
        specialization: 'Medical',
        eventType: 'medical',
        requestType: 'professional',
        interpreterFirstName: 'Keanu',
        recipientStatus: 'confirmed',
      },
      {
        title: 'HR onboarding meeting',
        requesterName: 'Cascade Communications',
        date: toDateStr(twoWeeks),
        timeStart: '10:00',
        timeEnd: '11:30',
        location: 'Cascade Communications HQ, Training Room B',
        format: 'in_person',
        status: 'open',
        description: 'New hire onboarding session covering benefits, policies, and team introductions.',
        specialization: 'Corporate',
        eventType: 'employment',
        requestType: 'professional',
        interpreterFirstName: null,
        recipientStatus: null,
      },
      {
        title: 'Family reunion',
        requesterName: null,
        date: toDateStr(threeWeeks),
        timeStart: '12:00',
        timeEnd: '16:00',
        location: 'Volunteer Park, Seattle WA',
        format: 'in_person',
        status: 'filled',
        description: 'Annual family reunion. Mix of Deaf and hearing family members. Casual outdoor event.',
        specialization: 'Community',
        eventType: 'personal',
        requestType: 'personal',
        interpreterFirstName: 'Idris',
        recipientStatus: 'confirmed',
      },
    ]

    for (const bs of bookingSeeds) {
      const { data: booking, error: bookingErr } = await admin
        .from('bookings')
        .insert({
          requester_id: userId,
          title: bs.title,
          requester_name: bs.requesterName,
          date: bs.date,
          time_start: bs.timeStart,
          time_end: bs.timeEnd,
          location: bs.location,
          format: bs.format,
          status: bs.status,
          description: bs.description,
          specialization: bs.specialization,
          event_type: bs.eventType,
          request_type: bs.requestType,
          interpreter_count: 1,
          is_seed: true,
          notes: bs.description,
        })
        .select('id')
        .single()

      if (bookingErr) {
        errors.push(`booking "${bs.title}": ${bookingErr.message}`)
        continue
      }

      // Link DHH client
      const { error: dhhErr } = await admin.from('booking_dhh_clients').insert({
        booking_id: booking.id,
        dhh_user_id: userId,
        comm_prefs_snapshot: { primary_language: 'ASL', preferred_format: 'in_person' },
        added_at: new Date().toISOString(),
      })
      if (dhhErr) errors.push(`booking_dhh_clients "${bs.title}": ${dhhErr.message}`)

      // Create booking_recipient if there's a confirmed interpreter
      if (bs.interpreterFirstName && bs.recipientStatus) {
        const interpId = interpMap[bs.interpreterFirstName]
        if (interpId) {
          const recipientData: Record<string, unknown> = {
            booking_id: booking.id,
            interpreter_id: interpId,
            status: bs.recipientStatus,
            sent_at: new Date().toISOString(),
          }
          if (bs.recipientStatus === 'confirmed') {
            recipientData.confirmed_at = new Date().toISOString()
          }
          const { error: recipErr } = await admin.from('booking_recipients').insert(recipientData)
          if (recipErr) errors.push(`booking_recipients "${bs.title}": ${recipErr.message}`)
        }
      }
    }

    // ── STEP 2: Seed deaf_roster (5 preferred/secondary + 1 DNB) ──

    if (!rosterAlreadySeeded) {
      const rosterEntries: { firstName: string; tier: string; dnb?: boolean }[] = [
        { firstName: 'Betty', tier: 'preferred' },
        { firstName: 'Keanu', tier: 'preferred' },
        { firstName: 'Idris', tier: 'preferred' },
        { firstName: 'Sandra', tier: 'approved' },
        { firstName: 'Dwayne', tier: 'approved' },
        // DNB: use Dolly Parton (not used in bookings above)
        { firstName: 'Dolly', tier: 'preferred', dnb: true },
      ]

      for (const entry of rosterEntries) {
        const interpId = interpMap[entry.firstName]
        if (!interpId) continue

        const { error: rosterErr } = await admin.from('deaf_roster').upsert(
          {
            deaf_user_id: userId,
            interpreter_id: interpId,
            tier: entry.dnb ? 'preferred' : entry.tier,
            do_not_book: entry.dnb || false,
            approve_work: !entry.dnb,
            approve_personal: !entry.dnb,
          },
          { onConflict: 'deaf_user_id,interpreter_id' }
        )
        if (rosterErr) errors.push(`deaf_roster ${entry.firstName}: ${rosterErr.message}`)
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      ...(errors.length > 0 ? { errors } : {}),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[seed-deaf-account] fatal:', msg)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
