export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import DeafLandingClient from './DeafLandingClient'

interface Props {
  params: Promise<{ slug: string }>
}

async function getPublicProfile(slug: string) {
  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('deaf_profiles')
      .select('id, name, first_name, last_name, city, state, photo_url, vanity_slug')
      .ilike('vanity_slug', slug)
      .maybeSingle()
    if (error) { console.error('[d/slug] Profile fetch error:', error); return null }
    return data
  } catch { return null }
}

async function getFullProfile(slug: string) {
  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('deaf_profiles')
      .select('id, name, first_name, pronouns, comm_prefs, profile_video_url, vanity_slug')
      .ilike('vanity_slug', slug)
      .maybeSingle()
    if (error) { console.error('[d/slug] Profile fetch error:', error); return null }
    return data
  } catch { return null }
}

async function checkAuthenticated(): Promise<boolean> {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    return !!user
  } catch {
    return false
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getPublicProfile(slug)

  if (!data) {
    return { title: 'Profile Not Found — signpost' }
  }

  const displayName = data.first_name || data.name || 'User'

  return {
    title: `Book an Interpreter for ${displayName} — signpost`,
    description: `Connect with ${displayName} on signpost and book a qualified sign language interpreter based on their preferences.`,
  }
}

function NotFoundPage() {
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

export default async function DeafSlugPage({ params }: Props) {
  const { slug } = await params
  const isAuthenticated = await checkAuthenticated()

  if (!isAuthenticated) {
    const publicData = await getPublicProfile(slug)
    if (!publicData) return <NotFoundPage />

    return (
      <DeafLandingClient
        isAuthenticated={false}
        deafProfile={{
          id: publicData.id,
          name: publicData.name,
          firstName: publicData.first_name,
          lastName: publicData.last_name,
          city: publicData.city,
          state: publicData.state,
          photoUrl: publicData.photo_url,
          vanitySlug: publicData.vanity_slug,
        }}
      />
    )
  }

  const data = await getFullProfile(slug)
  if (!data) return <NotFoundPage />

  return (
    <DeafLandingClient
      isAuthenticated={true}
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
