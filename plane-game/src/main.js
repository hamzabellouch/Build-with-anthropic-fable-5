// HORIZONS Flight Simulator — bootstrap, game state machine, main loop.

import * as THREE from 'three';
import { AIRFRAMES, getAirframe } from './airframes.js';
import { FlightModel, Wind } from './physics.js';
import { buildAircraft, updateAircraft } from './models.js';
import { createWorld } from './world.js';
import { HUD } from './hud.js';
import { Controls } from './controls.js';
import { CameraRig } from './cameras.js';
import { AudioEngine } from './audio.js';
import { clamp, MS2FPM } from './util.js';

// ---------------------------------------------------------------------------
// Renderer / scene
// ---------------------------------------------------------------------------
const sceneCanvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas: sceneCanvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.3, 95000);

const world = createWorld(scene);
const hud = new HUD(document.getElementById('hud'));
const controls = new Controls(sceneCanvas);
const cameraRig = new CameraRig(camera, sceneCanvas, world.terrainHeight);
const audio = new AudioEngine();
const wind = new Wind(1);

// ---------------------------------------------------------------------------
// UI elements
// ---------------------------------------------------------------------------
const el = (id) => document.getElementById(id);
const menuEl = el('menu'), pauseEl = el('pause'), crashEl = el('crash');
const toastEl = el('toast');

let state = 'menu';           // menu | flying | paused | crashed
let fm = null, vis = null;
let selectedId = 'c172';
let hudMode = false;
let prevOnGround = true;
let airborneVs = 0, airborneTime = 0;
let crashTimer = 0;
let toastTimer = null;
let autopilot = null;         // test-hook input override
let menuAngle = 0;
let scrapeCooldown = 0;

function toast(msg, ms = 2600) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
}

// --- aircraft cards ---------------------------------------------------------
function buildCards() {
  const wrap = el('planeCards');
  wrap.innerHTML = '';
  for (const af of AIRFRAMES) {
    const card = document.createElement('div');
    card.className = 'card' + (af.id === selectedId ? ' selected' : '');
    card.innerHTML = `<h3>${af.name}</h3><div class="role">${af.role}</div>` +
      Object.entries(af.stats).map(([k, v]) => `<div class="stat"><span>${k}</span><b>${v}</b></div>`).join('') +
      `<div class="blurb">${af.blurb}</div>`;
    card.onclick = () => {
      selectedId = af.id;
      for (const c of wrap.children) c.classList.remove('selected');
      card.classList.add('selected');
    };
    wrap.appendChild(card);
  }
}
buildCards();

const KEYS = [
  ['↑ / ↓', 'pitch (stick fwd / back)'],
  ['← / →', 'roll'],
  ['A / D', 'rudder'],
  ['W / S', 'throttle'],
  ['1–9, 0', 'throttle preset'],
  ['F / R', 'flaps down / up'],
  ['G', 'landing gear'],
  ['B (hold)', 'wheel brakes'],
  ['P', 'parking brake'],
  ['Z / X', 'pitch trim'],
  ['Tab', 'afterburner (jet)'],
  ['C', 'camera view'],
  ['H', 'HUD overlay'],
  ['M', 'mouse yoke'],
  ['K', 'stability assist'],
  ['Esc', 'pause'],
];
el('controlsHint').innerHTML = KEYS.map(([k, d]) => `<div><b>${k}</b>&nbsp; ${d}</div>`).join('');
el('pauseHint').innerHTML = '<div style="display:grid;grid-template-columns:repeat(4,auto);gap:4px 24px;font-size:12px;">'
  + KEYS.map(([k, d]) => `<div><b style="color:#d8ecf8;font-family:monospace;">${k}</b> ${d}</div>`).join('') + '</div>';

