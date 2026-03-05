import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protected route patterns
  const isInterpreterDashboard = pathname.startsWith('/interpreter/dashboard');
  const isDeafDashboard = pathname.startsWith('/dhh/dashboard');
  const isRequestDashboard = pathname.startsWith('/request/dashboard');
  const isDashboard = isInterpreterDashboard || isDeafDashboard || isRequestDashboard;

  if (isDashboard && !user) {
    // Redirect to appropriate portal login
    let loginPath = '/interpreter/login';
    if (isDeafDashboard) loginPath = '/dhh';
    if (isRequestDashboard) loginPath = '/request/login';
    const url = request.nextUrl.clone();
    url.pathname = loginPath;
    return NextResponse.redirect(url);
  }

  if (isDashboard && user) {
    // Fetch user role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role;

    if (isInterpreterDashboard && role !== 'interpreter') {
      const url = request.nextUrl.clone();
      url.pathname = '/interpreter/login';
      return NextResponse.redirect(url);
    }
    if (isDeafDashboard && role !== 'deaf') {
      const url = request.nextUrl.clone();
      url.pathname = '/dhh';
      return NextResponse.redirect(url);
    }
    if (isRequestDashboard && role !== 'requester' && role !== 'org') {
      const url = request.nextUrl.clone();
      url.pathname = '/request/login';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
