// Collision detection and response.
//
// The drone is approximated by 5 spheres: one at the CG and one per motor
// (covering the prop discs). Static world shapes: infinite ground plane y=0,
// yaw-rotated boxes, vertical cylinders, spheres.
//
// Response is impulse-based with restitution and Coulomb friction, applied
// at the contact point so impacts also spin the quad (clipping a gate with
// one prop cartwheels you, like reality). Runs at the physics rate (1 kHz),
// which keeps resting contact stable without a constraint solver.

import { v3, vadd, vsub, vscale, vdot, vcross, vlen, vnormalize, vaddScaled, clamp } from './math.js';

export function makeColliders(list) { return list; }

const tmp = v3(), tmpN = v3(), tmpT = v3(), rxn = v3(), vp = v3();

// Closest point on shape surface to sphere center; returns contact or null.
function sphereVsShape(c, r, shape, out) {
  switch (shape.type) {
    case 'box': {
      // Transform into the box's yaw-local frame.
      const dx = c[0] - shape.c[0], dy = c[1] - shape.c[1], dz = c[2] - shape.c[2];
      const cos = Math.cos(-shape.yaw || 0), sin = Math.sin(-shape.yaw || 0);
      const lx = dx * cos - dz * sin, lz = dx * sin + dz * cos, ly = dy;
      const qx = clamp(lx, -shape.h[0], shape.h[0]);
      const qy = clamp(ly, -shape.h[1], shape.h[1]);
      const qz = clamp(lz, -shape.h[2], shape.h[2]);
      let nx = lx - qx, ny = ly - qy, nz = lz - qz;
      let d2 = nx * nx + ny * ny + nz * nz;
      if (d2 > r * r) return null;
      let depth, d;
      if (d2 < 1e-12) {
        // Center inside the box: push out along the axis of least penetration.
        const px = shape.h[0] - Math.abs(lx), py = shape.h[1] - Math.abs(ly), pz = shape.h[2] - Math.abs(lz);
        if (px < py && px < pz) { nx = Math.sign(lx) || 1; ny = 0; nz = 0; depth = px + r; }
        else if (py < pz) { nx = 0; ny = Math.sign(ly) || 1; nz = 0; depth = py + r; }
        else { nx = 0; ny = 0; nz = Math.sign(lz) || 1; depth = pz + r; }
      } else {
        d = Math.sqrt(d2);
        nx /= d; ny /= d; nz /= d;
        depth = r - d;
      }
      // Rotate normal back to world.
      const cosW = Math.cos(shape.yaw || 0), sinW = Math.sin(shape.yaw || 0);
      out.n[0] = nx * cosW - nz * sinW; out.n[1] = ny; out.n[2] = nx * sinW + nz * cosW;
      out.depth = depth;
      return out;
    }
    case 'cyl': {
      if (c[1] + r < shape.y0 || c[1] - r > shape.y1) return null;
      const dx = c[0] - shape.x, dz = c[2] - shape.z;
      const d = Math.hypot(dx, dz);
      if (d > shape.r + r) return null;
      // Side contact only (tops are handled fine by the radial push for thin poles).
      if (c[1] >= shape.y0 && c[1] <= shape.y1) {
        const inv = d > 1e-9 ? 1 / d : 0;
        out.n[0] = dx * inv; out.n[1] = 0; out.n[2] = dz * inv;
        out.depth = shape.r + r - d;
        return out;
      }
      // Near the cap: treat as sphere vs rim point.
      const cy = c[1] < shape.y0 ? shape.y0 : shape.y1;
      const rd = Math.min(d, shape.r);
      const px = shape.x + (d > 1e-9 ? dx / d * rd : 0), pz = shape.z + (d > 1e-9 ? dz / d * rd : 0);
      const ex = c[0] - px, ey = c[1] - cy, ez = c[2] - pz;
      const ed = Math.hypot(ex, ey, ez);
      if (ed > r) return null;
      const inv = ed > 1e-9 ? 1 / ed : 0;
      out.n[0] = ex * inv; out.n[1] = ey * inv || 1; out.n[2] = ez * inv;
      out.depth = r - ed;
      return out;
    }
    case 'sphere': {
      const dx = c[0] - shape.c[0], dy = c[1] - shape.c[1], dz = c[2] - shape.c[2];
      const d = Math.hypot(dx, dy, dz);
      if (d > shape.r + r) return null;
      const inv = d > 1e-9 ? 1 / d : 0;
      out.n[0] = dx * inv; out.n[1] = dy * inv || 1; out.n[2] = dz * inv;
      out.depth = shape.r + r - d;
      return out;
    }
  }
  return null;
}

