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
    // Existing user — redirect to their dashboard
    return redirectToDashboard(origin, profile.role);
  }

  // New OAuth user — create profile with the role passed from the login page
  const assignedRole = role ?? 'requester';
  await supabase.from('user_profiles').insert({ id: user.id, role: assignedRole });

  // For interpreter/deaf, also create role-specific profile stub
  if (assignedRole === 'interpreter') {
    await supabase.from('interpreter_profiles').insert({
      user_id: user.id,
      name: user.user_metadata?.full_name ?? user.email ?? 'Interpreter',
      status: 'pending',
    });
  } else if (assignedRole === 'deaf') {
    await supabase.from('deaf_profiles').insert({
      id: user.id,
      name: user.user_metadata?.full_name ?? user.email ?? 'User',
    });
  } else {
    await supabase.from('requester_profiles').insert({
      id: user.id,
      name: user.user_metadata?.full_name ?? user.email ?? 'User',
    });
  }

  return redirectToDashboard(origin, assignedRole);
}

function redirectToDashboard(origin: string, role: string) {
  if (role === 'interpreter') return NextResponse.redirect(`${origin}/interpreter/dashboard`);
  if (role === 'deaf') return NextResponse.redirect(`${origin}/dhh/dashboard`);
  return NextResponse.redirect(`${origin}/request/dashboard`);
}
