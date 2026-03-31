import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications-server'
import { sanitizeText } from '@/lib/sanitize'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verify authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const raw = await request.json()
    const recipientUserId = raw.recipientUserId
    const subject = raw.subject ? sanitizeText(raw.subject) : ''
    const body = raw.body ? sanitizeText(raw.body) : ''
    const { type, metadata, ctaText, ctaUrl, channel } = raw

    if (!recipientUserId || !subject || !body || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const notif = await createNotification({
      recipientUserId,
      type,
      subject,
      body,
      metadata,
      ctaText,
      ctaUrl,
      channel: channel ?? 'both',
    })

    return NextResponse.json({ sent: true, notificationId: notif?.id ?? null })
  } catch (err) {
    console.error('[notifications/send] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
