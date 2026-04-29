import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { render } from '@react-email/components'
import { BetaInterpreterUpdate } from '@/emails/BetaInterpreterUpdate'
import { InterpreterInvitation } from '@/emails/InterpreterInvitation'
import { CustomEmail } from '@/emails/CustomEmail'
import { InterpreterProfileInvite } from '@/emails/InterpreterProfileInvite'
import { SoftLaunchAnnouncementInterpreter } from '@/emails/SoftLaunchAnnouncementInterpreter'

export const dynamic = 'force-dynamic'

const TEMPLATES = {
  'beta-update': {
    subject: 'signpost is almost ready. We need your help.',
    component: BetaInterpreterUpdate,
  },
  'invitation': {
    subject: 'I built something I think you will want to see',
    component: InterpreterInvitation,
  },
  'profile-invite': {
    subject: 'signpost is opening soon. Help us one more time and coffee\'s on us!',
    component: InterpreterProfileInvite,
  },
  'soft-launch': {
    subject: 'signpost opens Friday. Complete your profile in time.',
    component: SoftLaunchAnnouncementInterpreter,
  },
} as const

type BuiltInTemplate = keyof typeof TEMPLATES

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  const adminClient = getSupabaseAdmin()
  const { data: profile, error: profileErr } = await adminClient
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (profileErr || !profile?.is_admin) return null
  return user
}

async function renderEmail(
  template: string,
  recipientName: string,
  subject?: string,
  customBody?: string,
): Promise<{ html: string; subject: string }> {
  if (template === 'custom') {
    const body = (customBody || '').replace(/\[name\]/gi, recipientName)
    const paragraphs = body.split(/\n\s*\n/).filter(Boolean)
    const html = await render(CustomEmail({ preview: subject || '', bodyParagraphs: paragraphs }))
    return { html, subject: subject || 'A message from signpost' }
  }

  const config = TEMPLATES[template as BuiltInTemplate]
  const Component = config.component
  const html = await render(Component({ recipientName }))
  return { html, subject: config.subject }
}

async function getRecipientsForRole(role: string): Promise<{ email: string; name: string }[]> {
  const adminClient = getSupabaseAdmin()
  const recipients: { email: string; name: string }[] = []

  if (role === 'interpreter') {
    const { data: profiles } = await adminClient
      .from('interpreter_profiles')
      .select('first_name, last_name, user_id')

    if (profiles) {
      for (const p of profiles) {
        try {
          const { data: authUser } = await adminClient.auth.admin.getUserById(p.user_id)
          if (authUser?.user?.email) {
            recipients.push({
              email: authUser.user.email,
              name: [p.first_name, p.last_name].filter(Boolean).join(' ') || 'there',
            })
          }
        } catch {
          // skip users we can't look up
        }
      }
    }
  } else if (role === 'deaf') {
    const { data: profiles } = await adminClient
      .from('deaf_profiles')
      .select('first_name, last_name, email')

    if (profiles) {
      for (const p of profiles) {
        if (p.email) {
          recipients.push({
            email: p.email,
            name: [p.first_name, p.last_name].filter(Boolean).join(' ') || 'there',
          })
        }
      }
    }
  } else if (role === 'requester') {
    const { data: profiles } = await adminClient
      .from('requester_profiles')
      .select('first_name, last_name, user_id')

    if (profiles) {
      for (const p of profiles) {
        try {
          const { data: authUser } = await adminClient.auth.admin.getUserById(p.user_id)
          if (authUser?.user?.email) {
            recipients.push({
              email: authUser.user.email,
              name: [p.first_name, p.last_name].filter(Boolean).join(' ') || 'there',
            })
          }
        } catch {
          // skip
        }
      }
    }
  }

  return recipients
}

