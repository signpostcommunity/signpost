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

type PageFeedback = {
  page: string
  openNotes: string
  specificAnswer: string
}

export async function POST(request: NextRequest) {
  const token = process.env.MONDAY_API_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'MONDAY_API_TOKEN not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const {
      pageFeedback,
      professionalNeeds,
      whatsWorkingMissing,
      likelihood,
      usedMobile,
      mobileFeedback,
      starRatingFeel,
      whoShouldRate,
      dhhRatingCategories,
      orgRatingCategories,
      ratingDisplay,
      triedInvoicing,
      invoicingCompare,
      premiumInterest,
      premiumPrice,
      dreamPlatform,
    } = body as {
      pageFeedback: PageFeedback[]
      professionalNeeds: string
      whatsWorkingMissing: string
      likelihood: string
      usedMobile: string
      mobileFeedback: string
      starRatingFeel: string
      whoShouldRate: string[]
      dhhRatingCategories: string
      orgRatingCategories: string
      ratingDisplay: string
      triedInvoicing: string
      invoicingCompare: string
      premiumInterest: string
      premiumPrice: string
      dreamPlatform: string
    }

    // Get tester name from auth session
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

    // Concatenate all per-page open notes with page labels
    const allNotes = (pageFeedback || [])
      .filter(f => f.openNotes)
      .map(f => `[${f.page}] ${f.openNotes}`)
      .join('\n')

    // Concatenate all per-page specific answers with page labels
    const allSpecific = (pageFeedback || [])
      .filter(f => f.specificAnswer)
      .map(f => `[${f.page}] ${f.specificAnswer}`)
      .join('\n')

    // Format end-of-session answers as structured text
    const endOfSessionLines: string[] = []

    if (professionalNeeds) endOfSessionLines.push(`Professional needs: ${professionalNeeds}`)
    if (whatsWorkingMissing) endOfSessionLines.push(`What's working/missing: ${whatsWorkingMissing}`)
    if (likelihood) endOfSessionLines.push(`Likelihood to use: ${likelihood}`)
    if (usedMobile) endOfSessionLines.push(`Used mobile: ${usedMobile}`)
    if (mobileFeedback) endOfSessionLines.push(`Mobile feedback: ${mobileFeedback}`)
    if (starRatingFeel) endOfSessionLines.push(`Star rating feel: ${starRatingFeel}`)
    if (whoShouldRate?.length) endOfSessionLines.push(`Who should rate: ${whoShouldRate.join(', ')}`)
    if (dhhRatingCategories) endOfSessionLines.push(`D/HH rating categories: ${dhhRatingCategories}`)
    if (orgRatingCategories) endOfSessionLines.push(`Org rating categories: ${orgRatingCategories}`)
    if (ratingDisplay) endOfSessionLines.push(`Rating display: ${ratingDisplay}`)
    if (triedInvoicing) endOfSessionLines.push(`Tried invoicing: ${triedInvoicing}`)
    if (invoicingCompare) endOfSessionLines.push(`Invoicing compare: ${invoicingCompare}`)
    if (premiumInterest) endOfSessionLines.push(`Premium interest: ${premiumInterest}`)
    if (premiumPrice) endOfSessionLines.push(`Premium price: ${premiumPrice}`)
    if (dreamPlatform) endOfSessionLines.push(`Dream platform: ${dreamPlatform}`)

    const endOfSession = endOfSessionLines.join('\n')

    // ── Save to Supabase beta_feedback table ──
    // Per-page feedback rows
    for (const pf of (pageFeedback || [])) {
      if (!pf.openNotes && !pf.specificAnswer) continue
      const { error: pfErr } = await supabase.from('beta_feedback').insert({
        tester_email: user?.email ?? null,
        page: pf.page,
        notes: pf.openNotes || null,
        specific_answer: pf.specificAnswer || null,
        feedback_type: 'page_note',
      })
      if (pfErr) console.error('beta_feedback page insert error:', pfErr)
    }

    // End-of-session survey row
    if (endOfSessionLines.length > 0) {
      const surveyAnswers: Record<string, unknown> = {}
      if (professionalNeeds) surveyAnswers.professional_needs = professionalNeeds
      if (whatsWorkingMissing) surveyAnswers.whats_working_missing = whatsWorkingMissing
      if (likelihood) surveyAnswers.likelihood_to_use = likelihood
      if (usedMobile) surveyAnswers.used_mobile = usedMobile
      if (mobileFeedback) surveyAnswers.mobile_feedback = mobileFeedback
      if (starRatingFeel) surveyAnswers.star_rating_feel = starRatingFeel
      if (whoShouldRate?.length) surveyAnswers.who_should_rate = whoShouldRate
      if (dhhRatingCategories) surveyAnswers.dhh_rating_categories = dhhRatingCategories
      if (orgRatingCategories) surveyAnswers.org_rating_categories = orgRatingCategories
      if (ratingDisplay) surveyAnswers.rating_display = ratingDisplay
      if (triedInvoicing) surveyAnswers.tried_invoicing = triedInvoicing
      if (invoicingCompare) surveyAnswers.invoicing_compare = invoicingCompare
      if (premiumInterest) surveyAnswers.premium_interest = premiumInterest
      if (premiumPrice) surveyAnswers.premium_price = premiumPrice
      if (dreamPlatform) surveyAnswers.dream_platform = dreamPlatform

      const { error: surveyErr } = await supabase.from('beta_feedback').insert({
        tester_email: user?.email ?? null,
        page: 'end_of_session',
        notes: endOfSession,
        feedback_type: 'end_of_session',
        survey_answers: surveyAnswers,
      })
      if (surveyErr) console.error('beta_feedback survey insert error:', surveyErr)
    }

    // ── Also save to Monday board ──
    // Build column values — do NOT set status columns (labels may not match board config)
    const columnValues: Record<string, unknown> = {
      short_textnbhnggeq: testerName,
      long_text24vbemv7: { text: allNotes },
      long_text8gfogdy7: { text: allSpecific },
      long_textwi8vrijw: { text: endOfSession },
    }

    const createResult = await mondayQuery(token,
      `mutation ($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON!) {
        create_item(board_id: $boardId, group_id: $groupId, item_name: $itemName, column_values: $columnValues) { id }
      }`,
      {
        boardId: BOARD_ID,
        groupId: 'topics',
        itemName: testerName,
        columnValues: JSON.stringify(columnValues),
      }
    )

    if (createResult.errors) {
      console.error('Monday create error:', JSON.stringify(createResult.errors))
      return NextResponse.json({ error: createResult.errors[0]?.message ?? 'Monday API error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Beta feedback error:', err)
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
  }
}
