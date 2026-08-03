import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { createMesh, createLight, createImportedMesh } from '../core/factory.js';
import { serializeScene, deserializeScene } from './serializer.js';

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function pickFiles(accept, multiple, cb) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;
  input.multiple = !!multiple;
  input.onchange = () => cb([...input.files]);
  input.click();
}

// ---- scene JSON -------------------------------------------------------------

export function saveJSON(app) {
  const json = JSON.stringify(serializeScene(app));
  download(new Blob([json], { type: 'application/json' }), 'scene.blendweb.json');
  app.flash('Scene saved');
}

export function openJSONDialog(app) {
  pickFiles('.json,application/json', false, async ([file]) => {
    if (!file) return;
    try {
      deserializeScene(app, JSON.parse(await file.text()));
      app.flash(`Opened ${file.name}`);
    } catch (err) {
      console.error(err);
      app.flash('Could not open file: ' + err.message);
    }
  });
}

const AUTOSAVE_KEY = 'blender-web.autosave';

export function autosave(app) {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(serializeScene(app)));
  } catch {
    /* quota — ignore */
  }
}

export function recoverAutosave(app) {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) {
      app.flash('No autosave found');
      return;
    }
    deserializeScene(app, JSON.parse(raw));
    app.flash('Autosave restored');
  } catch (err) {
    console.error(err);
    app.flash('Autosave could not be restored');
  }
}

// ---- mesh import ------------------------------------------------------------

// Imported assets are Y-up; the world is Z-up.
const YUP_TO_ZUP = new THREE.Matrix4().makeRotationX(Math.PI / 2);

function adoptMeshes(app, sourceRoot, baseName) {
  sourceRoot.updateMatrixWorld(true);
  const adopted = [];
  sourceRoot.traverse((node) => {
    if (!node.isMesh || !node.geometry?.attributes?.position) return;
    const material = Array.isArray(node.material) ? node.material[0] : node.material;
    const mesh = createImportedMesh(node.geometry, material, node.name || baseName);
    const m = new THREE.Matrix4().multiplyMatrices(YUP_TO_ZUP, node.matrixWorld);
    m.decompose(mesh.position, mesh.quaternion, mesh.scale);
    adopted.push(mesh);
  });
  if (!adopted.length) {
    app.flash('No meshes found in file');
    return;
  }
  app.addObjects(adopted, 'Import');
  app.flash(`Imported ${adopted.length} mesh${adopted.length > 1 ? 'es' : ''}`);
}

export async function importFile(app, file) {
  const name = file.name.replace(/\.[^.]+$/, '');
  const ext = file.name.split('.').pop().toLowerCase();
  try {
    if (ext === 'json') {
      deserializeScene(app, JSON.parse(await file.text()));
      app.flash(`Opened ${file.name}`);
    } else if (ext === 'glb' || ext === 'gltf') {
      const buf = await file.arrayBuffer();
      new GLTFLoader().parse(
        buf,
        '',
        (gltf) => adoptMeshes(app, gltf.scene, name),
        (err) => {
          console.error(err);
          app.flash('GLTF import failed');
        }
      );
    } else if (ext === 'obj') {
      const group = new OBJLoader().parse(await file.text());
      adoptMeshes(app, group, name);
    } else {
      app.flash(`Unsupported file type: .${ext}`);
    }
  } catch (err) {
    console.error(err);
    app.flash('Import failed: ' + err.message);
  }
}

export function importDialog(app) {
  pickFiles('.glb,.gltf,.obj', true, (files) => {
    for (const f of files) importFile(app, f);
  });
}

export function installDropImport(app, el) {
  el.addEventListener('dragover', (e) => e.preventDefault());
  el.addEventListener('drop', (e) => {
    e.preventDefault();
    for (const f of e.dataTransfer.files) importFile(app, f);
  });
}

// ---- mesh export ------------------------------------------------------------

// Bare mesh copies (no gizmos / edit overlays), optionally rotated to Y-up.
function exportRoot(app, toYUp) {
  const root = new THREE.Group();
  if (toYUp) root.rotation.x = -Math.PI / 2;
  app.sceneM.forEachUserMesh((src) => {
    if (!src.visible) return;
    const copy = new THREE.Mesh(src.geometry, src.material);
    copy.name = src.name;
    copy.position.copy(src.position);
    copy.quaternion.copy(src.quaternion);
    copy.scale.copy(src.scale);
    root.add(copy);
  });
  root.updateMatrixWorld(true);
  return root;
}

