# NEON VOID

A neon 3D arena-survival shooter built with Next.js, React Three Fiber, and a fully synthesized WebAudio soundtrack — no art or audio assets, everything is generated.

![genre](https://img.shields.io/badge/genre-arena%20survival-ff3dcd) ![stack](https://img.shields.io/badge/stack-Next.js%20%2B%20R3F%20%2B%20three.js-3de8ff)

## Play

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Desktop + mouse/keyboard recommended.

| Input | Action |
| --- | --- |
| `W A S D` / arrows | Move |
| Mouse | Aim |
| Click / hold, or `Space` | Fire |
| `Shift` | Dash (brief invulnerability, 1.6s cooldown) |
| `P` / `Esc` | Pause |
| `M` | Mute |
| `Enter` | Start / retry |

## The game

You pilot a lone ship on a circular neon arena against endless waves of geometry:

- **Chaser** (magenta octahedron) — swarms you head-on
- **Speeder** (orange tetrahedron) — fast, fragile flanker (wave 2+)
- **Splitter** (green icosahedron) — splits into three minis on death (wave 3+)
- **Shooter** (yellow hex-ring) — keeps its distance and fires plasma orbs (wave 4+)
- **Tank** (purple dodecahedron) — slow, huge, hits like a truck (wave 5+)

Enemies telegraph their arrival with pulsing ground rings. Each wave is bigger and tougher; clearing one heals you a little.

**Scoring.** Kill streaks raise your multiplier up to ×9 — take a hit and it resets. Enemies drop **shards** (auto-magnet): collect them to upgrade your weapon from single → twin → triple-stream. Rarer drops: **heal**, **triple-shot**, **rapid fire**, and **shield**. Best score persists in `localStorage`.

## Architecture

```
lib/game/
  sim.ts      — pure-TS simulation (entities, waves, collisions, scoring); zero three.js
  audio.ts    — WebAudio synth: SFX + 116bpm dark-synth music loop, all procedural
  store.ts    — zustand store bridging sim → DOM HUD/menus
components/game/
  GameCanvas  — R3F <Canvas>, scene assembly
  systems     — GameLoop (input + fixed update, priority -100) and CameraRig (chase cam, shake)
  Arena       — grid floor, boundary ring, pillars, stars, lights
  PlayerMesh  — ship, engine trail, shield bubble, banking/blink animation
  Swarms      — InstancedMesh renderers: enemies (per kind), bullets, pickups,
                particles, shockwaves, spawn rings — sim arrays in, matrices out
  Effects     — bloom + noise + vignette post-processing
components/ui/
  HUD, Menus  — DOM overlays (hull bar, score/multiplier, powerups, wave banner,
                title / pause / game-over screens)
```

Design notes:

- The simulation runs on the xz-plane with hand-rolled circle collisions — no physics engine. One `useFrame(-100)` tick drives it; renderers only copy state into instanced buffers, so React re-renders only when HUD numbers change.
- Neon look: `meshBasicMaterial`/`meshStandardMaterial` with `toneMapped={false}` and HDR (>1) color values pushed through a bloom pass.
- `window.__sim` exposes the simulation, and `sim.autopilot = true` detaches aim/fire from the mouse — used by the automated Playwright playtests (and handy for a demo mode).
