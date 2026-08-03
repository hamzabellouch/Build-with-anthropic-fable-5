// App glue: renderer, fixed-timestep physics loop (1 kHz), cameras, race
// logic, crash handling, settings persistence.

import * as THREE from 'three';
import { Simulation, PHYS_DT } from './sim/sim.js';
import { PRESETS, getPreset, DEFAULT_PRESET } from './sim/presets.js';
import { buildWorld, gateCrossed } from './render/world.js';
import { buildDrone } from './render/droneModel.js';
import { HUD } from './render/hud.js';
import { InputManager } from './input/input.js';
import { QuadSound } from './audio/sound.js';
import { Menu, Store } from './ui/menu.js';
import { DEG } from './sim/math.js';

class App {
  constructor() {
    this.store = new Store('fpvsim');
    this.settings = Object.assign(
      { damage: true, wind: 0, gust: 1.0, renderScale: 1.0, presetId: DEFAULT_PRESET },
      this.store.get('settings') || {});

    this.presetList = Object.values(PRESETS).map(p => ({ id: p.id, name: p.name }));

    // --- renderer/scene ---
    this.canvas = document.getElementById('gl');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.world = buildWorld(this.scene);

    this.camera = new THREE.PerspectiveCamera(75, 1, 0.05, 1200);
    this.view = 'fpv';            // fpv | chase | los
    this.chasePos = new THREE.Vector3();

    // --- sim + drone visual ---
    this.applyPreset(getPreset(this.settings.presetId));

    // --- subsystems ---
    this.hud = new HUD(document.getElementById('hud'));
    this.input = new InputManager(this.store);
    this.sound = new QuadSound(this.sim.cfg.prop.blades);
    this.menu = new Menu(document.getElementById('menu'), this);

    const saved = this.store.get('tune:' + this.sim.cfg.id);
    if (saved) this.applyTune(saved);
    this.applyWind();

    this.timescale = 1;
    this.slowmoIdx = 0;
    this.accum = 0;
    this.lastT = performance.now();
    this.prevPos = [...this.sim.pos];
    this.crashFlash = 0;

    this.race = {
      enabled: this.store.get('raceEnabled', true),
      next: 0, total: this.world.gates.length,
      lapStart: null, lastLap: null,
      bestLap: this.store.get('bestLap', null),
    };
    this.world.setNextGate(0);

    this.bindKeys();
    this.onResize();
    window.addEventListener('resize', () => this.onResize());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.sim.armed) { this.sim.disarm(); this.hud.message('AUTO-DISARM (tab hidden)'); }
    });

    // Start screen
    const startEl = document.getElementById('start');
    document.getElementById('startBtn').addEventListener('click', () => {
      startEl.style.display = 'none';
      this.sound.start();
      this.hud.message('Throttle LOW, then ENTER (or start button) to ARM', 4);
    });
    setInterval(() => {
      const gp = this.input.gamepad();
      const el = document.getElementById('gpstatus');
      if (el) el.textContent = gp ? `Controller: ${gp.id.slice(0, 60)}` : 'No controller detected — keyboard armed. Move a stick to detect.';
    }, 500);

    // Test hook
    window.__sim = this;

    requestAnimationFrame(t => this.frame(t));
  }

  // ---------- configuration ----------
  applyPreset(cfg) {
    if (this.droneVis) this.scene.remove(this.droneVis.group);
    this.sim = new Simulation(cfg, { colliders: this.world.colliders, wind: { speed: 0, dir: 0, gust: 0 } });
    this.sim.reset(this.world.spawn.pos, this.world.spawn.yaw);
    this.droneVis = buildDrone(cfg);
    this.scene.add(this.droneVis.group);
    this.setFov(cfg.cam.fovH, false);
    if (this.sound) this.sound.blades = cfg.prop.blades;
  }

  setPreset(id) {
    this.settings.presetId = id;
    this.applyPreset(getPreset(id));
    const saved = this.store.get('tune:' + id);
    if (saved) this.applyTune(saved);
    this.applyWind();
    this.persist();
    this.menu.render();
    this.hud.message(this.sim.cfg.name);
  }

  applyTune(t) {
    const cfg = this.sim.cfg;
    Object.assign(cfg.fc.rates, t.rates || {});
    Object.assign(cfg.fc.ratesYaw, t.ratesYaw || {});
    Object.assign(cfg.fc.pid.rollPitch, t.pid || {});
    Object.assign(cfg.cam, t.cam || {});
    if (t.angleMode != null) this.sim.fc.angleMode = t.angleMode;
    this.setFov(cfg.cam.fovH, false);
  }

  persist() {
    this.store.set('settings', this.settings);
    const cfg = this.sim.cfg;
    this.store.set('tune:' + cfg.id, {
      rates: cfg.fc.rates, ratesYaw: cfg.fc.ratesYaw,
      pid: cfg.fc.pid.rollPitch, cam: cfg.cam,
      angleMode: this.sim.fc.angleMode,
    });
    this.store.set('raceEnabled', this.race.enabled);
  }

  resetDefaults() {
    localStorage.clear();
    this.settings = { damage: true, wind: 0, gust: 1.0, renderScale: 1.0, presetId: DEFAULT_PRESET };
    this.applyPreset(getPreset(DEFAULT_PRESET));
    this.applyWind();
    this.menu.render();
  }

  setCamTilt(v) { this.sim.cfg.cam.tiltDeg = v; this.persist(); }
  setFov(h, save = true) {
    this.sim.cfg.cam.fovH = h;
    const aspect = window.innerWidth / window.innerHeight;
    this.camera.fov = 2 * Math.atan(Math.tan(h * DEG / 2) / aspect) / DEG;
    this.camera.updateProjectionMatrix();
    if (save) this.persist();
  }
  applyWind() {
    this.sim.setWind(this.settings.wind, 0.7, this.settings.gust * (this.settings.wind > 0 ? 1 : 0.3));
  }
  applyRenderScale() { this.onResize(); }

  // ---------- input/keys ----------
  bindKeys() {
    window.addEventListener('keydown', e => {
      if (e.code === 'Escape') { this.menu.toggle(); return; }
      if (this.menu.open) return;
      switch (e.code) {
        case 'Enter': this.toggleArm(); break;
        case 'KeyR': this.resetQuad(); break;
        case 'KeyB': this.sim.swapBattery(); this.hud.message('Fresh pack!'); break;
        case 'KeyC':
          this.view = this.view === 'fpv' ? 'chase' : this.view === 'chase' ? 'los' : 'fpv';
          this.hud.message(this.view.toUpperCase());
          break;
        case 'KeyM':
          this.sim.fc.angleMode = !this.sim.fc.angleMode;
          this.hud.message(this.sim.fc.angleMode ? 'ANGLE (self-level)' : 'ACRO');
          this.persist();
          break;
        case 'KeyT': {
          this.slowmoIdx = (this.slowmoIdx + 1) % 3;
          this.timescale = [1, 0.5, 0.25][this.slowmoIdx];
          this.hud.message(this.timescale === 1 ? 'REAL TIME' : `SLOW-MO x${this.timescale}`);
          break;
        }
        case 'KeyG': this.hud.showGraph = !this.hud.showGraph; break;
        case 'KeyH': this.hud.showSticks = !this.hud.showSticks; break;
      }
    });
  }

  toggleArm() {
    if (this.sim.armed) { this.sim.disarm(); this.hud.message('DISARMED'); return; }
    if (this.sim.crashed) { this.hud.message('CRASHED — press R to reset'); return; }
    if (this.input.out.throttle > 0.1) { this.hud.message('THROTTLE HIGH — lower it to arm'); return; }
    if (this.sim.arm()) this.hud.message('ARMED', 1.2);
  }

  resetQuad() {
    this.sim.reset(this.world.spawn.pos, this.world.spawn.yaw);
    this.resetRace();
    this.hud.message('Reset. ENTER to arm.', 1.5);
  }

  resetRace() {
    this.race.next = 0;
    this.race.lapStart = null;
    this.world.setNextGate(this.race.enabled ? 0 : -1);
  }

  // ---------- race ----------
  updateRace() {
    if (!this.race.enabled) return;
    const g = this.world.gates[this.race.next];
    if (!g) return;
    if (gateCrossed(g, this.prevPos, this.sim.pos)) {
      if (this.race.next === 0) this.race.lapStart = this.sim.time;
      this.race.next++;
      if (this.race.next >= this.race.total) {
        const lap = this.sim.time - this.race.lapStart;
        this.race.lastLap = lap;
        if (this.race.bestLap == null || lap < this.race.bestLap) {
          this.race.bestLap = lap;
          this.store.set('bestLap', lap);
          this.hud.message(`LAP ${lap.toFixed(2)}s — NEW BEST!`, 3);
        } else this.hud.message(`LAP ${lap.toFixed(2)}s`, 2.5);
        this.race.next = 0;
        this.race.lapStart = this.sim.time;
      }
      this.world.setNextGate(this.race.next);
    }
  }

  // ---------- main loop ----------
  frame(tNow) {
    requestAnimationFrame(t => this.frame(t));
    const dtReal = Math.min((tNow - this.lastT) / 1000, 0.05);
    this.lastT = tNow;

    const inputs = this.input.update(dtReal);
    for (const ev of this.input.takeEvents()) if (ev === 'arm') this.toggleArm();

    if (!this.menu.open) {
      // InputManager already outputs pilot convention (pitch + = stick back).
      this.sim.inputs.roll = inputs.roll;
      this.sim.inputs.pitch = inputs.pitch;
      this.sim.inputs.yaw = inputs.yaw;
      this.sim.inputs.throttle = inputs.throttle;

      this.prevPos = [this.sim.pos[0], this.sim.pos[1], this.sim.pos[2]];
      this.accum += dtReal * this.timescale;
      const maxSteps = 100;
      let steps = 0;
      while (this.accum >= PHYS_DT && steps < maxSteps) {
        this.sim.step(PHYS_DT);
        this.accum -= PHYS_DT;
        steps++;
        // crash / impact handling at physics rate
        if (this.sim.lastImpact > 0.8) this.handleImpact(this.sim.lastImpact);
      }
      this.updateRace();
    }

    this.render(dtReal);
    this.hud.draw({
      sim: this.sim, inputs: this.sim.inputs, race: this.race,
      view: this.view, timescale: this.timescale, menuOpen: this.menu.open,
    });

    const dist = this.camera.position.distanceTo(this.droneVis.group.position);
    this.sound.update(this.sim.motors, this.sim.speed, this.view === 'fpv' ? 0 : dist, dtReal);
  }

  handleImpact(speed) {
    if (speed > 1.5) this.sound.thud(speed);
    if (this.settings.damage && this.sim.armed && speed > this.sim.cfg.collision.crashSpeed) {
      this.sim.disarm();
      this.sim.crashed = true;
      this.crashFlash = 1;
    }
    this.sim.lastImpact = 0;
  }

  render(dt) {
    const d = this.droneVis.group;
    d.position.set(this.sim.pos[0], this.sim.pos[1], this.sim.pos[2]);
    d.quaternion.set(this.sim.q[0], this.sim.q[1], this.sim.q[2], this.sim.q[3]);
    this.droneVis.updateProps(this.sim.motors.map(m => m.w), dt);

    // shadow camera follows the action
    this.world.sun.position.set(this.sim.pos[0] + 60, 90, this.sim.pos[2] + 30);
    this.world.sun.target.position.set(this.sim.pos[0], 0, this.sim.pos[2]);

    if (this.view === 'fpv') {
      this.camera.position.copy(d.position);
      const camQ = new THREE.Quaternion().copy(d.quaternion);
      const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.sim.cfg.cam.tiltDeg * DEG);
      camQ.multiply(tilt);
      this.camera.quaternion.copy(camQ);
      // nudge to the cam pod position
      const off = new THREE.Vector3(0, 0.02, -0.06).applyQuaternion(d.quaternion);
      this.camera.position.add(off);
    } else if (this.view === 'chase') {
      const back = new THREE.Vector3(0, 0, 1).applyQuaternion(d.quaternion);
      back.y = 0;
      back.normalize().multiplyScalar(3.4);
      const target = new THREE.Vector3().copy(d.position).add(back).add(new THREE.Vector3(0, 1.1, 0));
      this.chasePos.lerp(target, Math.min(1, dt * 7));
      if (this.chasePos.y < 0.2) this.chasePos.y = 0.2;
      this.camera.position.copy(this.chasePos);
      this.camera.lookAt(d.position);
    } else {
      this.camera.position.set(...this.world.losEye);
      this.camera.lookAt(d.position);
    }

    // crash flash decay
    if (this.crashFlash > 0) {
      this.crashFlash = Math.max(0, this.crashFlash - dt * 2);
      this.renderer.setClearColor(new THREE.Color(this.crashFlash * 0.4, 0, 0));
    }

    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2) * (this.settings.renderScale || 1);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h);
    this.hud.resize(w, h, Math.min(window.devicePixelRatio || 1, 2));
    this.setFov(this.sim.cfg.cam.fovH, false);
  }
}

new App();
