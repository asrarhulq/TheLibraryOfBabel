'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { useRouter } from 'next/navigation';

const HEX_RADIUS = 2;
const HEX_HEIGHT = 4;
// Calculate offsets for pointy-topped hexagons
const HEX_WIDTH = Math.sqrt(3) * HEX_RADIUS;
const HEX_VERT_DIST = 1.5 * HEX_RADIUS;

interface HexRoomProps {
  q: number;
  r: number;
  yOffset?: number;
  label: string;
  onClick: () => void;
}

function HexRoom({ q, r, yOffset = 0, label, onClick }: HexRoomProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Calculate 3D position from axial coordinates (q, r)
  const x = HEX_WIDTH * (q + r / 2);
  const z = HEX_VERT_DIST * r;

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle floating animation
      meshRef.current.position.y = yOffset + Math.sin(state.clock.elapsedTime * 0.5 + q + r) * 0.2;
    }
  });

  return (
    <group position={[x, yOffset, z]}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        rotation={[0, Math.PI / 6, 0]} // Rotate to pointy top
      >
        <cylinderGeometry args={[HEX_RADIUS, HEX_RADIUS, HEX_HEIGHT, 6]} />
        <meshStandardMaterial 
          color={hovered ? '#1a1b22' : '#0d0e12'} 
          transparent
          opacity={hovered ? 0.9 : 0.6}
          roughness={0.8}
        />
        <Edges
          linewidth={hovered ? 2 : 1}
          threshold={15}
          color={hovered ? '#d4af37' : 'rgba(212, 175, 55, 0.3)'}
        />
      </mesh>
      
      {/* Label for the room */}
      <Text
        position={[0, HEX_HEIGHT / 2 + 0.5, 0]}
        fontSize={0.4}
        color={hovered ? '#d4af37' : '#f4f1ea'}
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, 0]} // Face upwards
      >
        {label}
      </Text>
    </group>
  );
}

export default function HexagonalGrid() {
  const router = useRouter();
  
  // Generate a grid of rooms around 0,0
  const rooms = [];
  const radius = 4; // Number of rings

  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      // Create an artificial Z coordinate for demonstration
      const zCoord = Math.abs(q + r);
      // Room address format: X-Y-Z
      const xStr = (q < 0 ? 'm' : '') + Math.abs(q);
      const yStr = (r < 0 ? 'm' : '') + Math.abs(r);
      const zStr = zCoord.toString();
      
      const label = `${xStr}-${yStr}-${zStr}`;

      rooms.push(
        <HexRoom
          key={`${q}-${r}`}
          q={q}
          r={r}
          label={label}
          onClick={() => {
            // Navigate to the room's first wall, shelf, book, page
            router.push(`/room/${label}/1/1/1/1`);
          }}
        />
      );
    }
  }

  return <group>{rooms}</group>;
}
