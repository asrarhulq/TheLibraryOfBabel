'use client';

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { useRouter } from 'next/navigation';

const HEX_RADIUS = 2;
const HEX_HEIGHT = 4;
const HEX_WIDTH = Math.sqrt(3) * HEX_RADIUS;
const HEX_VERT_DIST = 1.5 * HEX_RADIUS;
const GRID_RADIUS = 4; // rings
const LABEL_RING_LIMIT = 2; // only label the inner rings — distant labels are unreadable noise

interface RoomData {
  q: number;
  r: number;
  x: number;
  z: number;
  phase: number; // per-hex float offset
  label: string;
  showLabel: boolean;
}

interface HexRoomProps {
  room: RoomData;
  meshRef: (m: THREE.Mesh | null) => void;
  onClick: () => void;
  onHover: () => void;
}

// Presentational only — no per-hex frame loop. The parent animates all meshes at once.
function HexRoom({ room, meshRef, onClick, onHover }: HexRoomProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={[room.x, 0, room.z]}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
        rotation={[0, Math.PI / 6, 0]}
      >
        <cylinderGeometry args={[HEX_RADIUS, HEX_RADIUS, HEX_HEIGHT, 6]} />
        <meshStandardMaterial
          color={hovered ? '#1a1b22' : '#0d0e12'}
          transparent
          opacity={hovered ? 0.92 : 0.7}
          roughness={0.7}
          emissive={hovered ? '#d4af37' : '#8b6914'}
          emissiveIntensity={hovered ? 0.4 : 0.25}
        />
        <Edges
          scale={1}
          threshold={15}
          color={hovered ? '#e8c547' : '#b8941f'}
        />
      </mesh>

      {room.showLabel && (
        <Text
          position={[0, HEX_HEIGHT / 2 + 0.5, 0]}
          fontSize={0.4}
          color={hovered ? '#d4af37' : '#f4f1ea'}
          anchorX="center"
          anchorY="middle"
          rotation={[-Math.PI / 2, 0, 0]}
        >
          {room.label}
        </Text>
      )}
    </group>
  );
}

export default function HexagonalGrid() {
  const router = useRouter();
  const meshes = useRef<(THREE.Mesh | null)[]>([]);

  // Compute the grid once.
  const rooms = useMemo<RoomData[]>(() => {
    const out: RoomData[] = [];
    for (let q = -GRID_RADIUS; q <= GRID_RADIUS; q++) {
      const r1 = Math.max(-GRID_RADIUS, -q - GRID_RADIUS);
      const r2 = Math.min(GRID_RADIUS, -q + GRID_RADIUS);
      for (let r = r1; r <= r2; r++) {
        const zCoord = Math.abs(q + r);
        const xStr = (q < 0 ? 'm' : '') + Math.abs(q);
        const yStr = (r < 0 ? 'm' : '') + Math.abs(r);
        const ring = (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
        out.push({
          q,
          r,
          x: HEX_WIDTH * (q + r / 2),
          z: HEX_VERT_DIST * r,
          phase: q + r,
          label: `${xStr}-${yStr}-${zCoord}`,
          showLabel: true,
        });
      }
    }
    return out;
  }, []);

  // A SINGLE frame loop drives the float animation for every hexagon.
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const list = meshes.current;
    for (let i = 0; i < list.length; i++) {
      const m = list[i];
      if (m) m.position.y = Math.sin(t * 0.5 + rooms[i].phase) * 0.2;
    }
  });

  return (
    <group>
      {rooms.map((room, i) => (
        <HexRoom
          key={`${room.q}-${room.r}`}
          room={room}
          meshRef={(m) => {
            meshes.current[i] = m;
          }}
          onHover={() => router.prefetch(`/room/${room.label}/1/1/1/1`)}
          onClick={() => router.push(`/room/${room.label}/1/1/1/1`)}
        />
      ))}
    </group>
  );
}