// ---------------------------------------------------------------------------
// Flight lifecycle
// ---------------------------------------------------------------------------
function startFlight(id) {
  selectedId = id || selectedId;
  const af = getAirframe(selectedId);
  if (vis) { scene.remove(vis.root); vis = null; }
  wind.set(parseInt(el('optWind').value, 10));
  fm = new FlightModel(af, world.terrainInfo, wind);
  const s = world.runwayStart;
  fm.reset(s.x, s.z, s.heading);
  vis = buildAircraft(af);
  scene.add(vis.root);
  vis.root.position.copy(fm.pos);
  vis.root.quaternion.copy(fm.quat);
  audio.attach(af);
  controls.syncFrom(fm);
  controls.assist = el('optAssist').checked;
  controls.invertPitch = el('optInvert').checked;
  controls.mouseYoke = el('optMouse').checked;
  controls.enabled = true;
  hudMode = af.id === 'f16';
  cameraRig.setMode(0, fm);
  prevOnGround = true;
  state = 'flying';
  menuEl.classList.add('hidden');
  pauseEl.classList.add('hidden');
  crashEl.classList.add('hidden');
  toast('Parking brake set — release with P, throttle up with W. Rotate gently. Good flight!', 5200);
}

function backToRunway() {
  if (!fm) return;
  const s = world.runwayStart;
  fm.reset(s.x, s.z, s.heading);
  controls.syncFrom(fm);
  cameraRig.setMode(0, fm);
  state = 'flying';
  pauseEl.classList.add('hidden');
  crashEl.classList.add('hidden');
  toast('Back on runway 36. Parking brake set.', 3000);
}

function backToMenu() {
  state = 'menu';
  if (vis) { scene.remove(vis.root); vis = null; }
  fm = null;
  audio.silenceEngine();
  menuEl.classList.remove('hidden');
  pauseEl.classList.add('hidden');
  crashEl.classList.add('hidden');
}

function onCrash() {
  state = 'crashed';
  crashTimer = 0;
  world.particles.explosion(fm.pos);
  audio.explosion();
  audio.silenceEngine();
  cameraRig.kick(2.5);
  el('crashReason').textContent = fm.crashReason;
}

function setPaused(p) {
  if (p && state === 'flying') {
    state = 'paused';
    pauseEl.classList.remove('hidden');
    if (audio.ctx) audio.ctx.suspend();
  } else if (!p && state === 'paused') {
    state = 'flying';
    pauseEl.classList.add('hidden');
    if (audio.ctx) audio.ctx.resume();
  }
}

el('btnFly').onclick = () => { audio.init(); startFlight(selectedId); };
el('btnResume').onclick = () => setPaused(false);
el('btnRestart').onclick = () => { backToRunway(); if (audio.ctx) audio.ctx.resume(); };
el('btnMenu').onclick = () => { backToMenu(); if (audio.ctx) audio.ctx.resume(); };
el('btnCrashRestart').onclick = () => backToRunway();
el('btnCrashMenu').onclick = () => backToMenu();

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
function handleAction(a) {
  if (typeof a === 'object' && a.throttle !== undefined) {
    controls.throttle = a.throttle;
    return;
  }
  switch (a) {
    case 'pause':
      if (state === 'flying') setPaused(true);
      else if (state === 'paused') setPaused(false);
      break;
    case 'camera':
      cameraRig.cycle(fm);
      break;
    case 'gear': {
      if (!fm || !fm.af.gear.retractable) { toast('Landing gear is fixed on this aircraft'); break; }
      if (fm.inputs.gearDown && fm.out.onGround) { toast('Cannot retract — weight on wheels'); break; }
      fm.inputs.gearDown = !fm.inputs.gearDown;
      toast(fm.inputs.gearDown ? 'Gear DOWN' : 'Gear UP');
      break;
    }
    case 'flapsDown': {
      if (!fm) break;
      const n = fm.af.flapNotches;
      if (fm.inputs.flapIdx < n.length - 1) fm.inputs.flapIdx++;
      toast(`Flaps ${n[fm.inputs.flapIdx]}°`);
      break;
    }
    case 'flapsUp': {
      if (!fm) break;
      const n = fm.af.flapNotches;
      if (fm.inputs.flapIdx > 0) fm.inputs.flapIdx--;
      toast(fm.inputs.flapIdx === 0 ? 'Flaps UP' : `Flaps ${n[fm.inputs.flapIdx]}°`);
      break;
    }
    case 'parking':
      if (!fm) break;
      fm.inputs.parking = !fm.inputs.parking;
      toast(fm.inputs.parking ? 'Parking brake SET' : 'Parking brake RELEASED');
      break;
    case 'afterburner':
      if (!fm) break;
      if (fm.af.engine.type !== 'jet') { toast('No afterburner on this aircraft'); break; }
      fm.inputs.afterburner = !fm.inputs.afterburner;
      toast(fm.inputs.afterburner ? 'AFTERBURNER' : 'Afterburner OFF', 1500);
      break;
    case 'hud':
      hudMode = !hudMode;
      toast(hudMode ? 'HUD overlay ON' : 'HUD overlay OFF', 1200);
      break;
    case 'mouseYoke':
      controls.mouseYoke = !controls.mouseYoke;
      toast(controls.mouseYoke ? 'Mouse yoke ON — steer with the cursor' : 'Mouse yoke OFF');
      break;
    case 'assist':
      controls.assist = !controls.assist;
      toast(controls.assist ? 'Stability assist ON' : 'Stability assist OFF');
      break;
    case 'invert':
      controls.invertPitch = !controls.invertPitch;
      toast(`Pitch axis ${controls.invertPitch ? 'INVERTED' : 'NORMAL'}`);
      break;
    case 'restart':
      backToRunway();
      break;
  }
}

