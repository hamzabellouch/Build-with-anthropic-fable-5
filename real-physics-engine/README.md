# ⚛ Veritas — a real physics engine in your browser

A rigid-body physics engine written from scratch in dependency-free JavaScript,
with an interactive sandbox for running simulations. No build step, no
`npm install`, no frameworks — the physics, the renderer and the UI are all in
this repo.

![Orbits scene](docs/screenshot-orbits.png)

## Run it (one command)

```sh
./run.sh
```

That's it. It serves the app locally (python3, or node as a fallback — both
are zero-dependency) and opens your browser. Optional: `./run.sh 9000` to pick
a port, `NO_OPEN=1 ./run.sh` to skip opening the browser.

## The physics

Everything is simulated from first principles in SI units (meters, kilograms,
seconds, Joules):

| Law / phenomenon | Implementation |
| --- | --- |
| Newton's laws of motion | force/torque accumulation → symplectic (semi-implicit) Euler integration at 120 Hz |
| Universal gravitation | uniform field **g** or true n-body `F = G·m₁·m₂/r²` between every pair |
| Conservation of momentum | impulse-based collision response (equal and opposite impulses) |
| Restitution (energy of bounce) | Newton's impact law with coefficient `e`, mixed as `max(e₁, e₂)` |
| Coulomb friction | tangent impulses clamped to the friction cone `|Jt| ≤ μ·Jn`, `μ = √(μ₁μ₂)` — static *and* kinetic behavior emerge |
| Rotational dynamics | moment of inertia computed from actual geometry (second moment of area), angular impulses |
| Hooke's law | force-based springs `F = −kx − cv` with elastic potential energy tracked |
| Aerodynamic drag | quadratic drag `F = −½·ρ·C_d·A·|v|·v`, with per-shape drag coefficients |
| Constraints | distance (rod), revolute (pin), spring, and mouse joints solved as velocity constraints |
| Energy accounting | live kinetic + potential (gravitational, elastic) totals and a strip-chart in the panel |

### Engine architecture

```
src/
├── math.js       vector algebra
├── body.js       rigid bodies — mass, inertia & centroid derived from geometry
├── collision.js  broadphase (sweep-and-prune) + narrowphase (SAT with
│                 reference-face clipping, circle tests) → contact manifolds
├── solver.js     sequential-impulse contact solver: accumulated impulses,
│                 warm starting, Baumgarte stabilization, restitution, friction
├── joints.js     distance / revolute / spring / mouse constraints
├── world.js      simulation orchestration & energy bookkeeping
├── renderer.js   canvas renderer (camera, trails, vectors, contacts, joints)
├── scenes.js     the 8 demo simulations
└── main.js       fixed-timestep loop, input, UI
```

The integrator is *symplectic*, which is why orbits stay closed and total
energy stays bounded over thousands of steps instead of spiraling outward.

### Verified against theory

`node tests/sanity.mjs` checks the engine against closed-form physics:

- projectile range = `v²·sin(2θ)/g` — **0.3 % error**
- head-on elastic collision: momentum exact, KE within 0.01 %, equal masses
  exchange velocities
- a 5-box stack stands for 5 simulated seconds
- circular orbit conserves total energy to **0.01 % over 30 s** and stays
  within ±3 % of its nominal radius
- small-angle pendulum period = `2π√(L/g)` — **0.1 % error**

## The scenes

1. **Stacks & Pyramid** — contact forces and friction holding structures up
2. **Bouncing Balls** — restitution sweep e = 0 … 1 (rebound height = e²·h)
3. **Pendulums & Cradle** — pendulum period, double-pendulum chaos, Newton's cradle
4. **Projectiles** — 30°/45°/60° launches; toggle air density to break the range symmetry
5. **Orbits (N-Body)** — circular, elliptical, comet, and a moon orbiting a planet
6. **Springs & Bridge** — harmonic oscillator, plank bridge, spring-lattice soft body
7. **Friction Ramps** — static vs kinetic friction on a 20° incline
8. **Wrecking Ball** — mgh → ½mv² → momentum transfer, demolition style

![Wrecking ball scene](docs/screenshot-wrecking.png)

## Interacting

| Input | Action |
| --- | --- |
| left-drag on a body (✋ grab) | grab and throw it (soft mouse constraint) |
| left-drag with ● / ■ tool | slingshot-spawn a ball or box |
| right-drag / wheel | pan / zoom |
| `Space` · `.` · `R` | pause · single-step · reset scene |
| `1`–`8` | switch scene |
| `v` `c` `t` `g` | velocity vectors · contact points · trails · grid |

The panel exposes gravity, air density, time scale (slow motion!), solver
iterations, and material properties for spawned bodies. The whole engine is
also scriptable from the browser console via `window.physics`.

## Limitations (honest physics small print)

- 2D rigid bodies (circles & convex polygons); no fluids or deformables beyond
  spring lattices.
- No continuous collision detection: extremely fast, tiny bodies can tunnel.
- Contacts dissipate energy by design (inelastic collisions, friction); the
  conservative scenes (orbits, pendulums) are where conservation is visible.
