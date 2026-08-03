import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Object factory: primitives, lights, naming, cloning.
// World is Z-up (Blender convention); geometries are rotated accordingly.
// ---------------------------------------------------------------------------

export const MESH_TYPES = [
  { id: 'plane', label: 'Plane' },
  { id: 'cube', label: 'Cube' },
  { id: 'circle', label: 'Circle' },
  { id: 'uvsphere', label: 'UV Sphere' },
  { id: 'icosphere', label: 'Ico Sphere' },
  { id: 'cylinder', label: 'Cylinder' },
  { id: 'cone', label: 'Cone' },
  { id: 'torus', label: 'Torus' },
  { id: 'torusknot', label: 'Torus Knot' },
];

export const LIGHT_TYPES = [
  { id: 'point', label: 'Point' },
  { id: 'sun', label: 'Sun' },
  { id: 'spot', label: 'Spot' },
];

const MESH_LABELS = Object.fromEntries(MESH_TYPES.map((t) => [t.id, t.label]));

const PARAM_DEFS = {
  plane: [{ key: 'size', label: 'Size', min: 0.01, max: 100, step: 0.02 }],
  cube: [{ key: 'size', label: 'Size', min: 0.01, max: 100, step: 0.02 }],
  circle: [
    { key: 'radius', label: 'Radius', min: 0.01, max: 100, step: 0.02 },
    { key: 'segments', label: 'Vertices', min: 3, max: 256, step: 0.1, int: true },
  ],
  uvsphere: [
    { key: 'radius', label: 'Radius', min: 0.01, max: 100, step: 0.02 },
    { key: 'widthSegments', label: 'Segments', min: 3, max: 128, step: 0.1, int: true },
    { key: 'heightSegments', label: 'Rings', min: 2, max: 64, step: 0.1, int: true },
  ],
  icosphere: [
    { key: 'radius', label: 'Radius', min: 0.01, max: 100, step: 0.02 },
    { key: 'detail', label: 'Subdivisions', min: 0, max: 5, step: 0.05, int: true },
  ],
  cylinder: [
    { key: 'radius', label: 'Radius', min: 0.01, max: 100, step: 0.02 },
    { key: 'depth', label: 'Depth', min: 0.01, max: 100, step: 0.02 },
    { key: 'radialSegments', label: 'Vertices', min: 3, max: 128, step: 0.1, int: true },
  ],
  cone: [
    { key: 'radius', label: 'Radius', min: 0.01, max: 100, step: 0.02 },
    { key: 'depth', label: 'Depth', min: 0.01, max: 100, step: 0.02 },
    { key: 'radialSegments', label: 'Vertices', min: 3, max: 128, step: 0.1, int: true },
  ],
  torus: [
    { key: 'radius', label: 'Radius', min: 0.01, max: 100, step: 0.02 },
    { key: 'tube', label: 'Minor Radius', min: 0.005, max: 50, step: 0.01 },
    { key: 'radialSegments', label: 'Minor Segments', min: 3, max: 64, step: 0.1, int: true },
    { key: 'tubularSegments', label: 'Major Segments', min: 3, max: 256, step: 0.1, int: true },
  ],
  torusknot: [
    { key: 'radius', label: 'Radius', min: 0.01, max: 100, step: 0.02 },
    { key: 'tube', label: 'Tube Radius', min: 0.005, max: 50, step: 0.01 },
    { key: 'tubularSegments', label: 'Tube Segments', min: 8, max: 512, step: 0.25, int: true },
    { key: 'radialSegments', label: 'Radial Segments', min: 3, max: 64, step: 0.1, int: true },
  ],
};

const PARAM_DEFAULTS = {
  plane: { size: 2 },
  cube: { size: 2 },
  circle: { radius: 1, segments: 32 },
  uvsphere: { radius: 1, widthSegments: 32, heightSegments: 16 },
  icosphere: { radius: 1, detail: 2 },
  cylinder: { radius: 1, depth: 2, radialSegments: 32 },
  cone: { radius: 1, depth: 2, radialSegments: 32 },
  torus: { radius: 1, tube: 0.25, radialSegments: 12, tubularSegments: 48 },
  torusknot: { radius: 0.9, tube: 0.25, tubularSegments: 120, radialSegments: 16 },
};

export function defaultParams(primitive) {
  return { ...(PARAM_DEFAULTS[primitive] || {}) };
}

export function paramDefs(primitive) {
  return PARAM_DEFS[primitive] || [];
}

