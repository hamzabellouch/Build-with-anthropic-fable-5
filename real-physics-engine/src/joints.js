// Constraints between bodies, solved with impulses inside the same velocity
// iteration loop as contacts. Springs are force-based (Hooke's law + damping).

import { V } from './math.js';

const BETA = 0.2; // Baumgarte factor for joint position drift

export class Joint {
  applyForces(dt) {}
  initVelocity(dt) {}
  solveVelocity() {}
  potentialEnergy() { return 0; }
}

// Rigid rod: |anchorB - anchorA| == length
export class DistanceJoint extends Joint {
  constructor(bodyA, bodyB, worldAnchorA, worldAnchorB, length = null) {
    super();
    this.bodyA = bodyA;
    this.bodyB = bodyB;
    this.localA = bodyA.localPoint(worldAnchorA);
    this.localB = bodyB.localPoint(worldAnchorB);
    this.length = length ?? V.dist(worldAnchorA, worldAnchorB);
  }

  initVelocity(dt) {
    const a = this.bodyA, b = this.bodyB;
    const pA = a.worldPoint(this.localA);
    const pB = b.worldPoint(this.localB);
    this.rA = V.sub(pA, a.position);
    this.rB = V.sub(pB, b.position);
    const d = V.sub(pB, pA);
    const len = V.len(d);
    this.u = len > 1e-9 ? V.scale(d, 1 / len) : { x: 0, y: 1 };
    const crA = V.cross(this.rA, this.u);
    const crB = V.cross(this.rB, this.u);
    const k = a.invMass + b.invMass + a.invI * crA * crA + b.invI * crB * crB;
    this.mass = k > 0 ? 1 / k : 0;
    this.bias = (BETA / dt) * (len - this.length);
  }

  solveVelocity() {
    const a = this.bodyA, b = this.bodyB, u = this.u;
    const vA = a.velocityAt(V.add(a.position, this.rA));
    const vB = b.velocityAt(V.add(b.position, this.rB));
    const Cdot = V.dot(u, V.sub(vB, vA));
    const lambda = -this.mass * (Cdot + this.bias);
    const P = V.scale(u, lambda);
    a.velocity.x -= P.x * a.invMass; a.velocity.y -= P.y * a.invMass;
    a.angularVelocity -= a.invI * V.cross(this.rA, P);
    b.velocity.x += P.x * b.invMass; b.velocity.y += P.y * b.invMass;
    b.angularVelocity += b.invI * V.cross(this.rB, P);
  }

  anchors() {
    return [this.bodyA.worldPoint(this.localA), this.bodyB.worldPoint(this.localB)];
  }
}

// Pin joint: both bodies share a common point, free to rotate around it.
export class RevoluteJoint extends Joint {
  constructor(bodyA, bodyB, worldAnchor) {
    super();
    this.bodyA = bodyA;
    this.bodyB = bodyB;
    this.localA = bodyA.localPoint(worldAnchor);
    this.localB = bodyB.localPoint(worldAnchor);
  }

  initVelocity(dt) {
    const a = this.bodyA, b = this.bodyB;
    const pA = a.worldPoint(this.localA);
    const pB = b.worldPoint(this.localB);
    this.rA = V.sub(pA, a.position);
    this.rB = V.sub(pB, b.position);
    const { rA, rB } = this;
    const k11 = a.invMass + b.invMass + a.invI * rA.y * rA.y + b.invI * rB.y * rB.y;
    const k12 = -a.invI * rA.x * rA.y - b.invI * rB.x * rB.y;
    const k22 = a.invMass + b.invMass + a.invI * rA.x * rA.x + b.invI * rB.x * rB.x;
    const det = k11 * k22 - k12 * k12;
    const inv = det !== 0 ? 1 / det : 0;
    this.im11 = k22 * inv; this.im12 = -k12 * inv; this.im22 = k11 * inv;
    this.bias = V.scale(V.sub(pB, pA), BETA / dt);
  }

  solveVelocity() {
    const a = this.bodyA, b = this.bodyB, rA = this.rA, rB = this.rB;
    const cdx = b.velocity.x - b.angularVelocity * rB.y - a.velocity.x + a.angularVelocity * rA.y + this.bias.x;
    const cdy = b.velocity.y + b.angularVelocity * rB.x - a.velocity.y - a.angularVelocity * rA.x + this.bias.y;
    const Px = -(this.im11 * cdx + this.im12 * cdy);
    const Py = -(this.im12 * cdx + this.im22 * cdy);
    a.velocity.x -= Px * a.invMass; a.velocity.y -= Py * a.invMass;
    a.angularVelocity -= a.invI * (rA.x * Py - rA.y * Px);
    b.velocity.x += Px * b.invMass; b.velocity.y += Py * b.invMass;
    b.angularVelocity += b.invI * (rB.x * Py - rB.y * Px);
  }

