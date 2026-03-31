export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

const BOARD_ID = '18405168710'
const GROUP_SUBMITTED = 'group_mm1rxrz5'
const GROUP_IN_PROGRESS = 'group_mm1r3amb'
const MONDAY_API = 'https://api.monday.com/v2'

// ── Monday column IDs ─────────────────────────────────────────────────────
// Per-page feedback (long_text) — reuse same board structure as DHH
const PAGE_COLUMN_MAP: Record<string, string> = {
  '/request': 'long_text_mm1r5h3n',
  '/request/signup': 'long_text_mm1r1dgk',
  '/request/dashboard': 'long_text_mm1r5853',
  '/request/dashboard/new-request': 'long_text_mm1rbsvf',
  '/request/dashboard/requests': 'long_text_mm1rv8zd',
  '/request/dashboard/interpreters': 'long_text_mm1rd8b5',
  '/request/dashboard/inbox': 'long_text_mm1rbsvf',
  '/request/dashboard/profile': 'long_text_mm1r5h3n',
  '/request/dashboard/client-lists': 'long_text_mm1r1dgk',
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

    // ── Look up tester name + email from requester_profiles ──
    const { data: profile, error: profileErr } = await admin
      .from('requester_profiles')
      .select('first_name, last_name, name, email')
      .or(`id.eq.${user.id},user_id.eq.${user.id}`)
      .maybeSingle()

    if (profileErr) console.error('requester_profiles lookup error:', profileErr)

    const testerName = profile
      ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.name || user.email || 'Anonymous'
      : user.email || 'Anonymous'
    const testerEmail = profile?.email || user.email || ''

    // ── Look up pages_visited from requester_beta_status ──
    const { data: status, error: statusErr } = await admin
      .from('requester_beta_status')
      .select('pages_visited, final_completed')
      .eq('user_id', user.id)
      .maybeSingle()

    if (statusErr) console.error('requester_beta_status lookup error:', statusErr)

    const pagesVisited: string[] = status?.pages_visited ?? []
    const isFinalSurvey = type === 'final_survey' && status?.final_completed === true

    // ── Read all requester_beta_responses for this user ──
    const { data: allResponses, error: respErr } = await admin
      .from('requester_beta_responses')
      .select('page_path, question_key, response_type, response_text, response_choice')
      .eq('user_id', user.id)

    if (respErr) {
      console.error('requester_beta_responses read error:', respErr)
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
    const pageTexts: Record<string, string[]> = {}
    for (const r of allResponses || []) {
      if (!r.response_text) continue
      const colId = PAGE_COLUMN_MAP[r.page_path]
      if (!colId) continue
      if (!pageTexts[colId]) pageTexts[colId] = []
      pageTexts[colId].push(r.response_text)
    }
    for (const [colId, texts] of Object.entries(pageTexts)) {
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
          itemName: `[Requester] ${testerName}`,
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
    console.error('Requester beta feedback Monday push error:', err)
    return NextResponse.json({ error: 'Failed to push to Monday' }, { status: 500 })
  }
}
