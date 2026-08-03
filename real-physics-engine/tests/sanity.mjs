// Headless physics validation against closed-form solutions.
// Run with: node tests/sanity.mjs

import { World } from '../src/world.js';
import { Bodies } from '../src/body.js';
import { DistanceJoint } from '../src/joints.js';
import { V } from '../src/math.js';

const DT = 1 / 120;
let failures = 0;

function check(name, actual, expected, tolerance, unit = '') {
  const err = Math.abs(actual - expected);
  const rel = expected !== 0 ? err / Math.abs(expected) : err;
  const ok = rel <= tolerance;
  if (!ok) failures++;
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${name}\n` +
    `      expected ${expected.toFixed(4)}${unit}, got ${actual.toFixed(4)}${unit} ` +
    `(error ${(rel * 100).toFixed(2)}%, tolerance ${(tolerance * 100).toFixed(1)}%)`
  );
}

function assert(name, cond, detail = '') {
  if (!cond) failures++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? `\n      ${detail}` : ''}`);
}

// ---------------------------------------------------------------- projectile
{
  const w = new World();
  w.cullRadius = 10000;
  const v0 = 20, theta = Math.PI / 4, g = 9.81;
  const ball = Bodies.circle(0, 0, 0.2, {
    velocity: { x: v0 * Math.cos(theta), y: v0 * Math.sin(theta) },
  });
  w.addBody(ball);
  let prev = { x: 0, y: 0 };
  let range = null;
  for (let i = 0; i < 120 * 10; i++) {
    prev = V.clone(ball.position);
    w.step(DT);
    if (prev.y >= 0 && ball.position.y < 0 && w.time > DT * 2) {
      const t = prev.y / (prev.y - ball.position.y);
      range = prev.x + (ball.position.x - prev.x) * t;
      break;
    }
  }
  check('projectile range (v0=20 m/s @ 45deg) matches v0^2*sin(2t)/g',
    range ?? -1, (v0 * v0 * Math.sin(2 * theta)) / g, 0.02, ' m');
}

// -------------------------------------------------- elastic collision (e = 1)
{
  const w = new World();
  w.gravityMode = 'none';
  const a = Bodies.circle(-3, 0, 0.5, { velocity: { x: 5, y: 0 }, restitution: 1, friction: 0 });
  const b = Bodies.circle(3, 0, 0.5, { velocity: { x: -5, y: 0 }, restitution: 1, friction: 0 });
  w.addBody(a); w.addBody(b);
  const p0 = a.mass * a.velocity.x + b.mass * b.velocity.x;
  const ke0 = a.kineticEnergy() + b.kineticEnergy();
  for (let i = 0; i < 120 * 3; i++) w.step(DT);
  const p1 = a.mass * a.velocity.x + b.mass * b.velocity.x;
  const ke1 = a.kineticEnergy() + b.kineticEnergy();
  check('head-on elastic collision conserves momentum', p1, p0, 1e-6);
  check('head-on elastic collision conserves kinetic energy', ke1, ke0, 0.02);
  assert('equal masses exchange velocities',
    Math.abs(a.velocity.x + 5) < 0.15 && Math.abs(b.velocity.x - 5) < 0.15,
    `vA=${a.velocity.x.toFixed(3)}, vB=${b.velocity.x.toFixed(3)}`);
}

// --------------------------------------------------------------- box stacking
{
  const w = new World();
  w.addBody(Bodies.box(0, -0.5, 40, 1, { isStatic: true, friction: 0.6 }));
  const boxes = [];
  for (let i = 0; i < 5; i++) {
    boxes.push(w.addBody(Bodies.box(0, 0.4 + i * 0.8, 0.8, 0.8, { friction: 0.5, restitution: 0.1 })));
  }
  for (let i = 0; i < 120 * 5; i++) w.step(DT);
  const top = boxes[4];
  const speed = V.len(top.velocity);
  assert('5-box stack stays standing for 5 simulated seconds',
    Math.abs(top.position.y - 3.6) < 0.15 && Math.abs(top.position.x) < 0.3 && speed < 0.2,
    `top box at (${top.position.x.toFixed(3)}, ${top.position.y.toFixed(3)}), |v|=${speed.toFixed(3)}`);
}

// ------------------------------------------------- orbital energy conservation
{
  const w = new World();
  w.gravityMode = 'nbody';
  w.G = 5;
  w.cullRadius = 10000;
  const star = Bodies.circle(0, 0, 1.2, { density: 300 / (Math.PI * 1.44), isStatic: true });
  const M = star.mass;
  const r = 8;
  const vCirc = Math.sqrt((w.G * M) / r);
  const planet = Bodies.circle(r, 0, 0.3, { velocity: { x: 0, y: vCirc } });
  w.addBody(star); w.addBody(planet);
  const e0 = w.energy().total;
  let maxR = 0, minR = Infinity;
  for (let i = 0; i < 120 * 30; i++) {
    w.step(DT);
    const d = V.dist(planet.position, star.position);
    if (d > maxR) maxR = d;
    if (d < minR) minR = d;
  }
  const e1 = w.energy().total;
  check('circular orbit conserves total energy over 30 s', e1, e0, 0.01);
  assert('circular orbit radius stays bounded (symplectic integrator)',
    minR > r * 0.97 && maxR < r * 1.03,
    `radius range [${minR.toFixed(3)}, ${maxR.toFixed(3)}], nominal ${r}`);
}

// ------------------------------------------------------------ pendulum period
{
  const w = new World();
  const L = 2, g = 9.81;
  const anchor = Bodies.circle(0, 5, 0.1, { isStatic: true, collidable: false });
  const theta0 = 0.15; // small angle
  const bob = Bodies.circle(L * Math.sin(theta0), 5 - L * Math.cos(theta0), 0.15, { collidable: false });
  w.addBody(anchor); w.addBody(bob);
  w.addJoint(new DistanceJoint(anchor, bob, anchor.position, bob.position, L));

  // measure period via successive positive-going zero crossings of x
  let crossings = [];
  let prevX = bob.position.x;
  for (let i = 0; i < 120 * 20; i++) {
    w.step(DT);
    if (prevX < 0 && bob.position.x >= 0) crossings.push(w.time);
    prevX = bob.position.x;
  }
  let period = -1;
  if (crossings.length >= 2) {
    period = (crossings[crossings.length - 1] - crossings[0]) / (crossings.length - 1);
  }
  check('small-angle pendulum period matches 2*pi*sqrt(L/g)',
    period, 2 * Math.PI * Math.sqrt(L / g), 0.03, ' s');
}

console.log(failures === 0
  ? '\nAll physics sanity checks passed.'
  : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
