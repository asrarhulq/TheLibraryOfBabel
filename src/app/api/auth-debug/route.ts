// TEMPORARY diagnostic — surfaces the REAL Auth.js configuration error as readable text
// in the browser, so we don't have to dig through Vercel logs. Delete once sign-in works.
export const dynamic = 'force-dynamic';

export async function GET() {
  const report: Record<string, unknown> = {};

  // 1. What does the app see for each env var (presence only)?
  const clean = (v?: string) => (v ? v.trim() : v);
  report.env = {
    AUTH_SECRET: clean(process.env.AUTH_SECRET) ? `present(${clean(process.env.AUTH_SECRET)!.length})` : 'MISSING',
    AUTH_GOOGLE_ID: clean(process.env.AUTH_GOOGLE_ID) ? `present(${clean(process.env.AUTH_GOOGLE_ID)!.length})` : 'MISSING',
    AUTH_GOOGLE_SECRET: clean(process.env.AUTH_GOOGLE_SECRET) ? `present(${clean(process.env.AUTH_GOOGLE_SECRET)!.length})` : 'MISSING',
    AUTH_URL: process.env.AUTH_URL || 'not set',
    id_suffix_ok: (process.env.AUTH_GOOGLE_ID || '').trim().endsWith('.apps.googleusercontent.com'),
    secret_prefix_ok: (process.env.AUTH_GOOGLE_SECRET || '').trim().startsWith('GOCSPX-'),
  };

  // 2. Try to actually initialize Auth.js and read the provider list. Any thrown error
  //    here is the true cause of the Configuration error.
  try {
    const mod = await import('@/auth');
    const session = await mod.auth().catch((e: unknown) => ({ authError: String(e) }));
    report.auth_init = 'ok';
    report.session = session;
  } catch (e: unknown) {
    report.auth_init = 'THREW';
    report.error_message = e instanceof Error ? e.message : String(e);
    report.error_stack = e instanceof Error ? (e.stack || '').split('\n').slice(0, 6) : undefined;
  }

  return Response.json(report, { status: 200 });
}
