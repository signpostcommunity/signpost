export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import type { Interpreter } from '@/lib/types';
import DirectoryClient from './DirectoryClient';

export default async function DirectoryPage() {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from('interpreter_profiles')
    .select('id, name, first_name, last_name, city, country, state, sign_languages, spoken_languages, specializations, specialized_skills, regions, rating, review_count, available, avatar_color, bio, video_url, interpreter_type, status, photo_url, draft_data, lgbtq, deaf_parented, bipoc, bipoc_details, religious_affiliation, religious_details, gender_identity')
    .in('status', ['approved', 'active']);

  const interpreters: Interpreter[] = (rows || []).map((r) => {
    const fullName = r.name || [r.first_name, r.last_name].filter(Boolean).join(' ') || 'Interpreter';
    const initials = fullName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
    const location = [r.city, r.state, r.country].filter(Boolean).join(', ');

    // Extract certifications from draft_data if present
    const draftData = (r.draft_data || {}) as Record<string, unknown>;
    const draftCerts = Array.isArray(draftData.certifications) ? draftData.certifications : [];
    const certNames = draftCerts
      .filter((c: Record<string, unknown>) => c && typeof c.name === 'string' && c.name.trim())
      .map((c: Record<string, unknown>) => c.name as string);

    // Build affinities array from boolean columns
    const affinities: string[] = [];
    if (r.lgbtq) affinities.push('LGBTQ+');
    if (r.deaf_parented) affinities.push('Deaf-parented');
    if (r.bipoc) affinities.push('BIPOC');
    if (r.religious_affiliation) affinities.push('Religious');

    return {
      id: r.id,
      initials,
      name: fullName,
      location: location || '',
      state: r.state || '',
      country: r.country || '',
      signLangs: r.sign_languages || [],
      spokenLangs: r.spoken_languages || [],
      specs: r.specializations || [],
      specializedSkills: r.specialized_skills || [],
      certs: certNames,
      rating: Number(r.rating) || 0,
      reviews: r.review_count || 0,
      available: r.available ?? true,
      color: r.avatar_color || 'linear-gradient(135deg,#7b61ff,#00e5ff)',
      regions: r.regions || [],
      bio: r.bio || '',
      videoUrl: r.video_url || undefined,
      gender: (r.gender_identity as 'male' | 'female' | 'nonbinary' | null) || null,
      isDeafInterpreter: r.interpreter_type === 'Deaf Interpreter',
      affinities,
      photoUrl: r.photo_url || undefined,
      racialIdentity: (r.bipoc_details || []) as string[],
      religiousAffiliation: (r.religious_details || []) as string[],
    };
  });

  return <DirectoryClient interpreters={interpreters} />;
}
