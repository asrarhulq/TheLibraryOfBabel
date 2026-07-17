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

const googleConfigured = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

// Auth.js needs *a* secret to sign session tokens even when no providers are configured;
// without one the /api/auth/* endpoints return 500. Use the real AUTH_SECRET when present,
// otherwise a harmless placeholder so the app never crashes before sign-in is set up.
// (No real sessions are issued until Google is configured, so the placeholder is safe.)
const secret = process.env.AUTH_SECRET || 'babel-unconfigured-placeholder-secret-change-me';

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret,
  providers: googleConfigured
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
      ]
    : [],
  // Stateless JWT sessions — no database adapter needed for sign-in itself.
  session: { strategy: 'jwt' },
  trustHost: true, // required on Vercel / behind a proxy
});

export const isAuthConfigured = googleConfigured;
