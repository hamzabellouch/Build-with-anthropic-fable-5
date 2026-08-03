"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sim, ENEMY_DEFS, PICKUP_COLORS, type EnemyKind, type PickupKind } from "@/lib/game/sim";

const dummy = new THREE.Object3D();
const tmpColor = new THREE.Color();

const MAX_ENEMIES = 70;
const MAX_BULLETS = 160;
const MAX_EBULLETS = 80;
const MAX_PICKUPS = 32;
const MAX_PARTICLES = 720;
const MAX_WAVES = 24;

function hide(mesh: THREE.InstancedMesh, from: number) {
  // count is enough — but keep stale matrices from flashing on resize
  mesh.count = from;
  mesh.instanceMatrix.needsUpdate = true;
}

/* ---------------- enemies: one instanced mesh per kind ---------------- */

const ENEMY_GEOMS: { kind: EnemyKind; geo: THREE.BufferGeometry; ry: number }[] = [
  { kind: "chaser", geo: new THREE.OctahedronGeometry(0.85, 0), ry: 0 },
  { kind: "speeder", geo: new THREE.TetrahedronGeometry(0.8, 0), ry: 0 },
  { kind: "splitter", geo: new THREE.IcosahedronGeometry(1.05, 0), ry: 0 },
  { kind: "mini", geo: new THREE.IcosahedronGeometry(0.5, 0), ry: 0 },
  { kind: "shooter", geo: new THREE.TorusGeometry(0.72, 0.24, 8, 6), ry: 1 },
  { kind: "tank", geo: new THREE.DodecahedronGeometry(1.55, 0), ry: 0 },
];

function EnemyKindMesh({ kind, geo, flat }: { kind: EnemyKind; geo: THREE.BufferGeometry; flat: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const def = ENEMY_DEFS[kind];

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = clock.elapsedTime;
    let n = 0;
    for (const e of sim.enemies) {
      if (e.kind !== kind || e.spawnT > 0 || n >= MAX_ENEMIES) continue;
      const grow = Math.min(1, e.age / 0.3);
      const scale = grow * (1 + e.flash * 0.25);
      dummy.position.set(e.x, 0.95 + Math.sin(t * 2 + e.seed * 6) * 0.12, e.z);
      if (flat) {
        dummy.rotation.set(Math.PI / 2, 0, t * e.seed * 1.4);
      } else {
        dummy.rotation.set(t * e.seed, t * e.seed * 1.35, 0);
      }
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(n, dummy.matrix);
      const f = e.flash;
      tmpColor.setRGB(
        def.color[0] + (5 - def.color[0]) * f,
        def.color[1] + (5 - def.color[1]) * f,
        def.color[2] + (5 - def.color[2]) * f
      );
      mesh.setColorAt(n, tmpColor);
      n++;
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[geo, undefined, MAX_ENEMIES]} frustumCulled={false}>
      <meshStandardMaterial flatShading toneMapped={false} metalness={0.15} roughness={0.45} />
    </instancedMesh>
  );
}

export function Enemies() {
  return (
    <>
      {ENEMY_GEOMS.map((cfg) => (
        <EnemyKindMesh key={cfg.kind} kind={cfg.kind} geo={cfg.geo} flat={cfg.ry === 1} />
      ))}
      <SpawnRings />
    </>
  );
}

/* ---------------- spawn warning rings ---------------- */

function SpawnRings() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.TorusGeometry(1, 0.07, 6, 28), []);

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = clock.elapsedTime;
    let n = 0;
    for (const e of sim.enemies) {
      if (e.spawnT <= 0 || n >= MAX_ENEMIES) continue;
      const p = 1 - e.spawnT; // 0 -> 1 as spawn approaches
      dummy.position.set(e.x, 0.06, e.z);
      dummy.rotation.set(Math.PI / 2, 0, 0);
      dummy.scale.setScalar(e.r * (2.6 - p * 1.2) * (1 + 0.1 * Math.sin(t * 14)));
      dummy.updateMatrix();
      mesh.setMatrixAt(n, dummy.matrix);
      const def = ENEMY_DEFS[e.kind];
      const glow = 0.3 + p * 0.9;
      tmpColor.setRGB(def.color[0] * glow, def.color[1] * glow, def.color[2] * glow);
      mesh.setColorAt(n, tmpColor);
      n++;
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[geo, undefined, MAX_ENEMIES]} frustumCulled={false}>
      <meshBasicMaterial toneMapped={false} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  );
}

/* ---------------- bullets ---------------- */

export function Bullets() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.SphereGeometry(0.22, 8, 8), []);

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    let n = 0;
    for (const b of sim.bullets) {
      if (n >= MAX_BULLETS) break;
      dummy.position.set(b.x, 0.85, b.z);
      dummy.rotation.set(0, Math.atan2(-b.vz, b.vx), 0);
      dummy.scale.set(2.2, 0.65, 0.65);
      dummy.updateMatrix();
      mesh.setMatrixAt(n, dummy.matrix);
      n++;
    }
    hide(mesh, n);
  });

  return (
    <instancedMesh ref={ref} args={[geo, undefined, MAX_BULLETS]} frustumCulled={false}>
      <meshBasicMaterial color={[0.8, 3.4, 4.2]} toneMapped={false} />
    </instancedMesh>
  );
}

