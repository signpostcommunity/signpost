export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
      const nameParts = displayName.split(' ');
      await supabase.from('deaf_profiles').insert({
        id: user.id,
        user_id: user.id,
        name: displayName,
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        email: user.email || '',
      });
    }
    return NextResponse.redirect(`${origin}/dhh/dashboard`);
  }

  // Requester — create minimal profile and redirect to dashboard
  const displayName = user.user_metadata?.full_name ?? user.email ?? 'User';
  const { data: existing } = await supabase
    .from('requester_profiles').select('id').eq('id', user.id).maybeSingle();
  if (!existing) {
    await supabase.from('requester_profiles').insert({
      id: user.id,
      name: displayName,
    });
  }
  return NextResponse.redirect(`${origin}/request/dashboard`);
}

function redirectToDashboard(origin: string, role: string) {
  if (role === 'interpreter') return NextResponse.redirect(`${origin}/interpreter/dashboard`);
  if (role === 'deaf') return NextResponse.redirect(`${origin}/dhh/dashboard`);
  return NextResponse.redirect(`${origin}/request/dashboard`);
}
