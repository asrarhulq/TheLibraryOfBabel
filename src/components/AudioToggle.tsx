'use client';

import { useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { getEngine } from '@/lib/audio/SoundEngine';

export default function AudioToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const engine = getEngine();
    setEnabled(engine.getEnabled());

    // Register first-interaction listener to unlock audio
    const handleInteraction = () => {
      engine.handleUserInteraction();
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  const handleToggle = useCallback(() => {
    const engine = getEngine();
    engine.handleUserInteraction(); // Ensure context is ready
    const newState = engine.toggle();
    setEnabled(newState);
  }, []);

  return (
    <button 
      onClick={handleToggle}
      className="flex items-center gap-2 hover:text-babel-gold transition-colors duration-300 p-2 rounded-full border border-transparent hover:border-babel-lines/50"
      title={enabled ? "Disable ambient audio" : "Enable ambient audio"}
    >
      {enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
    </button>
  );
}