// Resolve collisions for the rigid body. Mutates pos, vel, omega (body), via state.
// Returns { contact: bool, maxImpact: m/s worst normal approach speed this call }.
export function resolveCollisions(state, points, colliders, restitution = 0.25, mu = 0.7) {
  let contact = false, maxImpact = 0;
  const { pos, vel } = state;

  for (const pt of points) {
    // pt.world: sphere center world, pt.r radius, pt.rBody: offset from CG (world frame)
    const contacts = [];
    if (pt.world[1] - pt.r < 0) {
      contacts.push({ n: v3(0, 1, 0), depth: pt.r - pt.world[1] });
    }
    for (const shape of colliders) {
      const out = { n: v3(), depth: 0 };
      if (sphereVsShape(pt.world, pt.r, shape, out)) contacts.push(out);
    }

    for (const ct of contacts) {
      contact = true;
      const n = ct.n;
      // Velocity of the contact point: v + w x r (omega already in world frame here).
      vcross(vp, state.omegaWorld, pt.rBody);
      vadd(vp, vp, vel);
      const vn = vdot(vp, n);
      if (vn < -0.01) maxImpact = Math.max(maxImpact, -vn);

      if (vn < 0) {
        // Effective mass along n at this point.
        vcross(rxn, pt.rBody, n);
        const angTerm = vdot(rxn, [rxn[0] * state.invInertiaWorld[0], rxn[1] * state.invInertiaWorld[1], rxn[2] * state.invInertiaWorld[2]]);
        const invMassN = state.invMass + angTerm;
        const e = -vn > 1.2 ? restitution : 0;   // no bounce for slow/resting contact
        const jn = -(1 + e) * vn / invMassN;
        vaddScaled(vel, vel, n, jn * state.invMass);
        // Angular impulse (diagonal world-inertia approximation).
        vcross(rxn, pt.rBody, vscale(tmp, n, jn));
        state.omegaWorld[0] += rxn[0] * state.invInertiaWorld[0];
        state.omegaWorld[1] += rxn[1] * state.invInertiaWorld[1];
        state.omegaWorld[2] += rxn[2] * state.invInertiaWorld[2];

        // Friction: oppose tangential velocity, clamped by mu*jn.
        vcross(vp, state.omegaWorld, pt.rBody);
        vadd(vp, vp, vel);
        vaddScaled(tmpT, vp, n, -vdot(vp, n));
        const vt = vlen(tmpT);
        if (vt > 1e-4) {
          vscale(tmpT, tmpT, -1 / vt);
          vcross(rxn, pt.rBody, tmpT);
          const angT = vdot(rxn, [rxn[0] * state.invInertiaWorld[0], rxn[1] * state.invInertiaWorld[1], rxn[2] * state.invInertiaWorld[2]]);
          const jt = Math.min(vt / (state.invMass + angT), mu * jn);
          vaddScaled(vel, vel, tmpT, jt * state.invMass);
          vcross(rxn, pt.rBody, vscale(tmp, tmpT, jt));
          state.omegaWorld[0] += rxn[0] * state.invInertiaWorld[0];
          state.omegaWorld[1] += rxn[1] * state.invInertiaWorld[1];
          state.omegaWorld[2] += rxn[2] * state.invInertiaWorld[2];
        }
      }
      // Positional correction: push out of penetration (softly, per-step).
      if (ct.depth > 0) vaddScaled(pos, pos, n, Math.min(ct.depth, 0.005 + ct.depth * 0.25));
    }
  }
  return { contact, maxImpact };
}
