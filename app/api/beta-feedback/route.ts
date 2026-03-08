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

export async function POST(request: NextRequest) {
  const token = process.env.MONDAY_API_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'MONDAY_API_TOKEN not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { page, notes, specificAnswer } = body

    // Get tester name/email from auth session
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

    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'short', timeStyle: 'short' })
    const commentLines = [`<strong>[Page: ${page}]</strong> — ${timestamp}`]
    if (notes?.trim()) commentLines.push(`<strong>Open notes:</strong> ${notes.trim()}`)
    if (specificAnswer?.trim()) commentLines.push(`<strong>Specific question:</strong> ${specificAnswer.trim()}`)
    const commentBody = commentLines.join('<br>')

    // Search for existing item for this tester
    const searchResult = await mondayQuery(token,
      `query ($boardId: ID!, $columnId: String!, $value: String!) {
        items_page_by_column_values(board_id: $boardId, limit: 1, columns: [{column_id: $columnId, column_values: [$value]}]) {
          items { id name }
        }
      }`,
      { boardId: BOARD_ID, columnId: 'short_textnbhnggeq', value: testerName }
    )
    const existingItem = searchResult?.data?.items_page_by_column_values?.items?.[0]

    if (existingItem) {
      // Add comment to existing tester row
      const updateResult = await mondayQuery(token,
        `mutation ($itemId: ID!, $body: String!) {
          create_update(item_id: $itemId, body: $body) { id }
        }`,
        { itemId: existingItem.id, body: commentBody }
      )
      if (updateResult.errors) {
        console.error('Monday update error:', JSON.stringify(updateResult.errors))
        return NextResponse.json({ error: updateResult.errors[0]?.message ?? 'Monday API error' }, { status: 500 })
      }
    } else {
      // Create new item for this tester
      const columnValues = JSON.stringify({
        short_textnbhnggeq: testerName,
        long_text24vbemv7: { text: notes || '' },
        long_text8gfogdy7: { text: specificAnswer || '' },
      })

      const createResult = await mondayQuery(token,
        `mutation ($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON!) {
          create_item(board_id: $boardId, group_id: $groupId, item_name: $itemName, column_values: $columnValues) { id }
        }`,
        { boardId: BOARD_ID, groupId: 'topics', itemName: testerName, columnValues }
      )
      if (createResult.errors) {
        console.error('Monday create error:', JSON.stringify(createResult.errors))
        return NextResponse.json({ error: createResult.errors[0]?.message ?? 'Monday API error' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Beta feedback error:', err)
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
  }
}