// GET: role counts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await verifyAdmin(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    if (action === 'list') {
      const role = url.searchParams.get('role')
      if (!role || !['interpreter', 'deaf', 'requester'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }

      const adminClient = getSupabaseAdmin()
      const recipients: { user_id: string; email: string; name: string }[] = []

      if (role === 'interpreter') {
        const { data } = await adminClient
          .from('interpreter_profiles')
          .select('user_id, first_name, last_name, email, is_seed')
          .order('first_name', { ascending: true })

        if (data) {
          for (const p of data) {
            if (p.is_seed === true) continue
            const email = (p.email || '').trim()
            if (!email || email.toLowerCase().endsWith('@signpost.test')) continue
            recipients.push({
              user_id: p.user_id,
              email,
              name: [p.first_name, p.last_name].filter(Boolean).join(' ') || 'there',
            })
          }
        }
      } else if (role === 'deaf') {
        const { data } = await adminClient
          .from('deaf_profiles')
          .select('user_id, first_name, last_name, email')
          .order('first_name', { ascending: true })

        if (data) {
          for (const p of data) {
            const email = (p.email || '').trim()
            if (!email || email.toLowerCase().endsWith('@signpost.test')) continue
            recipients.push({
              user_id: p.user_id,
              email,
              name: [p.first_name, p.last_name].filter(Boolean).join(' ') || 'there',
            })
          }
        }
      } else if (role === 'requester') {
        const { data } = await adminClient
          .from('requester_profiles')
          .select('user_id, first_name, last_name, email')
          .order('first_name', { ascending: true })

        if (data) {
          for (const p of data) {
            const email = (p.email || '').trim()
            if (!email || email.toLowerCase().endsWith('@signpost.test')) continue
            recipients.push({
              user_id: p.user_id,
              email,
              name: [p.first_name, p.last_name].filter(Boolean).join(' ') || 'there',
            })
          }
        }
      }

      return NextResponse.json({ recipients })
    }

    if (action === 'counts') {
      const adminClient = getSupabaseAdmin()

      const [interpRes, deafRes, reqRes] = await Promise.all([
        adminClient.from('interpreter_profiles').select('id', { count: 'exact', head: true }),
        adminClient.from('deaf_profiles').select('id', { count: 'exact', head: true }),
        adminClient.from('requester_profiles').select('id', { count: 'exact', head: true }),
      ])

      return NextResponse.json({
        interpreter: interpRes.count ?? 0,
        deaf: deafRes.count ?? 0,
        requester: reqRes.count ?? 0,
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('[admin/send-announcement] GET error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// POST: send emails
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const user = await verifyAdmin(supabase)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      template,
      recipientEmail,
      recipientName,
      subject,
      customBody,
      role,
      recipients: manualRecipients,
    } = body as {
      template: string
      recipientEmail?: string
      recipientName?: string
      subject?: string
      customBody?: string
      role?: 'interpreter' | 'deaf' | 'requester'
      recipients?: Array<{ email: string; name: string }>
    }

    if (!template) {
      return NextResponse.json({ error: 'Template is required' }, { status: 400 })
    }

    const validTemplates = ['beta-update', 'invitation', 'profile-invite', 'soft-launch', 'custom']
    if (!validTemplates.includes(template)) {
      return NextResponse.json(
        { error: `Invalid template. Must be one of: ${validTemplates.join(', ')}` },
        { status: 400 },
      )
    }

    if (template === 'custom' && !subject) {
      return NextResponse.json({ error: 'Subject is required for custom emails' }, { status: 400 })
    }

    // Mode 3: broadcast by role
    if (role) {
      const roleRecipients = await getRecipientsForRole(role)
      if (roleRecipients.length === 0) {
        return NextResponse.json({ error: `No recipients found for role: ${role}` }, { status: 400 })
      }

      let sent = 0
      let failed = 0
      const errors: string[] = []

      for (const r of roleRecipients) {
        try {
          const rendered = await renderEmail(template, r.name, subject, customBody)
          await sendEmail({ to: r.email, subject: rendered.subject, html: rendered.html })
          sent++
        } catch (err) {
          failed++
          const msg = err instanceof Error ? err.message : String(err)
          errors.push(`${r.email}: ${msg}`)
        }
        await sleep(100)
      }

      return NextResponse.json({ sent, failed, errors, total: roleRecipients.length })
    }

    // Mode 4: manual list
    if (manualRecipients && manualRecipients.length > 0) {
      let sent = 0
      let failed = 0
      const errors: string[] = []

      for (const r of manualRecipients) {
        try {
          const rendered = await renderEmail(template, r.name, subject, customBody)
          await sendEmail({ to: r.email, subject: rendered.subject, html: rendered.html })
          sent++
        } catch (err) {
          failed++
          const msg = err instanceof Error ? err.message : String(err)
          errors.push(`${r.email}: ${msg}`)
        }
        await sleep(100)
      }

      return NextResponse.json({ sent, failed, errors, total: manualRecipients.length })
    }

    // Mode 1 & 2: single recipient
    if (!recipientEmail || !recipientName) {
      return NextResponse.json(
        { error: 'Missing required fields: recipientEmail, recipientName' },
        { status: 400 },
      )
    }

    const rendered = await renderEmail(template, recipientName, subject, customBody)
    const result = await sendEmail({
      to: recipientEmail,
      subject: rendered.subject,
      html: rendered.html,
    })

    return NextResponse.json({ success: true, emailId: result?.id ?? null })
  } catch (err) {
    console.error('[admin/send-announcement] POST error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
