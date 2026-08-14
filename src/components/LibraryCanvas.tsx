'use client';

import { Canvas } from '@react-three/fiber';
import { MapControls, Stars, Sparkles } from '@react-three/drei';
import HexagonalGrid from './HexagonalGrid';
import { useIntroCamera } from './IntroCameraController';

function SceneContent() {
  const introDone = useIntroCamera();

  return (
    <>
      <color attach="background" args={['#08090c']} />
      <fog attach="fog" args={['#08090c', 18, 60]} />

      <ambientLight intensity={0.18} />
      <pointLight position={[10, 20, 10]} intensity={1.6} color="#f4f1ea" />
      <pointLight position={[-10, 5, -10]} intensity={1.1} color="#d4af37" />
      <pointLight position={[0, -8, 0]} intensity={0.5} color="#d4af37" />

      <Stars radius={100} depth={50} count={1800} factor={4} saturation={0} fade speed={1} />
      <Sparkles count={40} scale={26} size={2} speed={0.25} opacity={0.5} color="#d4af37" />

      <HexagonalGrid />

      {introDone && (
        <MapControls
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.8}
          zoomSpeed={0.9}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={5}
          maxDistance={50}
        />
      )}
    </>
  );
}

export default function LibraryCanvas() {
  return (
    <div className="w-full h-full bg-babel-void absolute inset-0 z-0 gpu-accelerated">
      <Canvas
        camera={{ position: [0, 32, 28], fov: 45 }}
        dpr={[1, typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio) : 1.5]}
        gl={{
          powerPreference: 'high-performance',
          antialias: true,
          stencil: false,
          depth: true,
          alpha: false,
        }}
      >
        <SceneContent />
      </Canvas>
    </div>
  );
}