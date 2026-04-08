export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

// Molly's auth user ID
const MOLLY_USER_ID = '6018f4fe-83b4-4e9b-8022-e6b15158ab97'

// ── Interpreter seed profiles ───────────────────────────────────────────────

interface InterpreterSeed {
  email: string
  firstName: string
  lastName: string
  city: string
  state: string
  country: string
  interpreterType?: string
  signLanguages: string[]
  spokenLanguages: string[]
  specializations: string[]
  certName: string
  certBody: string
  yearsExperience: number
  bio: string
  avatarColor: string
  availability: { day: number; start: string; end: string }[]
}

const INTERPRETER_SEEDS: InterpreterSeed[] = [
  {
    email: 'oprah.seed@signpost.test',
    firstName: 'Oprah',
    lastName: 'Winfrey (BETA)',
    city: 'Chicago',
    state: 'Illinois',
    country: 'United States',
    signLanguages: ['ASL'],
    spokenLanguages: ['English'],
    specializations: ['Mental Health', 'Education'],
    certName: 'NIC',
    certBody: 'RID',
    yearsExperience: 15,
    bio: 'NIC-certified interpreter with deep experience in mental health and educational settings. Based in Chicago, passionate about accessible communication for all.',
    avatarColor: 'linear-gradient(135deg,#ff6b85,#9d87ff)',
    availability: [
      { day: 1, start: '08:00', end: '17:00' },
      { day: 2, start: '08:00', end: '17:00' },
      { day: 3, start: '08:00', end: '17:00' },
      { day: 4, start: '08:00', end: '17:00' },
      { day: 5, start: '08:00', end: '14:00' },
    ],
  },
  {
    email: 'denzel.seed@signpost.test',
    firstName: 'Denzel',
    lastName: 'Washington (BETA)',
    city: 'New York',
    state: 'New York',
    country: 'United States',
    interpreterType: 'deaf',
    signLanguages: ['ASL'],
    spokenLanguages: ['English'],
    specializations: ['Legal', 'Medical'],
    certName: 'CDI',
    certBody: 'RID',
    yearsExperience: 20,
    bio: 'Certified Deaf Interpreter (CDI) specializing in legal and medical settings. Over 20 years of experience ensuring accurate communication in high-stakes environments.',
    avatarColor: 'linear-gradient(135deg,#00e5ff,#7b61ff)',
    availability: [
      { day: 1, start: '09:00', end: '18:00' },
      { day: 2, start: '09:00', end: '18:00' },
      { day: 3, start: '09:00', end: '18:00' },
      { day: 4, start: '09:00', end: '18:00' },
      { day: 5, start: '09:00', end: '16:00' },
    ],
  },
  {
    email: 'sandra.seed@signpost.test',
    firstName: 'Sandra',
    lastName: 'Oh (BETA)',
    city: 'Toronto',
    state: 'Ontario',
    country: 'Canada',
    signLanguages: ['ASL', 'LSQ'],
    spokenLanguages: ['English', 'French'],
    specializations: ['Education', 'Conference'],
    certName: 'AVLIC COI',
    certBody: 'AVLIC',
    yearsExperience: 12,
    bio: 'Trilingual interpreter fluent in ASL, LSQ, English, and French. Based in Toronto, experienced in education and conference interpreting across Canada.',
    avatarColor: 'linear-gradient(135deg,#7b61ff,#00e5ff)',
    availability: [
      { day: 1, start: '08:00', end: '16:00' },
      { day: 2, start: '08:00', end: '16:00' },
      { day: 3, start: '08:00', end: '16:00' },
      { day: 4, start: '08:00', end: '16:00' },
      { day: 5, start: '08:00', end: '12:00' },
    ],
  },
  {
    email: 'dolly.seed@signpost.test',
    firstName: 'Dolly',
    lastName: 'Parton (BETA)',
    city: 'Nashville',
    state: 'Tennessee',
    country: 'United States',
    signLanguages: ['ASL'],
    spokenLanguages: ['English'],
    specializations: ['Religious', 'Community', 'Arts & Performance'],
    certName: 'BEI Advanced',
    certBody: 'BEI',
    yearsExperience: 18,
    bio: 'BEI Advanced certified interpreter based in Nashville. Specializes in religious services, community events, and arts/performance settings.',
    avatarColor: 'linear-gradient(135deg,#ff4d6d,#ff6b85)',
    availability: [
      { day: 0, start: '07:00', end: '13:00' },
      { day: 1, start: '09:00', end: '17:00' },
      { day: 2, start: '09:00', end: '17:00' },
      { day: 3, start: '09:00', end: '17:00' },
      { day: 4, start: '09:00', end: '17:00' },
      { day: 5, start: '09:00', end: '17:00' },
    ],
  },
  {
    email: 'dwayne.seed@signpost.test',
    firstName: 'Dwayne',
    lastName: 'Johnson (BETA)',
    city: 'Atlanta',
    state: 'Georgia',
    country: 'United States',
    signLanguages: ['ASL'],
    spokenLanguages: ['English'],
    specializations: ['Corporate', 'Medical', 'Legal'],
    certName: 'NIC-Master',
    certBody: 'RID',
    yearsExperience: 22,
    bio: 'NIC-Master certified with 22 years of experience across corporate, medical, and legal interpreting. Based in Atlanta, available for travel assignments.',
    avatarColor: 'linear-gradient(135deg,#00e5ff,#ff4d6d)',
    availability: [
      { day: 1, start: '07:00', end: '18:00' },
      { day: 2, start: '07:00', end: '18:00' },
      { day: 3, start: '07:00', end: '18:00' },
      { day: 4, start: '07:00', end: '18:00' },
      { day: 5, start: '07:00', end: '15:00' },
    ],
  },
]