export function primitiveLabel(primitive) {
  return MESH_LABELS[primitive] || 'Mesh';
}

export function buildGeometry(primitive, params) {
  const p = { ...defaultParams(primitive), ...params };
  let geo;
  switch (primitive) {
    case 'plane':
      geo = new THREE.PlaneGeometry(p.size, p.size);
      break;
    case 'cube':
      geo = new THREE.BoxGeometry(p.size, p.size, p.size);
      break;
    case 'circle':
      geo = new THREE.CircleGeometry(p.radius, Math.round(p.segments));
      break;
    case 'uvsphere':
      geo = new THREE.SphereGeometry(p.radius, Math.round(p.widthSegments), Math.round(p.heightSegments));
      geo.rotateX(Math.PI / 2); // poles on Z, like Blender
      break;
    case 'icosphere':
      geo = new THREE.IcosahedronGeometry(p.radius, Math.round(p.detail));
      break;
    case 'cylinder':
      geo = new THREE.CylinderGeometry(p.radius, p.radius, p.depth, Math.round(p.radialSegments));
      geo.rotateX(Math.PI / 2); // axis on Z
      break;
    case 'cone':
      geo = new THREE.ConeGeometry(p.radius, p.depth, Math.round(p.radialSegments));
      geo.rotateX(Math.PI / 2); // tip on +Z
      break;
    case 'torus':
      geo = new THREE.TorusGeometry(p.radius, p.tube, Math.round(p.radialSegments), Math.round(p.tubularSegments));
      break;
    case 'torusknot':
      geo = new THREE.TorusKnotGeometry(p.radius, p.tube, Math.round(p.tubularSegments), Math.round(p.radialSegments));
      break;
    default:
      geo = new THREE.BoxGeometry(2, 2, 2);
  }
  return geo;
}

export function defaultMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    color: '#cccccc',
    roughness: 0.5,
    metalness: 0.0,
  });
  mat.userData.wire = false;
  return mat;
}

export function createMesh(primitive, params) {
  const geo = buildGeometry(primitive, params);
  const mesh = new THREE.Mesh(geo, defaultMaterial());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = primitiveLabel(primitive);
  mesh.userData.kind = 'mesh';
  mesh.userData.primitive = primitive;
  mesh.userData.params = { ...defaultParams(primitive), ...params };
  mesh.userData.edited = false; // positions hand-edited in Edit Mode
  mesh.userData.topo = false; // topology changed (shade smooth/flat) -> full serialize
  return mesh;
}

// Wraps an arbitrary geometry (imports) in a standard app mesh.
export function createImportedMesh(geometry, material, name) {
  let mat;
  if (material && material.isMeshStandardMaterial) {
    mat = material;
  } else {
    mat = defaultMaterial();
    if (material && material.color) mat.color.copy(material.color);
    if (material && material.map) mat.map = material.map;
  }
  if (!mat.userData) mat.userData = {};
  if (mat.userData.wire === undefined) mat.userData.wire = false;
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = name || 'Imported';
  mesh.userData.kind = 'mesh';
  mesh.userData.primitive = 'imported';
  mesh.userData.params = {};
  mesh.userData.edited = false;
  mesh.userData.topo = true;
  return mesh;
}

// ---------------------------------------------------------------------------
// Lights. A light object is a Group: [ actual Light (+target), gizmo group ].
// The gizmo carries an invisible pick sphere so lights are clickable.
// ---------------------------------------------------------------------------

const GIZMO_LINE_COLOR = 0xe8d48a;

function lineSegmentsFromPoints(pairs) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pairs.flat(), 3));
  const mat = new THREE.LineBasicMaterial({ color: GIZMO_LINE_COLOR, transparent: true, opacity: 0.85 });
  const lines = new THREE.LineSegments(geo, mat);
  return lines;
}

function buildLightGizmo(type, light) {
  const g = new THREE.Group();
  g.userData.isGizmo = true;

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xffe9a8, toneMapped: false })
  );
  g.add(core);

  // invisible-but-pickable sphere so the tiny light is easy to click
  const pick = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 8, 6),
    new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })
  );
  pick.userData.isPickProxy = true;
  g.add(pick);

  const segs = [];
  const r1 = 0.14;
  const r2 = 0.26;
  // small rays on the three planes
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    segs.push([c * r1, s * r1, 0], [c * r2, s * r2, 0]);
  }
  segs.push([0, 0, r1], [0, 0, r2], [0, 0, -r1], [0, 0, -r2]);

  if (type === 'sun') {
    segs.push([0, 0, -0.35], [0, 0, -2.2]);
  }
  if (segs.length) g.add(lineSegmentsFromPoints(segs));

  if (type === 'spot') {
    const cone = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: GIZMO_LINE_COLOR, transparent: true, opacity: 0.65 })
    );
    cone.userData.isSpotCone = true;
    g.add(cone);
    updateSpotCone(cone, light);
  }
  return g;
}

