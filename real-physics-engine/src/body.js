// Rigid bodies: mass properties from geometry, world-space transform caching.

import { V } from './math.js';

let nextId = 1;

// Area, centroid and second moment of area (per unit mass, about centroid)
// for a simple polygon via the shoelace decomposition.
function polygonProperties(verts) {
  let A = 0, cx = 0, cy = 0, I = 0;
  const n = verts.length;
  for (let i = 0; i < n; i++) {
    const v0 = verts[i], v1 = verts[(i + 1) % n];
    const cr = V.cross(v0, v1);
    A += cr / 2;
    cx += (v0.x + v1.x) * cr / 6;
    cy += (v0.y + v1.y) * cr / 6;
    I += cr * (V.dot(v0, v0) + V.dot(v0, v1) + V.dot(v1, v1)) / 12;
  }
  const centroid = { x: cx / A, y: cy / A };
  // parallel axis: shift second moment from origin to centroid
  const inertiaPerMass = I / A - V.len2(centroid);
  return { area: A, centroid, inertiaPerMass };
}

export class Body {
  constructor({
    position = { x: 0, y: 0 },
    angle = 0,
    velocity = { x: 0, y: 0 },
    angularVelocity = 0,
    density = 1,
    restitution = 0.2,
    friction = 0.4,
    isStatic = false,
    collidable = true,
    group = 0,          // bodies sharing a nonzero group never collide together
    shape,              // { type:'circle', radius } | { type:'polygon', verts }
    color = null,
    label = null,
    trail = false,
    dragCoeff = null,   // aerodynamic Cd override
  } = {}) {
    this.id = nextId++;
    this.position = V.clone(position);
    this.angle = angle;
    this.velocity = V.clone(velocity);
    this.angularVelocity = angularVelocity;
    this.force = { x: 0, y: 0 };
    this.torque = 0;
    this.density = density;
    this.restitution = restitution;
    this.friction = friction;
    this.isStatic = isStatic;
    this.collidable = collidable;
    this.group = group;
    this.color = color;
    this.label = label;
    this.trail = trail ? [] : null;
    this.dragCoeff = dragCoeff;
    this.shape = shape;

    if (shape.type === 'polygon') {
      let verts = shape.verts.map(V.clone);
      // enforce counter-clockwise winding so outward normals are consistent
      let area2 = 0;
      for (let i = 0; i < verts.length; i++) {
        area2 += V.cross(verts[i], verts[(i + 1) % verts.length]);
      }
      if (area2 < 0) verts.reverse();
      const { area, centroid, inertiaPerMass } = polygonProperties(verts);
      // re-center vertices on the centroid so position == center of mass
      shape.verts = verts.map(v => V.sub(v, centroid));
      shape.normals = shape.verts.map((v, i) => {
        const e = V.sub(shape.verts[(i + 1) % shape.verts.length], v);
        return V.norm({ x: e.y, y: -e.x });
      });
      this.area = area;
      this.mass = density * area;
      this.inertia = this.mass * inertiaPerMass;
    } else {
      const r = shape.radius;
      this.area = Math.PI * r * r;
      this.mass = density * this.area;
      this.inertia = 0.5 * this.mass * r * r;
    }

    this.invMass = isStatic ? 0 : 1 / this.mass;
    this.invI = isStatic ? 0 : 1 / this.inertia;

    this.worldVerts = [];
    this.worldNormals = [];
    this.aabb = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    this.updateTransform();
  }

  updateTransform() {
    const { aabb } = this;
    if (this.shape.type === 'circle') {
      const r = this.shape.radius, p = this.position;
      aabb.minX = p.x - r; aabb.maxX = p.x + r;
      aabb.minY = p.y - r; aabb.maxY = p.y + r;
      return;
    }
    const c = Math.cos(this.angle), s = Math.sin(this.angle);
    const verts = this.shape.verts, normals = this.shape.normals;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < verts.length; i++) {
      const v = verts[i];
      const wx = this.position.x + v.x * c - v.y * s;
      const wy = this.position.y + v.x * s + v.y * c;
      this.worldVerts[i] = { x: wx, y: wy };
      const n = normals[i];
      this.worldNormals[i] = { x: n.x * c - n.y * s, y: n.x * s + n.y * c };
      if (wx < minX) minX = wx; if (wx > maxX) maxX = wx;
      if (wy < minY) minY = wy; if (wy > maxY) maxY = wy;
    }
    this.worldVerts.length = verts.length;
    this.worldNormals.length = verts.length;
    aabb.minX = minX; aabb.maxX = maxX; aabb.minY = minY; aabb.maxY = maxY;
  }

  // transform a point from body-local to world space
  worldPoint(local) {
    const c = Math.cos(this.angle), s = Math.sin(this.angle);
    return {
      x: this.position.x + local.x * c - local.y * s,
      y: this.position.y + local.x * s + local.y * c,
    };
  }

  // transform a world point into body-local space
  localPoint(world) {
    const c = Math.cos(this.angle), s = Math.sin(this.angle);
    const dx = world.x - this.position.x, dy = world.y - this.position.y;
    return { x: dx * c + dy * s, y: -dx * s + dy * c };
  }

  applyForce(f, point = null) {
    this.force.x += f.x;
    this.force.y += f.y;
    if (point) {
      this.torque += (point.x - this.position.x) * f.y - (point.y - this.position.y) * f.x;
    }
  }

  applyImpulse(P, point) {
    this.velocity.x += P.x * this.invMass;
    this.velocity.y += P.y * this.invMass;
    this.angularVelocity += this.invI *
      ((point.x - this.position.x) * P.y - (point.y - this.position.y) * P.x);
  }

  velocityAt(point) {
    const rx = point.x - this.position.x, ry = point.y - this.position.y;
    return {
      x: this.velocity.x - this.angularVelocity * ry,
      y: this.velocity.y + this.angularVelocity * rx,
    };
  }

  containsPoint(p) {
    if (this.shape.type === 'circle') {
      return V.dist2(p, this.position) <= this.shape.radius * this.shape.radius;
    }
    const verts = this.worldVerts, normals = this.worldNormals;
    for (let i = 0; i < verts.length; i++) {
      if (V.dot(normals[i], V.sub(p, verts[i])) > 0) return false;
    }
    return true;
  }

  kineticEnergy() {
    if (this.isStatic) return 0;
    return 0.5 * this.mass * V.len2(this.velocity) +
           0.5 * this.inertia * this.angularVelocity * this.angularVelocity;
  }
}

export const Bodies = {
  circle: (x, y, radius, opts = {}) =>
    new Body({ ...opts, position: { x, y }, shape: { type: 'circle', radius } }),

  box: (x, y, w, h, opts = {}) =>
    new Body({
      ...opts, position: { x, y },
      shape: {
        type: 'polygon',
        verts: [
          { x: -w / 2, y: -h / 2 }, { x: w / 2, y: -h / 2 },
          { x: w / 2, y: h / 2 }, { x: -w / 2, y: h / 2 },
        ],
      },
    }),

  polygon: (x, y, verts, opts = {}) =>
    new Body({ ...opts, position: { x, y }, shape: { type: 'polygon', verts } }),

  ngon: (x, y, radius, sides, opts = {}) => {
    const verts = [];
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2;
      verts.push({ x: radius * Math.cos(a), y: radius * Math.sin(a) });
    }
    return new Body({ ...opts, position: { x, y }, shape: { type: 'polygon', verts } });
  },
};
