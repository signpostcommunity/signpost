export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Interpreter } from '@/lib/types'
import type { Metadata } from 'next'
import ProfileClient from '../../directory/[id]/ProfileClient'

interface Props {
  params: Promise<{ slug: string }>
}

async function getInterpreterBySlug(slug: string) {
  const supabase = await createClient()

  // Look up profile by vanity_slug
  const { data, error } = await supabase
    .from('interpreter_profiles')
    .select('id, user_id, name, first_name, last_name, vanity_slug, status, city, state, country, interpreter_type, work_mode, years_experience, bio, bio_specializations, bio_extra, available, avatar_color, photo_url, video_url, video_desc, rating, review_count, sign_languages, spoken_languages, specializations, specialized_skills, regions, lgbtq, deaf_parented, bipoc, bipoc_details, religious_affiliation, religious_details, draft_data')
    .ilike('vanity_slug', slug)
    .maybeSingle()

  if (error) {
    console.error('[book] Profile fetch error:', error)
    return null
  }

  if (!data || !['approved', 'active'].includes(data.status)) {
    return null
  }

  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getInterpreterBySlug(slug)

  if (!data) {
    return { title: 'Profile Not Found — signpost' }
  }

  const name = data.name || [data.first_name, data.last_name].filter(Boolean).join(' ') || 'Interpreter'

  return {
    title: `${name} — Book on signpost`,
    description: `View ${name}'s interpreter profile and request a booking on signpost.`,
  }
}

export default async function BookPage({ params }: Props) {
  const { slug } = await params
  const data = await getInterpreterBySlug(slug)

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', paddingTop: '120px' }}>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '48px 40px',
          textAlign: 'center', maxWidth: 480,
        }}>
          <h1 style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: '1.5rem',
            fontWeight: 700, marginBottom: 12,
          }}>
            This interpreter profile wasn&apos;t found.
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 24, lineHeight: 1.6 }}>
            The link may be outdated or the profile may no longer be available.
          </p>
          <Link
            href="/directory"
            className="btn-primary"
            style={{
              display: 'inline-block',
              padding: '12px 28px',
              fontSize: '0.9rem',
              fontWeight: 600,
              borderRadius: '100px',
              textDecoration: 'none',
            }}
          >
            Browse the directory
          </Link>
        </div>
      </div>
    )
  }

  const fullName = data.name || [data.first_name, data.last_name].filter(Boolean).join(' ') || 'Interpreter'
  const initials = fullName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  const location = [data.city, data.state, data.country].filter(Boolean).join(', ')

  const interpreter: Interpreter = {
    id: data.id,
    userId: data.user_id || undefined,
    initials,
    name: fullName,
    location: location || '',
    state: data.state || '',
    country: data.country || '',
    signLangs: data.sign_languages || [],
    spokenLangs: data.spoken_languages || [],
    specs: data.specializations || [],
    specializedSkills: data.specialized_skills || [],
    certs: ((data.draft_data as Record<string, unknown> | null)?.certifications as Array<{ name: string }> | undefined)
      ?.filter((c: { name: string }) => c.name?.trim())
      .map((c: { name: string }) => c.name.trim()) || [],
    certDetails: ((data.draft_data as Record<string, unknown> | null)?.certifications as Array<{ name: string; issuingBody?: string; year?: string; verificationLink?: string }> | undefined)
      ?.filter(c => c.name?.trim())
      .map(c => ({ name: c.name.trim(), issuingBody: c.issuingBody, year: c.year, verificationLink: c.verificationLink })) || [],
    rating: Number(data.rating) || 0,
    reviews: data.review_count || 0,
    available: data.available ?? true,
    color: data.avatar_color || 'linear-gradient(135deg,#7b61ff,#00e5ff)',
    regions: data.regions || [],
    bio: data.bio || '',
    bioSpecializations: data.bio_specializations || undefined,
    bioExtra: data.bio_extra || undefined,
    videoUrl: data.video_url || undefined,
    photoUrl: data.photo_url || undefined,
    gender: null,
    isDeafInterpreter: data.interpreter_type === 'Deaf Interpreter',
    affinities: [
      ...(data.lgbtq ? ['LGBTQ+'] : []),
      ...(data.deaf_parented ? ['Deaf-Parented Interpreter / CODA'] : []),
      ...(data.bipoc && !(data.bipoc_details as string[] | null)?.length ? ['BIPOC'] : []),
    ],
    racialIdentity: data.bipoc && (data.bipoc_details as string[] | null)?.length
      ? ['BIPOC', ...(data.bipoc_details as string[])]
      : [],
    religiousAffiliation: data.religious_affiliation
      ? (data.religious_details as string[] | null)?.length
        ? ['Religious Affiliation', ...(data.religious_details as string[])]
        : ['Religious Affiliation']
      : [],
  }

  return <ProfileClient interpreter={interpreter} />
}
