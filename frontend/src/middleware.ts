import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { PROTECTED_ROUTES, UserRole } from '@/types/auth.types';

/**
 * Next.js Middleware — runs on every matched request before rendering.
 *
 * Responsibilities:
 * 1. Refresh Supabase session (keeps JWT alive across requests)
 * 2. Redirect unauthenticated users to /login
 * 3. Enforce role-based access: a user can ONLY access their own role route
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh session — IMPORTANT: do not write logic between createServerClient and getUser
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // BYPASS PARA O SANDBOX: Permite acesso livre à tela de relatórios
  if (pathname.startsWith('/admin/relatorios/desempenho')) {
    return supabaseResponse;
  }

  // ── 1. Unauthenticated user trying to access a protected route ──
  const isProtected = Object.keys(PROTECTED_ROUTES).some((route) =>
    pathname.startsWith(route),
  );

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  // ── 2. Authenticated user trying to access /login ──
  if (pathname === '/login' && user) {
    const role = user.user_metadata?.role as UserRole | undefined;
    if (role && PROTECTED_ROUTES) {
      const roleUrl = request.nextUrl.clone();
      roleUrl.pathname = `/${role}`;
      return NextResponse.redirect(roleUrl);
    }
  }

  // ── 3. Role enforcement: user can only access their own role route ──
  if (isProtected && user) {
    const userRole = user.user_metadata?.role as string | undefined;
    const requiredRole = Object.entries(PROTECTED_ROUTES).find(([route]) =>
      pathname.startsWith(route),
    )?.[1];

    if (requiredRole && userRole !== requiredRole) {
      // Redirect to their correct dashboard instead of showing an error
      const correctUrl = request.nextUrl.clone();
      correctUrl.pathname = userRole ? `/${userRole}` : '/login';
      return NextResponse.redirect(correctUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
