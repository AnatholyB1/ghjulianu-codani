import { updateSession } from '@/utils/supabase/middleware';
import { createServerClient } from '@supabase/ssr';
import { isAdminUser } from '@/lib/server/requireAdmin';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin routes (except /admin/login) and /api/admin. "Admin" = email in ADMIN_EMAILS (fail closed),
  // not just any Supabase user: the project is shared and sign-up is open.
  if ((pathname.startsWith('/admin') && pathname !== '/admin/login') || pathname.startsWith('/api/admin')) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      },
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!isAdminUser(user)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
      }
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|api/track|api/cron|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
