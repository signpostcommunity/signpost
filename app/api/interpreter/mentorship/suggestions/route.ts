import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Profile {
  id: string
  user_id: string
  first_name: string | null
  last_name: string | null
  photo_url: string | null
  avatar_color: string | null
  years_experience: string | null
  city: string | null
  state: string | null
  specializations: string[] | null
  mentorship_offering: boolean
  mentorship_seeking: boolean
  mentorship_types: string[] | null
  mentorship_types_offering: string[] | null
  mentorship_types_seeking: string[] | null
  mentorship_paid: string | null
  mentorship_bio_offering: string | null
  mentorship_bio_seeking: string | null
}

function scoreMentor(seeker: Profile, mentor: Profile): number {
  let score = 0

  // Compare seeker's mentorship_types_seeking against mentor's mentorship_types_offering
  const seekerTypes = seeker.mentorship_types_seeking || seeker.mentorship_types || []
  const mentorTypes = mentor.mentorship_types_offering || mentor.mentorship_types || []
  const typeOverlap = seekerTypes.filter(t => mentorTypes.includes(t)).length
  score += typeOverlap * 10

  // Experience gap: mentor should have more years (positive gap = good)
  const seekerExp = parseInt(seeker.years_experience || '0', 10) || 0
  const mentorExp = parseInt(mentor.years_experience || '0', 10) || 0
  const expGap = mentorExp - seekerExp
  if (expGap > 0 && expGap <= 5) score += 8
  if (expGap > 5 && expGap <= 15) score += 15
  if (expGap > 15) score += 10
  if (expGap <= 0) score -= 5

  // Geographic proximity: same state = bonus
  if (seeker.state && mentor.state && seeker.state === mentor.state) score += 5
  // Same city = bigger bonus
  if (seeker.city && mentor.city && seeker.city === mentor.city) score += 5

  // Shared specializations beyond mentorship types
  const seekerSpecs = seeker.specializations || []
  const mentorSpecs = mentor.specializations || []
  const specOverlap = seekerSpecs.filter(s => mentorSpecs.includes(s)).length
  score += specOverlap * 3

  return score
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify interpreter role
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role, pending_roles')
    .eq('id', user.id)
    .single()

  if (!userProfile) {
    return NextResponse.json({ error: 'No profile found' }, { status: 404 })
  }

  const roles = [userProfile.role, ...(userProfile.pending_roles || [])]
  if (!roles.includes('interpreter')) {
    return NextResponse.json({ error: 'Interpreter role required' }, { status: 403 })
  }

  // Fetch seeker's profile
  const { data: seekerProfile } = await supabase
    .from('interpreter_profiles')
    .select('id, user_id, first_name, last_name, photo_url, avatar_color, years_experience, city, state, specializations, mentorship_offering, mentorship_seeking, mentorship_types, mentorship_types_offering, mentorship_types_seeking, mentorship_paid, mentorship_bio_offering, mentorship_bio_seeking')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!seekerProfile || !seekerProfile.mentorship_seeking) {
    return NextResponse.json({ suggestions: [] })
  }

  // Fetch all mentors (offering mentorship, not the seeker themselves)
  const { data: mentors } = await supabase
    .from('interpreter_profiles')
    .select('id, user_id, first_name, last_name, photo_url, avatar_color, years_experience, city, state, specializations, mentorship_offering, mentorship_seeking, mentorship_types, mentorship_types_offering, mentorship_types_seeking, mentorship_paid, mentorship_bio_offering, mentorship_bio_seeking')
    .eq('mentorship_offering', true)
    .eq('status', 'approved')
    .neq('user_id', user.id)

  if (!mentors || mentors.length === 0) {
    return NextResponse.json({ suggestions: [] })
  }

  // Score and sort
  const scored = mentors.map(mentor => ({
    ...mentor,
    score: scoreMentor(seekerProfile as Profile, mentor as Profile),
    name: [mentor.first_name, mentor.last_name].filter(Boolean).join(' ') || 'Interpreter',
  }))

  scored.sort((a, b) => b.score - a.score)

  return NextResponse.json({ suggestions: scored.slice(0, 10) })
}