export function exportGLB(app) {
  const root = exportRoot(app, true);
  if (!root.children.length) return app.flash('Nothing to export');
  new GLTFExporter().parse(
    root,
    (result) => {
      download(new Blob([result], { type: 'model/gltf-binary' }), 'scene.glb');
      app.flash('Exported scene.glb');
    },
    (err) => {
      console.error(err);
      app.flash('GLB export failed');
    },
    { binary: true }
  );
}

export function exportOBJ(app) {
  const root = exportRoot(app, true);
  if (!root.children.length) return app.flash('Nothing to export');
  const text = new OBJExporter().parse(root);
  download(new Blob([text], { type: 'text/plain' }), 'scene.obj');
  app.flash('Exported scene.obj');
}

export function exportSTL(app) {
  const root = exportRoot(app, false); // STL stays Z-up (printing convention)
  if (!root.children.length) return app.flash('Nothing to export');
  const data = new STLExporter().parse(root, { binary: true });
  download(new Blob([data.buffer ?? data], { type: 'model/stl' }), 'scene.stl');
  app.flash('Exported scene.stl');
}

export async function renderImage(app) {
  const url = app.viewport.renderStill(2);
  const blob = await (await fetch(url)).blob();
  download(blob, 'render.png');
  app.flash('Render saved as render.png');
}

// ---- demo scene -------------------------------------------------------------

export function loadDemoScene(app) {
  app.clearScene();
  const add = (o) => app.sceneM.objectsGroup.add(o);

  const floor = createMesh('plane', { size: 16 });
  floor.name = 'Floor';
  floor.material.color.set('#767676');
  floor.material.roughness = 0.95;
  floor.castShadow = false;
  add(floor);

  const knot = createMesh('torusknot', {});
  knot.name = 'Knot';
  knot.position.set(0, 0, 1.5);
  knot.material.color.set('#d4a13a');
  knot.material.metalness = 1;
  knot.material.roughness = 0.28;
  add(knot);

  const ico = createMesh('icosphere', { detail: 2 });
  ico.name = 'Glow';
  ico.position.set(-2.6, 2.0, 0.8);
  ico.scale.setScalar(0.8);
  ico.material.color.set('#0c1c20');
  ico.material.emissive.set('#26c6da');
  ico.material.emissiveIntensity = 2.4;
  add(ico);

  const cube = createMesh('cube', {});
  cube.name = 'Cube';
  cube.position.set(2.6, -1.8, 0.7);
  cube.scale.setScalar(0.7);
  cube.rotation.z = THREE.MathUtils.degToRad(28);
  cube.material.color.set('#b04a4a');
  cube.material.roughness = 0.35;
  add(cube);

  const cyl = createMesh('cylinder', {});
  cyl.name = 'Cylinder';
  cyl.position.set(-2.4, -2.2, 0.75);
  cyl.scale.setScalar(0.75);
  cyl.material.color.set('#4772b3');
  cyl.material.roughness = 0.4;
  cyl.material.metalness = 0.15;
  add(cyl);

  const aimAt = (group, target) => {
    const dir = target.clone().sub(group.position).normalize();
    group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);
  };

  const spot = createLight('spot');
  spot.name = 'Key Spot';
  spot.position.set(4.5, -3.5, 6.5);
  spot.userData.light.intensity = 900;
  aimAt(spot, new THREE.Vector3(0, 0, 1));
  add(spot);

  const fill = createLight('point');
  fill.name = 'Fill';
  fill.position.set(-4.5, 3.5, 3.5);
  fill.userData.light.intensity = 120;
  fill.userData.light.color.set('#9db4ff');
  add(fill);

  const sun = createLight('sun');
  sun.name = 'Sun';
  sun.position.set(2, 3, 7);
  sun.userData.light.intensity = 1.2;
  aimAt(sun, new THREE.Vector3(-1, -1, 0));
  add(sun);

  app.afterSceneMutation();
  app.setShading('rendered');
  app.viewport.persp.position.set(8.6, -8.2, 5.6);
  app.viewport.controls.target.set(0, 0, 1.0);
  app.viewport.controls.update();
  app.selection.clear();
  app.flash('Demo scene loaded — try F12 to render an image');
}
