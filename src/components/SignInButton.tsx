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

  const signIn = async () => {
    // Probe whether providers exist; if not, tell the user instead of a dead redirect.
    try {
      const res = await fetch('/api/auth/providers');
      const providers = await res.json().catch(() => ({}));
      if (!providers || !providers.google) {
        setConfigured(false);
        return;
      }
    } catch {
      setConfigured(false);
      return;
    }
    window.location.href = `/api/auth/signin/google?callbackUrl=${encodeURIComponent(
      window.location.pathname
    )}`;
  };

  const signOut = () => {
    window.location.href = `/api/auth/signout?callbackUrl=${encodeURIComponent(
      window.location.pathname
    )}`;
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
        className={`${base} border-babel-lines/50 text-babel-parchment hover:text-babel-gold`}
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
      className={`${base} border-babel-lines/50 text-babel-parchment hover:text-babel-gold`}
      title={configured ? 'Sign in with Google' : 'Sign-in not configured yet'}
    >
      <LogIn size={variant === 'drawer' ? 16 : 13} />
      {configured ? 'SIGN IN' : 'SIGN-IN SOON'}
    </button>
  );
}
