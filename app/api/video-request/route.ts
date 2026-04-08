import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { emailTemplate } from '@/lib/email-template'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { interpreter_id, anonymous } = await request.json()

    if (!interpreter_id || typeof interpreter_id !== 'string') {
      return NextResponse.json({ error: 'interpreter_id required' }, { status: 400 })
    }

    // Insert the request (RLS enforces requester_user_id = auth.uid())
    const { data: inserted, error: insertError } = await supabase
      .from('video_requests')
      .insert({
        requester_user_id: user.id,
        interpreter_id,
        anonymous: !!anonymous,
      })
      .select('id')
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Already requested' }, { status: 409 })
      }
      console.error('[video-request] insert error:', insertError.message)
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
    }

    // Check if we should send an email notification
    // Only send on first request, or if it's been 30+ days since last notification
    const admin = getSupabaseAdmin()

    const { data: allRequests } = await admin
      .from('video_requests')
      .select('id, notified_at')
      .eq('interpreter_id', interpreter_id)

    const totalCount = allRequests?.length ?? 0
    const lastNotified = allRequests
      ?.map(r => r.notified_at)
      .filter(Boolean)
      .sort()
      .reverse()[0]

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const shouldNotify = totalCount === 1 || !lastNotified || lastNotified < thirtyDaysAgo

    if (shouldNotify) {
      // Fetch interpreter info
      const { data: interpreterProfile } = await admin
        .from('interpreter_profiles')
        .select('first_name, email')
        .eq('id', interpreter_id)
        .single()

      if (interpreterProfile?.email) {
        // Fetch requester name if not anonymous
        let requesterName: string | null = null
        if (!anonymous) {
          // Try deaf_profiles first, then requester_profiles, then user_profiles
          const { data: deafProfile } = await admin
            .from('deaf_profiles')
            .select('first_name, last_name')
            .or(`id.eq.${user.id},user_id.eq.${user.id}`)
            .limit(1)
            .maybeSingle()

          if (deafProfile?.first_name) {
            requesterName = [deafProfile.first_name, deafProfile.last_name].filter(Boolean).join(' ')
          } else {
            const { data: reqProfile } = await admin
              .from('requester_profiles')
              .select('name')
              .eq('user_id', user.id)
              .maybeSingle()
            if (reqProfile?.name) {
              requesterName = reqProfile.name
            }
          }
        }

        const firstName = interpreterProfile.first_name || 'there'
        const whoLine = requesterName
          ? `${requesterName} would love to see your intro video on signpost.`
          : 'A signpost user would love to see your intro video.'

        const body = `
          <p>Hi ${firstName},</p>
          <p>${whoLine}</p>
          <p>Deaf users consistently rate interpreter intro videos as one of their most valued features of signpost. Adding a short video introduction helps people get to know you before booking.</p>
          <p>You can record your intro video right from your dashboard - it takes less than 2 minutes.</p>
        `

        await sendEmail({
          to: interpreterProfile.email,
          subject: 'Someone wants to see your intro video on signpost',
          html: emailTemplate({
            heading: 'Someone wants to see your intro video on signpost',
            body,
            ctaText: 'Record my intro video',
            ctaUrl: 'https://signpost.community/interpreter/dashboard/profile',
          }),
        })

        // Update notified_at
        await admin
          .from('video_requests')
          .update({ notified_at: new Date().toISOString() })
          .eq('id', inserted.id)
      }
    }

    return NextResponse.json({ success: true, id: inserted.id })
  } catch (err) {
    console.error('[video-request] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
