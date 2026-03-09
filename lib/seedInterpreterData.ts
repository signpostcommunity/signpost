import { getSupabaseAdmin } from '@/lib/supabase/admin'

// BETA: seed demo bookings + messages for new interpreters
export async function seedInterpreterData(interpreterProfileId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdmin()

    // Seed pending bookings
    const { error: bookingsErr } = await supabase
      .from('bookings')
      .insert([
        {
          interpreter_id: interpreterProfileId,
          requester_id: null,
          title: 'Cardiology Appointment',
          requester_name: 'Alex Rivera',
          specialization: 'Medical',
          date: '2026-03-18',
          time_start: '14:00',
          time_end: '16:00',
          location: 'Seattle Medical Center, Floor 3',
          format: 'in_person',
          recurrence: 'one-time',
          notes: 'Need ASL interpreter experienced with cardiology terminology.',
          status: 'pending',
          is_seed: true,
        },
        {
          interpreter_id: interpreterProfileId,
          requester_id: null,
          title: 'Weekly Therapy Sessions',
          requester_name: 'Maria Chen',
          specialization: 'Mental Health',
          date: '2026-03-20',
          time_start: '15:00',
          time_end: '16:00',
          location: 'Remote',
          format: 'remote',
          recurrence: 'recurring',
          notes: 'Ongoing weekly CBT sessions.',
          status: 'pending',
          is_seed: true,
        },
        {
          interpreter_id: interpreterProfileId,
          requester_id: null,
          title: 'Legal Consultation — Family Law',
          requester_name: 'Jordan Lee',
          specialization: 'Legal',
          date: '2026-03-22',
          time_start: '10:30',
          time_end: '12:00',
          location: 'Remote (Zoom)',
          format: 'remote',
          recurrence: 'one-time',
          status: 'confirmed',
          is_seed: true,
        },
      ])

    if (bookingsErr) {
      console.error('[seed] bookings insert failed:', bookingsErr.message)
    }

    // Seed messages
    const { error: messagesErr } = await supabase
      .from('messages')
      .insert([
        {
          interpreter_id: interpreterProfileId,
          sender_id: null,
          booking_id: null,
          sender_name: 'Alex Rivera',
          subject: 'Re: Cardiology Appointment',
          preview: 'Do you have experience with echo and stress test terminology?',
          body: 'Do you have experience with echo and stress test terminology?',
          is_read: false,
          is_seed: true,
        },
        {
          interpreter_id: interpreterProfileId,
          sender_id: null,
          booking_id: null,
          sender_name: 'signpost team',
          subject: 'Welcome to signpost',
          preview: "Your profile is live. Here's how to get the most from your dashboard.",
          body: "Your profile is live. Here's how to get the most from your dashboard.",
          is_read: false,
          is_seed: true,
        },
      ])

    if (messagesErr) {
      console.error('[seed] messages insert failed:', messagesErr.message)
    }

    if (bookingsErr || messagesErr) {
      return { success: false, error: `${bookingsErr?.message || ''} ${messagesErr?.message || ''}`.trim() }
    }

    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown seed error'
    console.error('[seed] unexpected error:', msg)
    return { success: false, error: msg }
  }
}
