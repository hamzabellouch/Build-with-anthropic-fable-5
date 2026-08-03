// Demo scenes. Each one configures the world and the camera, and documents
// which physical laws it showcases.

import { Bodies } from './body.js';
import { DistanceJoint, RevoluteJoint, SpringJoint } from './joints.js';

function ground(world, width = 60, friction = 0.6, y = -0.5) {
  return world.addBody(Bodies.box(0, y, width, 1, { isStatic: true, friction, restitution: 0 }));
}

export const SCENES = [
  {
    name: 'Stacks & Pyramid',
    description: 'Rigid-body statics: stacked boxes held up by contact forces with Coulomb friction. Grab a base block and watch the structure collapse under gravity.',
    camera: { x: 0, y: 4, zoom: 42 },
    setup(world) {
      ground(world, 80);
      const size = 0.7, rows = 8;
      for (let row = 0; row < rows; row++) {
        const count = rows - row;
        for (let i = 0; i < count; i++) {
          world.addBody(Bodies.box(
            -5 + (i - (count - 1) / 2) * size * 1.04,
            size / 2 + row * size,
            size, size,
            { friction: 0.55, restitution: 0.05, color: '#4cc9f0' }
          ));
        }
      }
      for (let i = 0; i < 8; i++) {
        world.addBody(Bodies.box(5, 0.3 + i * 0.62, 1.4, 0.6,
          { friction: 0.5, restitution: 0.05, color: '#ffd166' }));
      }
      world.addBody(Bodies.circle(10.5, 7, 0.7, { restitution: 0.4, density: 2, color: '#f72585' }));
      world.annotations.push({ x: -5, y: 6.6, text: 'pyramid (friction holds it)' });
      world.annotations.push({ x: 5, y: 5.8, text: 'tower' });
    },
  },

  {
    name: 'Bouncing Balls',
    description: 'Coefficient of restitution e from 0 to 1: each bounce returns e^2 of the impact energy, so rebound height is e^2 * h. The e=1 ball bounces back to its starting height forever.',
    camera: { x: 0, y: 3.5, zoom: 46 },
    setup(world) {
      ground(world, 60, 0.3);
      for (let i = 0; i < 8; i++) {
        const e = i / 7;
        world.addBody(Bodies.circle((i - 3.5) * 1.7, 6.5, 0.5, {
          restitution: e, friction: 0.2,
          label: `e=${e.toFixed(2)}`,
          color: `hsl(${200 + e * 130}, 80%, 65%)`,
        }));
      }
      world.annotations.push({ x: 0, y: 8, text: 'drop height 6.5 m — rebound = e² × h' });
    },
  },

  {
    name: 'Pendulums & Cradle',
    description: "Simple pendulum (T = 2*pi*sqrt(L/g)), a chaotic double pendulum (trail on the second bob), and Newton's cradle: elastic collisions transfer momentum through the ball chain.",
    camera: { x: 0, y: 4.5, zoom: 40 },
    setup(world) {
      ground(world, 60);
      // simple pendulum, released at 60 degrees
      const a1 = world.addBody(Bodies.circle(-9, 8, 0.12, { isStatic: true, collidable: false }));
      const L = 4, th = Math.PI / 3;
      const bob = world.addBody(Bodies.circle(-9 + L * Math.sin(th), 8 - L * Math.cos(th), 0.5,
        { collidable: false, color: '#4cc9f0', density: 2 }));
      world.addJoint(new DistanceJoint(a1, bob, a1.position, bob.position, L));
      world.annotations.push({ x: -9, y: 8.6, text: 'T = 2π√(L/g) ≈ 4.0 s' });

      // double pendulum: deterministic chaos
      const a2 = world.addBody(Bodies.circle(-2.5, 8, 0.12, { isStatic: true, collidable: false, group: 2 }));
      const b1 = world.addBody(Bodies.circle(-0.5, 8, 0.3, { group: 2, color: '#ffd166', density: 3 }));
      const b2 = world.addBody(Bodies.circle(1.5, 8, 0.3, { group: 2, color: '#f72585', density: 3, trail: true }));
      world.addJoint(new DistanceJoint(a2, b1, a2.position, b1.position));
      world.addJoint(new DistanceJoint(b1, b2, b1.position, b2.position));
      world.annotations.push({ x: -1, y: 8.6, text: 'double pendulum (chaos)' });

      // Newton's cradle
      const n = 5, r = 0.45, gap = 0.92, cradleL = 3.6, cx = 7;
      for (let i = 0; i < n; i++) {
        const ax = cx + (i - (n - 1) / 2) * gap;
        const anchor = world.addBody(Bodies.circle(ax, 9, 0.1, { isStatic: true, collidable: false }));
        let px = ax, py = 9 - cradleL;
        if (i === 0) { // pull the first ball out to 55 degrees
          px = ax - cradleL * Math.sin(0.96);
          py = 9 - cradleL * Math.cos(0.96);
        }
        const ball = world.addBody(Bodies.circle(px, py, r,
          { restitution: 1, friction: 0, density: 4, color: '#b5e48c' }));
        world.addJoint(new DistanceJoint(anchor, ball, anchor.position, ball.position, cradleL));
      }
      world.annotations.push({ x: cx, y: 9.6, text: "Newton's cradle — momentum & energy transfer" });
    },
  },

  {
    name: 'Projectiles',
    description: 'Ballistic trajectories: same launch speed at 30/45/60 degrees. Range = v²·sin(2θ)/g, maximized at 45°; 30° and 60° land at the same spot. Turn up air density in the panel and refire (R) to see drag break the symmetry.',
    camera: { x: 15, y: 6, zoom: 19 },
    setup(world) {
      world.addBody(Bodies.box(14, -0.5, 70, 1, { isStatic: true, friction: 0.6, restitution: 0 }));
      const v0 = 18;
      const shots = [
        { deg: 30, color: '#4cc9f0' },
        { deg: 45, color: '#ffd166' },
        { deg: 60, color: '#f72585' },
      ];
      for (const s of shots) {
        const a = (s.deg * Math.PI) / 180;
        world.addBody(Bodies.circle(0, 0.4, 0.3, {
          velocity: { x: v0 * Math.cos(a), y: v0 * Math.sin(a) },
          restitution: 0.35, friction: 0.3, trail: true,
          color: s.color, label: `${s.deg}°`,
        }));
      }
      const g = 9.81;
      const r45 = (v0 * v0) / g;
      const r30 = (v0 * v0 * Math.sin(Math.PI / 3)) / g;
      world.annotations.push({ x: r45, y: 0.6, text: `↓ 45° lands at v²/g = ${r45.toFixed(1)} m` });
      world.annotations.push({ x: r30, y: 1.6, text: `↓ 30° & 60° land here (${r30.toFixed(1)} m)` });
    },
  },

  {
    name: 'Orbits (N-Body)',
    description: "Newtonian gravitation F = G·m₁·m₂/r²: circular and elliptical orbits, a comet, and a moon orbiting its planet. The symplectic integrator keeps total energy constant — watch E in the panel. Throw a planet with the grab tool to perturb the system.",
    camera: { x: 0, y: 0, zoom: 19 },
    setup(world) {
      world.gravityMode = 'nbody';
      world.G = 5;
      world.cullRadius = 2000;
      const M = 300;
      const star = world.addBody(Bodies.circle(0, 0, 1.2, {
        density: M / (Math.PI * 1.44), color: '#ffd166', label: 'star', restitution: 0.2,
      }));
      const vAt = (r) => Math.sqrt((world.G * M) / r);

      const mkPlanet = (x, y, r, density, vx, vy, color, label = null) =>
        world.addBody(Bodies.circle(x, y, r, {
          density, velocity: { x: vx, y: vy }, trail: true, color, label, restitution: 0.6,
        }));

      mkPlanet(8, 0, 0.35, 5.2, 0, vAt(8), '#4cc9f0', 'circular');
      mkPlanet(-13, 0, 0.4, 4, 0, -vAt(13) * 0.72, '#f72585', 'elliptical');
      mkPlanet(0, 17, 0.3, 3, vAt(17) * 0.55, 0, '#80ffdb', 'comet');

      // planet with a moon: moon velocity = planet velocity + local circular speed
      const planet = mkPlanet(21, 0, 0.5, 10.2, 0, vAt(21), '#c77dff', 'planet');
      const mp = planet.mass;
      const moonR = 1.1;
      mkPlanet(21 + moonR, 0, 0.12, 2, 0, vAt(21) + Math.sqrt((world.G * mp) / moonR), '#a0c4ff', 'moon');

      // zero out total momentum so the system doesn't drift
      let px = 0, py = 0;
      for (const b of world.bodies) { px += b.mass * b.velocity.x; py += b.mass * b.velocity.y; }
      star.velocity.x = -px / star.mass;
      star.velocity.y = -py / star.mass;
    },
  },

  {
    name: 'Springs & Bridge',
    description: "Hooke's law F = -kx: a harmonic oscillator, a plank bridge on revolute joints sagging under a heavy ball, and a soft body made of a spring lattice. Energy moves between kinetic, gravitational and elastic forms.",
    camera: { x: 0, y: 4, zoom: 38 },
    setup(world) {
      ground(world, 70);

      // harmonic oscillator, released from stretch
      const sAnchor = world.addBody(Bodies.circle(-12, 9.5, 0.12, { isStatic: true, collidable: false }));
      const weight = world.addBody(Bodies.circle(-12, 4.5, 0.5, { density: 2, color: '#ffd166', collidable: false }));
      world.addJoint(new SpringJoint(sAnchor, weight, sAnchor.position, weight.position,
        { stiffness: 60, damping: 0.15, restLength: 3.2 }));
      world.annotations.push({ x: -12, y: 10.1, text: 'F = −kx' });

      // plank bridge
      const n = 13, w = 1.18, h = 0.25, y = 4;
      const left = world.addBody(Bodies.box(-8.6, y, 0.5, 0.5, { isStatic: true }));
      const right = world.addBody(Bodies.box(8.6, y, 0.5, 0.5, { isStatic: true }));
      let prev = left;
      const planks = [];
      for (let i = 0; i < n; i++) {
        const x = -8.6 + 0.25 + w / 2 + i * (w + 0.06);
        const plank = world.addBody(Bodies.box(x, y, w, h,
          { friction: 0.6, group: 3, color: '#b5e48c', density: 1.2 }));
        planks.push(plank);
        world.addJoint(new RevoluteJoint(prev, plank, { x: x - w / 2 - 0.03, y }));
        prev = plank;
      }
      world.addJoint(new RevoluteJoint(prev, right, { x: 8.6 - 0.25, y }));
      world.addBody(Bodies.circle(0, 9, 0.85, { density: 6, color: '#f72585', restitution: 0.2 }));
      world.annotations.push({ x: 0, y: 5.2, text: 'revolute-joint bridge' });

      // soft body: ball lattice bound by springs
      const grid = [], gx = 11.5, gy = 6, sp = 0.75;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          grid.push(world.addBody(Bodies.circle(gx + i * sp, gy + j * sp, 0.26,
            { density: 1.5, friction: 0.5, group: 4, color: '#4cc9f0' })));
        }
      }
      const at = (i, j) => grid[i * 3 + j];
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const link = (a, b) => world.addJoint(new SpringJoint(a, b, a.position, b.position,
            { stiffness: 120, damping: 2 }));
          if (i < 2) link(at(i, j), at(i + 1, j));
          if (j < 2) link(at(i, j), at(i, j + 1));
          if (i < 2 && j < 2) { link(at(i, j), at(i + 1, j + 1)); link(at(i + 1, j), at(i, j + 1)); }
        }
      }
      world.annotations.push({ x: gx + sp, y: gy + 3, text: 'soft body (spring lattice)' });
    },
  },

  {
    name: 'Friction Ramps',
    description: 'Coulomb friction on a 20° incline: sliding needs tan(20°) ≈ 0.36 > μ. The μ=0.02 block races down, μ=0.30 creeps, and μ=0.70 holds still — static friction beats gravity along the slope.',
    camera: { x: 0, y: 3, zoom: 34 },
    setup(world) {
      ground(world, 70, 0.5);
      const slope = -20 * Math.PI / 180;
      const ramps = [
        { x: -10, mu: 0.02, color: '#4cc9f0' },
        { x: 0, mu: 0.30, color: '#ffd166' },
        { x: 10, mu: 0.70, color: '#f72585' },
      ];
      for (const r of ramps) {
        world.addBody(Bodies.box(r.x, 3.2, 9, 0.4, {
          isStatic: true, angle: slope, friction: r.mu, restitution: 0,
        }));
        // place the block near the top of the ramp, aligned with it
        const c = Math.cos(slope), s = Math.sin(slope);
        const lx = -3.6, ly = 0.62;
        world.addBody(Bodies.box(r.x + lx * c - ly * s, 3.2 + lx * s + ly * c, 0.85, 0.85, {
          angle: slope, friction: r.mu, restitution: 0, color: r.color, label: `μ=${r.mu.toFixed(2)}`,
        }));
        world.annotations.push({ x: r.x, y: 0.8, text: `μ = ${r.mu.toFixed(2)}` });
      }
      world.annotations.push({ x: 0, y: 7, text: 'slides only if μ < tan(20°) ≈ 0.36' });
    },
  },

  {
    name: 'Wrecking Ball',
    description: 'A heavy ball on a revolute-joint chain converts potential energy to kinetic energy (mgh = mv²/2) and transfers momentum into the tower on impact.',
    camera: { x: 2, y: 5.5, zoom: 32 },
    setup(world) {
      world.iterations = 20; // chain + heavy ball needs a stiffer solve
      ground(world, 70);

      // tower
      const bw = 0.62;
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 4; col++) {
          world.addBody(Bodies.box(7.2 + col * (bw + 0.02), bw / 2 + row * (bw + 0.015), bw, bw,
            { friction: 0.45, restitution: 0.05, density: 0.8, color: '#b5e48c' }));
        }
      }

      // chain + ball, held horizontal then released
      const anchor = world.addBody(Bodies.circle(2, 12, 0.15, { isStatic: true, collidable: false }));
      const linkLen = 0.55, links = 14;
      let prev = anchor;
      for (let i = 0; i < links; i++) {
        const x = 2 - (i + 0.5) * linkLen;
        const link = world.addBody(Bodies.box(x, 12, linkLen, 0.16,
          { density: 2, group: 5, color: '#8b96b5' }));
        world.addJoint(new RevoluteJoint(prev, link, { x: x + linkLen / 2, y: 12 }));
        prev = link;
      }
      const ball = world.addBody(Bodies.circle(2 - links * linkLen - 0.9, 12, 1.0,
        { density: 8, color: '#f72585', restitution: 0.1, friction: 0.4 }));
      world.addJoint(new RevoluteJoint(prev, ball, { x: 2 - links * linkLen, y: 12 }));
      world.annotations.push({ x: -3, y: 13, text: 'mgh → ½mv²' });
    },
  },
];
