export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import type { Interpreter } from '@/lib/types';
import DirectoryClient from './DirectoryClient';

export default async function DirectoryPage() {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from('interpreter_profiles')
    .select('id, name, first_name, last_name, city, country, state, sign_languages, spoken_languages, specializations, regions, rating, review_count, available, avatar_color, bio, video_url, interpreter_type, status, photo_url')
    .in('status', ['approved', 'active']);

  const interpreters: Interpreter[] = (rows || []).map((r) => {
    const fullName = r.name || [r.first_name, r.last_name].filter(Boolean).join(' ') || 'Interpreter';
    const initials = fullName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
    const location = [r.city, r.state].filter(Boolean).join(', ') || [r.city, r.country].filter(Boolean).join(', ');

    return {
      id: r.id,
      initials,
      name: fullName,
      location: location || '',
      state: r.state || '',
      signLangs: r.sign_languages || [],
      spokenLangs: r.spoken_languages || [],
      specs: r.specializations || [],
      certs: [],
      rating: Number(r.rating) || 0,
      reviews: r.review_count || 0,
      available: r.available ?? true,
      color: r.avatar_color || 'linear-gradient(135deg,#7b61ff,#00e5ff)',
      regions: r.regions || [],
      bio: r.bio || '',
      gender: null,
      isDeafInterpreter: r.interpreter_type === 'Deaf Interpreter',
      affinities: [],
      photoUrl: r.photo_url || undefined,
      racialIdentity: [],
      religiousAffiliation: [],
    };
  });

  return <DirectoryClient interpreters={interpreters} />;
}
