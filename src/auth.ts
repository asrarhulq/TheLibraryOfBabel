import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

// Google sign-in via Auth.js (NextAuth v5).
//
// Activates automatically once these env vars are present (locally in .env.local, or in the
// Vercel project's Environment Variables):
//   AUTH_SECRET        — any long random string (run: npx auth secret)
//   AUTH_GOOGLE_ID     — OAuth client ID from Google Cloud Console
//   AUTH_GOOGLE_SECRET — OAuth client secret
//
// Until AUTH_GOOGLE_ID is set, no providers load and nothing crashes — the sign-in UI
// simply reports that sign-in isn't configured yet.

// Trim values defensively — a trailing space/newline from copy-paste in the Vercel dashboard
// is a very common cause of "problem with the server configuration".
const clean = (v: string | undefined) => (typeof v === 'string' ? v.trim() : v);

const googleId = clean(process.env.AUTH_GOOGLE_ID);
const googleSecret = clean(process.env.AUTH_GOOGLE_SECRET);
const googleConfigured = Boolean(googleId && googleSecret);

// Auth.js needs *a* secret to sign session tokens even when no providers are configured;
// without one the /api/auth/* endpoints return 500. Use the real AUTH_SECRET when present,
// otherwise a harmless placeholder so the app never crashes before sign-in is set up.
const secret = clean(process.env.AUTH_SECRET) || 'babel-unconfigured-placeholder-secret-change-me';

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret,
  providers: googleConfigured
    ? [
        Google({
          clientId: googleId,
          clientSecret: googleSecret,
        }),
      ]
    : [],
  // Stateless JWT sessions — no database adapter needed for sign-in itself.
  session: { strategy: 'jwt' },
  trustHost: true, // required on Vercel / behind a proxy
});

export const isAuthConfigured = googleConfigured;
