import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const SHADING_MODES = ['wireframe', 'solid', 'material', 'rendered'];
export const SHADING_LABELS = {
  wireframe: 'Wireframe',
  solid: 'Solid',
  material: 'Material Preview',
  rendered: 'Rendered',
};

// Owns the three.js scene graph: user objects, grid/axes helpers,
// the camera-following "studio" rig for Solid shading, and the environment.
export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#393939');

    this.objectsGroup = new THREE.Group();
    this.objectsGroup.name = 'Objects';
    this.scene.add(this.objectsGroup);

    this.helpersGroup = new THREE.Group();
    this.helpersGroup.name = 'Helpers';
    this.scene.add(this.helpersGroup);

    this._buildGrid();
    this._buildRig();
    this.envTexture = null;
    this.shading = 'solid';
  }

  _buildGrid() {
    const grid = new THREE.GridHelper(40, 40, 0x4a4a4a, 0x474747);
    grid.rotation.x = Math.PI / 2; // XZ -> XY plane (Z-up)
    grid.material.transparent = true;
    grid.material.opacity = 0.55;
    this.helpersGroup.add(grid);

    const axis = (from, to, color) => {
      const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7 }));
      line.position.z = 0.001;
      this.helpersGroup.add(line);
    };
    axis(new THREE.Vector3(-20, 0, 0), new THREE.Vector3(20, 0, 0), 0x9b4a4a);
    axis(new THREE.Vector3(0, -20, 0), new THREE.Vector3(0, 20, 0), 0x4a7a3a);
  }

  _buildRig() {
    // Studio lights parented to the camera (Solid mode), Blender-style.
    this.rig = new THREE.Group();
    this.rig.name = 'ViewportRig';

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.1);
    hemi.position.set(0, 1, 0.4); // camera-local: above & slightly behind
    this.rig.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 1.9);
    key.position.set(-1.4, 1.8, 0.6);
    const keyTarget = new THREE.Object3D();
    keyTarget.position.set(0, 0, -1);
    this.rig.add(keyTarget);
    key.target = keyTarget;
    this.rig.add(key);
  }

  attachCameraRig(camera) {
    this.scene.add(camera);
    camera.add(this.rig);
  }

  initEnvironment(renderer) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    this.envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
  }

  get objects() {
    return this.objectsGroup.children;
  }

  forEachUserMesh(fn) {
    for (const o of this.objectsGroup.children) {
      if (o.userData.kind === 'mesh') fn(o);
    }
  }

  forEachUserLight(fn) {
    for (const o of this.objectsGroup.children) {
      if (o.userData.kind === 'light') fn(o, o.userData.light);
    }
  }

  // Effective wireframe flag = user checkbox OR global wireframe shading.
  syncMeshWireframe(mesh) {
    mesh.material.wireframe = (mesh.material.userData?.wire || false) || this.shading === 'wireframe';
  }

  applyShading(mode) {
    this.shading = mode;
    const useSceneLights = mode === 'material' || mode === 'rendered';

    this.rig.visible = !useSceneLights;
    this.forEachUserLight((group, light) => {
      light.visible = useSceneLights;
    });

    if (mode === 'material') {
      this.scene.environment = this.envTexture;
      this.scene.environmentIntensity = 1.0;
    } else if (mode === 'rendered') {
      this.scene.environment = this.envTexture;
      this.scene.environmentIntensity = 0.22;
    } else {
      this.scene.environment = null;
    }

    this.forEachUserMesh((m) => this.syncMeshWireframe(m));
  }
}
