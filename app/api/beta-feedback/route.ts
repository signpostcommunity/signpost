export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const now = new Date().toISOString().split('T')[0]
    const itemName = `Feedback — ${page} — ${now}`

    const columnValues = JSON.stringify({
      short_textnbhnggeq: testerName,
      long_text24vbemv7: { text: notes || '' },
      long_text8gfogdy7: { text: specificAnswer || '' },
    }).replace(/"/g, '\\"')

    const query = `mutation { create_item(board_id: 18402840319, group_id: "topics", item_name: "${itemName.replace(/"/g, '\\"')}", column_values: "${columnValues}") { id } }`

    const res = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      body: JSON.stringify({ query }),
    })

    const result = await res.json()
    if (result.errors) {
      console.error('Monday API error:', JSON.stringify(result.errors))
      return NextResponse.json({ error: result.errors[0]?.message ?? 'Monday API error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Beta feedback error:', err)
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
  }
}