// ── Deaf user seed profiles ─────────────────────────────────────────────────

interface DeafSeed {
  email: string
  firstName: string
  lastName: string
  city: string
  state: string
  country: string
}

const DEAF_SEEDS: DeafSeed[] = [
  {
    email: 'deaf.jordan.seed@signpost.test',
    firstName: 'Jordan',
    lastName: 'Sample-Tester (BETA)',
    city: 'Portland',
    state: 'Oregon',
    country: 'United States',
  },
  {
    email: 'deaf.alex.seed@signpost.test',
    firstName: 'Alex',
    lastName: 'Demo-Account (BETA)',
    city: 'Washington',
    state: 'District of Columbia',
    country: 'United States',
  },
]

// ── Helpers ─────────────────────────────────────────────────────────────────

async function findOrCreateUser(
  admin: ReturnType<typeof getSupabaseAdmin>,
  email: string,
  role: string,
): Promise<{ userId: string; alreadyExisted: boolean }> {
  // Check if auth user exists
  const { data: existingUsers } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const existing = existingUsers?.users?.find(u => u.email === email)
  if (existing) {
    return { userId: existing.id, alreadyExisted: true }
  }

  const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
    email,
    password: 'signpost-beta-2026',
    email_confirm: true,
    user_metadata: { role },
  })

  if (authErr) {
    throw new Error(`Failed to create auth user ${email}: ${authErr.message}`)
  }

  return { userId: authUser.user.id, alreadyExisted: false }
}

// ── Main seed function ──────────────────────────────────────────────────────

