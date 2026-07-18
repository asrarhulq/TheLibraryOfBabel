'use client';

import { useEffect } from 'react';
import { initSession } from '@/lib/traveler/client';

// Loads the session once on app start (and merges anonymous progress into the account
// on first sign-in). Renders nothing.
export default function SessionInit() {
  useEffect(() => {
    initSession();
  }, []);
  return null;
}
