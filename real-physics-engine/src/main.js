// Application shell: fixed-timestep loop, mouse/keyboard interaction, UI panel.

import { V } from './math.js';
import { Bodies } from './body.js';
import { World } from './world.js';
import { Renderer } from './renderer.js';
import { MouseJoint } from './joints.js';
import { SCENES } from './scenes.js';

const PHYS_HZ = 120;
const PHYS_DT = 1 / PHYS_HZ;
const MAX_STEPS_PER_FRAME = 8;

const canvas = document.getElementById('canvas');
const world = new World();
const renderer = new Renderer(canvas);

const state = {
  paused: false,
  timeScale: 1,
  tool: 'drag',
  sceneIndex: 0,
  accumulator: 0,
  lastFrame: performance.now(),
  fps: 60,
  mouseJoint: null,
  aim: null,        // { from, to } while spawning with a pulled slingshot
  panning: null,    // { startScreen, startCam }
  spawn: { restitution: 0.5, friction: 0.4, density: 1, size: 0.5 },
  energyHistory: [],
};

// ---------------------------------------------------------------- scene mgmt

function loadScene(index) {
  state.sceneIndex = index;
  const scene = SCENES[index];
  world.reset();
  scene.setup(world);
  renderer.camera = { ...scene.camera };
  state.energyHistory = [];
  state.mouseJoint = null;
  state.aim = null;
  document.getElementById('sceneSelect').value = String(index);
  document.getElementById('sceneDesc').textContent = scene.description;
  syncPanelFromWorld();
}

// ------------------------------------------------------------------ main loop

function frame(now) {
  const rdt = Math.min((now - state.lastFrame) / 1000, 0.05);
  state.lastFrame = now;
  state.fps = state.fps * 0.95 + (1 / Math.max(rdt, 1e-4)) * 0.05;

  if (!state.paused) {
    state.accumulator += rdt * state.timeScale;
    let steps = 0;
    while (state.accumulator >= PHYS_DT && steps < MAX_STEPS_PER_FRAME) {
      if (state.mouseJoint) state.mouseJoint.target = V.clone(mouse.world);
      world.step(PHYS_DT);
      steps++;
      state.accumulator -= PHYS_DT;
    }
    if (steps === MAX_STEPS_PER_FRAME) state.accumulator = 0;
  }

  renderer.render(world, { aim: state.aim });
  updateStats();
  requestAnimationFrame(frame);
}

// --------------------------------------------------------------------- input

const mouse = { screen: { x: 0, y: 0 }, world: { x: 0, y: 0 }, down: false };

function updateMouse(e) {
  const rect = canvas.getBoundingClientRect();
  mouse.screen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  mouse.world = renderer.toWorld(mouse.screen);
}

canvas.addEventListener('pointerdown', (e) => {
  updateMouse(e);
  canvas.setPointerCapture(e.pointerId);
  if (e.button === 2 || e.button === 1) {
    state.panning = { startScreen: { ...mouse.screen }, startCam: { ...renderer.camera } };
    return;
  }
  mouse.down = true;
  if (state.tool === 'drag') {
    const body = world.bodyAt(mouse.world);
    if (body) {
      state.mouseJoint = new MouseJoint(body, mouse.world);
      world.addJoint(state.mouseJoint);
    }
  } else {
    state.aim = { from: V.clone(mouse.world), to: V.clone(mouse.world), speed: 0 };
  }
});

canvas.addEventListener('pointermove', (e) => {
  updateMouse(e);
  if (state.panning) {
    const dx = (mouse.screen.x - state.panning.startScreen.x) / renderer.camera.zoom;
    const dy = (mouse.screen.y - state.panning.startScreen.y) / renderer.camera.zoom;
    renderer.camera.x = state.panning.startCam.x - dx;
    renderer.camera.y = state.panning.startCam.y + dy;
    return;
  }
  if (state.mouseJoint) state.mouseJoint.target = V.clone(mouse.world);
  if (state.aim) {
    state.aim.to = V.clone(mouse.world);
    state.aim.speed = V.dist(state.aim.from, state.aim.to) * 4;
  }
});

canvas.addEventListener('pointerup', (e) => {
  updateMouse(e);
  if (state.panning) { state.panning = null; return; }
  mouse.down = false;
  if (state.mouseJoint) {
    world.removeJoint(state.mouseJoint);
    state.mouseJoint = null;
  }
  if (state.aim) {
    const velocity = V.scale(V.sub(state.aim.from, state.aim.to), 4); // slingshot
    spawnBody(state.tool, state.aim.from, velocity);
    state.aim = null;
  }
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  updateMouse(e);
  const before = renderer.toWorld(mouse.screen);
  const factor = Math.exp(-e.deltaY * 0.001);
  renderer.camera.zoom = Math.min(300, Math.max(3, renderer.camera.zoom * factor));
  const after = renderer.toWorld(mouse.screen);
  renderer.camera.x += before.x - after.x;
  renderer.camera.y += before.y - after.y;
}, { passive: false });

function spawnBody(tool, position, velocity) {
  const { restitution, friction, density, size } = state.spawn;
  const opts = { restitution, friction, density, velocity };
  const body = tool === 'ball'
    ? Bodies.circle(position.x, position.y, size, opts)
    : Bodies.box(position.x, position.y, size * 1.8, size * 1.8, opts);
  world.addBody(body);
}

window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  switch (e.key) {
    case ' ': e.preventDefault(); togglePause(); break;
    case '.': case 's': stepOnce(); break;
    case 'r': case 'R': loadScene(state.sceneIndex); break;
    case 'g': toggleOption('grid'); break;
    case 'v': toggleOption('vectors'); break;
    case 't': toggleOption('trails'); break;
    case 'c': toggleOption('contacts'); break;
    default:
      if (e.key >= '1' && e.key <= String(SCENES.length)) {
        loadScene(Number(e.key) - 1);
      }
  }
});

