'use client';

import { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const INTRO_DURATION = 5; // seconds

/**
 * Orbits the camera around the grid during the first few seconds, then
 * hands control to the parent MapControls by setting `introDone`.
 * Parent renders MapControls only after introDone is true.
 */
export function useIntroCamera(): boolean {
  const { camera } = useThree();
  const [introDone, setIntroDone] = useState(false);
  const startRef = useRef<number | null>(null);

  useFrame((state) => {
    if (introDone) return;

    const elapsed = startRef.current !== null ? state.clock.elapsedTime - startRef.current : 0;
    if (startRef.current === null) {
      startRef.current = state.clock.elapsedTime;
      camera.position.set(0, 32, 28);
      camera.lookAt(0, 0, 0);
      return;
    }

    const t = Math.min(elapsed / INTRO_DURATION, 1.0);
    const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic

    // Slowly orbit around while descending
    const orbitAngle = t * Math.PI * 1.8;
    const orbitRadius = 8 * (1 - ease) + 0 * ease;

    camera.position.set(
      Math.sin(orbitAngle) * orbitRadius * 1.5,
      THREE.MathUtils.lerp(32, 15, ease),
      THREE.MathUtils.lerp(28, 10, ease) + Math.cos(orbitAngle) * orbitRadius,
    );
    camera.lookAt(0, 0, 0);

    if (t >= 1.0) {
      setIntroDone(true);
      camera.position.set(0, 15, 10);
      camera.lookAt(0, 0, 0);
    }
  });

  return introDone;
}