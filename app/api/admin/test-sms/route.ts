import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendSms } from '@/lib/sms'
import { isValidE164 } from '@/lib/phone'

export const dynamic = 'force-dynamic'

/**
 * POST: Send a test SMS to verify Telnyx is working.
 * Admin-only. Accepts { to: string } in body.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = getSupabaseAdmin()
    const { data: profile, error: profileErr } = await adminClient
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileErr || !profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { to } = body

    if (!to || !isValidE164(to)) {
      return NextResponse.json({ error: 'Invalid phone number. Must be E.164 format (+1XXXXXXXXXX).' }, { status: 400 })
    }

    const result = await sendSms({
      to,
      message: '[signpost] SMS test -- delivery confirmed.',
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('[admin/test-sms] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