export function updateSpotCone(cone, light) {
  const len = 2.2;
  const rad = Math.tan(light.angle) * len;
  const pts = [];
  const N = 24;
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2;
    const a1 = ((i + 1) / N) * Math.PI * 2;
    pts.push(
      [Math.cos(a0) * rad, Math.sin(a0) * rad, -len],
      [Math.cos(a1) * rad, Math.sin(a1) * rad, -len]
    );
  }
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    pts.push([0, 0, 0], [Math.cos(a) * rad, Math.sin(a) * rad, -len]);
  }
  cone.geometry.dispose();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3));
  cone.geometry = geo;
}

export function refreshLightGizmo(group) {
  const light = group.userData.light;
  if (!light) return;
  group.traverse((c) => {
    if (c.userData.isSpotCone) updateSpotCone(c, light);
  });
}

export function createLight(type) {
  const group = new THREE.Group();
  group.userData.kind = 'light';
  group.userData.lightType = type;

  let light;
  if (type === 'point') {
    light = new THREE.PointLight(0xffffff, 200, 0, 2);
    light.name = 'Point';
  } else if (type === 'sun') {
    light = new THREE.DirectionalLight(0xffffff, 3);
    light.name = 'Sun';
  } else {
    light = new THREE.SpotLight(0xffffff, 400, 0, THREE.MathUtils.degToRad(40), 0.15, 2);
    light.name = 'Spot';
  }

  light.castShadow = true;
  if (light.shadow) {
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.bias = -0.0004;
    light.shadow.normalBias = 0.02;
    if (light.isDirectionalLight) {
      const c = light.shadow.camera;
      c.left = -14; c.right = 14; c.top = 14; c.bottom = -14;
      c.near = 0.1; c.far = 60;
      light.shadow.mapSize.set(2048, 2048);
    }
  }

  group.add(light);
  if (light.target) {
    light.target.position.set(0, 0, -1); // direction = group's -Z
    group.add(light.target);
  }

  group.userData.light = light;
  group.add(buildLightGizmo(type, light));
  group.name = light.name;
  if (type === 'sun' || type === 'spot') {
    group.position.set(0, 0, 4);
  }
  return group;
}

// ---------------------------------------------------------------------------

export function uniqueName(existingNames, base) {
  base = base.replace(/\.\d{3,}$/, '') || 'Object';
  if (!existingNames.has(base)) return base;
  for (let i = 1; i < 10000; i++) {
    const candidate = `${base}.${String(i).padStart(3, '0')}`;
    if (!existingNames.has(candidate)) return candidate;
  }
  return `${base}.${Math.floor(Math.random() * 1e6)}`;
}

export function cloneObject(obj) {
  let clone;
  if (obj.userData.kind === 'light') {
    clone = createLight(obj.userData.lightType);
    const src = obj.userData.light;
    const dst = clone.userData.light;
    dst.color.copy(src.color);
    dst.intensity = src.intensity;
    dst.castShadow = src.castShadow;
    if (src.isSpotLight) {
      dst.angle = src.angle;
      dst.penumbra = src.penumbra;
      dst.distance = src.distance;
      refreshLightGizmo(clone);
    }
  } else {
    clone = new THREE.Mesh(obj.geometry.clone(), obj.material.clone());
    clone.castShadow = obj.castShadow;
    clone.receiveShadow = obj.receiveShadow;
    clone.userData = JSON.parse(JSON.stringify({
      kind: obj.userData.kind,
      primitive: obj.userData.primitive,
      params: obj.userData.params,
      edited: obj.userData.edited,
      topo: obj.userData.topo,
    }));
    if (!clone.material.userData) clone.material.userData = {};
    clone.material.userData.wire = obj.material.userData?.wire || false;
  }
  clone.position.copy(obj.position);
  clone.quaternion.copy(obj.quaternion);
  clone.scale.copy(obj.scale);
  clone.visible = obj.visible;
  clone.name = obj.name;
  return clone;
}
