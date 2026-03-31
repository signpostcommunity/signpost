import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendAdminAlert } from '@/lib/adminAlerts'

export const dynamic = 'force-dynamic'

/**
 * POST: Fire an admin alert after a profile flag is created.
 * Called client-side after successful flag insert (fire-and-forget).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type } = body

    if (type === 'new_flag') {
      const { interpreterName, reason, details, reporterEmail } = body

      const name = interpreterName || 'Unknown interpreter'
      const detailText = details || 'No details provided'

      await sendAdminAlert({
        type: 'new_flag',
        emailSubject: '[signpost] New profile flag submitted',
        emailBody: [
          `A new profile flag has been submitted on signpost.`,
          ``,
          `Interpreter: ${name}`,
          `Reason: ${reason}`,
          `Details: ${detailText}`,
          `Reported by: ${reporterEmail || user.email || 'Unknown'}`,
          ``,
          `Review: https://signpost.community/admin/dashboard/flags`,
        ].join('\n'),
        smsMessage: `[signpost] New flag: ${name} — ${reason}. Review at signpost.community/admin/dashboard/flags`,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/alert-trigger] error:', err)
    return NextResponse.json({ ok: true }) // Don't fail the caller
  }
}
