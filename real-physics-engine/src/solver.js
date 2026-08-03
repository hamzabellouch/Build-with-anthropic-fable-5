// Sequential-impulse contact solver with accumulated clamping, warm starting,
// Coulomb friction and restitution (Erin Catto's Box2D-lite formulation).
//
// Convention: manifold normal points from body A to body B. The solver drives
// the relative normal velocity at each contact point to >= velocityBias, where
// the bias combines Baumgarte positional correction and restitution bounce.

import { V, clamp } from './math.js';

export const SLOP = 0.005;          // allowed penetration (m)
export const BAUMGARTE = 0.2;       // positional correction factor
export const REST_THRESHOLD = 1.0;  // min approach speed (m/s) for bounce

export function prepareContacts(manifolds, cache, dt) {
  const contacts = [];
  for (const m of manifolds) {
    const { a, b, normal: n } = m;
    const t = V.perp(n);
    const friction = Math.sqrt(a.friction * b.friction);
    const restitution = Math.max(a.restitution, b.restitution);
    const key = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
    const old = cache.get(key);

    const points = m.points.map(({ p, penetration }) => {
      const ra = V.sub(p, a.position);
      const rb = V.sub(p, b.position);
      const rnA = V.cross(ra, n), rnB = V.cross(rb, n);
      const rtA = V.cross(ra, t), rtB = V.cross(rb, t);
      const kn = a.invMass + b.invMass + a.invI * rnA * rnA + b.invI * rnB * rnB;
      const kt = a.invMass + b.invMass + a.invI * rtA * rtA + b.invI * rtB * rtB;

      // relative velocity at the contact, projected on the normal
      const dvx = b.velocity.x - b.angularVelocity * rb.y - a.velocity.x + a.angularVelocity * ra.y;
      const dvy = b.velocity.y + b.angularVelocity * rb.x - a.velocity.y - a.angularVelocity * ra.x;
      const vn0 = dvx * n.x + dvy * n.y;

      const bounce = vn0 < -REST_THRESHOLD ? -restitution * vn0 : 0;
      const baumgarte = (BAUMGARTE / dt) * Math.max(0, penetration - SLOP);
      const velocityBias = Math.max(bounce, baumgarte);

      // warm start: reuse impulses from the matching point of the last step
      let normalImpulse = 0, tangentImpulse = 0;
      if (old) {
        for (const op of old) {
          if (V.dist2(op.p, p) < 0.0025) {
            normalImpulse = op.normalImpulse;
            tangentImpulse = op.tangentImpulse;
            break;
          }
        }
      }
      return {
        p, ra, rb,
        massN: kn > 0 ? 1 / kn : 0,
        massT: kt > 0 ? 1 / kt : 0,
        velocityBias, normalImpulse, tangentImpulse,
      };
    });

    contacts.push({ a, b, n, t, friction, key, points });
  }
  return contacts;
}

export function warmStart(contacts) {
  for (const c of contacts) {
    for (const pt of c.points) {
      const P = {
        x: pt.normalImpulse * c.n.x + pt.tangentImpulse * c.t.x,
        y: pt.normalImpulse * c.n.y + pt.tangentImpulse * c.t.y,
      };
      applyAt(c.a, c.b, pt, P);
    }
  }
}

function applyAt(a, b, pt, P) {
  a.velocity.x -= P.x * a.invMass;
  a.velocity.y -= P.y * a.invMass;
  a.angularVelocity -= a.invI * (pt.ra.x * P.y - pt.ra.y * P.x);
  b.velocity.x += P.x * b.invMass;
  b.velocity.y += P.y * b.invMass;
  b.angularVelocity += b.invI * (pt.rb.x * P.y - pt.rb.y * P.x);
}

export function solveContacts(contacts) {
  for (const c of contacts) {
    const { a, b, n, t } = c;
    for (const pt of c.points) {
      // --- normal impulse ---
      let dvx = b.velocity.x - b.angularVelocity * pt.rb.y - a.velocity.x + a.angularVelocity * pt.ra.y;
      let dvy = b.velocity.y + b.angularVelocity * pt.rb.x - a.velocity.y - a.angularVelocity * pt.ra.x;
      const vn = dvx * n.x + dvy * n.y;
      let lambda = -pt.massN * (vn - pt.velocityBias);
      const newImpulse = Math.max(pt.normalImpulse + lambda, 0);
      lambda = newImpulse - pt.normalImpulse;
      pt.normalImpulse = newImpulse;
      applyAt(a, b, pt, { x: lambda * n.x, y: lambda * n.y });

      // --- friction impulse, clamped to the Coulomb cone ---
      dvx = b.velocity.x - b.angularVelocity * pt.rb.y - a.velocity.x + a.angularVelocity * pt.ra.y;
      dvy = b.velocity.y + b.angularVelocity * pt.rb.x - a.velocity.y - a.angularVelocity * pt.ra.x;
      const vt = dvx * t.x + dvy * t.y;
      let lambdaT = -pt.massT * vt;
      const maxF = c.friction * pt.normalImpulse;
      const newT = clamp(pt.tangentImpulse + lambdaT, -maxF, maxF);
      lambdaT = newT - pt.tangentImpulse;
      pt.tangentImpulse = newT;
      applyAt(a, b, pt, { x: lambdaT * t.x, y: lambdaT * t.y });
    }
  }
}

export function storeImpulses(contacts) {
  const cache = new Map();
  for (const c of contacts) {
    cache.set(c.key, c.points.map(pt => ({
      p: pt.p,
      normalImpulse: pt.normalImpulse,
      tangentImpulse: pt.tangentImpulse,
    })));
  }
  return cache;
}
