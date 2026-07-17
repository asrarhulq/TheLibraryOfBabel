'use client';

import { Canvas } from '@react-three/fiber';
import { MapControls, Stars } from '@react-three/drei';
import HexagonalGrid from './HexagonalGrid';

export default function LibraryCanvas() {
  return (
    <div className="w-full h-full bg-babel-dark absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 15, 10], fov: 45 }}>
        <color attach="background" args={['#0d0e12']} />
        
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 20, 10]} intensity={1.5} color="#f4f1ea" />
        <pointLight position={[-10, 5, -10]} intensity={1} color="#d4af37" />

        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <HexagonalGrid />

        <MapControls
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2.1} // Prevent looking completely from below
          minDistance={5}
          maxDistance={50}
        />
      </Canvas>
    </div>
  );
}
