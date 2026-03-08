import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Spark Auth Middleware
 *
 * Handles route protection and auth redirects:
 *
 * - Protected routes (/discover, /matches, /profile, /calls, /tables):
 *   Redirect to /login when no auth token cookie is present.
 *
 * - Auth routes (/login, /register):
 *   Redirect to /discover when token IS present (already logged in).
 *
 * - Public routes (/, /onboarding):
 *   Always accessible regardless of auth state.
 *
 * NOTE: The token cookie (`spark_access_token`) is set by the client-side
 * API client alongside localStorage so that this Edge middleware can read it.
 */

const AUTH_COOKIE_NAME = 'spark_access_token'

/** Routes that require authentication */
const PROTECTED_PREFIXES = ['/discover', '/matches', '/profile', '/calls', '/tables']

/** Routes only for unauthenticated users */
const AUTH_ONLY_PREFIXES = ['/login', '/register']

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function isAuthOnlyRoute(pathname: string): boolean {
  return AUTH_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasToken = request.cookies.has(AUTH_COOKIE_NAME)

  // Unauthenticated user trying to access protected route → login
  if (isProtectedRoute(pathname) && !hasToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated user trying to access login/register → discover
  if (isAuthOnlyRoute(pathname) && hasToken) {
    return NextResponse.redirect(new URL('/discover', request.url))
  }

  return NextResponse.next()
}

export const config = {
  /*
   * Match all routes except:
   * - _next (static files, image optimization)
   * - api (API routes if any)
   * - favicon, static assets
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
