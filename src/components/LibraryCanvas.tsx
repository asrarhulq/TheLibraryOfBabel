'use client';

import { Canvas } from '@react-three/fiber';
import { MapControls, Stars, Sparkles } from '@react-three/drei';
import HexagonalGrid from './HexagonalGrid';

export default function LibraryCanvas() {
  return (
    <div className="w-full h-full bg-babel-void absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 15, 10], fov: 45 }}
        dpr={[1, 1.75]} // cap device-pixel-ratio so 4K/retina screens don't render 4x the pixels
        gl={{ powerPreference: 'high-performance', antialias: true, stencil: false, depth: true }}
      >
        <color attach="background" args={['#08090c']} />
        {/* Atmospheric fog gives the void real depth — distant chambers dissolve into dark. */}
        <fog attach="fog" args={['#08090c', 18, 60]} />

        <ambientLight intensity={0.18} />
        <pointLight position={[10, 20, 10]} intensity={1.6} color="#f4f1ea" />
        <pointLight position={[-10, 5, -10]} intensity={1.1} color="#d4af37" />
        {/* Warm rim light from below lifts the hexagon edges into gold. */}
        <pointLight position={[0, -8, 0]} intensity={0.5} color="#d4af37" />

        <Stars radius={100} depth={50} count={1800} factor={4} saturation={0} fade speed={1} />
        {/* Drifting golden motes — dust in a shaft of library light. */}
        <Sparkles count={40} scale={26} size={2} speed={0.25} opacity={0.5} color="#d4af37" />

        <HexagonalGrid />

        <MapControls
          enableDamping
          dampingFactor={0.08}
          maxPolarAngle={Math.PI / 2.1} // Prevent looking completely from below
          minDistance={5}
          maxDistance={50}
        />
      </Canvas>
    </div>
  );
}
