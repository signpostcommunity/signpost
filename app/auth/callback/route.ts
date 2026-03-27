export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { generateSlug } from '@/lib/slugUtils';
import { getStripe } from '@/lib/stripe';
import { syncNameFields } from '@/lib/nameSync';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const role = searchParams.get('role') as 'interpreter' | 'deaf' | 'requester' | null;

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/?error=auth_failed`);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/`);
  }

  // Check if user_profiles row exists
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile) {
    // Existing user — check if they have a completed role-specific profile
    if (profile.role === 'interpreter') {
      const { data: interpProfile } = await supabase
        .from('interpreter_profiles')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle();
      // If no interpreter profile or still pending/draft, route to signup wizard
      if (!interpProfile || interpProfile.status === 'draft' || interpProfile.status === 'pending') {
        return NextResponse.redirect(`${origin}/interpreter/signup`);
      }
    }
    // Existing user with completed profile — redirect to their dashboard
    return redirectToDashboard(origin, profile.role);
  }

  // New OAuth user — create user_profiles row with role, then route to signup wizard
  const assignedRole = role ?? 'requester';
  await supabase.from('user_profiles').upsert(
    { id: user.id, role: assignedRole },
    { onConflict: 'id' }
  );

  // Route new users to their signup wizard so they complete the full onboarding
  if (assignedRole === 'interpreter') {
    return NextResponse.redirect(`${origin}/interpreter/signup`);
  }

  if (assignedRole === 'deaf') {
    // Deaf signup is an inline form on the portal page — create a minimal profile
    // and redirect to dashboard since the deaf signup flow is simpler
    const displayName = user.user_metadata?.full_name ?? user.email ?? 'User';
    const { data: existing } = await supabase
      .from('deaf_profiles').select('id').eq('id', user.id).maybeSingle();
    if (!existing) {
      const { normalizeProfileFields } = await import('@/lib/normalize');
      const nameParts = displayName.split(' ');
      const norm = normalizeProfileFields({ first_name: nameParts[0] || '', last_name: nameParts.slice(1).join(' ') || '' });
      const firstName = (norm.first_name as string) || nameParts[0] || '';
      const lastName = (norm.last_name as string) || nameParts.slice(1).join(' ') || '';
      const normName = `${firstName} ${lastName}`.trim() || displayName;
      // TODO: Tech debt — remove deaf_profiles.name column, derive from first_name + last_name
      await supabase.from('deaf_profiles').insert(syncNameFields({
        id: user.id,
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: user.email || '',
      }));

      // Auto-generate vanity slug
      const baseSlug = generateSlug(firstName, lastName).slice(0, 50);
      if (baseSlug && baseSlug.length >= 3) {
        let slug = baseSlug;
        let attempt = 1;
        while (attempt <= 20) {
          const { data: slugExists } = await supabase
            .from('deaf_profiles')
            .select('vanity_slug')
            .ilike('vanity_slug', slug)
            .maybeSingle();
          if (!slugExists) break;
          attempt++;
          slug = `${baseSlug}-${attempt}`;
        }
        await supabase
          .from('deaf_profiles')
          .update({ vanity_slug: slug })
          .eq('id', user.id);
      }
      // BETA: seed demo bookings + roster for new Deaf account
      try {
        await fetch(`${origin}/api/seed-deaf-account`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || '',
          },
        })
      } catch (seedErr) {
        console.warn('Beta: deaf seed call failed, continuing', seedErr)
      }
    }
    return NextResponse.redirect(`${origin}/dhh/dashboard`);
  }

  // Requester — create minimal profile and redirect to dashboard
  const reqDisplayName = user.user_metadata?.full_name ?? user.email ?? 'User';
  const { data: existingReq } = await supabase
    .from('requester_profiles').select('id').eq('id', user.id).maybeSingle();
  if (!existingReq) {
    const { normalizeProfileFields: normReqFields } = await import('@/lib/normalize');
    const reqParts = reqDisplayName.split(' ');
    const reqNorm = normReqFields({ first_name: reqParts[0] || '', last_name: reqParts.slice(1).join(' ') || '' });
    const reqFirst = (reqNorm.first_name as string) || reqParts[0] || '';
    const reqLast = (reqNorm.last_name as string) || reqParts.slice(1).join(' ') || '';
    const reqNormName = `${reqFirst} ${reqLast}`.trim() || reqDisplayName;
    // TODO: Tech debt — remove requester_profiles.name column, derive from first_name + last_name
    await supabase.from('requester_profiles').insert(syncNameFields({
      id: user.id,
      user_id: user.id,
      first_name: reqFirst,
      last_name: reqLast,
      email: user.email || '',
    }));

    // Create Stripe customer for new requester (non-blocking)
    try {
      const stripe = getStripe();
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: reqNormName,
        metadata: { supabase_user_id: user.id, requester_profile_id: user.id },
      });
      const admin = getSupabaseAdmin();
      await admin.from('requester_profiles')
        .update({ stripe_customer_id: customer.id })
        .eq('user_id', user.id);
    } catch (e) {
      console.error('Failed to create Stripe customer on OAuth signup:', e);
    }
  }
  return NextResponse.redirect(`${origin}/request/dashboard`);
}

function redirectToDashboard(origin: string, role: string) {
  if (role === 'interpreter') return NextResponse.redirect(`${origin}/interpreter/dashboard`);
  if (role === 'deaf') return NextResponse.redirect(`${origin}/dhh/dashboard`);
  return NextResponse.redirect(`${origin}/request/dashboard`);
}
