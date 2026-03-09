import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { recipientUserId, subject, body, type } = await request.json()

    if (!recipientUserId || !subject || !body || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // TODO: Configure RESEND_API_KEY in Vercel env vars to enable email delivery
    // When configured, use Resend or similar service to send the email:
    //
    // import { Resend } from 'resend'
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: 'signpost <notifications@signpost-pdir.vercel.app>',
    //   to: recipientEmail,
    //   subject,
    //   text: body,
    // })

    console.log(`[notifications/send] Email delivery not configured. Would send:`)
    console.log(`  To: user ${recipientUserId}`)
    console.log(`  Subject: ${subject}`)
    console.log(`  Type: ${type}`)
    console.log(`  Body: ${body.substring(0, 200)}...`)

    return NextResponse.json({ sent: false, reason: 'Email service not configured' })
  } catch (err) {
    console.error('[notifications/send] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
