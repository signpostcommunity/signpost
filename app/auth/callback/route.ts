export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { seedInterpreterData } from '@/lib/seedInterpreterData';

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
    // Existing user — redirect to their dashboard
    return redirectToDashboard(origin, profile.role);
  }

  // New OAuth user — create profile with the role passed from the login page
  const assignedRole = role ?? 'requester';
  await supabase.from('user_profiles').upsert(
    { id: user.id, role: assignedRole },
    { onConflict: 'id' }
  );

  // For interpreter/deaf, also create role-specific profile stub (ignore if exists)
  const displayName = user.user_metadata?.full_name ?? user.email ?? 'User';
  if (assignedRole === 'interpreter') {
    const { data: existing } = await supabase
      .from('interpreter_profiles').select('id').eq('user_id', user.id).maybeSingle();
    if (!existing) {
      const { data: newProfile, error: insertErr } = await supabase
        .from('interpreter_profiles')
        .insert({
          user_id: user.id,
          name: displayName,
          status: 'pending',
        })
        .select('id')
        .single();

      if (insertErr) {
        console.error('[auth/callback] interpreter_profiles insert error:', insertErr.message, insertErr.code);
      }

      // BETA: seed demo data for new interpreters
      if (newProfile?.id) {
        try {
          const seedResult = await seedInterpreterData(newProfile.id);
          if (!seedResult.success) {
            console.error('[auth/callback] seed returned error:', seedResult.error);
          }
        } catch (e) {
          console.error('[auth/callback] seed threw:', e instanceof Error ? e.message : e);
        }
      } else {
        console.error('[auth/callback] no profile ID after insert — seed skipped. insertErr:', insertErr?.message, 'newProfile:', newProfile);
      }
    }
  } else if (assignedRole === 'deaf') {
    const { data: existing } = await supabase
      .from('deaf_profiles').select('id').eq('id', user.id).maybeSingle();
    if (!existing) {
      await supabase.from('deaf_profiles').insert({
        id: user.id,
        name: displayName,
      });
    }
  } else {
    const { data: existing } = await supabase
      .from('requester_profiles').select('id').eq('id', user.id).maybeSingle();
    if (!existing) {
      await supabase.from('requester_profiles').insert({
        id: user.id,
        name: displayName,
      });
    }
  }

  return redirectToDashboard(origin, assignedRole);
}

function redirectToDashboard(origin: string, role: string) {
  if (role === 'interpreter') return NextResponse.redirect(`${origin}/interpreter/dashboard`);
  if (role === 'deaf') return NextResponse.redirect(`${origin}/dhh/dashboard`);
  return NextResponse.redirect(`${origin}/request/dashboard`);
}
