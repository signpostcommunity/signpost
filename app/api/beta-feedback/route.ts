export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { page, notes, specificAnswer, isEndOfSession, endOfSessionData } = body

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const testerEmail = user?.email ?? null

    const { error } = await supabase.from('beta_feedback').insert({
      tester_email: testerEmail,
      page,
      notes,
      specific_answer: specificAnswer,
      is_end_of_session: isEndOfSession ?? false,
      end_of_session_data: endOfSessionData ?? null,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
  }
}
