export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

const BOARD_ID = '18405168710'
const GROUP_SUBMITTED = 'group_mm1rxrz5'
const GROUP_IN_PROGRESS = 'group_mm1r3amb'
const MONDAY_API = 'https://api.monday.com/v2'

// ── Monday column IDs ─────────────────────────────────────────────────────

// Per-page feedback (long_text)
const PAGE_COLUMN_MAP: Record<string, string> = {
  '/dhh': 'long_text_mm1r5h3n',
  '/dhh/signup': 'long_text_mm1r1dgk',
  '/dhh/dashboard': 'long_text_mm1r5853',
  '/dhh/dashboard/interpreters': 'long_text_mm1rv8zd',
  '/directory': 'long_text_mm1rv8zd',
  '/dhh/dashboard/directory': 'long_text_mm1rv8zd',
  '/dhh/dashboard/requests': 'long_text_mm1rbsvf',
  '/dhh/dashboard/bookings': 'long_text_mm1rbsvf',
  '/dhh/dashboard/request': 'long_text_mm1rbsvf',
  '/dhh/dashboard/preferences': 'long_text_mm1rd8b5',
}

// Final survey: question_key → { status column ID, text column ID }
const SURVEY_COLUMN_MAP: Record<string, { status?: string; text?: string }> = {
  trust_level:            { status: 'color_mm1rsa23' },
  trust_followup:         { text: 'long_text_mm1rsfqq' },
  preferred_list_value:   { status: 'color_mm1rt5hy' },
  preferred_list_followup:{ text: 'long_text_mm1ryfy' },
  dnb_value:              { status: 'color_mm1rc7fx' },
  dnb_followup:           { text: 'long_text_mm1rjcd3' },
  transparency_value:     { status: 'color_mm1rke07' },
  transparency_followup:  { text: 'long_text_mm1r5d5q' },
  transparency_anxiety:   { text: 'long_text_mm1r5d5q' },
  directory_value:        { status: 'color_mm1rdj1' },
  directory_followup:     { text: 'long_text_mm1rqt0m' },
  directory_personality:  { text: 'long_text_mm1rqt0m' },
  personal_request_value: { status: 'color_mm1rjhtc' },
  got_right:              { text: 'long_text_mm1rwe7b' },
  got_wrong:              { text: 'long_text_mm1rxxex' },
  recommend_value:        { status: 'color_mm1rcyzf' },
  final_thoughts:         { text: 'long_text_mm1r4xaa' },
}

// Map full choice text from the survey to Monday status labels
const CHOICE_TO_LABEL: Record<string, string> = {
  // Q1 Trust
  "Very comfortable. I'd use it today.": 'Very comfortable',
  'Mostly comfortable. A few things need to change first.': 'Mostly comfortable',
  'Somewhat comfortable. I have real concerns.': 'Somewhat comfortable',
  'Not comfortable yet.': 'Not comfortable yet',
  // Q2 Preferred List
  'Extremely useful. This changes things for me.': 'Extremely useful',
  "Useful. I'd use it.": 'Useful',
  'Somewhat useful.': 'Somewhat useful',
  'Not useful for how I work.': 'Not useful',
  // Q3 Do Not Book
  "Very important. This is something I've needed for a long time.": 'Very important',
  'Somewhat important.': 'Somewhat important',
  'Nice to have.': 'Nice to have',
  "Not something I'd use.": "Not something I'd use",
  // Q4 Visibility
  "Like exactly what I've always needed.": 'Exactly what I needed',
  'Good, but I want more control over it.': 'Good, want more control',
  'Neutral.': 'Neutral',
  "I'm not sure I want that much visibility.": 'Too much visibility',
  // Q5 Directory
  'Yes. I felt genuinely informed.': 'Genuinely informed',
  'Mostly. A few things were missing.': 'Mostly, few missing',
  'Not really. I needed more information.': 'Needed more info',
  "No. I couldn't tell enough from what was there.": "Couldn't tell enough",
  // Q6 Personal Requests
  'Very likely. This fills a real gap.': 'Very likely',
  'Somewhat likely.': 'Somewhat likely',
  'Unlikely. I handle these differently.': 'Unlikely',
  "I wouldn't use this.": "Wouldn't use this",
  // Q8 Would Recommend
  'Yes, without hesitation.': 'Yes, without hesitation',
  'Yes, once a few things are fixed.': 'Yes, once fixed',
  "Maybe. I'd want to see more first.": 'Maybe',
  'No.': 'No',
}

// ── Helpers ───────────────────────────────────────────────────────────────

async function mondayQuery(token: string, query: string, variables?: Record<string, unknown>) {
  const res = await fetch(MONDAY_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: token },
    body: JSON.stringify({ query, variables }),
  })
  return res.json()
}

