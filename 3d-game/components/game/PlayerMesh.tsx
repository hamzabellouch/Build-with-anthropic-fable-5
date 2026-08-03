"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Trail } from "@react-three/drei";
import * as THREE from "three";
import { sim } from "@/lib/game/sim";
import { useGame } from "@/lib/game/store";

export function PlayerMesh() {
  const outer = useRef<THREE.Group>(null);   // position + yaw
  const inner = useRef<THREE.Group>(null);   // bank roll
  const engine = useRef<THREE.Mesh>(null);
  const shieldMat = useRef<THREE.MeshBasicMaterial>(null);
  const shieldMesh = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const g = outer.current;
    if (!g) return;
    const phase = useGame.getState().phase;
    const t = clock.elapsedTime;

    const inGame = phase === "playing" || phase === "paused";
    const visible = inGame && !sim.dead;
    g.visible = visible;
    if (light.current) light.current.intensity = visible ? 9 : 0;
    if (!visible) return;

    g.position.set(sim.px, 0.85 + Math.sin(t * 3) * 0.06, sim.pz);
    g.rotation.y = Math.atan2(-sim.aimZ, sim.aimX);

    // bank into lateral motion
    if (inner.current) {
      const lat = sim.aimX * sim.pvz - sim.aimZ * sim.pvx;
      inner.current.rotation.x = THREE.MathUtils.lerp(inner.current.rotation.x, THREE.MathUtils.clamp(lat * 0.045, -0.6, 0.6), 0.15);
    }

    // i-frame blink
    if (inner.current) {
      inner.current.visible = sim.iframes <= 0 || Math.sin(t * 42) > -0.4;
    }

    // engine flare scales with speed
    if (engine.current) {
      const sp = Math.hypot(sim.pvx, sim.pvz);
      const s = 0.85 + (sp / 13) * 0.7 + Math.sin(t * 27) * 0.12;
      engine.current.scale.setScalar(s);
    }

    // shield bubble
    if (shieldMat.current && shieldMesh.current) {
      const sh = sim.shield;
      const on = sh > 0 && (sh > 1.5 || Math.sin(t * 16) > -0.2);
      shieldMesh.current.visible = on;
      if (on) {
        shieldMat.current.opacity = 0.16 + 0.08 * Math.sin(t * 7);
        shieldMesh.current.scale.setScalar(1 + 0.05 * Math.sin(t * 5));
      }
    }
  });

  return (
    <group ref={outer} visible={false}>
      <group ref={inner}>
        {/* hull — points along +x */}
        <mesh rotation-z={-Math.PI / 2}>
          <coneGeometry args={[0.52, 1.75, 8]} />
          <meshStandardMaterial color="#d7f3ff" emissive="#1faedd" emissiveIntensity={0.7} metalness={0.7} roughness={0.25} />
        </mesh>
        {/* swept wings */}
        <mesh position={[-0.45, 0, 0.55]} rotation-y={0.55}>
          <boxGeometry args={[1.0, 0.09, 0.34]} />
          <meshStandardMaterial color="#16344a" emissive="#0e7fa8" emissiveIntensity={0.9} metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[-0.45, 0, -0.55]} rotation-y={-0.55}>
          <boxGeometry args={[1.0, 0.09, 0.34]} />
          <meshStandardMaterial color="#16344a" emissive="#0e7fa8" emissiveIntensity={0.9} metalness={0.6} roughness={0.3} />
        </mesh>
        {/* wingtip lights */}
        <mesh position={[-0.78, 0, 0.92]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshBasicMaterial color={[2.8, 0.5, 1.8]} toneMapped={false} />
        </mesh>
        <mesh position={[-0.78, 0, -0.92]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshBasicMaterial color={[2.8, 0.5, 1.8]} toneMapped={false} />
        </mesh>
        {/* engine glow */}
        <Trail width={2.4} length={5.5} color={new THREE.Color(0.25, 1.4, 1.9)} attenuation={(w) => w * w} decay={1.2}>
          <mesh ref={engine} position={[-0.95, 0, 0]}>
            <sphereGeometry args={[0.2, 10, 10]} />
            <meshBasicMaterial color={[1.2, 5.0, 6.5]} toneMapped={false} />
          </mesh>
        </Trail>
      </group>

      {/* shield bubble */}
      <mesh ref={shieldMesh} visible={false}>
        <sphereGeometry args={[1.5, 24, 24]} />
        <meshBasicMaterial
          ref={shieldMat}
          color={[0.5, 1.4, 3.4]}
          toneMapped={false}
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <pointLight ref={light} color="#35d6ff" intensity={9} distance={11} position={[0, 0.6, 0]} />
    </group>
  );
}
