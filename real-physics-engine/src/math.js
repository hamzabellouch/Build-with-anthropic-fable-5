// 2D vector math. Plain {x, y} objects with pure helper functions.

export const V = {
  make: (x = 0, y = 0) => ({ x, y }),
  clone: (a) => ({ x: a.x, y: a.y }),
  add: (a, b) => ({ x: a.x + b.x, y: a.y + b.y }),
  sub: (a, b) => ({ x: a.x - b.x, y: a.y - b.y }),
  scale: (a, s) => ({ x: a.x * s, y: a.y * s }),
  neg: (a) => ({ x: -a.x, y: -a.y }),
  dot: (a, b) => a.x * b.x + a.y * b.y,
  cross: (a, b) => a.x * b.y - a.y * b.x,           // z component of 3D cross
  crossSV: (s, a) => ({ x: -s * a.y, y: s * a.x }), // omega x r
  perp: (a) => ({ x: -a.y, y: a.x }),
  len: (a) => Math.hypot(a.x, a.y),
  len2: (a) => a.x * a.x + a.y * a.y,
  dist: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
  dist2: (a, b) => { const dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy; },
  norm: (a) => { const l = Math.hypot(a.x, a.y) || 1; return { x: a.x / l, y: a.y / l }; },
  rotate: (a, c, s) => ({ x: a.x * c - a.y * s, y: a.x * s + a.y * c }),
  lerp: (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }),
};

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
