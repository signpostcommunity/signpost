import { getSupabaseAdmin } from '@/lib/supabase/admin'

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

// BETA: seed realistic demo bookings + messages for new interpreters
export async function seedInterpreterData(interpreterProfileId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdmin()

    // ── Bookings: 3 pending (inquiries) + 3 confirmed ──────────────────────

    const bookingsPayload = [
      // Pending inquiries
      {
        interpreter_id: interpreterProfileId,
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
        interpreter_count: 1,
        status: 'pending' as const,
        is_seed: true,
      },
      {
        interpreter_id: interpreterProfileId,
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
        interpreter_count: 1,
        status: 'pending' as const,
        is_seed: true,
      },
      {
        interpreter_id: interpreterProfileId,
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
        interpreter_count: 1,
        status: 'pending' as const,
        is_seed: true,
      },
      // Confirmed bookings
      {
        interpreter_id: interpreterProfileId,
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
        interpreter_count: 1,
        status: 'confirmed' as const,
        is_seed: true,
      },
      {
        interpreter_id: interpreterProfileId,
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
        interpreter_count: 2,
        status: 'confirmed' as const,
        is_seed: true,
      },
      {
        interpreter_id: interpreterProfileId,
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
        interpreter_count: 1,
        status: 'confirmed' as const,
        is_seed: true,
      },
    ]

    const { data: insertedBookings, error: bookingsErr } = await supabase
      .from('bookings')
      .insert(bookingsPayload)
      .select('id, title')

    if (bookingsErr) {
      console.error('[seed] bookings insert failed:', bookingsErr.message)
    }

    // Build a lookup from title → booking ID for linking messages
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

    if (bookingsErr || messagesErr) {
      return { success: false, error: `${bookingsErr?.message || ''} ${messagesErr?.message || ''}`.trim() }
    }

    console.log(`[seed] seeded 6 bookings + 4 messages for interpreter ${interpreterProfileId}`)
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown seed error'
    console.error('[seed] unexpected error:', msg)
    return { success: false, error: msg }
  }
}
