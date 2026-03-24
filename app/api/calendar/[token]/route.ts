import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/* ── ICS helpers ── */

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function formatICSDate(date: string, time: string, timezone?: string): string {
  // date = 'YYYY-MM-DD', time = 'HH:MM:SS' or 'HH:MM'
  const d = date.replace(/-/g, '')
  const t = time.replace(/:/g, '').slice(0, 6).padEnd(6, '0')
  if (timezone) {
    return `TZID=${timezone}:${d}T${t}`
  }
  return `${d}T${t}`
}

function formatICSTimestamp(isoString: string): string {
  const d = new Date(isoString)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`
}

function buildDescription(booking: Pick<BookingData, 'requester_name' | 'format' | 'description'>): string {
  const parts: string[] = []
  if (booking.requester_name) parts.push(`Requester: ${booking.requester_name}`)
  if (booking.format) parts.push(`Format: ${booking.format}`)
  if (booking.description) parts.push(`\nDetails:\n${booking.description}`)
  return parts.join('\n')
}

interface BookingData {
  id: string
  title: string | null
  date: string
  time_start: string
  time_end: string
  timezone: string | null
  location: string | null
  format: string | null
  requester_name: string | null
  description: string | null
  status: string
}

interface BookingRecipient {
  booking_id: string
  confirmed_at: string | null
  bookings: BookingData
}

function generateICS(
  interpreter: { first_name: string; last_name: string },
  bookings: BookingRecipient[],
): string {
  const events = bookings.map(br => {
    const b = br.bookings
    const dtStart = formatICSDate(b.date, b.time_start, b.timezone ?? undefined)
    const dtEnd = formatICSDate(b.date, b.time_end, b.timezone ?? undefined)

    return [
      'BEGIN:VEVENT',
      `UID:${b.id}@signpost.community`,
      `DTSTART;${dtStart}`,
      `DTEND;${dtEnd}`,
      `SUMMARY:${escapeICS(b.title || 'Interpreting Booking')}`,
      `DESCRIPTION:${escapeICS(buildDescription(b))}`,
      b.location ? `LOCATION:${escapeICS(b.location)}` : '',
      'STATUS:CONFIRMED',
      `DTSTAMP:${formatICSTimestamp(br.confirmed_at || new Date().toISOString())}`,
      'END:VEVENT',
    ].filter(Boolean).join('\r\n')
  })

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//signpost.community//Interpreter Calendar//EN',
    `X-WR-CALNAME:signpost — ${interpreter.first_name} ${interpreter.last_name}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
}

/* ── Route handler ── */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  // Strip .ics extension if present
  const cleanToken = token.replace(/\.ics$/i, '')

  // Validate UUID format
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanToken)) {
    return new Response('Not Found', { status: 404 })
  }

  const supabase = getSupabaseAdmin()

  // Look up interpreter by calendar_token
  const { data: interpreter, error: interpErr } = await supabase
    .from('interpreter_profiles')
    .select('id, first_name, last_name')
    .eq('calendar_token', cleanToken)
    .single()

  if (interpErr || !interpreter) {
    return new Response('Not Found', { status: 404 })
  }

  // Get confirmed bookings for this interpreter
  const { data: bookings, error: bookingsErr } = await supabase
    .from('booking_recipients')
    .select(`
      booking_id,
      confirmed_at,
      bookings!inner (
        id, title, date, time_start, time_end, timezone,
        location, format, requester_name, description, status
      )
    `)
    .eq('interpreter_id', interpreter.id)
    .eq('status', 'confirmed')

  if (bookingsErr) {
    console.error('[calendar] bookings fetch error:', bookingsErr.message)
    return new Response('Internal Server Error', { status: 500 })
  }

  // Filter out cancelled bookings
  // Supabase returns !inner embed as an object, but TS types it as array
  const activeBookings = ((bookings || []) as unknown as BookingRecipient[]).filter(
    br => br.bookings.status !== 'cancelled',
  )

  const icsContent = generateICS(interpreter, activeBookings)

  return new Response(icsContent, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="signpost-bookings.ics"',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
