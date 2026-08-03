// World: analytic terrain (single source of truth for physics + visuals),
// sky dome shader, airport with marked runway & PAPI, instanced scenery,
// drifting clouds, water, and particle effects.

import * as THREE from 'three';
import { clamp, lerp, smoothstep, fbm2, ridge2, valueNoise2, mulberry32, DEG2RAD } from './util.js';

export const FIELD_ELEV = 14;
export const WATER_Y = 0.6;

// Runway: along Z axis, centered at origin. North = -Z. Threshold 36 at z=+620.
const RWY_HALF_LEN = 700, RWY_HALF_W = 15.5;
const APRON = { x0: 24, x1: 110, z0: -60, z1: 140 };
const TAXI = { x0: 15.5, x1: 30, z0: -40, z1: 40 };

// ---------------------------------------------------------------------------
// Terrain height (analytic — used by physics and mesh generation)
// ---------------------------------------------------------------------------
function rawTerrain(x, z) {
  let h = (fbm2(x * 0.00035 + 3.7, z * 0.00035 + 1.2, 4) - 0.35) * 130;
  const r = Math.hypot(x, z);
  const mMask = smoothstep(5500, 12000, r) * (0.35 + 0.65 * valueNoise2(x * 0.00006 + 9, z * 0.00006 + 4));
  if (mMask > 0.001) h += ridge2(x * 0.00011 + 17.3, z * 0.00011 + 8.1, 4) * 1250 * mMask;
  const dN = Math.hypot(x - 1500, z + 13000);
  h += Math.exp(-(dN * dN) / (2 * 2800 * 2800)) * 950;          // landmark peak north
  const dL = Math.hypot(x + 4200, z - 3000);
  h -= smoothstep(2600, 600, dL) * 95;                          // lake SW
  const dL2 = Math.hypot(x - 7000, z - 500);
  h -= smoothstep(2200, 400, dL2) * 75;                         // lake E
  h -= smoothstep(20000, 32000, r) * 180;                       // ocean rim
  return h;
}

export function terrainHeight(x, z) {
  const rAir = Math.hypot(x * 1.6, z * 0.75);
  const t = smoothstep(1500, 3200, rAir);
  if (t <= 0) return FIELD_ELEV;
  return lerp(FIELD_ELEV, FIELD_ELEV + rawTerrain(x, z), t);
}

function isAsphalt(x, z) {
  if (Math.abs(x) <= RWY_HALF_W && Math.abs(z) <= RWY_HALF_LEN) return true;
  if (x >= TAXI.x0 && x <= TAXI.x1 && z >= TAXI.z0 && z <= TAXI.z1) return true;
  if (x >= APRON.x0 && x <= APRON.x1 && z >= APRON.z0 && z <= APRON.z1) return true;
  return false;
}

const _ti = { h: 0, surface: 'grass' };
export function terrainInfo(x, z) {
  if (isAsphalt(x, z)) { _ti.h = FIELD_ELEV; _ti.surface = 'runway'; return _ti; }
  let h = terrainHeight(x, z);
  if (h < WATER_Y) { _ti.h = WATER_Y; _ti.surface = 'water'; return _ti; }
  // grass micro-roughness (physics only — too fine for the visual mesh)
  h += (valueNoise2(x * 0.35, z * 0.35) - 0.5) * 0.34;
  _ti.h = h; _ti.surface = 'grass';
  return _ti;
}

// ---------------------------------------------------------------------------
// Terrain mesh rings with vertex colours
// ---------------------------------------------------------------------------
const _c = new THREE.Color();
function terrainColor(h, slope, x, z, out) {
  const n = fbm2(x * 0.002 + 8, z * 0.002 + 2, 3);
  const n2 = fbm2(x * 0.011 + 4, z * 0.011 + 7, 2);
  const forest = smoothstep(0.50, 0.60, fbm2(x * 0.0008 + 21, z * 0.0008 + 13, 3));
  // grass: meadow -> dry field patchwork
  out.setRGB(0.21, 0.37, 0.13).lerp(_c.setRGB(0.46, 0.50, 0.21), n * 0.9);
  out.lerp(_c.setRGB(0.55, 0.50, 0.28), smoothstep(0.62, 0.78, n2) * 0.5);  // dry patches
  out.lerp(_c.setRGB(0.08, 0.20, 0.07), forest * 0.85);
  // sand near water
  const sand = smoothstep(3.5, 1.0, h);
  if (sand > 0) out.lerp(_c.setRGB(0.74, 0.68, 0.48), sand * 0.9);
  // rock by slope & altitude
  const rock = Math.max(smoothstep(0.42, 0.72, slope), smoothstep(430, 680, h) * 0.85);
  out.lerp(_c.setRGB(0.40, 0.37, 0.34).lerp(_c.clone().setRGB(0.55, 0.52, 0.48), n2), rock);
  // snow
  const snow = smoothstep(760, 960 + 140 * n, h) * smoothstep(0.95, 0.5, slope);
  out.lerp(_c.setRGB(0.92, 0.94, 0.97), snow);
  return out;
}