// ---------------------------------------------------------------------------
// Touchdown rating
// ---------------------------------------------------------------------------
function onTouchdown() {
  const vsFpm = airborneVs * MS2FPM;
  if (airborneTime < 3) return;       // skip bounces / initial spawn
  let msg, kick = 0.2;
  if (airborneVs > -0.7) { msg = `Butter! ${Math.round(-vsFpm)} fpm — grease on the runway`; }
  else if (airborneVs > -1.8) { msg = `Smooth touchdown — ${Math.round(-vsFpm)} fpm`; }
  else if (airborneVs > -3.2) { msg = `Firm landing — ${Math.round(-vsFpm)} fpm`; kick = 0.6; }
  else { msg = `HARD landing — ${Math.round(-vsFpm)} fpm. Check the gear...`; kick = 1.4; }
  if (!fm.out.onRunway) msg += ' (off the runway!)';
  toast(msg, 3400);
  audio.thump(clamp(-airborneVs / 3, 0.2, 1.2));
  if (fm.out.tas > 25) audio.screech();
  cameraRig.kick(kick);
  for (const w of fm.wheels) {
    if (w.compression > 0) {
      const p = w.pos.clone().applyQuaternion(fm.quat).add(fm.pos);
      world.particles.tyreSmoke(p, fm.vel);
    }
  }
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
let last = performance.now();
const windVec = new THREE.Vector3();

function frame(ts) {
  requestAnimationFrame(frame);
  const dt = clamp((ts - last) / 1000, 0.0001, 0.05);
  last = ts;

  if (state === 'menu') {
    menuAngle += dt * 0.035;
    const r = 520;
    camera.position.set(Math.sin(menuAngle) * r, world.FIELD_ELEV + 130, Math.cos(menuAngle) * r * 0.9);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, world.FIELD_ELEV + 10, 0);
    camera.fov = 55;
    camera.updateProjectionMatrix();
    world.update(dt, camera.position, wind.vectorAt(camera.position, ts / 1000, windVec), null);
    hud.draw(null, {});
  } else if (fm) {
    // actions must be processed in every state (Esc to unpause, camera, etc.)
    for (const a of controls.consumeActions()) {
      const always = a === 'pause' || a === 'camera' || a === 'restart';
      if (always || state === 'flying') handleAction(a);
    }
    if (state === 'flying') {
      controls.update(dt, fm);
      if (autopilot) Object.assign(fm.inputs, autopilot);

      if (!fm.out.onGround) {
        airborneTime += dt;
        airborneVs = fm.out.vs;
      }
      fm.step(dt);
      if (fm.crashed) {
        onCrash();
      } else {
        if (!prevOnGround && fm.out.onGround) { onTouchdown(); airborneTime = 0; }
        prevOnGround = fm.out.onGround;
        scrapeCooldown -= dt;
        if (fm.out.scrape && scrapeCooldown <= 0) {
          scrapeCooldown = 3;
          toast('⚠ Airframe scraping the ground!', 2000);
          audio.screech();
          cameraRig.kick(0.8);
        }
      }
    } else if (state === 'crashed') {
      crashTimer += dt;
      // smouldering wreck
      if (Math.random() < 0.35) {
        world.particles.emit(
          fm.pos.x + (Math.random() - 0.5) * 3, fm.pos.y + 0.5, fm.pos.z + (Math.random() - 0.5) * 3,
          (Math.random() - 0.5), 1.5 + Math.random() * 2, (Math.random() - 0.5),
          2.5 + Math.random() * 2, 4 + Math.random() * 5, 0.12, 0.12, 0.13,
        );
      }
      if (crashTimer > 1.5) crashEl.classList.remove('hidden');
    }

    vis.root.position.copy(fm.pos);
    vis.root.quaternion.copy(fm.quat);
    updateAircraft(vis, fm, state === 'flying' ? dt : 0);
    if (vis.canopy) vis.canopy.visible = cameraRig.mode !== 1;

    wind.vectorAt(fm.pos, fm.time, windVec);
    world.update(dt, fm.pos, windVec, fm.out);
    if (state !== 'paused') cameraRig.update(dt, fm, world);
    audio.update(dt, fm, camera.position.distanceTo(fm.pos), cameraRig.mode);
    hud.draw(fm, { camMode: cameraRig.mode, hudMode, dt });
  }

  renderer.render(scene, camera);
  const ln = el('loadnote');
  if (ln) ln.remove();
}

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  hud.resize();
});

