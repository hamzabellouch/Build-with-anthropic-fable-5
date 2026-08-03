// Collision detection.
// Broadphase: sweep-and-prune over AABBs sorted on x.
// Narrowphase: circle tests + SAT with reference-face clipping for polygons
// (Box2D-lite style), producing up to two contact points per manifold.

import { V } from './math.js';

export function broadphase(bodies) {
  const sorted = bodies.slice().sort((a, b) => a.aabb.minX - b.aabb.minX);
  const pairs = [];
  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i];
    if (!a.collidable) continue;
    for (let j = i + 1; j < sorted.length; j++) {
      const b = sorted[j];
      if (b.aabb.minX > a.aabb.maxX) break;
      if (!b.collidable) continue;
      if (a.invMass === 0 && b.invMass === 0) continue;
      if (a.group !== 0 && a.group === b.group) continue;
      if (a.aabb.minY > b.aabb.maxY || b.aabb.minY > a.aabb.maxY) continue;
      pairs.push([a, b]);
    }
  }
  return pairs;
}

// Manifold: { a, b, normal (unit, from a to b), points: [{ p, penetration }] }
export function collide(a, b) {
  const ta = a.shape.type, tb = b.shape.type;
  if (ta === 'circle' && tb === 'circle') return circleCircle(a, b);
  if (ta === 'polygon' && tb === 'polygon') return polyPoly(a, b);
  if (ta === 'polygon' && tb === 'circle') return polyCircle(a, b, false);
  return polyCircle(b, a, true); // circle-polygon: swap then flip the normal
}

function circleCircle(a, b) {
  const rA = a.shape.radius, rB = b.shape.radius;
  const d = V.sub(b.position, a.position);
  const dist2 = V.len2(d);
  const rSum = rA + rB;
  if (dist2 >= rSum * rSum) return null;
  const dist = Math.sqrt(dist2);
  const normal = dist > 1e-9 ? V.scale(d, 1 / dist) : { x: 0, y: 1 };
  return {
    a, b, normal,
    points: [{
      p: V.add(a.position, V.scale(normal, rA)),
      penetration: rSum - dist,
    }],
  };
}

function polyCircle(poly, circle, flipped) {
  const c = circle.position, r = circle.shape.radius;
  const verts = poly.worldVerts, normals = poly.worldNormals;
  const n = verts.length;

  // face of maximum separation w.r.t. the circle center
  let sep = -Infinity, face = 0;
  for (let i = 0; i < n; i++) {
    const s = V.dot(normals[i], V.sub(c, verts[i]));
    if (s > r) return null;
    if (s > sep) { sep = s; face = i; }
  }

  const v1 = verts[face], v2 = verts[(face + 1) % n];
  let normal, penetration, point;

  if (sep < 1e-9) {
    // center is inside the polygon: push out along the shallowest face
    normal = normals[face];
    penetration = r - sep;
    point = V.sub(c, V.scale(normal, r));
  } else {
    // voronoi regions of the face: vertex / vertex / edge
    const u1 = V.dot(V.sub(c, v1), V.sub(v2, v1));
    const u2 = V.dot(V.sub(c, v2), V.sub(v1, v2));
    let closest;
    if (u1 <= 0) closest = v1;
    else if (u2 <= 0) closest = v2;
    else {
      const t = u1 / V.len2(V.sub(v2, v1));
      closest = V.lerp(v1, v2, t);
    }
    const d = V.sub(c, closest);
    const dist2 = V.len2(d);
    if (dist2 > r * r) return null;
    const dist = Math.sqrt(dist2);
    normal = dist > 1e-9 ? V.scale(d, 1 / dist) : normals[face];
    penetration = r - dist;
    point = closest;
  }

  if (flipped) {
    // caller passed (circle, polygon): manifold a=circle, b=polygon
    return { a: circle, b: poly, normal: V.neg(normal), points: [{ p: point, penetration }] };
  }
  return { a: poly, b: circle, normal, points: [{ p: point, penetration }] };
}

// largest separation of B's hull from A's faces; > 0 means a separating axis
function findMaxSeparation(a, b) {
  const normals = a.worldNormals, verts = a.worldVerts, bVerts = b.worldVerts;
  let bestSep = -Infinity, bestIndex = 0;
  for (let i = 0; i < verts.length; i++) {
    const nrm = normals[i], v = verts[i];
    let minDot = Infinity;
    for (let j = 0; j < bVerts.length; j++) {
      const d = nrm.x * (bVerts[j].x - v.x) + nrm.y * (bVerts[j].y - v.y);
      if (d < minDot) minDot = d;
    }
    if (minDot > bestSep) { bestSep = minDot; bestIndex = i; }
  }
  return { separation: bestSep, index: bestIndex };
}

// keep the portion of the segment with dot(n, p) <= offset
function clipSegment(points, n, offset) {
  const out = [];
  const d0 = V.dot(n, points[0]) - offset;
  const d1 = V.dot(n, points[1]) - offset;
  if (d0 <= 0) out.push(points[0]);
  if (d1 <= 0) out.push(points[1]);
  if (d0 * d1 < 0) out.push(V.lerp(points[0], points[1], d0 / (d0 - d1)));
  return out;
}

function polyPoly(a, b) {
  const resA = findMaxSeparation(a, b);
  if (resA.separation > 0) return null;
  const resB = findMaxSeparation(b, a);
  if (resB.separation > 0) return null;

  // reference face = the one with the smaller penetration (greater separation)
  let ref, inc, refIndex, flip;
  if (resB.separation > resA.separation + 1e-4) {
    ref = b; inc = a; refIndex = resB.index; flip = true;
  } else {
    ref = a; inc = b; refIndex = resA.index; flip = false;
  }

  const refNormal = ref.worldNormals[refIndex];

  // incident face: most anti-parallel face on the other polygon
  let incIndex = 0, minDot = Infinity;
  for (let i = 0; i < inc.worldNormals.length; i++) {
    const d = V.dot(refNormal, inc.worldNormals[i]);
    if (d < minDot) { minDot = d; incIndex = i; }
  }

  const incVerts = inc.worldVerts;
  const refVerts = ref.worldVerts;
  const r1 = refVerts[refIndex];
  const r2 = refVerts[(refIndex + 1) % refVerts.length];
  const tangent = V.norm(V.sub(r2, r1));

  // clip the incident edge against the reference face's side planes
  let pts = [incVerts[incIndex], incVerts[(incIndex + 1) % incVerts.length]];
  pts = clipSegment(pts, V.neg(tangent), -V.dot(tangent, r1));
  if (pts.length < 2) return null;
  pts = clipSegment(pts, tangent, V.dot(tangent, r2));
  if (pts.length < 2) return null;

  const points = [];
  for (const p of pts) {
    const d = V.dot(refNormal, V.sub(p, r1));
    if (d <= 0) points.push({ p, penetration: -d });
  }
  if (points.length === 0) return null;

  return { a, b, normal: flip ? V.neg(refNormal) : refNormal, points };
}
