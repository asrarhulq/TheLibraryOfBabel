'use client';

import React, { useEffect, useState } from 'react';
import { LogIn, LogOut } from 'lucide-react';

interface SessionUser {
  name?: string | null;
  image?: string | null;
  email?: string | null;
}

// Lightweight session reader — hits Auth.js's /api/auth/session endpoint directly so we
// don't need the SessionProvider wrapper around the whole tree.
export default function SignInButton({ variant = 'bar' }: { variant?: 'bar' | 'drawer' }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json().catch(() => null);
        if (!cancelled) setUser(data?.user ?? null);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auth.js v5 requires starting sign-in/out with a POST that includes the CSRF token —
  // a bare GET redirect throws a "Configuration" error. We fetch the token, then submit
  // a form-encoded POST to the correct endpoint and follow the redirect.
  const getCsrf = async (): Promise<string | null> => {
    try {
      // include credentials so the CSRF cookie is set and readable
      const res = await fetch('/api/auth/csrf', { credentials: 'same-origin' });
      const data = await res.json();
      return data?.csrfToken ?? null;
    } catch {
      return null;
    }
  };

  const postAndRedirect = async (url: string, callbackUrl: string) => {
    const csrfToken = await getCsrf();
    if (!csrfToken) return false;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      // credentials:'same-origin' sends the CSRF cookie back, which Auth.js requires —
      // without it the POST is rejected as MissingCSRF.
      credentials: 'same-origin',
      body: new URLSearchParams({ csrfToken, callbackUrl, json: 'true' }),
    });
    // Auth.js returns the URL to visit (Google's consent page) as JSON.
    const data = await res.json().catch(() => null);
    if (data?.url) {
      window.location.href = data.url;
      return true;
    }
    return false;
  };

  const signIn = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // Confirm the google provider is loaded before attempting.
      const providers = await fetch('/api/auth/providers').then((r) => r.json()).catch(() => ({}));
      if (!providers?.google) {
        setConfigured(false);
        return;
      }
      const ok = await postAndRedirect(
        '/api/auth/signin/google',
        `${window.location.origin}${window.location.pathname}`
      );
      if (!ok) setConfigured(false);
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const ok = await postAndRedirect(
        '/api/auth/signout',
        `${window.location.origin}/`
      );
      if (!ok) window.location.reload();
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return null;

  const base =
    variant === 'drawer'
      ? 'flex items-center gap-3 px-5 py-4 border-b border-babel-lines/10 text-sm tracking-widest uppercase w-full'
      : 'flex items-center gap-1 px-3 py-1 rounded border text-xs tracking-wider transition-colors';

  if (user) {
    return (
      <button
        onClick={signOut}
        disabled={busy}
        className={`${base} border-babel-lines/50 text-babel-parchment hover:text-babel-gold disabled:opacity-60`}
        title={user.email || undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {user.image ? (
          <img src={user.image} alt="" className="w-5 h-5 rounded-full" />
        ) : (
          <LogOut size={13} />
        )}
        <span className="truncate max-w-[8rem]">{user.name?.split(' ')[0] || 'Sign out'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={signIn}
      disabled={busy}
      className={`${base} border-babel-lines/50 text-babel-parchment hover:text-babel-gold disabled:opacity-60`}
      title={configured ? 'Sign in with Google' : 'Sign-in not configured yet'}
    >
      <LogIn size={variant === 'drawer' ? 16 : 13} />
      {configured ? (busy ? '...' : 'SIGN IN') : 'SIGN-IN SOON'}
    </button>
  );
}
