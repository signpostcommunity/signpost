import { getSupabaseAdmin } from '@/lib/supabase/admin'

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

// Track original status for creating booking_recipients
interface SeedBooking {
  requester_id: null
  title: string
  requester_name: string
  specialization: string
  date: string
  time_start: string
  time_end: string
  location: string
  format: 'in_person' | 'remote'
  recurrence: string
  description: string
  notes: string
  interpreter_count: number
  status: 'open' | 'filled' | 'completed'
  is_seed: true
  _recipient_status: 'sent' | 'confirmed'
}

// BETA: seed realistic demo bookings + messages for new interpreters
export async function seedInterpreterData(interpreterProfileId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdmin()

    // ── Bookings: 3 open (inquiries) + 2 completed + 3 filled (confirmed) ──

    const bookingsPayload: SeedBooking[] = [
      // Open inquiries (recipient status: sent)
      {
        requester_id: null,
        title: 'Staff Meeting Interpretation',
        requester_name: 'Lakewood Community College — HR Dept',
        specialization: 'Academic / Education',
        date: daysFromNow(3),
        time_start: '09:00',
        time_end: '11:00',
        location: 'Lakewood Community College, Admin Building Room 204',
        format: 'in_person' as const,
        recurrence: 'recurring',
        description: 'Biweekly staff meeting. ~15 attendees. One Deaf staff member. Mostly spoken English with ASL interpretation needed throughout. Materials can be shared in advance.',
        notes: 'D/HH Client: Janet Liu. Communication prefs: ASL preferred, comfortable with spoken English for brief exchanges. No positioning preference.',
        interpreter_count: 1,
        status: 'open' as const,
        is_seed: true,
        _recipient_status: 'sent' as const,
      },
      {
        requester_id: null,
        title: 'Therapy Session — Ongoing Client',
        requester_name: 'Dr. Anika Patel, PsyD',
        specialization: 'Mental Health',
        date: daysFromNow(5),
        time_start: '14:00',
        time_end: '15:00',
        location: 'Telehealth — Zoom link will be provided',
        format: 'remote' as const,
        recurrence: 'recurring',
        description: 'Weekly therapy session for a Deaf client. Therapist uses talk therapy approach. Familiarity with mental health terminology preferred. NDA may be required.',
        notes: 'D/HH Client: Jordan Lee. Communication prefs: Uses a mix of ASL and SimCom. Prefers interpreter remain neutral in affect during sessions. Do not paraphrase — interpret as closely as possible.',
        interpreter_count: 1,
        status: 'open' as const,
        is_seed: true,
        _recipient_status: 'sent' as const,
      },
      {
        requester_id: null,
        title: 'Parent-Teacher Conference',
        requester_name: 'Greenfield Elementary School',
        specialization: 'Academic / Education',
        date: daysFromNow(7),
        time_start: '16:30',
        time_end: '17:30',
        location: 'Greenfield Elementary, Room 112',
        format: 'in_person' as const,
        recurrence: 'one-time',
        description: 'Conference between Deaf parent and child\'s teacher. Discussion will cover academic progress, behavior, and IEP goals. Relaxed setting.',
        notes: 'D/HH Client: Rosa Hernandez. Communication prefs: ASL preferred, some written English. May bring a family member who signs.',
        interpreter_count: 1,
        status: 'open' as const,
        is_seed: true,
        _recipient_status: 'sent' as const,
      },
      // Completed (past) bookings
      {
        requester_id: null,
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
        _recipient_status: 'confirmed' as const,
      },
      {
        requester_id: null,
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
        _recipient_status: 'confirmed' as const,
      },
      // Filled (confirmed) bookings
      {
        requester_id: null,
        title: 'Cardiology Follow-Up',
        requester_name: 'Swedish Medical Center — Scheduling',
        specialization: 'Medical',
        date: daysFromNow(2),
        time_start: '10:30',
        time_end: '11:30',
        location: 'Swedish Medical Center, Cherry Hill Campus, Cardiology Suite 3B',
        format: 'in_person' as const,
        recurrence: 'one-time',
        description: 'Post-surgical follow-up for a Deaf patient. Cardiologist will review test results and discuss next steps. Patient uses ASL as primary language.',
        notes: 'D/HH Client: David Osei. Communication prefs: Black ASL preferred. Client may use tactile signing for complex medical terminology. Prefers interpreter positioned directly across from them.',
        interpreter_count: 1,
        status: 'filled' as const,
        is_seed: true,
        _recipient_status: 'confirmed' as const,
      },
      {
        requester_id: null,
        title: 'Workplace Safety Training',
        requester_name: 'Pacific Northwest Construction — Safety Office',
        specialization: 'Technical / IT',
        date: daysFromNow(4),
        time_start: '07:00',
        time_end: '12:00',
        location: 'PNW Construction HQ, Training Room B',
        format: 'in_person' as const,
        recurrence: 'one-time',
        description: 'Annual OSHA safety training. Two Deaf employees attending. Heavy use of industry-specific terminology. Hard hat and steel toes required on site. Materials shared 48hrs in advance.',
        notes: 'D/HH Client: Marcus Webb. Communication prefs: ASL preferred, uses some gestures for technical terms. Prefers interpreter on his right side.',
        interpreter_count: 2,
        status: 'filled' as const,
        is_seed: true,
        _recipient_status: 'confirmed' as const,
      },
      {
        requester_id: null,
        title: 'Deaf Community Leadership Meeting',
        requester_name: 'Washington State Deaf Association',
        specialization: 'Conference / Events',
        date: daysFromNow(6),
        time_start: '18:00',
        time_end: '20:00',
        location: 'Zoom — link in confirmation email',
        format: 'remote' as const,
        recurrence: 'recurring',
        description: 'Monthly board meeting. Mix of Deaf and hearing board members. ASL is the primary language of the meeting. Voicing for hearing participants who don\'t sign.',
        notes: 'D/HH Client: Multiple board members. Communication prefs: ASL is primary language of the meeting. Some board members are DeafBlind — pro-tactile support may be needed.',
        interpreter_count: 1,
        status: 'filled' as const,
        is_seed: true,
        _recipient_status: 'confirmed' as const,
      },
    ]

    // Extract _recipient_status before inserting (not a DB column)
    const recipientStatusByTitle: Record<string, string> = {}
    const dbPayload = bookingsPayload.map(({ _recipient_status, ...rest }) => {
      recipientStatusByTitle[rest.title] = _recipient_status
      return rest
    })

    const { data: insertedBookings, error: bookingsErr } = await supabase
      .from('bookings')
      .insert(dbPayload)
      .select('id, title')

    if (bookingsErr) {
      console.error('[seed] bookings insert failed:', bookingsErr.message)
    }

    // Create booking_recipients for each booking
    if (insertedBookings) {
      const recipientsPayload = insertedBookings.map(b => ({
        booking_id: b.id,
        interpreter_id: interpreterProfileId,
        status: recipientStatusByTitle[b.title] || 'sent',
        sent_at: new Date().toISOString(),
        ...(recipientStatusByTitle[b.title] === 'confirmed' ? { confirmed_at: new Date().toISOString() } : {}),
      }))

      const { error: recipientsErr } = await supabase
        .from('booking_recipients')
        .insert(recipientsPayload)

      if (recipientsErr) {
        console.error('[seed] booking_recipients insert failed:', recipientsErr.message)
      }
    }

    // Build a lookup from title -> booking ID for linking messages
    const bookingIdByTitle: Record<string, string> = {}
    if (insertedBookings) {
      for (const b of insertedBookings) {
        bookingIdByTitle[b.title] = b.id
      }
    }

    // ── Messages: 4 inbox items ────────────────────────────────────────────

    const messagesPayload = [
      {
        interpreter_id: interpreterProfileId,
        sender_id: null,
        booking_id: bookingIdByTitle['Staff Meeting Interpretation'] || null,
        sender_name: 'Lakewood Community College — HR Dept',
        subject: 'Upcoming Staff Meeting — Materials Attached',
        preview: 'Hi, just wanted to share the agenda and slides for next week\'s meeting so you can prep...',
        body: 'Hi,\n\nJust wanted to share the agenda and presentation slides for next week\'s staff meeting so you have time to review. There are a few technical terms related to our new enrollment system that might come up.\n\nPlease let me know if you have any questions or need anything else before the assignment.\n\nThank you!',
        is_read: false,
        is_seed: true,
      },
      {
        interpreter_id: interpreterProfileId,
        sender_id: null,
        booking_id: bookingIdByTitle['Therapy Session — Ongoing Client'] || null,
        sender_name: 'Dr. Anika Patel, PsyD',
        subject: 'Re: Therapy Session Scheduling',
        preview: 'Thanks for confirming. Just a heads up — the client may want to discuss a difficult family situation...',
        body: 'Thanks for confirming availability.\n\nJust a heads up — the client may want to discuss a difficult family situation this session. I want to make sure you\'re comfortable with that content. If you\'d prefer to pass on this one, no hard feelings at all.\n\nAlso, I\'ll send the Zoom link 30 minutes before the session.\n\nBest,\nDr. Patel',
        is_read: false,
        is_seed: true,
      },
      {
        interpreter_id: interpreterProfileId,
        sender_id: null,
        booking_id: bookingIdByTitle['Cardiology Follow-Up'] || null,
        sender_name: 'Swedish Medical Center — Scheduling',
        subject: 'Parking & Check-In Instructions',
        preview: 'Please use the Cherry Hill parking garage, Level 2. Check in at the front desk with photo ID...',
        body: 'Hello,\n\nFor your upcoming assignment at Swedish Medical Center:\n\n- Park in the Cherry Hill parking garage, Level 2 (we\'ll validate)\n- Check in at the front desk with photo ID\n- Ask for Cardiology Suite 3B\n- Please arrive 15 minutes early so the patient can meet you before the appointment\n\nThank you for your service!',
        is_read: true,
        is_seed: true,
      },
      {
        interpreter_id: interpreterProfileId,
        sender_id: null,
        booking_id: null,
        sender_name: 'signpost team',
        subject: 'Welcome to signpost beta!',
        preview: 'Thanks for joining the beta. We\'d love your feedback on the interpreter experience...',
        body: 'Hi!\n\nWelcome to the signpost beta. We\'re so glad you\'re here.\n\nThis is a real platform built by interpreters, for interpreters — and we need your honest feedback to make it great. Explore your dashboard, fill out your profile, and let us know what feels right and what doesn\'t.\n\nYou can leave feedback anytime using the orange BETA FEEDBACK panel on the right side of every page.\n\nThank you for being part of this!\n\n— Molly & Regina',
        is_read: false,
        is_seed: true,
      },
    ]

    const { error: messagesErr } = await supabase
      .from('messages')
      .insert(messagesPayload)

    if (messagesErr) {
      console.error('[seed] messages insert failed:', messagesErr.message)
    }

    // ── Seed notification so inbox isn't empty ─────────────────────────

    // Look up user_id from interpreter_profiles
    const { data: interpProfile, error: ipErr } = await supabase
      .from('interpreter_profiles')
      .select('user_id')
      .eq('id', interpreterProfileId)
      .single()

    if (ipErr) {
      console.error('[seed] interpreter_profiles lookup failed:', ipErr.message)
    }

    if (interpProfile?.user_id) {
      const { error: notifErr } = await supabase
        .from('notifications')
        .insert({
          recipient_user_id: interpProfile.user_id,
          type: 'welcome',
          channel: 'in_app',
          subject: 'signpost — Welcome! Your profile has been created',
          body: 'Your interpreter profile has been set up with demo data. Explore your dashboard, fill out your profile, and customize your notification preferences in Settings.',
          metadata: {},
          status: 'sent',
          sent_at: new Date().toISOString(),
        })

      if (notifErr) {
        console.error('[seed] notification insert failed:', notifErr.message)
      }
    }

    if (bookingsErr || messagesErr) {
      return { success: false, error: `${bookingsErr?.message || ''} ${messagesErr?.message || ''}`.trim() }
    }

    console.log(`[seed] seeded 8 bookings + 8 booking_recipients + 4 messages + 1 notification for interpreter ${interpreterProfileId}`)
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown seed error'
    console.error('[seed] unexpected error:', msg)
    return { success: false, error: msg }
  }
}
