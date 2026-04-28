import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizePhone, isValidPhone } from '@/lib/phone'

export const dynamic = 'force-dynamic'

const VALID_CATEGORY_KEYS = new Set([
  'new_request',
  'rate_response',
  'booking_confirmed',
  'booking_reminder',
  'cancelled_by_requester',
  'cancelled_by_you',
  'sub_search_update',
  'new_message',
  'team_invite',
  'added_to_preferred_list',
  'profile_approved',
  'profile_denied',
  'profile_saved',
  'invoice_paid',
])

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('interpreter_profiles')
      .select('notification_preferences, notification_phone')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('[interpreter-notif-prefs] GET error:', error.message)
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
    }

    return NextResponse.json({
      preferences: data?.notification_preferences ?? null,
      notification_phone: data?.notification_phone ?? '',
    })
  } catch (err) {
    console.error('[interpreter-notif-prefs] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const payload: Record<string, unknown> = {}

    if (body.notification_preferences != null) {
      const prefs = body.notification_preferences
      if (typeof prefs.email_enabled !== 'boolean' || typeof prefs.sms_enabled !== 'boolean') {
        return NextResponse.json({ error: 'Invalid preferences structure' }, { status: 400 })
      }
      if (!prefs.categories || typeof prefs.categories !== 'object') {
        return NextResponse.json({ error: 'Invalid categories' }, { status: 400 })
      }
      for (const key of Object.keys(prefs.categories)) {
        if (!VALID_CATEGORY_KEYS.has(key)) {
          return NextResponse.json({ error: `Unknown category: ${key}` }, { status: 400 })
        }
        const cat = prefs.categories[key]
        if (typeof cat.email !== 'boolean' || typeof cat.sms !== 'boolean') {
          return NextResponse.json({ error: `Invalid values for category: ${key}` }, { status: 400 })
        }
      }
      payload.notification_preferences = prefs
    }

    if (body.notification_phone !== undefined) {
      if (body.notification_phone) {
        const normalized = normalizePhone(body.notification_phone)
        if (!normalized && !isValidPhone(body.notification_phone)) {
          return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
        }
        payload.notification_phone = normalized || body.notification_phone
      } else {
        payload.notification_phone = ''
      }
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { error } = await supabase
      .from('interpreter_profiles')
      .update(payload)
      .eq('user_id', user.id)

    if (error) {
      console.error('[interpreter-notif-prefs] PATCH error:', error.message)
      return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[interpreter-notif-prefs] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
