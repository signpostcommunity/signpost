export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import type { Interpreter } from '@/lib/types';
import DirectoryClient from './DirectoryClient';

export default async function DirectoryPage() {
  const supabase = await createClient();

  // Check auth + fetch profile data for portal sidebar
  const { data: { user } } = await supabase.auth.getUser()
  let isRequester = false
  let userData: { id: string; primaryRole: string; name: string; initials: string; photoUrl: string | null } | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const role = profile?.role || 'interpreter'
    isRequester = role === 'requester' || role === 'org'

    let name = 'User'
    let initials = 'U'
    let photoUrl: string | null = null

    if (role === 'interpreter') {
      const { data: ip } = await supabase
        .from('interpreter_profiles')
        .select('first_name, last_name, photo_url')
        .eq('user_id', user.id)
        .maybeSingle()
      if (ip?.first_name) {
        name = `${ip.first_name} ${ip.last_name || ''}`.trim()
        initials = `${ip.first_name[0]}${ip.last_name?.[0] || ''}`.toUpperCase()
        photoUrl = ip.photo_url || null
      }
    } else if (role === 'deaf') {
      const { data: dp } = await supabase
        .from('deaf_profiles')
        .select('first_name, last_name')
        .or(`id.eq.${user.id},user_id.eq.${user.id}`)
        .maybeSingle()
      if (dp?.first_name) {
        name = `${dp.first_name} ${dp.last_name || ''}`.trim()
        initials = `${dp.first_name[0]}${dp.last_name?.[0] || ''}`.toUpperCase()
      }
    } else if (role === 'requester' || role === 'org') {
      const { data: rp } = await supabase
        .from('requester_profiles')
        .select('first_name, last_name, name')
        .or(`id.eq.${user.id},user_id.eq.${user.id}`)
        .maybeSingle()
      if (rp?.first_name) {
        name = `${rp.first_name} ${rp.last_name || ''}`.trim()
        initials = `${rp.first_name[0]}${rp.last_name?.[0] || ''}`.toUpperCase()
      } else if (rp?.name) {
        name = rp.name
        const parts = rp.name.split(' ')
        initials = `${parts[0]?.[0] || ''}${parts[parts.length - 1]?.[0] || ''}`.toUpperCase()
      }
    }

    userData = { id: user.id, primaryRole: role, name, initials, photoUrl }
  }

  let query = supabase
    .from('interpreter_profiles')
    .select('id, user_id, name, first_name, last_name, city, country, country_name, state, sign_languages, spoken_languages, specializations, specialized_skills, regions, rating, review_count, available, avatar_color, bio, video_url, interpreter_type, status, photo_url, draft_data, lgbtq, deaf_parented, bipoc, bipoc_details, religious_affiliation, religious_details, gender_identity, latitude, longitude, years_experience, mentorship_offering, mentorship_seeking, mentorship_types, mentorship_types_offering, mentorship_types_seeking, mentorship_paid, mentorship_bio_offering, mentorship_bio_seeking, is_seed, interpreter_certifications(name, issuing_body, year, verification_url), interpreter_videos(video_url)')
    .eq('status', 'approved')
    .eq('directory_visible', true)
    .order('photo_url', { ascending: false, nullsFirst: false })
    .order('last_name', { ascending: true, nullsFirst: false })

  // BETA ONLY: Remove this filter at launch
  if (isRequester) {
    query = query.eq('is_seed', true)
  }

  const { data: rows } = await query;

  const interpreters: Interpreter[] = (rows || []).map((r) => {
    const fullName = r.name || [r.first_name, r.last_name].filter(Boolean).join(' ') || 'Interpreter';
    const initials = fullName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
    const location = [r.city, r.state, r.country_name || (r.country ? r.country.toUpperCase() : null)].filter(Boolean).join(', ');

    // Extract certifications from interpreter_certifications table first, fall back to draft_data
    const tableCerts = (r as Record<string, unknown>).interpreter_certifications as Array<{ name: string; issuing_body?: string; year?: string; verification_url?: string }> | undefined;
    let certNames: string[];
    let certDetails: { name: string; issuingBody?: string; year?: string; verificationLink?: string }[];

    if (tableCerts && tableCerts.length > 0) {
      certNames = tableCerts.map(c => c.name);
      certDetails = tableCerts.map(c => ({
        name: c.name,
        issuingBody: c.issuing_body || undefined,
        year: c.year || undefined,
        verificationLink: c.verification_url || undefined,
      }));
    } else {
      const draftData = (r.draft_data || {}) as Record<string, unknown>;
      const draftCerts = Array.isArray(draftData.certifications) ? draftData.certifications : [];
      const validCerts = draftCerts.filter((c: Record<string, unknown>) => c && typeof c.name === 'string' && c.name.trim());
      certNames = validCerts.map((c: Record<string, unknown>) => c.name as string);
      certDetails = validCerts.map((c: Record<string, unknown>) => ({
        name: c.name as string,
        issuingBody: (c.issuingBody as string) || undefined,
        year: (c.year as string) || undefined,
        verificationLink: (c.verificationLink as string) || undefined,
      }));
    }

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
      certDetails,
      rating: Number(r.rating) || 0,
      reviews: r.review_count || 0,
      available: r.available ?? true,
      color: r.avatar_color || 'linear-gradient(135deg,#7b61ff,#00e5ff)',
      regions: r.regions || [],
      bio: r.bio || '',
      videoUrl: ((r as Record<string, unknown>).interpreter_videos as Array<{ video_url: string }> | undefined)?.length
        ? ((r as Record<string, unknown>).interpreter_videos as Array<{ video_url: string }>)[0].video_url
        : undefined,
      gender: (r.gender_identity as 'male' | 'female' | 'nonbinary' | null) || null,
      isDeafInterpreter: r.interpreter_type === 'Deaf Interpreter',
      affinities,
      photoUrl: r.photo_url || undefined,
      racialIdentity: (r.bipoc_details || []) as string[],
      religiousAffiliation: (r.religious_details || []) as string[],
      latitude: r.latitude ?? null,
      longitude: r.longitude ?? null,
      userId: r.user_id || undefined,
      yearsExperience: r.years_experience || undefined,
      mentorshipOffering: r.mentorship_offering || false,
      mentorshipSeeking: r.mentorship_seeking || false,
      mentorshipTypes: r.mentorship_types || [],
      mentorshipTypesOffering: r.mentorship_types_offering || [],
      mentorshipTypesSeeking: r.mentorship_types_seeking || [],
      mentorshipPaid: r.mentorship_paid || null,
      mentorshipBioOffering: r.mentorship_bio_offering || null,
      mentorshipBioSeeking: r.mentorship_bio_seeking || null,
    };
  });

  // Fetch active away periods for all displayed interpreters
  const today = new Date().toISOString().split('T')[0]
  const { data: awayRows } = await supabase
    .from('interpreter_away_periods')
    .select('interpreter_id, end_date, message, dim_profile')
    .lte('start_date', today)
    .gte('end_date', today)

  const awayMap: Record<string, { end_date: string; message: string; dim_profile: boolean }> = {}
  if (awayRows) {
    for (const row of awayRows) {
      awayMap[row.interpreter_id] = row
    }
  }

  return <DirectoryClient interpreters={interpreters} awayPeriods={awayMap} userData={userData} />;
}
