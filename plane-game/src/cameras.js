// Camera rig: chase / cockpit / orbit / tower / flyby, with smoothing,
// speed-reactive FOV, buffet shake and ground collision avoidance.

import * as THREE from 'three';
import { clamp, lerp, damp } from './util.js';

export const CAM_MODES = 5;

const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3();
const _q1 = new THREE.Quaternion();
const UP = new THREE.Vector3(0, 1, 0);

export class CameraRig {
  constructor(camera, dom, terrainHeight) {
    this.camera = camera;
    this.dom = dom;
    this.terrainHeight = terrainHeight;
    this.mode = 0;
    this.pos = new THREE.Vector3(0, 30, 60);
    this.lookTarget = new THREE.Vector3();
    this.shake = 0;

    // orbit state
    this.orbitYaw = 0.6;
    this.orbitPitch = 0.25;
    this.orbitDist = 28;
    this.dragging = false;

    // flyby state
    this.flybyPoint = new THREE.Vector3();
    this.flybyArmed = false;

    this.fovBase = 60;
    this.fov = 60;

    dom.addEventListener('mousedown', (e) => {
      if (this.mode === 2 || e.button === 2) this.dragging = true;
    });
    addEventListener('mouseup', () => { this.dragging = false; });
    addEventListener('mousemove', (e) => {
      if (this.dragging) {
        this.orbitYaw -= e.movementX * 0.005;
        this.orbitPitch = clamp(this.orbitPitch + e.movementY * 0.004, -0.45, 1.25);
      }
    });
    dom.addEventListener('wheel', (e) => {
      if (this.mode === 2) {
        this.orbitDist = clamp(this.orbitDist * (e.deltaY > 0 ? 1.12 : 0.89), 8, 220);
      }
    }, { passive: true });
    dom.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  setMode(m, fm) {
    this.mode = ((m % CAM_MODES) + CAM_MODES) % CAM_MODES;
    if (fm) {
      this.fovBase = this.mode === 1 ? fm.af.camera.fov : 60;
      if (this.mode === 4) this.armFlyby(fm);
      if (this.mode === 0) this.snapChase(fm);
    }
  }

  cycle(fm) { this.setMode(this.mode + 1, fm); }

  armFlyby(fm) {
    // point ~500m ahead of the flight path, offset sideways & up
    _v1.copy(fm.vel);
    if (_v1.lengthSq() < 4) _v1.set(0, 0, -1).applyQuaternion(fm.quat);
    _v1.normalize();
    this.flybyPoint.copy(fm.pos).addScaledVector(_v1, 450);
    this.flybyPoint.x += (Math.random() - 0.5) * 160;
    this.flybyPoint.y += 20 + Math.random() * 40;
    this.flybyPoint.z += (Math.random() - 0.5) * 160;
    const minY = this.terrainHeight(this.flybyPoint.x, this.flybyPoint.z) + 6;
    this.flybyPoint.y = Math.max(this.flybyPoint.y, minY);
    this.flybyArmed = true;
  }

  snapChase(fm) {
    const af = fm.af.camera;
    _v1.set(0, 0, -1).applyQuaternion(fm.quat); _v1.y = 0;
    if (_v1.lengthSq() < 0.01) _v1.set(0, 0, -1); else _v1.normalize();
    this.pos.copy(fm.pos).addScaledVector(_v1, -af.chaseDist).add(_v2.set(0, af.chaseHeight, 0));
  }

  update(dt, fm, world) {
    const cam = this.camera;
    const out = fm.out;
    const af = fm.af.camera;

    // buffet + touchdown shake decays
    this.shake = Math.max(this.shake * Math.exp(-3.5 * dt), out.buffet * 0.5);

    switch (this.mode) {
      case 0: { // chase
        _v1.set(0, 0, -1).applyQuaternion(fm.quat);
        _v2.copy(_v1); _v2.y = 0;
        if (_v2.lengthSq() < 0.01) _v2.set(0, 0, -1); else _v2.normalize();
        // blend horizontal-follow with a touch of full orientation-follow
        _v3.copy(_v2).lerp(_v1, 0.35).normalize();
        const speedK = clamp(out.tas / 120, 0, 1);
        const dist = af.chaseDist * (1 + speedK * 0.35);
        const want = _v3.multiplyScalar(-dist).add(fm.pos);
        want.y += af.chaseHeight;
        const rate = 4.2;
        // feed-forward most of the steady-state lag so fast jets stay framed
        want.addScaledVector(fm.vel, 0.88 / rate);
        this.pos.x = damp(this.pos.x, want.x, rate, dt);
        this.pos.y = damp(this.pos.y, want.y, rate, dt);
        this.pos.z = damp(this.pos.z, want.z, rate, dt);
        // terrain avoidance
        const minY = this.terrainHeight(this.pos.x, this.pos.z) + 1.6;
        if (this.pos.y < minY) this.pos.y = minY;
        cam.position.copy(this.pos);
        this.lookTarget.copy(fm.pos).addScaledVector(fm.vel, 0.06);
        this.lookTarget.y += 1.2;
        cam.up.copy(UP).lerp(_v2.set(0, 1, 0).applyQuaternion(fm.quat), 0.22).normalize();
        cam.lookAt(this.lookTarget);
        this.fov = damp(this.fov, this.fovBase * (1 + speedK * 0.12), 3, dt);
        break;
      }
      case 1: { // cockpit
        _v1.set(af.cockpit[0], af.cockpit[1], af.cockpit[2]).applyQuaternion(fm.quat).add(fm.pos);
        cam.position.copy(_v1);
        cam.quaternion.copy(fm.quat);
        // small G-induced head movement
        const gOff = clamp((out.G - 1) * -0.012, -0.06, 0.05);
        _v2.set(0, gOff, 0).applyQuaternion(fm.quat);
        cam.position.add(_v2);
        this.fov = damp(this.fov, this.fovBase, 5, dt);
        break;
      }
      case 2: { // orbit
        const cy = Math.cos(this.orbitYaw), sy = Math.sin(this.orbitYaw);
        const cp = Math.cos(this.orbitPitch), sp = Math.sin(this.orbitPitch);
        _v1.set(sy * cp, sp, cy * cp).multiplyScalar(this.orbitDist);
        cam.position.copy(fm.pos).add(_v1);
        const minY = this.terrainHeight(cam.position.x, cam.position.z) + 0.8;
        if (cam.position.y < minY) cam.position.y = minY;
        cam.up.copy(UP);
        cam.lookAt(fm.pos);
        this.fov = damp(this.fov, 55, 5, dt);
        break;
      }
      case 3: { // tower
        cam.position.set(95, world.FIELD_ELEV + 21, -18);
        cam.up.copy(UP);
        cam.lookAt(fm.pos);
        const d = cam.position.distanceTo(fm.pos);
        this.fov = clamp(2600 / Math.max(d, 10), 3, 50);
        break;
      }
      case 4: { // flyby
        if (!this.flybyArmed) this.armFlyby(fm);
        cam.position.copy(this.flybyPoint);
        cam.up.copy(UP);
        cam.lookAt(fm.pos);
        const d = cam.position.distanceTo(fm.pos);
        this.fov = clamp(1900 / Math.max(d, 10), 6, 55);
        // re-arm when plane is far past
        _v1.copy(fm.pos).sub(this.flybyPoint);
        _v2.copy(fm.vel);
        if (d > 650 && _v1.dot(_v2) > 0) this.armFlyby(fm);
        break;
      }
    }

    // shake (not in tower/orbit)
    if (this.mode <= 1 && this.shake > 0.003) {
      const s = this.shake * (this.mode === 1 ? 0.05 : 0.10);
      cam.position.x += (Math.random() - 0.5) * s;
      cam.position.y += (Math.random() - 0.5) * s;
      cam.position.z += (Math.random() - 0.5) * s;
    }

    cam.fov = this.fov;
    cam.updateProjectionMatrix();
  }

  kick(intensity) { this.shake = Math.max(this.shake, intensity); }
}