export function EnemyBullets() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.SphereGeometry(0.3, 10, 10), []);

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = clock.elapsedTime;
    let n = 0;
    for (const b of sim.ebullets) {
      if (n >= MAX_EBULLETS) break;
      dummy.position.set(b.x, 0.85, b.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1 + 0.18 * Math.sin(t * 12 + n));
      dummy.updateMatrix();
      mesh.setMatrixAt(n, dummy.matrix);
      n++;
    }
    hide(mesh, n);
  });

  return (
    <instancedMesh ref={ref} args={[geo, undefined, MAX_EBULLETS]} frustumCulled={false}>
      <meshBasicMaterial color={[4.2, 1.1, 0.4]} toneMapped={false} />
    </instancedMesh>
  );
}

/* ---------------- pickups ---------------- */

const PICKUP_GEOMS: { kind: PickupKind; geo: THREE.BufferGeometry }[] = [
  { kind: "shard", geo: new THREE.OctahedronGeometry(0.3, 0) },
  { kind: "heal", geo: new THREE.SphereGeometry(0.32, 10, 10) },
  { kind: "triple", geo: new THREE.ConeGeometry(0.3, 0.62, 4) },
  { kind: "rapid", geo: new THREE.BoxGeometry(0.42, 0.42, 0.42) },
  { kind: "shield", geo: new THREE.TorusGeometry(0.32, 0.12, 6, 14) },
];

function PickupKindMesh({ kind, geo }: { kind: PickupKind; geo: THREE.BufferGeometry }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const color = PICKUP_COLORS[kind];

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = clock.elapsedTime;
    let n = 0;
    for (const p of sim.pickups) {
      if (p.kind !== kind || n >= MAX_PICKUPS) continue;
      // expiry flicker
      if (p.life < 3 && Math.sin(t * 14 + p.seed) > 0.35) continue;
      dummy.position.set(p.x, 0.75 + Math.sin(t * 2.5 + p.seed) * 0.2, p.z);
      dummy.rotation.set(0, t * 2.2 + p.seed, kind === "shield" ? Math.PI / 2 : 0);
      const pop = p.life > 11.6 ? (12 - p.life) / 0.4 : 1;
      dummy.scale.setScalar(pop * (1 + 0.12 * Math.sin(t * 4 + p.seed)));
      dummy.updateMatrix();
      mesh.setMatrixAt(n, dummy.matrix);
      n++;
    }
    hide(mesh, n);
  });

  return (
    <instancedMesh ref={ref} args={[geo, undefined, MAX_PICKUPS]} frustumCulled={false}>
      <meshBasicMaterial color={color} toneMapped={false} />
    </instancedMesh>
  );
}

export function Pickups() {
  return (
    <>
      {PICKUP_GEOMS.map((cfg) => (
        <PickupKindMesh key={cfg.kind} kind={cfg.kind} geo={cfg.geo} />
      ))}
    </>
  );
}

/* ---------------- particles + shockwaves ---------------- */

export function Particles() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.TetrahedronGeometry(1, 0), []);

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    let n = 0;
    for (const p of sim.particles) {
      if (n >= MAX_PARTICLES) break;
      const fade = p.life / p.maxLife;
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.vx, p.vy + p.life * 9, p.vz);
      dummy.scale.setScalar(p.size * (0.4 + fade * 0.6));
      dummy.updateMatrix();
      mesh.setMatrixAt(n, dummy.matrix);
      tmpColor.setRGB(p.cr * fade, p.cg * fade, p.cb * fade);
      mesh.setColorAt(n, tmpColor);
      n++;
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[geo, undefined, MAX_PARTICLES]} frustumCulled={false}>
      <meshBasicMaterial toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} transparent />
    </instancedMesh>
  );
}

export function Shockwaves() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.TorusGeometry(1, 0.06, 6, 40), []);

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    let n = 0;
    for (const w of sim.shockwaves) {
      if (n >= MAX_WAVES) break;
      const p = 1 - w.life / w.maxLife; // 0 -> 1
      const r = w.maxR * (1 - (1 - p) * (1 - p));
      dummy.position.set(w.x, 0.4, w.z);
      dummy.rotation.set(Math.PI / 2, 0, 0);
      dummy.scale.set(Math.max(0.01, r), Math.max(0.01, r), 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(n, dummy.matrix);
      const fade = w.life / w.maxLife;
      tmpColor.setRGB(w.cr * fade, w.cg * fade, w.cb * fade);
      mesh.setColorAt(n, tmpColor);
      n++;
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[geo, undefined, MAX_WAVES]} frustumCulled={false}>
      <meshBasicMaterial toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} transparent />
    </instancedMesh>
  );
}
