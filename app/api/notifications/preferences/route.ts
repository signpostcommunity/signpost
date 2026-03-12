import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const DEFAULT_PREFS = {
  email_enabled: true,
  sms_enabled: false,
  categories: {
    new_request: { email: true, sms: false },
    booking_confirmed: { email: true, sms: false },
    booking_cancelled: { email: true, sms: false },
    new_message: { email: true, sms: false },
    added_to_preferred_list: { email: true, sms: false },
    rate_response: { email: true, sms: false },
    invoice_paid: { email: true, sms: false },
    profile_changes_saved: { email: false, sms: false },
    profile_approved: { email: true, sms: false },
    profile_denied: { email: true, sms: false },
  },
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try interpreter_profiles first
    const { data: interpProfile } = await supabase
      .from('interpreter_profiles')
      .select('notification_preferences')
      .eq('user_id', user.id)
      .maybeSingle()

    if (interpProfile?.notification_preferences) {
      return NextResponse.json({
        preferences: interpProfile.notification_preferences,
        role: 'interpreter',
      })
    }

    // For deaf/requester users, return defaults (email ON for all types)
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    return NextResponse.json({
      preferences: DEFAULT_PREFS,
      role: userProfile?.role || 'unknown',
    })
  } catch (err) {
    console.error('[preferences] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
