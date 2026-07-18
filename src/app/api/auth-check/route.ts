// TEMPORARY diagnostic: reports whether the auth env vars are visible to the running
// server, WITHOUT revealing their values. Delete this route once sign-in works.
export const dynamic = 'force-dynamic';

function status(v: string | undefined) {
  if (!v) return 'MISSING';
  const t = v.trim();
  if (t.length === 0) return 'EMPTY';
  return `present (len ${t.length})`;
}

export async function GET() {
  return Response.json({
    AUTH_SECRET: status(process.env.AUTH_SECRET),
    AUTH_GOOGLE_ID: status(process.env.AUTH_GOOGLE_ID),
    AUTH_GOOGLE_SECRET: status(process.env.AUTH_GOOGLE_SECRET),
    // sanity hints without leaking secrets:
    google_id_looks_valid: (process.env.AUTH_GOOGLE_ID || '').includes('.apps.googleusercontent.com'),
    google_secret_prefix_ok: (process.env.AUTH_GOOGLE_SECRET || '').trim().startsWith('GOCSPX-'),
    NODE_ENV: process.env.NODE_ENV,
  });
}
