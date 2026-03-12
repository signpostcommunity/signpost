import { NextRequest, NextResponse } from 'next/server'
import { createNotification } from '@/lib/notifications-server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { recipientUserId, subject, body, type, metadata, ctaText, ctaUrl, channel } = await request.json()

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
      channel: channel ?? 'email',
    })

    return NextResponse.json({ sent: true, notificationId: notif?.id ?? null })
  } catch (err) {
    console.error('[notifications/send] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
