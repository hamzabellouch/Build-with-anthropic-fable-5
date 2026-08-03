// Practice field: terrain, race gates, slalom flags, trees, building with a
// door gap, dive tower, gap wall. Every solid object registers a collider
// mirrored into the physics (src/sim/collision.js shapes).

import * as THREE from 'three';

function grassTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#4a7c3a';
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 14000; i++) {
    const x = Math.random() * 512, y = Math.random() * 512;
    const v = 0.75 + Math.random() * 0.5;
    g.fillStyle = `rgb(${58 * v | 0},${112 * v | 0},${48 * v | 0})`;
    g.fillRect(x, y, 2, 2);
  }
  // mowing stripes
  g.fillStyle = 'rgba(255,255,255,0.045)';
  for (let i = 0; i < 8; i += 2) g.fillRect(i * 64, 0, 64, 512);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(90, 90);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function buildWorld(scene) {
  const colliders = [];
  const gates = [];

  scene.background = new THREE.Color(0x87b5e0);
  scene.fog = new THREE.Fog(0x9cc0e2, 120, 480);

  const hemi = new THREE.HemisphereLight(0xbdd8f5, 0x3d5a2e, 0.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff3df, 2.6);
  sun.position.set(60, 90, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 10; sun.shadow.camera.far = 320;
  sun.shadow.camera.left = -90; sun.shadow.camera.right = 90;
  sun.shadow.camera.top = 90; sun.shadow.camera.bottom = -90;
  sun.shadow.bias = -0.0006;
  scene.add(sun);
  scene.add(sun.target);

  // Ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(900, 900),
    new THREE.MeshLambertMaterial({ map: grassTexture() })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Launch pad
  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 0.9, 0.02, 24),
    new THREE.MeshLambertMaterial({ color: 0x2b2f36 })
  );
  pad.position.set(0, 0.01, 0);
  pad.receiveShadow = true;
  scene.add(pad);
  const padRing = new THREE.Mesh(
    new THREE.RingGeometry(0.7, 0.86, 24),
    new THREE.MeshBasicMaterial({ color: 0xffb300, side: THREE.DoubleSide })
  );
  padRing.rotation.x = -Math.PI / 2;
  padRing.position.y = 0.025;
  scene.add(padRing);

  const mats = {
    post: new THREE.MeshLambertMaterial({ color: 0xe8e8e8 }),
    gateOff: new THREE.MeshLambertMaterial({ color: 0x1577d0, emissive: 0x0a3055 }),
    gateNext: new THREE.MeshLambertMaterial({ color: 0xff9500, emissive: 0xa05500 }),
    trunk: new THREE.MeshLambertMaterial({ color: 0x6b4a2f }),
    leaf: new THREE.MeshLambertMaterial({ color: 0x3a6b2a }),
    flag: new THREE.MeshLambertMaterial({ color: 0xd03030, side: THREE.DoubleSide }),
    wall: new THREE.MeshLambertMaterial({ color: 0xb8a890 }),
    roof: new THREE.MeshLambertMaterial({ color: 0x7d4f38 }),
    steel: new THREE.MeshLambertMaterial({ color: 0x8a939e }),
    rock: new THREE.MeshLambertMaterial({ color: 0x8d8d85 }),
  };

  function addBoxMesh(cx, cy, cz, sx, sy, sz, mat, yaw = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    m.position.set(cx, cy, cz);
    m.rotation.y = yaw;
    m.castShadow = m.receiveShadow = true;
    scene.add(m);
    colliders.push({ type: 'box', c: [cx, cy, cz], h: [sx / 2, sy / 2, sz / 2], yaw });
    return m;
  }
  function addCyl(x, z, r, y0, y1, mat, rTop = null) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop ?? r, r, y1 - y0, 10), mat);
    m.position.set(x, (y0 + y1) / 2, z);
    m.castShadow = m.receiveShadow = true;
    scene.add(m);
    colliders.push({ type: 'cyl', x, z, r, y0, y1 });
    return m;
  }

  // --- Race gates: MultiGP-style 5ft square gates on a loop ---
  // Opening 1.5 x 1.5 m, bottom edge at 0.7 m.
  const gateDefs = [
    { x: 0, z: -28, yaw: 0 },
    { x: 26, z: -52, yaw: -0.9 },
    { x: 55, z: -38, yaw: -2.0 },
    { x: 60, z: -4, yaw: -2.7 },
    { x: 34, z: 20, yaw: 2.6 },
    { x: 6, z: 6, yaw: 1.0 },
  ];
  const W = 1.5, B = 0.7;
  for (let gi = 0; gi < gateDefs.length; gi++) {
    const gd = gateDefs[gi];
    const grp = new THREE.Group();
    grp.position.set(gd.x, 0, gd.z);
    grp.rotation.y = gd.yaw;
    scene.add(grp);
    const frame = [];
    const mk = (px, py, sx, sy) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, 0.07), mats.gateOff.clone());
      m.position.set(px, py, 0);
      m.castShadow = true;
      grp.add(m);
      frame.push(m);
      // collider in world space (yaw-rotated box)
      const cos = Math.cos(gd.yaw), sin = Math.sin(gd.yaw);
      colliders.push({
        type: 'box',
        c: [gd.x + px * cos, py, gd.z - px * sin],
        h: [sx / 2, sy / 2, 0.035],
        yaw: gd.yaw,
      });
    };
    mk(-(W / 2 + 0.05), (B + W + 0.2) / 2, 0.1, B + W + 0.2);     // left post
    mk(+(W / 2 + 0.05), (B + W + 0.2) / 2, 0.1, B + W + 0.2);     // right post
    mk(0, B + W + 0.15, W + 0.2, 0.1);                            // top bar
    mk(0, B - 0.05, W + 0.2, 0.1);                                // bottom bar
    // checkpoint plane: center, normal, in-plane axes
    gates.push({
      idx: gi,
      center: [gd.x, B + W / 2, gd.z],
      normal: [-Math.sin(gd.yaw), 0, -Math.cos(gd.yaw)],
      right: [Math.cos(gd.yaw), 0, -Math.sin(gd.yaw)],
      halfW: W / 2, halfH: W / 2,
      meshes: frame,
    });
  }

  // --- Slalom flags ---
  const flagXs = [-16, -22, -28, -34];
  for (let i = 0; i < flagXs.length; i++) {
    const x = flagXs[i], z = -10 - (i % 2) * 6;
    addCyl(x, z, 0.025, 0, 2.6, mats.post);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.35), mats.flag);
    f.position.set(x + 0.28, 2.35, z);
    scene.add(f);
  }

  // --- Trees ---
  const treePos = [
    [-45, -45], [-52, -20], [-40, 18], [18, 38], [-12, -60], [42, -70],
    [75, -25], [70, 14], [-65, 0], [12, -75], [-25, 42], [50, 42],
  ];
  for (const [x, z] of treePos) {
    const h = 2.6 + Math.random() * 1.8;
    addCyl(x, z, 0.14, 0, h, mats.trunk, 0.10);
    const r = 1.5 + Math.random() * 1.1;
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mats.leaf);
    canopy.position.set(x, h + r * 0.55, z);
    canopy.castShadow = true;
    scene.add(canopy);
    colliders.push({ type: 'sphere', c: [x, h + r * 0.55, z], r });
  }

  // --- Building with a door gap (fly-through) ---
  {
    const bx = -38, bz = -38, w = 7, d = 5, hgt = 3.2, t = 0.18, yaw = 0.5;
    const cos = Math.cos(yaw), sin = Math.sin(yaw);
    const place = (lx, ly, lz, sx, sy, sz, mat) =>
      addBoxMesh(bx + lx * cos + lz * sin, ly, bz - lx * sin + lz * cos, sx, sy, sz, mat, yaw);
    // front wall split around a 1.6 x 2.2 door
    const dw = 1.6, dh = 2.2;
    place(-(w / 4 + dw / 4), hgt / 2, d / 2, w / 2 - dw / 2, hgt, t, mats.wall);
    place(+(w / 4 + dw / 4), hgt / 2, d / 2, w / 2 - dw / 2, hgt, t, mats.wall);
    place(0, (hgt + dh) / 2, d / 2, dw, hgt - dh, t, mats.wall);
    place(0, hgt / 2, -d / 2, w, hgt, t, mats.wall);            // back
    place(-w / 2, hgt / 2, 0, t, hgt, d, mats.wall);            // sides
    place(+w / 2, hgt / 2, 0, t, hgt, d, mats.wall);
    place(0, hgt + 0.06, 0, w + 0.5, 0.12, d + 0.5, mats.roof); // flat roof
  }

  // --- Gap wall: 8 x 4 wall with a 1.1 m square hole at 2 m ---
  {
    const wx = 22, wz = -14, yaw = -0.4, W2 = 8, H2 = 4, hole = 1.1, hy = 2.0, t = 0.15;
    const cos = Math.cos(yaw), sin = Math.sin(yaw);
    const place = (lx, ly, sx, sy) =>
      addBoxMesh(wx + lx * cos, ly, wz - lx * sin, sx, sy, t, mats.wall, yaw);
    place(-(W2 / 4 + hole / 4), H2 / 2, W2 / 2 - hole / 2, H2);
    place(+(W2 / 4 + hole / 4), H2 / 2, W2 / 2 - hole / 2, H2);
    place(0, (hy - hole / 2) / 2, hole, hy - hole / 2);
    place(0, hy + hole / 2 + (H2 - hy - hole / 2) / 2, hole, H2 - hy - hole / 2);
  }

  // --- Dive tower: platform at 12 m ---
  {
    const tx = -8, tz = -64;
    for (const [ox, oz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]])
      addCyl(tx + ox, tz + oz, 0.09, 0, 12, mats.steel);
    addBoxMesh(tx, 12.1, tz, 3.2, 0.2, 3.2, mats.steel);
  }

  // --- Scattered rocks (parallax cues) ---
  for (let i = 0; i < 26; i++) {
    const x = (Math.random() - 0.5) * 160, z = (Math.random() - 0.5) * 160;
    if (Math.hypot(x, z) < 6) continue;
    const r = 0.15 + Math.random() * 0.35;
    const rock = new THREE.Mesh(new THREE.SphereGeometry(r, 7, 6), mats.rock);
    rock.position.set(x, r * 0.4, z);
    rock.castShadow = rock.receiveShadow = true;
    scene.add(rock);
    if (r > 0.25) colliders.push({ type: 'sphere', c: [x, r * 0.4, z], r });
  }

  // Distant treeline ring for horizon depth
  const ringGeo = new THREE.CylinderGeometry(380, 380, 26, 48, 1, true);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x2e4a26, side: THREE.BackSide, fog: true });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = 6;
  scene.add(ring);

  return {
    colliders, gates, sun,
    spawn: { pos: [0, 0.04, 0], yaw: 0 },
    losEye: [0, 1.65, 7],
    setNextGate(i) {
      for (const g of gates)
        for (const m of g.meshes)
          m.material = (g.idx === i) ? mats.gateNext : mats.gateOff;
    },
  };
}

// Segment-vs-gate-plane crossing test for lap timing.
export function gateCrossed(gate, p0, p1) {
  const n = gate.normal, c = gate.center;
  const d0 = (p0[0] - c[0]) * n[0] + (p0[1] - c[1]) * n[1] + (p0[2] - c[2]) * n[2];
  const d1 = (p1[0] - c[0]) * n[0] + (p1[1] - c[1]) * n[1] + (p1[2] - c[2]) * n[2];
  if (d0 * d1 >= 0 || Math.abs(d0 - d1) < 1e-9) return false;
  const t = d0 / (d0 - d1);
  const px = p0[0] + (p1[0] - p0[0]) * t - c[0];
  const py = p0[1] + (p1[1] - p0[1]) * t - c[1];
  const pz = p0[2] + (p1[2] - p0[2]) * t - c[2];
  const r = gate.right;
  const u = px * r[0] + py * r[1] + pz * r[2];
  const v = py;
  return Math.abs(u) <= gate.halfW && Math.abs(v) <= gate.halfH;
}
