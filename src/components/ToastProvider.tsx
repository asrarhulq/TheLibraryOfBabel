'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { ACHIEVEMENT_MAP } from '@/lib/babel/types';

interface Toast {
  id: number;
  icon: string;
  title: string;
  body: string;
  tone: 'achievement' | 'rarity';
}

interface ToastCtx {
  pushAchievements: (ids: string[]) => void;
  pushRarity: (label: string, text: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) return { pushAchievements: () => {}, pushRarity: () => {} };
  return ctx;
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const add = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = ++counter.current;
      setToasts((ts) => [...ts, { ...t, id }]);
      // auto-dismiss
      setTimeout(() => remove(id), t.tone === 'rarity' ? 6000 : 5000);
    },
    [remove]
  );

  const pushAchievements = useCallback(
    (ids: string[]) => {
      (ids || []).forEach((id) => {
        const def = ACHIEVEMENT_MAP[id];
        if (def) add({ icon: def.icon, title: `Achievement — ${def.title}`, body: def.description, tone: 'achievement' });
      });
    },
    [add]
  );

  const pushRarity = useCallback(
    (label: string, text: string) => {
      add({ icon: '✦', title: 'A rarity surfaces', body: `${label}: “${text}”`, tone: 'rarity' });
    },
    [add]
  );

  return (
    <Ctx.Provider value={{ pushAchievements, pushRarity }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => remove(t.id)}
            className={`pointer-events-auto cursor-pointer flex items-start gap-3 p-4 rounded-md border backdrop-blur-md shadow-2xl font-mono babel-toast-in ${
              t.tone === 'rarity'
                ? 'bg-babel-wall/90 border-babel-gold/70 shadow-[0_0_25px_rgba(212,175,55,0.35)]'
                : 'bg-babel-wall/90 border-babel-lines/40'
            }`}
          >
            <span className={`text-2xl leading-none ${t.tone === 'rarity' ? 'drop-shadow-[0_0_10px_rgba(212,175,55,0.9)]' : ''}`}>
              {t.icon}
            </span>
            <div>
              <p className="text-babel-gold text-xs tracking-widest uppercase mb-1">{t.title}</p>
              <p className="text-babel-parchment/85 text-sm leading-snug">{t.body}</p>
            </div>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
