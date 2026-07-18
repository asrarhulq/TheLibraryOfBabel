'use client';

import React, { useEffect, useState } from 'react';
import { signIn, signOut } from 'next-auth/react';
import { LogIn, LogOut } from 'lucide-react';

interface SessionUser {
  name?: string | null;
  image?: string | null;
  email?: string | null;
}

// Uses the official next-auth/react helpers, which handle CSRF, cookies and the redirect
// to Google automatically (a hand-rolled POST hits MissingCSRF). Session is read directly
// from the /api/auth/session endpoint so we don't need a SessionProvider wrapper.
export default function SignInButton({ variant = 'bar' }: { variant?: 'bar' | 'drawer' }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'same-origin' });
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

  const doSignIn = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const providers = await fetch('/api/auth/providers', { credentials: 'same-origin' })
        .then((r) => r.json())
        .catch(() => ({}));
      if (!providers?.google) {
        setConfigured(false);
        setBusy(false);
        return;
      }
      // Official helper — manages CSRF + cookies + redirect to Google.
      await signIn('google', { callbackUrl: window.location.pathname });
    } catch {
      setBusy(false);
    }
  };

  const doSignOut = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await signOut({ callbackUrl: '/' });
    } catch {
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
        onClick={doSignOut}
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
      onClick={doSignIn}
      disabled={busy}
      className={`${base} border-babel-lines/50 text-babel-parchment hover:text-babel-gold disabled:opacity-60`}
      title={configured ? 'Sign in with Google' : 'Sign-in not configured yet'}
    >
      <LogIn size={variant === 'drawer' ? 16 : 13} />
      {configured ? (busy ? '...' : 'SIGN IN') : 'SIGN-IN SOON'}
    </button>
  );
}
