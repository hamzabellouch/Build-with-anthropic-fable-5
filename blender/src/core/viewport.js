import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const VIEWS = {
  front: { dir: new THREE.Vector3(0, -1, 0), label: 'Front' },
  back: { dir: new THREE.Vector3(0, 1, 0), label: 'Back' },
  right: { dir: new THREE.Vector3(1, 0, 0), label: 'Right' },
  left: { dir: new THREE.Vector3(-1, 0, 0), label: 'Left' },
  top: { dir: new THREE.Vector3(0.000001, -0.000001, 1), label: 'Top' },
  bottom: { dir: new THREE.Vector3(0.000001, -0.000001, -1), label: 'Bottom' },
};

export class Viewport {
  constructor(container, sceneM, events) {
    this.container = container;
    this.sceneM = sceneM;
    this.events = events;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, stencil: false });
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.NoToneMapping; // per-shading-mode; see App.setShading
    this.renderer.domElement.classList.add('three-canvas');
    container.appendChild(this.renderer.domElement);

    // 2D overlay for box-select rectangle / modal rotate line
    this.overlay = document.createElement('canvas');
    this.overlay.classList.add('overlay-canvas');
    container.appendChild(this.overlay);
    this.overlayCtx = this.overlay.getContext('2d');
    this.overlayDrawers = new Set();

    this.persp = new THREE.PerspectiveCamera(50, 1, 0.05, 2000);
    this.persp.up.set(0, 0, 1);
    this.persp.position.set(7.4, -6.9, 5.0);
    this.ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 2000);
    this.ortho.up.set(0, 0, 1);
    this._orthoHalfH = 5;
    this.camera = this.persp;
    sceneM.attachCameraRig(this.persp); // studio rig rides the active camera; moved on projection swap

    this.controls = new OrbitControls(this.persp, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.14;
    this.controls.zoomToCursor = true;
    this.controls.minDistance = 0.05;
    this.controls.maxDistance = 600;
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.ROTATE,
      RIGHT: THREE.MOUSE.PAN,
    };

    // Shift turns LMB/MMB drags into pans (capture runs before OrbitControls).
    this.renderer.domElement.addEventListener('pointerdown', (e) => {
      const pan = e.shiftKey;
      this.controls.mouseButtons.LEFT = pan ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE;
      this.controls.mouseButtons.MIDDLE = pan ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE;
    }, { capture: true });

    // Track the pointer for modal transforms / menus.
    this.lastPointer = { x: 0, y: 0, clientX: 0, clientY: 0 };
    container.addEventListener('pointermove', (e) => {
      const r = container.getBoundingClientRect();
      this.lastPointer = {
        x: e.clientX - r.left,
        y: e.clientY - r.top,
        clientX: e.clientX,
        clientY: e.clientY,
      };
    });

    // Composer with MSAA target + Blender-orange outlines.
    const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(this.renderer, rt);
    this.renderPass = new RenderPass(sceneM.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.outlineSel = new OutlinePass(new THREE.Vector2(1, 1), sceneM.scene, this.camera);
    this._setupOutline(this.outlineSel, '#c4642a');
    this.composer.addPass(this.outlineSel);

    this.outlineAct = new OutlinePass(new THREE.Vector2(1, 1), sceneM.scene, this.camera);
    this._setupOutline(this.outlineAct, '#ffa028');
    this.composer.addPass(this.outlineAct);

    this.composer.addPass(new OutputPass());

    this._resizeObserver = new ResizeObserver(() => this.resize());
    this._resizeObserver.observe(container);
    this.resize();

    // Named-view bookkeeping: orbiting drops back to "User" + perspective.
    this._viewName = 'User';
    this._autoOrtho = false;
    this._suppressViewReset = false;
    this._lastAz = this.controls.getAzimuthalAngle();
    this._lastPol = this.controls.getPolarAngle();
    this.controls.addEventListener('start', () => this._cancelTween());
    this.controls.addEventListener('change', () => {
      const az = this.controls.getAzimuthalAngle();
      const pol = this.controls.getPolarAngle();
      if (Math.abs(az - this._lastAz) > 1e-4 || Math.abs(pol - this._lastPol) > 1e-4) {
        this._lastAz = az;
        this._lastPol = pol;
        if (this._suppressViewReset) return;
        if (this._viewName !== 'User') {
          this._viewName = 'User';
          if (this._autoOrtho && this.camera === this.ortho) this.toggleProjection();
          this._autoOrtho = false;
          this._emitLabel();
        }
      }
    });

    this.onFrame = new Set();
    this._tween = null;
    this._raycaster = new THREE.Raycaster();
    this._emitLabel();
  }

  size() {
    return {
      w: this.container.clientWidth || 1,
      h: this.container.clientHeight || 1,
    };
  }

  resize() {
    const { w, h } = this.size();
    this.renderer.setSize(w, h);
    this.composer.setPixelRatio(this.dpr);
    this.composer.setSize(w, h);
    this.outlineSel.setSize(w, h);
    this.outlineAct.setSize(w, h);
    this.overlay.width = Math.round(w * this.dpr);
    this.overlay.height = Math.round(h * this.dpr);
    this.overlay.style.width = `${w}px`;
    this.overlay.style.height = `${h}px`;

    this.persp.aspect = w / h;
    this.persp.updateProjectionMatrix();
    this._applyOrthoFrustum();
  }

  _applyOrthoFrustum() {
    const { w, h } = this.size();
    const aspect = w / h;
    const hh = this._orthoHalfH;
    this.ortho.left = -hh * aspect;
    this.ortho.right = hh * aspect;
    this.ortho.top = hh;
    this.ortho.bottom = -hh;
    this.ortho.updateProjectionMatrix();
  }

  _setupOutline(pass, color) {
    pass.edgeStrength = 4;
    pass.edgeGlow = 0;
    pass.edgeThickness = 0.6;
    pass.pulsePeriod = 0;
    pass.visibleEdgeColor.set(color);
    pass.hiddenEdgeColor.set(color).multiplyScalar(0.25);
  }

  setOutline(selected, active) {
    this.outlineSel.selectedObjects = selected;
    this.outlineAct.selectedObjects = active;
  }

  _swapCamera(cam) {
    const wasRigParent = this.camera;
    this.camera = cam;
    this.renderPass.camera = cam;
    this.outlineSel.renderCamera = cam;
    this.outlineAct.renderCamera = cam;
    this.controls.object = cam;
    wasRigParent.remove(this.sceneM.rig);
    this.sceneM.scene.remove(wasRigParent);
    this.sceneM.scene.add(cam);
    cam.add(this.sceneM.rig);
    this.events.emit('camera-swapped', cam);
  }

  get isOrtho() {
    return this.camera === this.ortho;
  }

  toggleProjection() {
    const target = this.controls.target;
    if (!this.isOrtho) {
      const dist = this.persp.position.distanceTo(target);
      this._orthoHalfH = dist * Math.tan(THREE.MathUtils.degToRad(this.persp.fov / 2));
      this._applyOrthoFrustum();
      this.ortho.zoom = 1;
      this.ortho.position.copy(this.persp.position);
      this.ortho.quaternion.copy(this.persp.quaternion);
      this.ortho.updateProjectionMatrix();
      this._swapCamera(this.ortho);
    } else {
      const hh = this._orthoHalfH / (this.ortho.zoom || 1);
      const dist = hh / Math.tan(THREE.MathUtils.degToRad(this.persp.fov / 2));
      const dir = new THREE.Vector3().subVectors(this.ortho.position, target).normalize();
      if (dir.lengthSq() < 1e-9) dir.set(0, -1, 0);
      this.persp.position.copy(target).addScaledVector(dir, dist);
      this._swapCamera(this.persp);
    }
    this.controls.update();
    this._emitLabel();
  }

  viewAxis(name) {
    const view = VIEWS[name];
    if (!view) return;
    this._cancelTween();
    const target = this.controls.target.clone();
    let dist;
    if (this.isOrtho) {
      dist = Math.max(this.ortho.position.distanceTo(target), 0.1);
    } else {
      dist = Math.max(this.persp.position.distanceTo(target), 0.1);
    }
    const endPos = target.clone().addScaledVector(view.dir.clone().normalize(), dist);
    this._viewName = view.label;
    if (!this.isOrtho) {
      this._autoOrtho = true;
    }
    this._tweenCameraTo(endPos, target, () => {
      if (this._autoOrtho && !this.isOrtho) this.toggleProjection();
      this._syncAngles();
      this._emitLabel();
    });
  }

  _syncAngles() {
    this._lastAz = this.controls.getAzimuthalAngle();
    this._lastPol = this.controls.getPolarAngle();
  }

  _tweenCameraTo(endPos, endTarget, done) {
    this._cancelTween();
    const cam = this.camera;
    const startPos = cam.position.clone();
    const startTarget = this.controls.target.clone();
    const t0 = performance.now();
    const dur = 220;
    this._suppressViewReset = true;
    const step = () => {
      const t = Math.min((performance.now() - t0) / dur, 1);
      const k = t * t * (3 - 2 * t);
      cam.position.lerpVectors(startPos, endPos, k);
      this.controls.target.lerpVectors(startTarget, endTarget, k);
      this.controls.update();
      this._syncAngles();
      if (t < 1) {
        this._tween = requestAnimationFrame(step);
      } else {
        this._tween = null;
        this._suppressViewReset = false;
        done && done();
      }
    };
    this._tween = requestAnimationFrame(step);
  }

  _cancelTween() {
    if (this._tween) cancelAnimationFrame(this._tween);
    this._tween = null;
    this._suppressViewReset = false;
  }

  frameBox(box) {
    if (!box) return;
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const radius = Math.max(sphere.radius, 0.4);
    const center = sphere.center;
    if (this.isOrtho) {
      const dir = new THREE.Vector3().subVectors(this.ortho.position, this.controls.target).normalize();
      const endPos = center.clone().addScaledVector(dir, Math.max(radius * 4, 2));
      this.ortho.zoom = (this._orthoHalfH / (radius * 1.25));
      this.ortho.updateProjectionMatrix();
      this._tweenCameraTo(endPos, center.clone(), () => this._syncAngles());
    } else {
      const fov = THREE.MathUtils.degToRad(this.persp.fov / 2);
      const dist = (radius * 1.18) / Math.sin(fov);
      const dir = new THREE.Vector3().subVectors(this.persp.position, this.controls.target).normalize();
      if (dir.lengthSq() < 1e-9) dir.set(0.5, -1, 0.5).normalize();
      const endPos = center.clone().addScaledVector(dir, dist);
      this._tweenCameraTo(endPos, center.clone(), () => this._syncAngles());
    }
  }

  _emitLabel() {
    const proj = this.isOrtho ? 'Orthographic' : 'Perspective';
    this.events.emit('view-label', `${this._viewName} ${proj}`);
  }

  // viewport-local css px -> Raycaster
  rayFromScreen(p) {
    const { w, h } = this.size();
    const ndc = new THREE.Vector2((p.x / w) * 2 - 1, -(p.y / h) * 2 + 1);
    this._raycaster.setFromCamera(ndc, this.camera);
    return this._raycaster;
  }

  // world Vector3 -> viewport-local css px
  project(v, target = {}) {
    const { w, h } = this.size();
    const p = v.clone().project(this.camera);
    target.x = (p.x + 1) / 2 * w;
    target.y = (-p.y + 1) / 2 * h;
    target.behind = p.z > 1;
    return target;
  }

  start() {
    const loop = () => {
      requestAnimationFrame(loop);
      this.controls.update();
      for (const fn of this.onFrame) fn();
      this.composer.render();
      this._drawOverlay();
    };
    loop();
  }

  _drawOverlay() {
    const ctx = this.overlayCtx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
    for (const fn of this.overlayDrawers) fn(ctx);
  }

  // High-res still of the current view without helpers/gizmos/outlines.
  renderStill(scale = 2) {
    const hidden = [];
    const hide = (o) => {
      if (o && o.visible) {
        o.visible = false;
        hidden.push(o);
      }
    };
    hide(this.sceneM.helpersGroup);
    this.sceneM.scene.traverse((o) => {
      if (o.userData.isGizmo || o.userData.isEditOverlay || o.userData.isTransformHelper) hide(o);
    });
    const selPrev = this.outlineSel.selectedObjects;
    const actPrev = this.outlineAct.selectedObjects;
    this.outlineSel.selectedObjects = [];
    this.outlineAct.selectedObjects = [];

    const prevDpr = this.dpr;
    this.renderer.setPixelRatio(Math.min(prevDpr * scale, 4));
    this.composer.setPixelRatio(Math.min(prevDpr * scale, 4));
    const { w, h } = this.size();
    this.composer.setSize(w, h);
    this.composer.render();
    const url = this.renderer.domElement.toDataURL('image/png');

    this.renderer.setPixelRatio(prevDpr);
    this.composer.setPixelRatio(prevDpr);
    this.composer.setSize(w, h);
    for (const o of hidden) o.visible = true;
    this.outlineSel.selectedObjects = selPrev;
    this.outlineAct.selectedObjects = actPrev;
    this.composer.render();
    return url;
  }

  getCameraState() {
    return {
      position: this.camera.position.toArray(),
      target: this.controls.target.toArray(),
      ortho: this.isOrtho,
      orthoHalfH: this._orthoHalfH,
      zoom: this.ortho.zoom,
    };
  }

  setCameraState(s) {
    if (!s) return;
    if (s.ortho && !this.isOrtho) this.toggleProjection();
    if (!s.ortho && this.isOrtho) this.toggleProjection();
    this.camera.position.fromArray(s.position);
    this.controls.target.fromArray(s.target);
    if (s.ortho) {
      this._orthoHalfH = s.orthoHalfH || 5;
      this.ortho.zoom = s.zoom || 1;
      this._applyOrthoFrustum();
    }
    this.controls.update();
    this._syncAngles();
  }

  resetView() {
    this._cancelTween();
    if (this.isOrtho) this.toggleProjection();
    this.persp.position.set(7.4, -6.9, 5.0);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
    this._viewName = 'User';
    this._autoOrtho = false;
    this._syncAngles();
    this._emitLabel();
  }
}