// ── Route handler ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const token = process.env.MONDAY_API_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'MONDAY_API_TOKEN not configured' }, { status: 500 })
  }

  try {
    // Verify authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type } = body as { type: 'page_feedback' | 'final_survey' }

    const admin = getSupabaseAdmin()

    // ── Look up tester name + email from deaf_profiles ──
    const { data: profile, error: profileErr } = await admin
      .from('deaf_profiles')
      .select('first_name, last_name, email')
      .or(`id.eq.${user.id},user_id.eq.${user.id}`)
      .maybeSingle()

    if (profileErr) console.error('deaf_profiles lookup error:', profileErr)

    const testerName = profile
      ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || user.email || 'Anonymous'
      : user.email || 'Anonymous'
    const testerEmail = profile?.email || user.email || ''

    // ── Look up pages_visited from dhh_beta_status ──
    const { data: status, error: statusErr } = await admin
      .from('dhh_beta_status')
      .select('pages_visited, final_completed')
      .eq('user_id', user.id)
      .maybeSingle()

    if (statusErr) console.error('dhh_beta_status lookup error:', statusErr)

    const pagesVisited: string[] = status?.pages_visited ?? []
    const isFinalSurvey = type === 'final_survey' && status?.final_completed === true

    // ── Read all dhh_beta_responses for this user ──
    const { data: allResponses, error: respErr } = await admin
      .from('dhh_beta_responses')
      .select('page_path, question_key, response_type, response_text, response_choice')
      .eq('user_id', user.id)

    if (respErr) {
      console.error('dhh_beta_responses read error:', respErr)
      return NextResponse.json({ error: 'Failed to read responses' }, { status: 500 })
    }

    // ── Build Monday column values ──
    const columnValues: Record<string, unknown> = {}

    // Email
    if (testerEmail) {
      columnValues['email_mm1ra6kz'] = { email: testerEmail, text: testerEmail }
    }

    // Pages visited
    if (pagesVisited.length > 0) {
      columnValues['text_mm1r5rm7'] = pagesVisited.join(', ')
    }

    // Date submitted
    const today = new Date().toISOString().split('T')[0]
    columnValues['date_mm1r7g1m'] = { date: today }

    // ── Per-page feedback → long_text columns ──
    // Group responses by page, concatenate question texts
    const pageTexts: Record<string, string[]> = {}
    for (const r of allResponses || []) {
      if (r.page_path === '/dhh/dashboard/beta-final') continue // final survey handled separately
      if (!r.response_text) continue

      const colId = PAGE_COLUMN_MAP[r.page_path]
      if (!colId) continue

      if (!pageTexts[colId]) pageTexts[colId] = []
      pageTexts[colId].push(r.response_text)
    }
    for (const [colId, texts] of Object.entries(pageTexts)) {
      columnValues[colId] = { text: texts.join('\n\n') }
    }

    // ── Final survey → status + long_text columns ──
    // For text columns that may receive multiple entries (followup + extra free text),
    // collect and concatenate
    const textAccumulator: Record<string, string[]> = {}

    for (const r of allResponses || []) {
      if (r.page_path !== '/dhh/dashboard/beta-final') continue

      const mapping = SURVEY_COLUMN_MAP[r.question_key]
      if (!mapping) continue

      // Status column (multiple choice)
      if (mapping.status && r.response_choice) {
        const label = CHOICE_TO_LABEL[r.response_choice]
        if (label) {
          columnValues[mapping.status] = { label }
        }
      }

      // Text column (free text)
      if (mapping.text && r.response_text) {
        if (!textAccumulator[mapping.text]) textAccumulator[mapping.text] = []
        textAccumulator[mapping.text].push(r.response_text)
      }
    }

    for (const [colId, texts] of Object.entries(textAccumulator)) {
      columnValues[colId] = { text: texts.join('\n\n') }
    }

    // ── Determine group ──
    const groupId = isFinalSurvey ? GROUP_SUBMITTED : GROUP_IN_PROGRESS

    // ── Search for existing Monday item by email ──
    let existingItemId: string | null = null
    if (testerEmail) {
      const searchResult = await mondayQuery(token,
        `query ($boardId: ID!, $columnId: String!, $value: String!) {
          items_page_by_column_values(board_id: $boardId, columns: [{column_id: $columnId, column_values: [$value]}], limit: 1) {
            items { id name }
          }
        }`,
        { boardId: BOARD_ID, columnId: 'email_mm1ra6kz', value: testerEmail }
      )
      const items = searchResult?.data?.items_page_by_column_values?.items
      if (items && items.length > 0) {
        existingItemId = items[0].id
      }
    }

    // ── Create or update Monday item ──
    if (existingItemId) {
      const updateResult = await mondayQuery(token,
        `mutation ($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
          change_multiple_column_values(board_id: $boardId, item_id: $itemId, column_values: $columnValues) { id }
        }`,
        {
          boardId: BOARD_ID,
          itemId: existingItemId,
          columnValues: JSON.stringify(columnValues),
        }
      )
      if (updateResult.errors) {
        console.error('Monday update error:', JSON.stringify(updateResult.errors))
        return NextResponse.json({ error: 'Monday update failed' }, { status: 500 })
      }

      // If final survey, move item to Submitted group
      if (isFinalSurvey) {
        await mondayQuery(token,
          `mutation ($itemId: ID!, $groupId: String!) {
            move_item_to_group(item_id: $itemId, group_id: $groupId) { id }
          }`,
          { itemId: existingItemId, groupId: GROUP_SUBMITTED }
        )
      }
    } else {
      const createResult = await mondayQuery(token,
        `mutation ($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON!) {
          create_item(board_id: $boardId, group_id: $groupId, item_name: $itemName, column_values: $columnValues) { id }
        }`,
        {
          boardId: BOARD_ID,
          groupId: groupId,
          itemName: testerName,
          columnValues: JSON.stringify(columnValues),
        }
      )
      if (createResult.errors) {
        console.error('Monday create error:', JSON.stringify(createResult.errors))
        return NextResponse.json({ error: 'Monday create failed' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DHH beta feedback Monday push error:', err)
    return NextResponse.json({ error: 'Failed to push to Monday' }, { status: 500 })
  }
}
