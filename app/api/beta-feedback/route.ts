export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BOARD_ID = 18402840319
const MONDAY_API = 'https://api.monday.com/v2'

async function mondayQuery(token: string, query: string, variables?: Record<string, unknown>) {
  const res = await fetch(MONDAY_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': token },
    body: JSON.stringify({ query, variables }),
  })
  return res.json()
}

type PageFeedback = {
  page: string
  openNotes: string
  specificAnswer: string
}

export async function POST(request: NextRequest) {
  const token = process.env.MONDAY_API_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'MONDAY_API_TOKEN not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const {
      pageFeedback,
      signupEase,
      dashboardFeel,
      ratesControl,
      wouldUse,
      whatNeedsChange,
      oneThingForMolly,
    } = body as {
      pageFeedback: PageFeedback[]
      signupEase: string
      dashboardFeel: string
      ratesControl: string
      wouldUse: string
      whatNeedsChange: string
      oneThingForMolly: string
    }

    // Get tester name from auth session
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    let testerName = user?.email ?? 'Anonymous'
    if (user) {
      const { data: profile } = await supabase
        .from('interpreter_profiles')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .maybeSingle()
      if (profile?.first_name) {
        testerName = [profile.first_name, profile.last_name].filter(Boolean).join(' ')
      }
    }

    // Concatenate all per-page open notes with page labels
    const allNotes = (pageFeedback || [])
      .filter(f => f.openNotes)
      .map(f => `[${f.page}] ${f.openNotes}`)
      .join('\n')

    // Concatenate all per-page specific answers with page labels
    const allSpecific = (pageFeedback || [])
      .filter(f => f.specificAnswer)
      .map(f => `[${f.page}] ${f.specificAnswer}`)
      .join('\n')

    // Build column values for Monday board
    const columnValues: Record<string, unknown> = {
      short_textnbhnggeq: testerName,
      long_text24vbemv7: { text: allNotes },
      long_text8gfogdy7: { text: allSpecific },
      long_textwi8vrijw: { text: whatNeedsChange || '' },
      long_text4snmrdqj: { text: oneThingForMolly || '' },
    }

    // Status columns use { label: "Option text" } format
    if (signupEase) columnValues.single_selecti6ipr4d = { label: signupEase }
    if (dashboardFeel) columnValues.single_selectdigbayv = { label: dashboardFeel }
    if (ratesControl) columnValues.single_selectd999es5 = { label: ratesControl }
    if (wouldUse) columnValues.single_selectjdrm38a = { label: wouldUse }

    const createResult = await mondayQuery(token,
      `mutation ($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON!) {
        create_item(board_id: $boardId, group_id: $groupId, item_name: $itemName, column_values: $columnValues) { id }
      }`,
      {
        boardId: BOARD_ID,
        groupId: 'topics',
        itemName: testerName,
        columnValues: JSON.stringify(columnValues),
      }
    )

    if (createResult.errors) {
      console.error('Monday create error:', JSON.stringify(createResult.errors))
      return NextResponse.json({ error: createResult.errors[0]?.message ?? 'Monday API error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Beta feedback error:', err)
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
  }
}