export async function GET() {
  const summary: Record<string, unknown> = {}
  const errors: string[] = []

  try {
    const admin = getSupabaseAdmin()

    // ════════════════════════════════════════════════════════════════════════
    // STEP 1: Create interpreter profiles
    // ════════════════════════════════════════════════════════════════════════

    const interpreterIds: Record<string, string> = {} // firstName -> interpreter_profiles.id

    for (const seed of INTERPRETER_SEEDS) {
      try {
        const { userId, alreadyExisted } = await findOrCreateUser(admin, seed.email, 'interpreter')

        if (!alreadyExisted) {
          // Create user_profiles
          const { error: upErr } = await admin.from('user_profiles').upsert(
            { id: userId, role: 'interpreter' },
            { onConflict: 'id' }
          )
          if (upErr) console.error(`[seed-deaf-beta] user_profiles for ${seed.email}:`, upErr.message)
        }

        // Upsert interpreter_profiles
        const { data: interpProfile, error: ipErr } = await admin.from('interpreter_profiles').upsert(
          {
            user_id: userId,
            name: `${seed.firstName} ${seed.lastName}`,
            first_name: seed.firstName,
            last_name: seed.lastName,
            email: seed.email,
            city: seed.city,
            state: seed.state,
            country: seed.country,
            status: 'approved',
            interpreter_type: seed.interpreterType || 'hearing',
            work_mode: 'both',
            years_experience: seed.yearsExperience,
            bio: seed.bio,
            avatar_color: seed.avatarColor,
            sign_languages: seed.signLanguages,
            spoken_languages: seed.spokenLanguages,
            specializations: seed.specializations,
            notification_preferences: {
              email_enabled: true,
              sms_enabled: false,
              categories: {
                new_request: { email: true, sms: false },
                booking_confirmed: { email: true, sms: false },
              },
            },
          },
          { onConflict: 'user_id' }
        ).select('id')

        if (ipErr) {
          errors.push(`interpreter_profiles ${seed.email}: ${ipErr.message}`)
          console.error(`[seed-deaf-beta] interpreter_profiles for ${seed.email}:`, ipErr.message)
        }

        if (interpProfile?.[0]?.id) {
          interpreterIds[seed.firstName] = interpProfile[0].id
        }

        // Upsert certification
        if (interpProfile?.[0]?.id) {
          const { error: certErr } = await admin.from('interpreter_certifications').upsert(
            {
              interpreter_id: interpProfile[0].id,
              name: seed.certName,
              issuing_body: seed.certBody,
              year: 2020,
              verified: true,
            },
            { onConflict: 'interpreter_id,name' }
          )
          if (certErr) console.error(`[seed-deaf-beta] cert for ${seed.email}:`, certErr.message)

          // Upsert availability
          for (const avail of seed.availability) {
            const { error: availErr } = await admin.from('interpreter_availability').upsert(
              {
                interpreter_id: interpProfile[0].id,
                day_of_week: avail.day,
                start_time: avail.start,
                end_time: avail.end,
              },
              { onConflict: 'interpreter_id,day_of_week' }
            )
            if (availErr) console.error(`[seed-deaf-beta] availability for ${seed.email}:`, availErr.message)
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push(`interpreter ${seed.email}: ${msg}`)
        console.error(`[seed-deaf-beta] interpreter ${seed.email}:`, msg)
      }
    }

    summary.interpreters = {
      created: Object.keys(interpreterIds).length,
      ids: interpreterIds,
    }

    // ════════════════════════════════════════════════════════════════════════
    // STEP 2: Create bookings with geographic diversity
    // ════════════════════════════════════════════════════════════════════════

    // Check if seed bookings already exist
    const { data: existingBookings } = await admin
      .from('bookings')
      .select('title')
      .eq('is_seed', true)
      .eq('requester_id', MOLLY_USER_ID)

    const existingTitles = new Set((existingBookings || []).map(b => b.title))

    interface BookingSeed {
      title: string
      requesterName: string
      date: string
      timeStart: string
      timeEnd: string
      location: string
      format: 'in_person' | 'remote'
      status: 'open' | 'filled'
      description: string
      specialization: string
      eventType: string
      recipients: { firstName: string; status: string }[]
    }

    const bookingSeeds: BookingSeed[] = [
      {
        title: 'Doctor Appointment',
        requesterName: 'University of Chicago Medical Center',
        date: '2026-03-27',
        timeStart: '14:00',
        timeEnd: '15:00',
        location: 'Telehealth - Zoom link will be provided',
        format: 'remote',
        status: 'open',
        description: 'Telehealth follow-up with primary care physician. Discussion of recent lab results and medication adjustments. ASL interpretation needed throughout.',
        specialization: 'Medical',
        eventType: 'medical',
        recipients: [
          { firstName: 'Oprah', status: 'sent' },
          { firstName: 'Denzel', status: 'viewed' },
        ],
      },
      {
        title: 'Parent-Teacher Conference',
        requesterName: 'Nashville Public Schools',
        date: '2026-03-29',
        timeStart: '16:00',
        timeEnd: '17:00',
        location: 'Nashville Public Schools, Main Office',
        format: 'in_person',
        status: 'filled',
        description: 'Scheduled parent-teacher conference to discuss academic progress and IEP goals. Interpreter needed for ASL–English communication.',
        specialization: 'Education',
        eventType: 'education',
        recipients: [
          { firstName: 'Dolly', status: 'confirmed' },
        ],
      },
      {
        title: 'Legal Consultation',
        requesterName: 'Legal Aid Society of New York',
        date: '2026-04-01',
        timeStart: '10:00',
        timeEnd: '11:30',
        location: 'Remote - Zoom',
        format: 'remote',
        status: 'open',
        description: 'Initial legal consultation regarding housing rights. Interpreter should have legal terminology experience. Confidentiality required.',
        specialization: 'Legal',
        eventType: 'legal',
        recipients: [
          { firstName: 'Denzel', status: 'responded' },
          { firstName: 'Dwayne', status: 'sent' },
        ],
      },
      {
        title: 'Job Interview',
        requesterName: 'Turner Broadcasting - HR',
        date: '2026-04-03',
        timeStart: '13:00',
        timeEnd: '14:00',
        location: 'Turner Broadcasting, 1 CNN Center, Atlanta GA',
        format: 'in_person',
        status: 'open',
        description: 'In-person job interview for a senior marketing position. Professional corporate setting. Interpreter should be comfortable with business/HR terminology.',
        specialization: 'Corporate',
        eventType: 'employment',
        recipients: [
          { firstName: 'Dwayne', status: 'confirmed' },
          { firstName: 'Sandra', status: 'sent' },
        ],
      },
    ]

    const createdBookingIds: Record<string, string> = {}

    for (const bs of bookingSeeds) {
      if (existingTitles.has(bs.title)) continue

      const { data: booking, error: bookingErr } = await admin
        .from('bookings')
        .insert({
          requester_id: MOLLY_USER_ID,
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
          request_type: 'personal',
          interpreter_count: bs.recipients.length,
          is_seed: true,
          notes: bs.description,
        })
        .select('id')
        .single()

      if (bookingErr) {
        errors.push(`booking "${bs.title}": ${bookingErr.message}`)
        console.error(`[seed-deaf-beta] booking "${bs.title}":`, bookingErr.message)
        continue
      }

      createdBookingIds[bs.title] = booking.id

      // Create booking_dhh_clients entry
      const { error: dhhErr } = await admin.from('booking_dhh_clients').insert({
        booking_id: booking.id,
        dhh_user_id: MOLLY_USER_ID,
        comm_prefs_snapshot: { primary_language: 'ASL', preferred_format: 'video' },
        added_at: new Date().toISOString(),
      })
      if (dhhErr) console.error(`[seed-deaf-beta] booking_dhh_clients "${bs.title}":`, dhhErr.message)

      // Create booking_recipients
      for (const r of bs.recipients) {
        const interpId = interpreterIds[r.firstName]
        if (!interpId) {
          console.error(`[seed-deaf-beta] no interpreter_id for ${r.firstName}`)
          continue
        }

        const now = new Date().toISOString()
        const recipientData: Record<string, unknown> = {
          booking_id: booking.id,
          interpreter_id: interpId,
          status: r.status === 'viewed' ? 'sent' : r.status,
          sent_at: now,
        }

        if (r.status === 'viewed') {
          recipientData.viewed_at = now
        }
        if (r.status === 'confirmed') {
          recipientData.confirmed_at = now
        }
        if (r.status === 'responded') {
          recipientData.responded_at = now
        }

        const { error: recipErr } = await admin.from('booking_recipients').insert(recipientData)
        if (recipErr) console.error(`[seed-deaf-beta] booking_recipients for ${r.firstName}:`, recipErr.message)
      }
    }

    summary.bookings = {
      created: Object.keys(createdBookingIds).length,
      titles: Object.keys(createdBookingIds),
    }

    // ════════════════════════════════════════════════════════════════════════
    // STEP 3: Seed messages for bookings
    // ════════════════════════════════════════════════════════════════════════

    const messageSeeds: { bookingTitle: string; senderFirstName: string; body: string; subject: string }[] = [
      {
        bookingTitle: 'Doctor Appointment',
        senderFirstName: 'Oprah',
        subject: 'Medical Appointment - Availability',
        body: 'Hi! I saw your request for a medical appointment on March 27. I have extensive experience in healthcare settings and am familiar with medical terminology. Would you like me to confirm for this assignment?',
      },
      {
        bookingTitle: 'Legal Consultation',
        senderFirstName: 'Denzel',
        subject: 'Legal Consultation - CDI Available',
        body: "I'm a CDI (Certified Deaf Interpreter) and specialize in legal settings. I've worked with Legal Aid before and understand the terminology involved. I've responded with my rate profile for your review.",
      },
      {
        bookingTitle: 'Legal Consultation',
        senderFirstName: 'Dwayne',
        subject: 'Legal Consultation - Available',
        body: "I'm available for April 1st and have extensive experience with legal consultations. Happy to send my rate profile. Let me know if you have any questions about my background.",
      },
      {
        bookingTitle: 'Job Interview',
        senderFirstName: 'Dwayne',
        subject: 'Job Interview - Confirmed',
        body: "Looking forward to interpreting for your interview at Turner Broadcasting on April 3rd. I've worked in corporate HR settings many times. I'll arrive 15 minutes early to introduce myself and discuss any preferences you have.",
      },
    ]

    let messagesCreated = 0

    for (const ms of messageSeeds) {
      const bookingId = createdBookingIds[ms.bookingTitle]
      if (!bookingId) continue // booking wasn't created (already existed)

      const interpId = interpreterIds[ms.senderFirstName]

      const { error: msgErr } = await admin.from('messages').insert({
        booking_id: bookingId,
        interpreter_id: interpId || null,
        sender_id: null,
        sender_name: `${ms.senderFirstName} (Interpreter)`,
        subject: ms.subject,
        preview: ms.body.substring(0, 100) + '...',
        body: ms.body,
        is_read: false,
        is_seed: true,
      })

      if (msgErr) {
        errors.push(`message "${ms.subject}": ${msgErr.message}`)
        console.error(`[seed-deaf-beta] message:`, msgErr.message)
      } else {
        messagesCreated++
      }
    }

    summary.messages = { created: messagesCreated }

    // ════════════════════════════════════════════════════════════════════════
    // STEP 4: Create Deaf profiles + Trusted Circle connections
    // ════════════════════════════════════════════════════════════════════════

    const deafUserIds: Record<string, string> = {}

    for (const ds of DEAF_SEEDS) {
      try {
        const { userId, alreadyExisted } = await findOrCreateUser(admin, ds.email, 'deaf')
        deafUserIds[ds.firstName] = userId

        if (!alreadyExisted) {
          const { error: upErr } = await admin.from('user_profiles').upsert(
            { id: userId, role: 'deaf' },
            { onConflict: 'id' }
          )
          if (upErr) console.error(`[seed-deaf-beta] user_profiles for ${ds.email}:`, upErr.message)
        }

        // Upsert deaf_profiles
        const { error: dpErr } = await admin.from('deaf_profiles').upsert(
          {
            id: userId,
            user_id: userId,
            name: `${ds.firstName} ${ds.lastName}`,
            first_name: ds.firstName,
            last_name: ds.lastName,
            email: ds.email,
            city: ds.city,
            state: ds.state,
            country_name: ds.country,
          },
          { onConflict: 'id' }
        )
        if (dpErr) {
          errors.push(`deaf_profiles ${ds.email}: ${dpErr.message}`)
          console.error(`[seed-deaf-beta] deaf_profiles for ${ds.email}:`, dpErr.message)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push(`deaf user ${ds.email}: ${msg}`)
        console.error(`[seed-deaf-beta] deaf user ${ds.email}:`, msg)
      }
    }

    summary.deafUsers = {
      created: Object.keys(deafUserIds).length,
      ids: deafUserIds,
    }

    // Trusted Circle connections: Molly ↔ Jordan, Molly ↔ Alex
    let circleCreated = 0

    for (const [firstName, deafUserId] of Object.entries(deafUserIds)) {
      // Check if connection already exists
      const { data: existing } = await admin
        .from('trusted_deaf_circle')
        .select('id')
        .or(`and(inviter_id.eq.${MOLLY_USER_ID},invitee_id.eq.${deafUserId}),and(inviter_id.eq.${deafUserId},invitee_id.eq.${MOLLY_USER_ID})`)
        .maybeSingle()

      if (!existing) {
        const { error: circleErr } = await admin.from('trusted_deaf_circle').insert({
          inviter_id: MOLLY_USER_ID,
          invitee_id: deafUserId,
          invitee_email: DEAF_SEEDS.find(d => d.firstName === firstName)?.email,
          status: 'accepted',
        })
        if (circleErr) {
          errors.push(`trusted_deaf_circle ${firstName}: ${circleErr.message}`)
          console.error(`[seed-deaf-beta] circle ${firstName}:`, circleErr.message)
        } else {
          circleCreated++
        }
      }
    }

    summary.trustedCircle = { created: circleCreated }

    // Deaf roster entries for Jordan and Alex
    // Jordan's preferred interpreters: need to look up existing Betty White + Keanu Reeves IDs
    let rosterCreated = 0

    // Look up existing seed interpreters by name
    const { data: existingInterpreters } = await admin
      .from('interpreter_profiles')
      .select('id, first_name, name')
      .in('first_name', ['Betty', 'Keanu'])

    const existingInterpMap: Record<string, string> = {}
    for (const ip of existingInterpreters || []) {
      if (ip.first_name) existingInterpMap[ip.first_name] = ip.id
    }

    // Jordan's preferred: Betty White, Keanu Reeves
    const jordanId = deafUserIds['Jordan']
    if (jordanId) {
      const jordanPreferred = [existingInterpMap['Betty'], existingInterpMap['Keanu']].filter(Boolean)
      for (const interpId of jordanPreferred) {
        const { error: rosterErr } = await admin.from('deaf_roster').upsert(
          {
            deaf_user_id: jordanId,
            interpreter_id: interpId,
            tier: 'preferred',
            approve_work: true,
            approve_personal: true,
          },
          { onConflict: 'deaf_user_id,interpreter_id' }
        )
        if (rosterErr) console.error(`[seed-deaf-beta] roster Jordan:`, rosterErr.message)
        else rosterCreated++
      }
    }

    // Alex's preferred: Dwayne Johnson, Oprah Winfrey
    const alexId = deafUserIds['Alex']
    if (alexId) {
      const alexPreferred = [interpreterIds['Dwayne'], interpreterIds['Oprah']].filter(Boolean)
      for (const interpId of alexPreferred) {
        const { error: rosterErr } = await admin.from('deaf_roster').upsert(
          {
            deaf_user_id: alexId,
            interpreter_id: interpId,
            tier: 'preferred',
            approve_work: true,
            approve_personal: true,
          },
          { onConflict: 'deaf_user_id,interpreter_id' }
        )
        if (rosterErr) console.error(`[seed-deaf-beta] roster Alex:`, rosterErr.message)
        else rosterCreated++
      }
    }

    summary.deafRoster = { created: rosterCreated }

    // ════════════════════════════════════════════════════════════════════════
    // STEP 5: Clean up duplicates
    // ════════════════════════════════════════════════════════════════════════

    // Remove duplicate Regina invites in trusted_deaf_circle
    const { data: reginaInvites } = await admin
      .from('trusted_deaf_circle')
      .select('id, invitee_email, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    // Group by invitee_email, remove duplicates (keep oldest)
    const emailGroups: Record<string, { id: string; created_at: string }[]> = {}
    for (const inv of reginaInvites || []) {
      if (!inv.invitee_email) continue
      if (!emailGroups[inv.invitee_email]) emailGroups[inv.invitee_email] = []
      emailGroups[inv.invitee_email].push(inv)
    }

    let duplicatesRemoved = 0
    for (const [email, invites] of Object.entries(emailGroups)) {
      if (invites.length <= 1) continue
      // Keep the first (oldest), delete the rest
      const toDelete = invites.slice(1).map(i => i.id)
      const { error: delErr } = await admin
        .from('trusted_deaf_circle')
        .delete()
        .in('id', toDelete)
      if (delErr) {
        console.error(`[seed-deaf-beta] duplicate cleanup for ${email}:`, delErr.message)
      } else {
        duplicatesRemoved += toDelete.length
      }
    }

    summary.cleanup = { duplicatesRemoved }

    // ════════════════════════════════════════════════════════════════════════

    const success = errors.length === 0

    console.log(`[seed-deaf-beta] done. Success: ${success}. Errors: ${errors.length}`)

    return NextResponse.json({
      success,
      summary,
      ...(errors.length > 0 ? { errors } : {}),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[seed-deaf-beta] fatal error:', msg)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
