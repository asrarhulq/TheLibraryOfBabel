import { auth } from '@/auth';
import { NextResponse } from 'next/server';

// Paths that are always public (auth flow, API endpoints used during sign-in, static assets).
const PUBLIC_PREFIXES = [
  '/api/auth/',
  '/_next/',
  '/favicon.ico',
  '/icon.svg',
  '/file.svg',
  '/globe.svg',
  '/next.svg',
  '/vercel.svg',
  '/window.svg',
];

// In dev mode or before Google OAuth is configured, bypass the auth gate entirely
// so the site remains usable. Set AUTH_REQUIRED=true in production to enforce sign-in.
function authConfigured(): boolean {
  if (process.env.AUTH_REQUIRED === 'true') return true;
  const id = (process.env.AUTH_GOOGLE_ID || '').trim();
  const secret = (process.env.AUTH_GOOGLE_SECRET || '').trim();
  return Boolean(id && secret);
}

// Wrap the Auth.js edge-compatible middleware.
export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public paths through without a session.
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // If auth isn't configured yet, let everyone through (dev / setup mode).
  if (!authConfigured()) {
    return NextResponse.next();
  }

  // Gated: must be signed in.
  if (!req.auth?.user) {
    const signInUrl = new URL('/api/auth/signin', req.url);
    signInUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

// Only run middleware on pages (not on static files or internal Next.js chunks).
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)'],
};
