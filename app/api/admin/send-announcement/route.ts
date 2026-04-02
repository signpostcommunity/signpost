import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { render } from '@react-email/components'
import { BetaInterpreterUpdate } from '@/emails/BetaInterpreterUpdate'
import { InterpreterInvitation } from '@/emails/InterpreterInvitation'

const TEMPLATES = {
  'beta-update': {
    subject: 'signpost is almost ready. We need your help.',
    component: BetaInterpreterUpdate,
  },
  'invitation': {
    subject: 'I built something I think you will want to see',
    component: InterpreterInvitation,
  },
} as const

type TemplateName = keyof typeof TEMPLATES

export async function POST(request: NextRequest) {
  // Auth check: must be admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  const { data: profile } = await admin
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  // Parse body
  const body = await request.json()
  const { template, recipientEmail, recipientName } = body as {
    template: string
    recipientEmail: string
    recipientName: string
  }

  if (!template || !recipientEmail || !recipientName) {
    return NextResponse.json(
      { error: 'Missing required fields: template, recipientEmail, recipientName' },
      { status: 400 }
    )
  }

  if (!(template in TEMPLATES)) {
    return NextResponse.json(
      { error: `Invalid template. Must be one of: ${Object.keys(TEMPLATES).join(', ')}` },
      { status: 400 }
    )
  }

  const templateConfig = TEMPLATES[template as TemplateName]
  const Component = templateConfig.component

  const html = await render(Component({ recipientName }))

  const result = await sendEmail({
    to: recipientEmail,
    subject: templateConfig.subject,
    html,
  })

  return NextResponse.json({ success: true, emailId: result?.id ?? null })
}
