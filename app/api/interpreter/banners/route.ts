import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_BANNERS = ['book_me', 'intro_video'] as const
const VALID_ACTIONS = ['dismiss', 'snooze'] as const

type BannerName = (typeof VALID_BANNERS)[number]
type ActionName = (typeof VALID_ACTIONS)[number]

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { banner?: string; action?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { banner, action } = body

  if (banner === 'profile_incomplete') {
    return NextResponse.json(
      { error: 'The profile incomplete banner cannot be dismissed. It disappears when your profile is complete.' },
      { status: 400 },
    )
  }

  if (!banner || !VALID_BANNERS.includes(banner as BannerName)) {
    return NextResponse.json(
      { error: `Invalid banner. Must be one of: ${VALID_BANNERS.join(', ')}` },
      { status: 400 },
    )
  }

  if (!action || !VALID_ACTIONS.includes(action as ActionName)) {
    return NextResponse.json(
      { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` },
      { status: 400 },
    )
  }

  const columnMap: Record<string, Record<string, { column: string; value: string }>> = {
    book_me: {
      dismiss: { column: 'book_me_banner_dismissed_at', value: new Date().toISOString() },
      snooze: { column: 'book_me_banner_snoozed_until', value: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
    },
    intro_video: {
      dismiss: { column: 'intro_video_banner_dismissed_at', value: new Date().toISOString() },
      snooze: { column: 'intro_video_banner_snoozed_until', value: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
    },
  }

  const { column, value } = columnMap[banner][action]

  const { error: updateError } = await supabase
    .from('interpreter_profiles')
    .update({ [column]: value })
    .eq('user_id', user.id)

  if (updateError) {
    return NextResponse.json(
      { error: `Failed to update banner state: ${updateError.message}` },
      { status: 500 },
    )
  }

  return NextResponse.json({ [column]: value })
}
