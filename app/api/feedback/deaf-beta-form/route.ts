import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

interface DeafBetaFormData {
  gutReaction: string
  gutReactionText: string
  comfortLevel: string
  comfortText: string
  preferredListUsefulness: string
  interpreterInfo: string
  bookingProcess: string
  listFeatures: string
  mostImportant: string
  gotRight: string
  anythingElse: string
  name: string
}

export async function POST(request: NextRequest) {
  try {
    const body: DeafBetaFormData = await request.json()

    const displayName = body.name?.trim() || 'Anonymous'

    // Save to Supabase using beta_feedback table
    const admin = getSupabaseAdmin()
    const { error: dbError } = await admin
      .from('beta_feedback')
      .insert({
        tester_email: null,
        page: 'deaf-beta-form',
        notes: `Deaf beta feedback from ${displayName}`,
        specific_answer: null,
        is_end_of_session: true,
        end_of_session_data: body,
      })

    if (dbError) {
      console.error('[deaf-beta-form] DB insert error:', dbError.message)
    }

    // Build email HTML
    const sections = [
      {
        label: 'Your Experience',
        questions: [
          { q: 'Gut reaction to the Deaf portal', a: body.gutReaction },
          { q: 'What shaped that reaction?', a: body.gutReactionText },
          { q: 'Comfort level using signpost for real interpreter needs', a: body.comfortLevel },
          { q: 'What would need to be true for full trust?', a: body.comfortText },
        ],
      },
      {
        label: 'Features',
        questions: [
          { q: 'How useful is the Preferred Interpreter List?', a: body.preferredListUsefulness },
          { q: 'What interpreter info is missing? What filters do you wish existed?', a: body.interpreterInfo },
          { q: 'Was the booking/request process straightforward?', a: body.bookingProcess },
          { q: 'Are Preferred + Do Not Book lists useful? Changes?', a: body.listFeatures },
        ],
      },
      {
        label: 'Overall',
        questions: [
          { q: 'Single most important thing to fix or add', a: body.mostImportant },
          { q: 'What did we get right? What should stay as is?', a: body.gotRight },
          { q: 'Anything else', a: body.anythingElse },
        ],
      },
    ]

    const sectionHtml = sections
      .map(
        (s) => `
      <tr><td style="padding:24px 36px 8px;">
        <div style="font-size:13px;color:#a78bfa;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">${s.label}</div>
      </td></tr>
      ${s.questions
        .map(
          (q) => `
        <tr><td style="padding:8px 36px;">
          <div style="font-size:13px;color:#96a0b8;margin-bottom:4px;">${q.q}</div>
          <div style="font-size:15px;color:#f0f2f8;line-height:1.6;background:#16161f;border:1px solid #1e2433;border-radius:8px;padding:12px 16px;">
            ${(q.a || '').replace(/\n/g, '<br>') || '<span style="color:#5a6178;">No response</span>'}
          </div>
        </td></tr>`
        )
        .join('')}`
      )
      .join('')

    const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Inter',system-ui,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;">
  <tr><td style="padding:32px 36px 16px;">
    <div style="font-size:20px;color:#a78bfa;font-weight:700;font-family:'Syne',sans-serif;">
      Deaf Beta Feedback
    </div>
    <div style="font-size:14px;color:#96a0b8;margin-top:6px;">From: ${displayName}</div>
  </td></tr>
  ${sectionHtml}
  <tr><td style="padding:32px 36px;font-size:12px;color:#5a6178;">
    Submitted via signpost.community/feedback/deaf-beta
  </td></tr>
</table>
</body></html>`

    await sendEmail({
      to: 'mollysano.nicm@gmail.com',
      subject: `Deaf Beta Feedback from ${displayName}`,
      html,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[deaf-beta-form] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
