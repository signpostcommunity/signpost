export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type { Metadata } from 'next'
import DeafLandingClient from './DeafLandingClient'

interface Props {
  params: Promise<{ slug: string }>
}

async function getDeafProfileBySlug(slug: string) {
  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('deaf_profiles')
      .select('id, name, first_name, pronouns, comm_prefs, profile_video_url, vanity_slug')
      .ilike('vanity_slug', slug)
      .maybeSingle()

    if (error) {
      console.error('[d/slug] Profile fetch error:', error)
      return null
    }

    return data
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getDeafProfileBySlug(slug)

  if (!data) {
    return { title: 'Profile Not Found — signpost' }
  }

  const displayName = data.first_name || data.name || 'User'

  return {
    title: `Book an Interpreter for ${displayName} — signpost`,
    description: `Connect with ${displayName} on signpost and book a qualified sign language interpreter based on their preferences.`,
  }
}

export default async function DeafSlugPage({ params }: Props) {
  const { slug } = await params
  const data = await getDeafProfileBySlug(slug)

  if (!data) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '40px 20px',
        background: 'var(--bg)',
      }}>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '48px 40px',
          textAlign: 'center', maxWidth: 480,
        }}>
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontSize: '1.5rem',
            fontWeight: 700, marginBottom: 12, color: 'var(--text)',
          }}>
            This page wasn&apos;t found.
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 24, lineHeight: 1.6 }}>
            The link may be outdated or the profile may no longer be available.
          </p>
          <Link
            href="/"
            className="btn-primary"
            style={{
              display: 'inline-block', padding: '12px 28px',
              fontSize: '0.9rem', fontWeight: 600,
              borderRadius: '100px', textDecoration: 'none',
            }}
          >
            Go to signpost
          </Link>
        </div>
      </div>
    )
  }

  return (
    <DeafLandingClient
      deafProfile={{
        id: data.id,
        name: data.name,
        firstName: data.first_name,
        pronouns: data.pronouns,
        commPrefs: data.comm_prefs,
        profileVideoUrl: data.profile_video_url,
        vanitySlug: data.vanity_slug,
      }}
    />
  )
}
