// TEMPORARY diagnostic — inspects what the sign-in flow actually returns, so we can see
// why the redirect to Google isn't happening. Delete once sign-in works.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const report: Record<string, unknown> = { origin };

  // 1. Provider list
  try {
    const providers = await fetch(`${origin}/api/auth/providers`).then((r) => r.json());
    report.providers = providers;
  } catch (e) {
    report.providers_error = String(e);
  }

  // 2. CSRF token
  let csrfToken = '';
  try {
    const csrf = await fetch(`${origin}/api/auth/csrf`).then((r) => r.json());
    csrfToken = csrf?.csrfToken || '';
    report.csrf = csrfToken ? `present(${csrfToken.length})` : 'MISSING';
  } catch (e) {
    report.csrf_error = String(e);
  }

  // 3. Perform the exact sign-in POST and show the raw result
  try {
    const res = await fetch(`${origin}/api/auth/signin/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        csrfToken,
        callbackUrl: origin,
        json: 'true',
      }),
      redirect: 'manual',
    });
    report.signin_status = res.status;
    report.signin_location_header = res.headers.get('location') || null;
    const text = await res.text();
    report.signin_body = text.slice(0, 800);
  } catch (e) {
    report.signin_error = String(e);
  }

  return Response.json(report, { status: 200 });
}
