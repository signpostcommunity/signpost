import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify DHH role
    const admin = getSupabaseAdmin()
    const { data: profile, error: profileError } = await admin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[dhh/request] profile lookup failed:', profileError.message)
      return NextResponse.json({ error: 'Profile not found' }, { status: 403 })
    }

    if (profile.role !== 'deaf') {
      return NextResponse.json({ error: 'Only Deaf/DB/HH users can create personal requests' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title, date, timeStart, timeEnd, timezone,
      format, location, eventType, eventCategory,
      interpreterCount, description, interpreterIds,
    } = body

    if (!title || !date || !timeStart || !timeEnd || !format || !interpreterIds?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch the Deaf user's comm prefs and name
    const { data: deafProfile, error: deafError } = await admin
      .from('deaf_profiles')
      .select('comm_prefs, first_name, last_name, name')
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle()

    if (deafError) {
      console.error('[dhh/request] deaf_profiles lookup failed:', deafError.message)
    }

    const commPrefs = deafProfile?.comm_prefs ?? null
    const dhhClientName = deafProfile?.first_name
      ? `${deafProfile.first_name} ${deafProfile.last_name || ''}`.trim()
      : deafProfile?.name || 'A Deaf user'

    // Map format value for DB constraint (in_person, remote, hybrid)
    const dbFormat = format === 'in-person' ? 'in_person' : format

    const bookingIds: string[] = []

    // Create one booking per interpreter
    for (const interpreterId of interpreterIds) {
      const { data: booking, error: insertError } = await admin
        .from('bookings')
        .insert({
          dhh_client_id: user.id,
          requester_id: user.id,
          interpreter_id: interpreterId,
          status: 'pending',
          request_type: 'personal',
          title,
          date,
          time_start: timeStart,
          time_end: timeEnd,
          timezone: timezone || 'America/Los_Angeles',
          format: dbFormat,
          location: location || null,
          event_type: eventType || null,
          event_category: eventCategory || null,
          interpreter_count: interpreterCount || 1,
          description: description || null,
          notes: description || null,
          comm_prefs_snapshot: commPrefs,
          requester_name: dhhClientName,
          is_seed: false,
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('[dhh/request] booking insert failed:', insertError.message)
        return NextResponse.json({ error: `Failed to create booking: ${insertError.message}` }, { status: 500 })
      }

      bookingIds.push(booking.id)

      // Look up interpreter's user_id for notification
      const { data: interpProfile, error: interpError } = await admin
        .from('interpreter_profiles')
        .select('user_id')
        .eq('id', interpreterId)
        .maybeSingle()

      if (interpError) {
        console.error('[dhh/request] interpreter_profiles lookup failed:', interpError.message)
      }

      if (interpProfile?.user_id) {
        // Fire notification via the notifications API
        try {
          const notifBody = {
            recipientUserId: interpProfile.user_id,
            type: 'new_request',
            subject: `New request: ${date}, ${timeStart}, ${dhhClientName}`,
            body: `${dhhClientName} has sent you a personal interpreter request:\n• ${title}\n• ${date}, ${timeStart} - ${timeEnd} (${timezone || 'PT'})\n• ${location || 'Remote'}`,
            metadata: {
              bookingId: booking.id,
              requestType: 'personal',
              dhhClientName,
            },
            ctaText: 'View Request',
            ctaUrl: `https://signpost.community/interpreter/dashboard/inquiries`,
            channel: 'both',
          }

          // Use internal fetch to the notifications API
          const baseUrl = request.nextUrl.origin
          await fetch(`${baseUrl}/api/notifications/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              cookie: request.headers.get('cookie') || '',
            },
            body: JSON.stringify(notifBody),
          })
        } catch (notifErr) {
          console.error('[dhh/request] notification send failed:', notifErr instanceof Error ? notifErr.message : notifErr)
          // Don't fail the booking creation if notification fails
        }
      }
    }

    return NextResponse.json({ success: true, bookingIds })
  } catch (err) {
    console.error('[dhh/request] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getSupabaseAdmin()

    const { data: bookings, error: fetchError } = await admin
      .from('bookings')
      .select(`
        id, title, date, time_start, time_end, timezone, location, format,
        status, request_type, event_type, event_category, interpreter_count,
        description, notes, comm_prefs_snapshot, is_seed,
        cancellation_reason, cancelled_by, cancelled_at, sub_search_initiated,
        created_at, requester_name,
        interpreter_id
      `)
      .eq('dhh_client_id', user.id)
      .order('date', { ascending: false })

    if (fetchError) {
      console.error('[dhh/request] GET bookings failed:', fetchError.message)
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
    }

    // Enrich with interpreter info
    const interpreterIds = [...new Set((bookings || []).map(b => b.interpreter_id).filter(Boolean))]
    let interpreterMap: Record<string, { name: string; first_name: string | null; last_name: string | null; photo_url: string | null }> = {}

    if (interpreterIds.length > 0) {
      const { data: interpreters, error: interpError } = await admin
        .from('interpreter_profiles')
        .select('id, name, first_name, last_name, photo_url')
        .in('id', interpreterIds)

      if (interpError) {
        console.error('[dhh/request] interpreter lookup failed:', interpError.message)
      }

      for (const interp of interpreters || []) {
        interpreterMap[interp.id] = {
          name: interp.first_name ? `${interp.first_name} ${interp.last_name || ''}`.trim() : interp.name || 'Interpreter',
          first_name: interp.first_name,
          last_name: interp.last_name,
          photo_url: interp.photo_url,
        }
      }
    }

    const enriched = (bookings || []).map(b => ({
      ...b,
      interpreter: interpreterMap[b.interpreter_id] || null,
    }))

    return NextResponse.json({ bookings: enriched })
  } catch (err) {
    console.error('[dhh/request] GET error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
