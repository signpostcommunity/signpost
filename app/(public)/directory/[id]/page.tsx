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
    .select('id, name, first_name, last_name, city, state, country, interpreter_type, work_mode, years_experience, bio, available, avatar_color, photo_url, video_url, video_desc, rating, review_count, sign_languages, spoken_languages, specializations, regions')
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
  const location = [data.city, data.state].filter(Boolean).join(', ') || [data.city, data.country].filter(Boolean).join(', ');

  const interpreter: Interpreter = {
    id: data.id,
    initials,
    name: fullName,
    location: location || '',
    state: data.state || '',
    signLangs: data.sign_languages || [],
    spokenLangs: data.spoken_languages || [],
    specs: data.specializations || [],
    certs: [],
    rating: Number(data.rating) || 0,
    reviews: data.review_count || 0,
    available: data.available ?? true,
    color: data.avatar_color || 'linear-gradient(135deg,#7b61ff,#00e5ff)',
    regions: data.regions || [],
    bio: data.bio || '',
    videoUrl: data.video_url || undefined,
    photoUrl: data.photo_url || undefined,
    gender: null,
    isDeafInterpreter: data.interpreter_type === 'Deaf Interpreter',
    affinities: [],
    racialIdentity: [],
    religiousAffiliation: [],
  };

  return <ProfileClient interpreter={interpreter} />;
}
