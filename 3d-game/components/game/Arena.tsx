"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Grid, Stars } from "@react-three/drei";
import * as THREE from "three";
import { ARENA_R } from "@/lib/game/sim";

export function Arena() {
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const cyanTip = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []);
  const magentaTip = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []);

  const pillars = useMemo(() => {
    const arr: { x: number; z: number; h: number; cyan: boolean }[] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      arr.push({
        x: Math.cos(a) * (ARENA_R + 3.5),
        z: Math.sin(a) * (ARENA_R + 3.5),
        h: 3 + (i % 3),
        cyan: i % 2 === 0,
      });
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pulse = 0.75 + 0.25 * Math.sin(t * 1.8);
    cyanTip.color.setRGB(0.5 * pulse, 2.4 * pulse, 3.0 * pulse);
    magentaTip.color.setRGB(2.6 * pulse, 0.45 * pulse, 1.7 * pulse);
    const rp = 0.8 + 0.2 * Math.sin(t * 1.1);
    ringMat.current?.color.setRGB(0.35 * rp, 1.9 * rp, 2.5 * rp);
  });

  return (
    <group>
      <Stars radius={130} depth={60} count={3500} factor={4.5} saturation={0.4} fade speed={0.5} />

      {/* floor disc */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.02} receiveShadow>
        <circleGeometry args={[ARENA_R + 2, 72]} />
        <meshStandardMaterial color="#07071a" metalness={0.55} roughness={0.5} />
      </mesh>

      <Grid
        position={[0, 0.01, 0]}
        args={[120, 120]}
        cellSize={2}
        cellThickness={0.6}
        cellColor="#16344d"
        sectionSize={8}
        sectionThickness={1.1}
        sectionColor="#1f6f8f"
        fadeDistance={85}
        fadeStrength={1.4}
        infiniteGrid
      />

      {/* boundary ring + wall */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.12}>
        <torusGeometry args={[ARENA_R, 0.12, 8, 96]} />
        <meshBasicMaterial ref={ringMat} toneMapped={false} />
      </mesh>
      <mesh position-y={2}>
        <cylinderGeometry args={[ARENA_R, ARENA_R, 4, 72, 1, true]} />
        <meshBasicMaterial
          color="#0e6f8a"
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* center emblem */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.03}>
        <ringGeometry args={[2.7, 2.9, 48]} />
        <meshBasicMaterial color="#0e3d52" toneMapped={false} transparent opacity={0.8} />
      </mesh>

      {/* perimeter pillars */}
      {pillars.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]}>
          <mesh position-y={p.h / 2}>
            <boxGeometry args={[0.7, p.h, 0.7]} />
            <meshStandardMaterial color="#0b0b1e" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position-y={p.h + 0.18} material={p.cyan ? cyanTip : magentaTip}>
            <boxGeometry args={[0.82, 0.3, 0.82]} />
          </mesh>
        </group>
      ))}

      <ambientLight intensity={0.5} />
      <directionalLight position={[14, 26, 10]} intensity={1.1} color="#bcd2ff" />
      <directionalLight position={[-12, 10, -16]} intensity={0.45} color="#ff3fae" />
    </group>
  );
}