// ------------------------------------------------------------------------ UI

function togglePause() {
  state.paused = !state.paused;
  document.getElementById('btnPause').textContent = state.paused ? '▶' : '⏸';
}

function stepOnce() {
  if (!state.paused) togglePause();
  world.step(PHYS_DT);
}

function toggleOption(name) {
  renderer.options[name] = !renderer.options[name];
  const box = document.querySelector(`input[data-option="${name}"]`);
  if (box) box.checked = renderer.options[name];
}

function bindSlider(id, initial, onChange, format = (v) => v.toFixed(2)) {
  const input = document.getElementById(id);
  const out = document.getElementById(id + 'Val');
  input.value = initial;
  out.textContent = format(initial);
  input.addEventListener('input', () => {
    const v = parseFloat(input.value);
    out.textContent = format(v);
    onChange(v);
  });
  return (v) => { input.value = v; out.textContent = format(v); };
}

const setGravitySlider = bindSlider('gravity', 9.81, (v) => { world.gravity.y = -v; });
const setAirSlider = bindSlider('air', 0, (v) => { world.airDensity = v; });
bindSlider('timeScale', 1, (v) => { state.timeScale = v; }, (v) => v.toFixed(2) + 'x');
const setIterSlider = bindSlider('iterations', 12, (v) => { world.iterations = Math.round(v); }, (v) => String(Math.round(v)));
bindSlider('spawnRestitution', state.spawn.restitution, (v) => { state.spawn.restitution = v; });
bindSlider('spawnFriction', state.spawn.friction, (v) => { state.spawn.friction = v; });
bindSlider('spawnDensity', state.spawn.density, (v) => { state.spawn.density = v; });
bindSlider('spawnSize', state.spawn.size, (v) => { state.spawn.size = v; }, (v) => v.toFixed(2) + ' m');

function syncPanelFromWorld() {
  setGravitySlider(-world.gravity.y);
  setAirSlider(world.airDensity);
  setIterSlider(world.iterations);
  const note = document.getElementById('gravityNote');
  note.textContent = world.gravityMode === 'nbody'
    ? `n-body mode: F = G·m₁·m₂/r², G = ${world.G}` : '';
}

for (const box of document.querySelectorAll('input[data-option]')) {
  box.checked = renderer.options[box.dataset.option];
  box.addEventListener('change', () => {
    renderer.options[box.dataset.option] = box.checked;
  });
}

for (const btn of document.querySelectorAll('.tool')) {
  btn.addEventListener('click', () => {
    state.tool = btn.dataset.tool;
    document.querySelectorAll('.tool').forEach(b => b.classList.toggle('active', b === btn));
  });
}

document.getElementById('btnPause').addEventListener('click', togglePause);
document.getElementById('btnStep').addEventListener('click', stepOnce);
document.getElementById('btnReset').addEventListener('click', () => loadScene(state.sceneIndex));
document.getElementById('btnPanel').addEventListener('click', () => {
  document.getElementById('panel').classList.toggle('hidden');
});

const sceneSelect = document.getElementById('sceneSelect');
SCENES.forEach((s, i) => {
  const opt = document.createElement('option');
  opt.value = String(i);
  opt.textContent = `${i + 1}. ${s.name}`;
  sceneSelect.appendChild(opt);
});
sceneSelect.addEventListener('change', () => loadScene(Number(sceneSelect.value)));

// ---------------------------------------------------------------- stats/HUD

const energyCanvas = document.getElementById('energyGraph');
const energyCtx = energyCanvas.getContext('2d');
let statFrame = 0;

function updateStats() {
  if (++statFrame % 5 !== 0) return;
  const e = world.energy();
  document.getElementById('statFps').textContent = state.fps.toFixed(0);
  document.getElementById('statBodies').textContent = String(world.bodies.length);
  document.getElementById('statContacts').textContent = String(world.contactCount());
  document.getElementById('statTime').textContent = world.time.toFixed(1) + ' s';
  document.getElementById('statKe').textContent = e.ke.toFixed(1) + ' J';
  document.getElementById('statPe').textContent = e.pe.toFixed(1) + ' J';
  document.getElementById('statTotal').textContent = e.total.toFixed(1) + ' J';

  state.energyHistory.push(e.total);
  if (state.energyHistory.length > 110) state.energyHistory.shift();
  drawEnergyGraph();
}

function drawEnergyGraph() {
  const w = energyCanvas.width, h = energyCanvas.height;
  energyCtx.clearRect(0, 0, w, h);
  const hist = state.energyHistory;
  if (hist.length < 2) return;
  let min = Math.min(...hist), max = Math.max(...hist);
  const pad = Math.max((max - min) * 0.1, 1e-6);
  min -= pad; max += pad;
  energyCtx.strokeStyle = '#4cc9f0';
  energyCtx.lineWidth = 1.5;
  energyCtx.beginPath();
  hist.forEach((v, i) => {
    const x = (i / (hist.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    i === 0 ? energyCtx.moveTo(x, y) : energyCtx.lineTo(x, y);
  });
  energyCtx.stroke();
}

// ----------------------------------------------------------------- bootstrap

function handleResize() { renderer.resize(); }
window.addEventListener('resize', handleResize);
handleResize();
loadScene(0);
requestAnimationFrame(frame);

// console access for tinkering
window.physics = { world, renderer, scenes: SCENES, loadScene, state };
