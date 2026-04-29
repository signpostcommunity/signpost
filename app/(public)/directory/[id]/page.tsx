export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Interpreter } from '@/lib/types';
import ProfileClient from './ProfileClient';

function ProfileUnavailable() {
  return (
    <div style={{
      maxWidth: 560, margin: '120px auto', padding: '48px 32px',
      background: '#111118', border: '1px solid var(--border)',
      borderRadius: 16, textAlign: 'center',
    }}>
      <h1 style={{
        fontFamily: 'Syne, sans-serif', fontWeight: 775, fontSize: 27,
        color: '#f0f2f8', margin: '0 0 12px', letterSpacing: '-0.02em',
      }}>
        This profile is not currently available
      </h1>
      <p style={{
        fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: 14,
        color: '#96a0b8', lineHeight: 1.6, margin: '0 0 24px',
      }}>
        This interpreter has temporarily hidden their profile from the directory.
        They may return later. In the meantime, browse other interpreters to find
        the right match for your needs.
      </p>
      <a href="/directory" style={{
        display: 'inline-block', padding: '12px 24px',
        background: '#00e5ff', color: '#0a0a0f',
        borderRadius: 10, textDecoration: 'none',
        fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 14,
      }}>
        Browse the directory
      </a>
    </div>
  );
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('interpreter_profiles')
    .select('id, user_id, name, first_name, last_name, city, state, country, country_name, interpreter_type, work_mode, years_experience, gender_identity, bio, bio_specializations, bio_extra, available, avatar_color, photo_url, video_url, video_desc, rating, review_count, sign_languages, spoken_languages, specializations, aspirational_specializations, specialized_skills, regions, lgbtq, deaf_parented, bipoc, bipoc_details, religious_affiliation, religious_details, draft_data, directory_visible, mentorship_offering, mentorship_seeking, mentorship_types, mentorship_types_offering, mentorship_types_seeking, mentorship_paid, mentorship_bio_offering, mentorship_bio_seeking, timezone, interpreter_videos(video_url)')
    .eq('id', id)
    .in('status', ['approved', 'active'])
    .maybeSingle();

  if (error) {
    console.error('Profile fetch error:', error);
  }

  if (!data) {
    notFound();
  }

  if (data.directory_visible === false || (data as Record<string, unknown>).is_test_account === true) {
    return <ProfileUnavailable />;
  }

  const fullName = data.name || [data.first_name, data.last_name].filter(Boolean).join(' ') || 'Interpreter';
  const initials = fullName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  const location = [data.city, data.state, data.country_name || (data.country ? data.country.toUpperCase() : null)].filter(Boolean).join(', ');

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
    aspirationalSpecs: ((data as Record<string, unknown>).aspirational_specializations as string[] | null) || [],
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
    videoUrl: ((data as Record<string, unknown>).interpreter_videos as Array<{ video_url: string }> | undefined)?.length
      ? ((data as Record<string, unknown>).interpreter_videos as Array<{ video_url: string }>)[0].video_url
      : undefined,
    photoUrl: data.photo_url || undefined,
    yearsExperience: data.years_experience || undefined,
    genderIdentity: data.gender_identity || undefined,
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
    mentorshipOffering: data.mentorship_offering || false,
    mentorshipSeeking: data.mentorship_seeking || false,
    mentorshipTypes: data.mentorship_types || [],
    mentorshipTypesOffering: data.mentorship_types_offering || [],
    mentorshipTypesSeeking: data.mentorship_types_seeking || [],
    mentorshipPaid: data.mentorship_paid || null,
    mentorshipBioOffering: data.mentorship_bio_offering || null,
    mentorshipBioSeeking: data.mentorship_bio_seeking || null,
  };

  // Fetch active away period
  const today = new Date().toISOString().split('T')[0]
  const { data: awayData } = await supabase
    .from('interpreter_away_periods')
    .select('end_date, message')
    .eq('interpreter_id', data.id)
    .lte('start_date', today)
    .gte('end_date', today)
    .order('end_date', { ascending: true })
    .limit(1)
  const activeAway = awayData && awayData.length > 0 ? awayData[0] : null

  // Fetch weekly availability
  const { data: availRows } = await supabase
    .from('interpreter_availability')
    .select('day_of_week, status, start_time, end_time')
    .eq('interpreter_id', data.id)
    .order('day_of_week', { ascending: true })

  return (
    <ProfileClient
      interpreter={interpreter}
      activeAway={activeAway}
      availability={availRows || []}
      timezone={(data as Record<string, unknown>).timezone as string | null}
    />
  );
}