requestAnimationFrame(frame);

// ---------------------------------------------------------------------------
// Test hooks (programmatic control for verification — not used in gameplay)
// ---------------------------------------------------------------------------
window.__sim = {
  get state() { return state; },
  get fm() { return fm; },
  out: () => (fm ? { ...fm.out, ctrl: { ...fm.out.ctrl } } : null),
  pos: () => (fm ? fm.pos.toArray() : null),
  crashed: () => (fm ? fm.crashed : false),
  reason: () => (fm ? fm.crashReason : ''),
  start(id) { autopilot = null; startFlight(id); controls.enabled = false; return true; },
  restart() { autopilot = null; backToRunway(); return true; },
  // teleport for approach/test setups: heading in deg, speed in knots
  place(x, alt, z, hdgDeg, spdKt) {
    if (!fm) return false;
    const h = (hdgDeg * Math.PI) / 180;
    fm.quat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -h);
    fm.pos.set(x, alt, z);
    const spd = spdKt / 1.943844;
    fm.vel.set(Math.sin(h) * spd, 0, -Math.cos(h) * spd);
    fm.omega.set(0, 0, 0);
    fm.inputs.parking = false;
    fm.crashed = false; fm.crashReason = '';
    prevOnGround = false;
    airborneTime = 10;
    return true;
  },
  setInputs(o) { autopilot = { ...(autopilot || {}), ...o }; },
  setWind(n) { wind.set(n); return wind.setting; },
  cam(n) { cameraRig.setMode(n, fm); return cameraRig.mode; },
  setHud(v) { hudMode = !!v; },
  clearInputs() { autopilot = null; controls.enabled = true; },
  fastForward(seconds, stepHz = 60) {
    if (!fm) return null;
    const h = 1 / stepHz;
    let t = 0;
    while (t < seconds && !fm.crashed) {
      if (autopilot) Object.assign(fm.inputs, autopilot);
      fm.step(h);
      t += h;
    }
    prevOnGround = fm.out.onGround;
    return { ...fm.out };
  },
};
