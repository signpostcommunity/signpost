export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Interpreter } from '@/lib/types';
import ProfileClient from './ProfileClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('interpreter_profiles')
    .select('id, name, first_name, last_name, city, state, country, interpreter_type, work_mode, years_experience, bio, bio_specializations, bio_extra, available, avatar_color, photo_url, video_url, video_desc, rating, review_count, sign_languages, spoken_languages, specializations, specialized_skills, regions, lgbtq, deaf_parented, bipoc, bipoc_details, religious_affiliation, religious_details, draft_data')
    .eq('id', id)
    .in('status', ['approved', 'active'])
    .maybeSingle();

  if (error) {
    console.error('Profile fetch error:', error);
  }

  if (!data) {
    notFound();
  }

  const fullName = data.name || [data.first_name, data.last_name].filter(Boolean).join(' ') || 'Interpreter';
  const initials = fullName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  const location = [data.city, data.state, data.country].filter(Boolean).join(', ');

  const interpreter: Interpreter = {
    id: data.id,
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
      ...(data.deaf_parented ? ['Deaf-parented / CODA'] : []),
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
  };

  return <ProfileClient interpreter={interpreter} />;
}