function buildTerrainRing(size, segments, holeHalf) {
  const half = size / 2, step = size / segments;
  const positions = [], colors = [], indices = [];
  const idxGrid = new Int32Array((segments + 1) * (segments + 1)).fill(-1);
  const col = new THREE.Color();
  let vi = 0;
  for (let j = 0; j <= segments; j++) {
    for (let i = 0; i <= segments; i++) {
      const x = -half + i * step, z = -half + j * step;
      if (holeHalf > 0 && Math.abs(x) < holeHalf - step && Math.abs(z) < holeHalf - step) continue;
      const h = terrainHeight(x, z);
      const hx = terrainHeight(x + step * 0.6, z) - terrainHeight(x - step * 0.6, z);
      const hz = terrainHeight(x, z + step * 0.6) - terrainHeight(x, z - step * 0.6);
      const slope = Math.hypot(hx, hz) / (1.2 * step);
      positions.push(x, h, z);
      terrainColor(h, slope, x, z, col);
      colors.push(col.r, col.g, col.b);
      idxGrid[j * (segments + 1) + i] = vi++;
    }
  }
  for (let j = 0; j < segments; j++) {
    for (let i = 0; i < segments; i++) {
      const a = idxGrid[j * (segments + 1) + i];
      const b = idxGrid[j * (segments + 1) + i + 1];
      const c2 = idxGrid[(j + 1) * (segments + 1) + i];
      const d = idxGrid[(j + 1) * (segments + 1) + i + 1];
      if (a < 0 || b < 0 || c2 < 0 || d < 0) continue;
      indices.push(a, c2, b, b, c2, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}

// ---------------------------------------------------------------------------
// Sky dome
// ---------------------------------------------------------------------------
function buildSky(sunDir) {
  const geo = new THREE.SphereGeometry(42000, 32, 18);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      sunDir: { value: sunDir.clone() },
      zenith: { value: new THREE.Color(0x2a64b8) },
      horizon: { value: new THREE.Color(0xcfe2ee) },
      sunCol: { value: new THREE.Color(0xfff4d6) },
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww; // pin to far plane
      }`,
    fragmentShader: `
      varying vec3 vDir;
      uniform vec3 sunDir, zenith, horizon, sunCol;
      void main() {
        float h = max(vDir.y, 0.0);
        vec3 sky = mix(horizon, zenith, pow(h, 0.42));
        float belowFade = smoothstep(0.0, -0.12, vDir.y);
        sky = mix(sky, horizon * 0.85, belowFade);
        float sd = dot(vDir, sunDir);
        sky += sunCol * (pow(max(sd, 0.0), 900.0) * 1.6 + pow(max(sd, 0.0), 80.0) * 0.18);
        gl_FragColor = vec4(sky, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  return mesh;
}

// ---------------------------------------------------------------------------
// Clouds: instanced soft billboards
// ---------------------------------------------------------------------------
function cloudTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const rnd = mulberry32(7);
  // one cohesive cumulus blob: large core + clustered lobes
  const puffs = [[128, 138, 78]];
  for (let i = 0; i < 7; i++) {
    const a = rnd() * Math.PI * 2;
    puffs.push([128 + Math.cos(a) * (30 + rnd() * 34), 138 + Math.sin(a) * 18 - rnd() * 26, 36 + rnd() * 34]);
  }
  for (const [x, y, r] of puffs) {
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(255,255,255,0.62)');
    grad.addColorStop(0.55, 'rgba(250,251,255,0.34)');
    grad.addColorStop(1, 'rgba(245,248,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildClouds() {
  const CLUSTERS = 90, PER = 4;
  const COUNT = CLUSTERS * PER;
  const rnd = mulberry32(42);
  const base = new THREE.PlaneGeometry(1, 1);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = base.index;
  geo.attributes.position = base.attributes.position;
  geo.attributes.uv = base.attributes.uv;
  const inst = new Float32Array(COUNT * 4);
  let i = 0;
  for (let c = 0; c < CLUSTERS; c++) {
    const cx = (rnd() - 0.5) * 36000;
    const cz = (rnd() - 0.5) * 36000;
    const cy = 1500 + rnd() * 1500;
    const cs = 800 + rnd() * 1300;                     // cluster scale
    for (let p = 0; p < PER; p++, i++) {
      inst[i * 4 + 0] = cx + (rnd() - 0.5) * cs * 0.9;
      inst[i * 4 + 1] = cy + (rnd() - 0.5) * 160;
      inst[i * 4 + 2] = cz + (rnd() - 0.5) * cs * 0.9;
      inst[i * 4 + 3] = cs * (0.55 + rnd() * 0.55);
    }
  }
  geo.setAttribute('inst', new THREE.InstancedBufferAttribute(inst, 4));
  geo.instanceCount = COUNT;
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: {
      map: { value: cloudTexture() },
      drift: { value: new THREE.Vector2(0, 0) },
      fogColor: { value: new THREE.Color(0xcfe2ee) },
    },
    vertexShader: `
      attribute vec4 inst;
      uniform vec2 drift;
      varying vec2 vUv; varying float vFade;
      void main() {
        vUv = uv;
        vec3 c = inst.xyz;
        c.x = mod(c.x + drift.x + 20000.0, 40000.0) - 20000.0;
        c.z = mod(c.z + drift.y + 20000.0, 40000.0) - 20000.0;
        vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
        vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
        vec3 wp = c + (right * position.x + up * position.y * 0.55) * inst.w;
        vec4 mv = viewMatrix * vec4(wp, 1.0);
        gl_Position = projectionMatrix * mv;
        float d = length(mv.xyz);
        vFade = 1.0 - smoothstep(18000.0, 30000.0, d);
      }`,
    fragmentShader: `
      uniform sampler2D map;
      varying vec2 vUv; varying float vFade;
      void main() {
        float a = texture2D(map, vUv).a;
        // ignore stored rgb (premultiplied canvas would give dark fringes)
        gl_FragColor = vec4(vec3(0.99, 0.995, 1.0), a * 0.9 * vFade);
        if (gl_FragColor.a < 0.01) discard;
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 5;
  return mesh;
}

// ---------------------------------------------------------------------------
// Runway & airport
// ---------------------------------------------------------------------------
function runwayTexture() {
  const W = 256, H = 4096;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  // asphalt with subtle noise
  g.fillStyle = '#3b3d40';
  g.fillRect(0, 0, W, H);
  const rnd = mulberry32(3);
  for (let i = 0; i < 9000; i++) {
    const v = 50 + rnd() * 30;
    g.fillStyle = `rgba(${v},${v},${v + 4},0.25)`;
    g.fillRect(rnd() * W, rnd() * H, 2, 2);
  }
  // tyre rubber at touchdown zones
  for (const zone of [[H * 0.08, H * 0.20], [H * 0.80, H * 0.92]]) {
    for (let i = 0; i < 700; i++) {
      const y = zone[0] + rnd() * (zone[1] - zone[0]);
      g.fillStyle = `rgba(20,20,22,${0.05 + rnd() * 0.1})`;
      g.fillRect(W * 0.2 + rnd() * W * 0.6, y, 3 + rnd() * 5, 14 + rnd() * 24);
    }
  }
  g.fillStyle = '#e8e8e8';
  const cl = (y0, y1) => g.fillRect(W / 2 - 4, y0, 8, y1 - y0);
  // edge lines
  g.fillRect(8, 0, 5, H); g.fillRect(W - 13, 0, 5, H);
  // centreline dashes
  for (let y = H * 0.155; y < H * 0.845; y += H * 0.030) cl(y, y + H * 0.016);
  // threshold piano keys + designators at both ends
  const drawEnd = (flip, num) => {
    g.save();
    if (flip) { g.translate(W / 2, H / 2); g.rotate(Math.PI); g.translate(-W / 2, -H / 2); }
    for (let i = 0; i < 8; i++) {
      const x = 22 + i * ((W - 44) / 8);
      g.fillRect(x + 4, H - H * 0.035, (W - 44) / 8 - 8, H * 0.022);
    }
    g.font = `bold ${W * 0.42}px Arial`;
    g.textAlign = 'center';
    g.save();
    g.translate(W / 2, H - H * 0.062);
    g.rotate(Math.PI);
    g.fillText(num, 0, 0);
    g.restore();
    // aim-point bars
    g.fillRect(W * 0.16, H - H * 0.118, W * 0.14, H * 0.013);
    g.fillRect(W * 0.70, H - H * 0.118, W * 0.14, H * 0.013);
    g.restore();
  };
  drawEnd(false, '36');
  drawEnd(true, '18');
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildAirport(scene) {
  const group = new THREE.Group();

  const rwy = new THREE.Mesh(
    new THREE.PlaneGeometry(RWY_HALF_W * 2, RWY_HALF_LEN * 2),
    new THREE.MeshLambertMaterial({ map: runwayTexture() }),
  );
  rwy.rotation.x = -Math.PI / 2;
  rwy.position.y = FIELD_ELEV + 0.04;
  rwy.receiveShadow = true;
  group.add(rwy);

  const asphalt = new THREE.MeshLambertMaterial({ color: 0x4a4c4f });
  const taxi = new THREE.Mesh(new THREE.PlaneGeometry(TAXI.x1 - TAXI.x0, TAXI.z1 - TAXI.z0), asphalt);
  taxi.rotation.x = -Math.PI / 2;
  taxi.position.set((TAXI.x0 + TAXI.x1) / 2, FIELD_ELEV + 0.03, (TAXI.z0 + TAXI.z1) / 2);
  group.add(taxi);
  const apron = new THREE.Mesh(new THREE.PlaneGeometry(APRON.x1 - APRON.x0, APRON.z1 - APRON.z0),
    new THREE.MeshLambertMaterial({ color: 0x55585c }));
  apron.rotation.x = -Math.PI / 2;
  apron.position.set((APRON.x0 + APRON.x1) / 2, FIELD_ELEV + 0.03, (APRON.z0 + APRON.z1) / 2);
  apron.receiveShadow = true;
  group.add(apron);

  // hangar
  const hangar = new THREE.Group();
  const hw = new THREE.Mesh(new THREE.BoxGeometry(26, 7, 20), new THREE.MeshLambertMaterial({ color: 0x9aa3ab }));
  hw.position.y = 3.5;
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(13, 13, 20, 16, 1, false, 0, Math.PI), new THREE.MeshLambertMaterial({ color: 0x77808a }));
  roof.rotation.set(0, 0, 0);
  roof.rotation.x = Math.PI / 2;
  roof.rotation.z = Math.PI / 2;
  roof.scale.set(1, 1, 0.5);
  roof.position.y = 7;
  hangar.add(hw, roof);
  hangar.position.set(75, FIELD_ELEV, 40);
  hangar.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
  group.add(hangar);

  // tower
  const tower = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 16, 10), new THREE.MeshLambertMaterial({ color: 0xb8bcc2 }));
  shaft.position.y = 8;
  const cab = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.0, 3.4, 10), new THREE.MeshPhongMaterial({ color: 0x2e4a5e, shininess: 120 }));
  cab.position.y = 17.5;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(3.8, 1.4, 10), new THREE.MeshLambertMaterial({ color: 0x9aa3ab }));
  cap.position.y = 20;
  tower.add(shaft, cab, cap);
  tower.position.set(95, FIELD_ELEV, -20);
  tower.traverse((o) => { o.castShadow = true; });
  group.add(tower);

  // fuel tanks, small hut
  for (let i = 0; i < 2; i++) {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 5, 12), new THREE.MeshPhongMaterial({ color: 0xd8dde2, shininess: 90 }));
    tank.position.set(60, FIELD_ELEV + 2.5, 95 + i * 7);
    tank.castShadow = true;
    group.add(tank);
  }
  const hut = new THREE.Mesh(new THREE.BoxGeometry(8, 3.4, 6), new THREE.MeshLambertMaterial({ color: 0xc6b89a }));
  hut.position.set(45, FIELD_ELEV + 1.7, -45);
  hut.castShadow = true;
  group.add(hut);

  // windsock
  const sockGroup = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 6, 6), new THREE.MeshLambertMaterial({ color: 0xdddddd }));
  pole.position.y = 3;
  sockGroup.add(pole);
  const sockPivot = new THREE.Group();
  sockPivot.position.y = 5.9;
  const sock = new THREE.Mesh(
    new THREE.ConeGeometry(0.45, 2.6, 8, 1, true),
    new THREE.MeshLambertMaterial({ color: 0xff5a00, side: THREE.DoubleSide }),
  );
  sock.rotation.x = Math.PI / 2;       // cone tip toward -Z initially... tip along +len dir
  sock.position.z = 1.3;
  sockPivot.add(sock);
  sockGroup.add(sockPivot);
  sockGroup.position.set(-28, FIELD_ELEV, 540);
  group.add(sockGroup);

  // runway edge + threshold lights (instanced)
  const lightGeo = new THREE.SphereGeometry(0.22, 6, 5);
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const positions = [];
  const colors = [];
  for (let z = -660; z <= 660; z += 60) {
    positions.push([-RWY_HALF_W - 1.5, z], [RWY_HALF_W + 1.5, z]);
    colors.push([1, 1, 1], [1, 1, 1]);
  }
  for (let x = -12; x <= 12; x += 3) {
    positions.push([x, RWY_HALF_LEN - 2]);  colors.push([0.1, 1, 0.25]); // 36 threshold (green inbound)
    positions.push([x, -RWY_HALF_LEN + 2]); colors.push([0.1, 1, 0.25]);
  }
  const lightsMesh = new THREE.InstancedMesh(lightGeo, lightMat, positions.length);
  const m4 = new THREE.Matrix4();
  positions.forEach(([x, z], i) => {
    m4.setPosition(x, FIELD_ELEV + 0.25, z);
    lightsMesh.setMatrixAt(i, m4);
    lightsMesh.setColorAt(i, _c.setRGB(...colors[i]));
  });
  group.add(lightsMesh);

  // PAPI (left of runway 36 threshold, aim point z=470).
  // Real PAPIs are high-intensity — oversized lenses keep them readable from miles out.
  const papi = [];
  const papiGroup = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.1, 0.9), new THREE.MeshLambertMaterial({ color: 0x2c2c2c }));
    const lens = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.85),
      new THREE.MeshBasicMaterial({ color: 0xffffff }));
    lens.position.set(0, 0.08, -0.47);
    box.add(lens);
    box.position.set(-26 - i * 5.0, FIELD_ELEV + 0.6, 470);
    papiGroup.add(box);
    papi.push(lens.material);
  }
  group.add(papiGroup);

  scene.add(group);
  return { sockPivot, sockGroup, papi };
}

// ---------------------------------------------------------------------------
// Scenery: trees + buildings (instanced)
// ---------------------------------------------------------------------------
function buildTrees(scene) {
  const rnd = mulberry32(1234);
  const positions = [];
  for (let tries = 0; tries < 30000 && positions.length < 1700; tries++) {
    const x = (rnd() - 0.5) * 22000;
    const z = (rnd() - 0.5) * 22000;
    if (isAsphalt(x, z)) continue;
    const rAir = Math.hypot(x * 1.6, z * 0.75);
    if (rAir < 700) continue;                                    // keep airfield clear
    const h = terrainHeight(x, z);
    if (h < 3 || h > 520) continue;
    const forest = fbm2(x * 0.0008 + 21, z * 0.0008 + 13, 3);
    if (forest < 0.52 && rnd() > 0.06) continue;                 // cluster into forests
    const sl = Math.abs(terrainHeight(x + 14, z) - h) + Math.abs(terrainHeight(x, z + 14) - h);
    if (sl > 9) continue;
    positions.push([x, h, z, 0.7 + rnd() * 0.9]);
  }
  const trunkGeo = new THREE.CylinderGeometry(0.35, 0.5, 3.2, 5);
  trunkGeo.translate(0, 1.6, 0);
  const canopyGeo = new THREE.ConeGeometry(3.1, 9.5, 6);
  canopyGeo.translate(0, 7.5, 0);
  const trunks = new THREE.InstancedMesh(trunkGeo, new THREE.MeshLambertMaterial({ color: 0x5d4426 }), positions.length);
  const canopies = new THREE.InstancedMesh(canopyGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), positions.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  positions.forEach(([x, h, z, sc], i) => {
    q.setFromAxisAngle(up, rnd() * Math.PI * 2);
    s.set(sc, sc * (0.85 + rnd() * 0.4), sc);
    p.set(x, h - 0.3, z);
    m4.compose(p, q, s);
    trunks.setMatrixAt(i, m4);
    canopies.setMatrixAt(i, m4);
    _c.setHSL(0.31 + rnd() * 0.06, 0.45 + rnd() * 0.2, 0.22 + rnd() * 0.12);
    canopies.setColorAt(i, _c);
  });
  scene.add(trunks, canopies);
}

function buildTown(scene) {
  const rnd = mulberry32(99);
  const clusters = [[1700, -2600, 38], [-2400, -1500, 22], [900, 2900, 16]];
  const boxes = [];
  for (const [cx, cz, n] of clusters) {
    for (let i = 0; i < n; i++) {
      const x = cx + (rnd() - 0.5) * 900;
      const z = cz + (rnd() - 0.5) * 900;
      if (isAsphalt(x, z)) continue;
      const h = terrainHeight(x, z);
      if (h < 2) continue;
      boxes.push([x, h, z, 6 + rnd() * 9, 3.5 + rnd() * 7, 6 + rnd() * 9, rnd()]);
    }
  }
  const geo = new THREE.BoxGeometry(1, 1, 1);
  geo.translate(0, 0.5, 0);
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: 0xffffff }), boxes.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  boxes.forEach(([x, h, z, w, ht, d, c], i) => {
    q.setFromAxisAngle(up, Math.floor(c * 4) * Math.PI / 2 + 0.2);
    p.set(x, h - 0.4, z);
    s.set(w, ht, d);
    m4.compose(p, q, s);
    mesh.setMatrixAt(i, m4);
    _c.setHSL(0.07 + c * 0.06, 0.25, 0.45 + (c * 7 % 1) * 0.3);
    mesh.setColorAt(i, _c);
  });
  mesh.castShadow = false;
  scene.add(mesh);
}

// ---------------------------------------------------------------------------
// Particle effects (crash explosion, touchdown smoke)
// ---------------------------------------------------------------------------
class Particles {
  constructor(scene, max = 600) {
    this.max = max;
    this.pos = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.age = new Float32Array(max);
    this.size = new Float32Array(max);
    this.col = new Float32Array(max * 3);
    this.head = 0;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('pcolor', new THREE.BufferAttribute(this.col, 3));
    geo.setAttribute('psize', new THREE.BufferAttribute(this.size, 1));
    geo.setAttribute('palpha', new THREE.BufferAttribute(this.age, 1)); // age->alpha in shader? store alpha directly
    this.alpha = geo.attributes.palpha.array;
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      vertexShader: `
        attribute vec3 pcolor; attribute float psize; attribute float palpha;
        varying vec3 vC; varying float vA;
        void main(){
          vC = pcolor; vA = palpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = psize * (380.0 / max(-mv.z, 1.0));
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        varying vec3 vC; varying float vA;
        void main(){
          vec2 d = gl_PointCoord - 0.5;
          float a = smoothstep(0.5, 0.12, length(d)) * vA;
          if (a < 0.01) discard;
          gl_FragColor = vec4(vC, a);
        }`,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }
  emit(x, y, z, vx, vy, vz, life, size, r, g, b) {
    const i = this.head;
    this.head = (this.head + 1) % this.max;
    this.pos.set([x, y, z], i * 3);
    this.vel.set([vx, vy, vz], i * 3);
    this.life[i] = life;
    this.age[i] = 0.0001;
    this.size[i] = size;
    this.col.set([r, g, b], i * 3);
  }
  update(dt) {
    const n = this.max;
    for (let i = 0; i < n; i++) {
      if (this.age[i] <= 0) { this.alpha[i] = 0; continue; }
      this.age[i] += dt;
      if (this.age[i] >= this.life[i]) { this.age[i] = 0; this.alpha[i] = 0; continue; }
      const t = this.age[i] / this.life[i];
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      this.vel[i * 3 + 1] += 2.2 * dt;            // smoke rises
      this.vel[i * 3] *= 1 - 0.5 * dt; this.vel[i * 3 + 2] *= 1 - 0.5 * dt;
      this.alpha[i] = (1 - t) * 0.75;
      this.size[i] += dt * 6;
    }
    const g = this.points.geometry;
    g.attributes.position.needsUpdate = true;
    g.attributes.palpha.needsUpdate = true;
    g.attributes.psize.needsUpdate = true;
    g.attributes.pcolor.needsUpdate = true;
  }
  explosion(p) {
    const rnd = Math.random;
    for (let i = 0; i < 90; i++) {
      const a = rnd() * Math.PI * 2, e = rnd() * Math.PI / 2;
      const sp = 4 + rnd() * 22;
      const fire = i < 40;
      this.emit(
        p.x + (rnd() - 0.5) * 2, p.y + rnd() * 1.5, p.z + (rnd() - 0.5) * 2,
        Math.cos(a) * Math.cos(e) * sp, Math.sin(e) * sp * 1.3, Math.sin(a) * Math.cos(e) * sp,
        fire ? 0.7 + rnd() * 0.8 : 2.6 + rnd() * 3.0,
        fire ? 3.5 + rnd() * 4 : 6 + rnd() * 9,
        fire ? 1.0 : 0.18, fire ? 0.45 + rnd() * 0.3 : 0.17, fire ? 0.1 : 0.16,
      );
    }
  }
  tyreSmoke(p, vel) {
    for (let i = 0; i < 5; i++) {
      this.emit(
        p.x + (Math.random() - 0.5), p.y + 0.2, p.z + (Math.random() - 0.5),
        vel.x * 0.25 + (Math.random() - 0.5) * 2, 0.8 + Math.random(), vel.z * 0.25 + (Math.random() - 0.5) * 2,
        0.9 + Math.random() * 0.7, 1.6 + Math.random() * 1.5,
        0.82, 0.82, 0.84,
      );
    }
  }
}

// ---------------------------------------------------------------------------
export function createWorld(scene) {
  scene.background = new THREE.Color(0xbfd8e8);
  scene.fog = new THREE.FogExp2(0xc4d9e8, 0.000085);

  const sunDir = new THREE.Vector3(0.45, 0.62, 0.40).normalize();

  const hemi = new THREE.HemisphereLight(0xbdd8f0, 0x57683f, 0.62);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2dd, 2.5);
  sun.position.copy(sunDir).multiplyScalar(300);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 50;
  sun.shadow.camera.far = 700;
  const sc = 45;
  sun.shadow.camera.left = -sc; sun.shadow.camera.right = sc;
  sun.shadow.camera.top = sc; sun.shadow.camera.bottom = -sc;
  sun.shadow.bias = -0.0004;
  scene.add(sun, sun.target);

  scene.add(buildSky(sunDir));

  scene.add(buildTerrainRing(8000, 170, 0));
  scene.add(buildTerrainRing(36000, 170, 3950));
  scene.add(buildTerrainRing(90000, 90, 17800));

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(90000, 90000),
    new THREE.MeshPhongMaterial({ color: 0x16435e, shininess: 240, specular: 0x99bbcc, transparent: true, opacity: 0.94 }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = WATER_Y;
  scene.add(water);

  const clouds = buildClouds();
  scene.add(clouds);

  const airport = buildAirport(scene);
  buildTrees(scene);
  buildTown(scene);

  const particles = new Particles(scene);

  let driftX = 0, driftZ = 0;
  const world = {
    terrainInfo,
    terrainHeight,
    FIELD_ELEV,
    particles,
    sunDir,
    // start at threshold 36 (south end), facing north
    runwayStart: { x: 0, z: 600, heading: 0 },

    update(dt, planePos, windVec, fmOut) {
      // clouds drift with wind
      driftX += windVec.x * dt * 0.6;
      driftZ += windVec.z * dt * 0.6;
      clouds.material.uniforms.drift.value.set(driftX, driftZ);

      // shadow follows aircraft
      sun.position.copy(planePos).addScaledVector(sunDir, 320);
      sun.target.position.copy(planePos);
      sun.target.updateMatrixWorld();

      // windsock
      const ws = Math.hypot(windVec.x, windVec.z);
      if (ws > 0.2) {
        airport.sockPivot.rotation.y = Math.atan2(windVec.x, windVec.z);
      }
      airport.sockPivot.rotation.x = lerp(-1.25, -0.05, clamp(ws / 9, 0, 1));

      // PAPI vs aircraft glidepath to aim point (z=470)
      const dx = planePos.x - (-26), dz = planePos.z - 470;
      const horiz = Math.hypot(planePos.x, dz);
      const ang = Math.atan2(planePos.y - FIELD_ELEV, Math.max(horiz, 1)) / DEG2RAD;
      const th = [2.5, 2.8, 3.2, 3.5];
      for (let i = 0; i < 4; i++) {
        airport.papi[i].color.setHex(ang > th[i] ? 0xffffff : 0xff2418);
      }

      particles.update(dt);
    },
  };
  return world;
}
