// The simulation world. One step() is:
//   1. accumulate forces  (gravity / n-body gravity / quadratic air drag / springs)
//   2. integrate velocities          (semi-implicit a.k.a. symplectic Euler)
//   3. detect collisions             (sweep-and-prune + SAT / circle tests)
//   4. solve velocity constraints    (sequential impulses: contacts + joints)
//   5. integrate positions
//
// Symplectic Euler keeps long-term energy bounded, which is what makes the
// orbital scenes stable over many revolutions.

import { V } from './math.js';
import { broadphase, collide } from './collision.js';
import { prepareContacts, warmStart, solveContacts, storeImpulses } from './solver.js';

export class World {
  constructor() {
    this.reset();
  }

  reset() {
    this.bodies = [];
    this.joints = [];
    this.gravity = { x: 0, y: -9.81 };
    this.gravityMode = 'uniform';   // 'uniform' | 'nbody' | 'none'
    this.G = 5;                     // gravitational constant for n-body scenes
    this.airDensity = 0;            // kg/m^3 (0 = vacuum, ~1.2 = air)
    this.iterations = 12;
    this.peReference = 0;           // height of zero potential energy (uniform mode)
    this.cullRadius = 500;
    this.time = 0;
    this.contactCache = new Map();
    this.manifolds = [];
    this.annotations = [];          // [{x, y, text}] drawn by the renderer
  }

  addBody(body) { this.bodies.push(body); return body; }
  addJoint(joint) { this.joints.push(joint); return joint; }

  removeBody(body) {
    const i = this.bodies.indexOf(body);
    if (i >= 0) this.bodies.splice(i, 1);
    this.joints = this.joints.filter(j =>
      j.bodyA !== body && j.bodyB !== body && j.body !== body);
  }

  removeJoint(joint) {
    const i = this.joints.indexOf(joint);
    if (i >= 0) this.joints.splice(i, 1);
  }

  bodyAt(point) {
    for (let i = this.bodies.length - 1; i >= 0; i--) {
      const b = this.bodies[i];
      if (!b.isStatic && b.containsPoint(point)) return b;
    }
    return null;
  }

  step(dt) {
    const { bodies, joints } = this;

    // --- 1. forces ---
    for (const j of joints) j.applyForces(dt);
    if (this.gravityMode === 'nbody') this.applyNBodyGravity();

    // --- 2. integrate velocities ---
    for (const b of bodies) {
      if (b.isStatic) { b.force.x = 0; b.force.y = 0; b.torque = 0; continue; }
      let fx = b.force.x, fy = b.force.y;
      if (this.gravityMode === 'uniform') {
        fx += b.mass * this.gravity.x;
        fy += b.mass * this.gravity.y;
      }
      if (this.airDensity > 0) {
        // quadratic drag: F = -1/2 * rho * Cd * A * |v| * v
        const speed = V.len(b.velocity);
        if (speed > 1e-4) {
          const Cd = b.dragCoeff ?? (b.shape.type === 'circle' ? 0.47 : 1.05);
          const width = b.shape.type === 'circle' ? 2 * b.shape.radius : Math.sqrt(b.area);
          const f = 0.5 * this.airDensity * Cd * width * speed;
          fx -= f * b.velocity.x;
          fy -= f * b.velocity.y;
          b.angularVelocity *= Math.max(0, 1 - 0.05 * this.airDensity * dt);
        }
      }
      b.velocity.x += fx * b.invMass * dt;
      b.velocity.y += fy * b.invMass * dt;
      b.angularVelocity += b.torque * b.invI * dt;
      b.force.x = 0; b.force.y = 0; b.torque = 0;
    }

    // --- 3. collision detection ---
    for (const b of bodies) b.updateTransform();
    const pairs = broadphase(bodies);
    const manifolds = [];
    for (const [a, b] of pairs) {
      const m = collide(a, b);
      if (m) manifolds.push(m);
    }
    this.manifolds = manifolds;

    // --- 4. solve velocity constraints ---
    const contacts = prepareContacts(manifolds, this.contactCache, dt);
    warmStart(contacts);
    for (const j of joints) j.initVelocity(dt);
    for (let i = 0; i < this.iterations; i++) {
      for (const j of joints) j.solveVelocity();
      solveContacts(contacts);
    }
    this.contactCache = storeImpulses(contacts);

    // --- 5. integrate positions ---
    for (const b of bodies) {
      if (b.isStatic) continue;
      b.position.x += b.velocity.x * dt;
      b.position.y += b.velocity.y * dt;
      b.angle += b.angularVelocity * dt;
      b.updateTransform();
      if (b.trail) {
        b.trail.push({ x: b.position.x, y: b.position.y });
        if (b.trail.length > 500) b.trail.shift();
      }
    }

    // cull escapees so abandoned debris doesn't accumulate
    for (let i = bodies.length - 1; i >= 0; i--) {
      const b = bodies[i];
      if (b.isStatic) continue;
      if (Math.abs(b.position.x) > this.cullRadius || b.position.y < -this.cullRadius) {
        this.removeBody(b);
      }
    }

    this.time += dt;
  }

  applyNBodyGravity() {
    const bodies = this.bodies;
    for (let i = 0; i < bodies.length; i++) {
      const a = bodies[i];
      for (let j = i + 1; j < bodies.length; j++) {
        const b = bodies[j];
        if (a.isStatic && b.isStatic) continue;
        const dx = b.position.x - a.position.x;
        const dy = b.position.y - a.position.y;
        const r2 = Math.max(dx * dx + dy * dy, 0.05);
        const r = Math.sqrt(r2);
        const f = (this.G * a.mass * b.mass) / r2;
        const fx = f * dx / r, fy = f * dy / r;
        a.force.x += fx; a.force.y += fy;
        b.force.x -= fx; b.force.y -= fy;
      }
    }
  }

  energy() {
    let ke = 0, pe = 0;
    for (const b of this.bodies) {
      if (b.isStatic) continue;
      ke += b.kineticEnergy();
      if (this.gravityMode === 'uniform') {
        pe += b.mass * Math.abs(this.gravity.y) * (b.position.y - this.peReference);
      }
    }
    if (this.gravityMode === 'nbody') {
      const bodies = this.bodies;
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const r = Math.max(V.dist(bodies[i].position, bodies[j].position), 0.22);
          pe -= (this.G * bodies[i].mass * bodies[j].mass) / r;
        }
      }
    }
    for (const j of this.joints) pe += j.potentialEnergy();
    return { ke, pe, total: ke + pe };
  }

  contactCount() {
    let n = 0;
    for (const m of this.manifolds) n += m.points.length;
    return n;
  }
}