  anchors() {
    const p = this.bodyA.worldPoint(this.localA);
    return [p, p];
  }
}

// Hooke spring with viscous damping: F = -k(x - rest) - c * v_rel
export class SpringJoint extends Joint {
  constructor(bodyA, bodyB, worldAnchorA, worldAnchorB, { stiffness = 30, damping = 0.5, restLength = null } = {}) {
    super();
    this.bodyA = bodyA;
    this.bodyB = bodyB;
    this.localA = bodyA.localPoint(worldAnchorA);
    this.localB = bodyB.localPoint(worldAnchorB);
    this.stiffness = stiffness;
    this.damping = damping;
    this.restLength = restLength ?? V.dist(worldAnchorA, worldAnchorB);
  }

  applyForces() {
    const a = this.bodyA, b = this.bodyB;
    const pA = a.worldPoint(this.localA);
    const pB = b.worldPoint(this.localB);
    const d = V.sub(pB, pA);
    const len = V.len(d);
    if (len < 1e-9) return;
    const u = V.scale(d, 1 / len);
    const relVel = V.dot(u, V.sub(b.velocityAt(pB), a.velocityAt(pA)));
    const fScalar = -(this.stiffness * (len - this.restLength) + this.damping * relVel);
    const F = V.scale(u, fScalar);
    b.applyForce(F, pB);
    a.applyForce(V.neg(F), pA);
  }

  potentialEnergy() {
    const len = V.dist(this.bodyA.worldPoint(this.localA), this.bodyB.worldPoint(this.localB));
    const x = len - this.restLength;
    return 0.5 * this.stiffness * x * x;
  }

  anchors() {
    return [this.bodyA.worldPoint(this.localA), this.bodyB.worldPoint(this.localB)];
  }
}

// Soft constraint dragging a body anchor toward a target point (Box2D mouse joint).
export class MouseJoint extends Joint {
  constructor(body, worldPoint, { frequency = 5, dampingRatio = 0.7, maxForceFactor = 1500 } = {}) {
    super();
    this.body = body;
    this.local = body.localPoint(worldPoint);
    this.target = V.clone(worldPoint);
    this.frequency = frequency;
    this.dampingRatio = dampingRatio;
    this.maxForce = maxForceFactor * body.mass;
    this.impulse = { x: 0, y: 0 };
  }

  initVelocity(dt) {
    const b = this.body;
    const omega = 2 * Math.PI * this.frequency;
    const d = 2 * b.mass * this.dampingRatio * omega;
    const k = b.mass * omega * omega;
    this.gamma = 1 / (dt * (d + dt * k));
    const beta = dt * k * this.gamma;

    const p = b.worldPoint(this.local);
    this.r = V.sub(p, b.position);
    const r = this.r;
    const k11 = b.invMass + b.invI * r.y * r.y + this.gamma;
    const k12 = -b.invI * r.x * r.y;
    const k22 = b.invMass + b.invI * r.x * r.x + this.gamma;
    const det = k11 * k22 - k12 * k12;
    const inv = det !== 0 ? 1 / det : 0;
    this.im11 = k22 * inv; this.im12 = -k12 * inv; this.im22 = k11 * inv;
    this.C = V.scale(V.sub(p, this.target), beta);
    this.maxImpulse = this.maxForce * dt;

    b.applyImpulse(this.impulse, p); // warm start
  }

  solveVelocity() {
    const b = this.body, r = this.r;
    const cdx = b.velocity.x - b.angularVelocity * r.y + this.C.x + this.gamma * this.impulse.x;
    const cdy = b.velocity.y + b.angularVelocity * r.x + this.C.y + this.gamma * this.impulse.y;
    let ix = -(this.im11 * cdx + this.im12 * cdy);
    let iy = -(this.im12 * cdx + this.im22 * cdy);
    const old = this.impulse;
    let nx = old.x + ix, ny = old.y + iy;
    const mag = Math.hypot(nx, ny);
    if (mag > this.maxImpulse) {
      const s = this.maxImpulse / mag;
      nx *= s; ny *= s;
    }
    ix = nx - old.x; iy = ny - old.y;
    this.impulse = { x: nx, y: ny };
    b.velocity.x += ix * b.invMass;
    b.velocity.y += iy * b.invMass;
    b.angularVelocity += b.invI * (r.x * iy - r.y * ix);
  }

  anchors() {
    return [this.body.worldPoint(this.local), this.target];
  }
}
