# FPV AcroSim

A physics-accurate FPV drone simulator that runs in your browser. Built so you
can learn acro and crash **here** instead of with your real quad.

The flight model is not game physics — it is a 1 kHz 6-DOF rigid-body
simulation with per-motor brushless/propeller dynamics, a sagging LiPo model,
advance-ratio thrust washout, propwash, ground effect, gyroscopic effects, and
a Betaflight-style flight controller (Actual rates, rate-loop PID with
feedforward, airmode mixer). It is validated by an automated test suite
against published real-world numbers for a 6S 5" freestyle quad
(`tests/run.mjs`, 33 checks).

---

## Quick start

```bash
./start.sh            # serves on http://localhost:8000 and opens the browser
# or: python3 -m http.server 8000   then open http://localhost:8000
```

ES modules require `http://` — opening `index.html` directly from disk won't work.
Everything is local (Three.js is vendored); no internet needed after setup.

**Best way to practice:** plug your real RC transmitter in via USB (OpenTX /
EdgeTX / ELRS radios all enumerate as a USB joystick — same as every
commercial sim). Open Settings (Esc) → Input → click *Detect* for each
channel and move that stick **up/right**, then *Calibrate now* with sticks
at rest and move all sticks to their corners once. Muscle memory transfers
1:1 to your real quad.

## Controls

| Action | Keyboard | Gamepad/Radio |
|---|---|---|
| Throttle / Yaw | W,S / A,D | left stick (Mode 2) |
| Pitch / Roll | Arrows | right stick |
| Arm / Disarm | Enter | mappable button |
| Throttle cut | Space | — |
| Reset to pad | R | — |
| Fresh battery | B | — |
| Camera FPV → chase → LOS | C | — |
| Acro ⇄ Angle mode | M | — |
| Slow-motion ×1/×0.5/×0.25 | T | — |
| Tuning graph (setpoint vs gyro) | G | — |
| Stick overlay | H | — |
| Settings (pauses sim) | Esc | — |

Keyboard flying is possible (inputs are slew-filtered and rate-scaled) but a
controller is strongly recommended — that's the entire point of a sim.

---

## What is simulated, exactly

All SI units, fixed 1 ms timestep, semi-implicit Euler, quaternion attitude.

### Rigid body
- 6-DOF with measured-class inertia tensor (5" freestyle: Ixx 0.0017,
  Iyy 0.0030, Izz 0.0015 kg·m²), Euler's equations with the full
  `ω × (Iω + h_rotor)` term.
- Rotor angular momentum: gyroscopic precession of the four props and the
  spool-up reaction torque — the yaw kick you feel on punch-outs is emergent,
  not scripted.

### Motors, props, ESC (per motor)
- DC-equivalent brushless model: `I = (u·V_pack − Ke·ω)/R`,
  `J_r·ω̇ = Kt·I − Q_aero − friction`, with ESC burst-current and braking
  limits (DShot damped-light behavior). Spool 0→90% in ~115 ms, like a real
  2207 with a 5.1×3 prop.
- Propeller via thrust/torque coefficients with **advance-ratio washout**:
  `T = Ct(J)·ρ·n²·D⁴`, `Ct(J) = Ct0(1 − J/J0)`. This is what limits climb
  rate and top speed in reality, and because every motor sees its own local
  inflow (`v + ω×r`), roll/pitch aerodynamic damping emerges for free.
- **Battery**: LiPo OCV-vs-SoC curve, pack internal resistance (punch sag
  ~4.4 V on a 6S at 130 A), capacity integration. A dying pack genuinely
  flies soft; the OSD warns you to land.

### Aerodynamics
- Quadratic body drag with per-axis CdA (flat-fall terminal ≈ 27 m/s,
  max level speed ≈ 138 km/h — both in the real 5" envelope).
- **Rotor H-force**: in-plane prop drag ∝ RPM × lateral airspeed applied at
  each motor (props sit above the CG, so it couples into pitch like reality).
- **Propwash**: descending into your own wake (axial inflow < ~−1 m/s, low
  lateral speed) injects band-limited per-motor thrust turbulence + moment
  noise that the PID has to fight — you get the authentic shake on sloppy
  throttle-chops and corner exits, and it scales with descent rate.
- **Ground effect** (Cheeseman–Bennett) below ~1.5 prop diameters: the quad
  floats on its own cushion near the deck.
- Wind: steady + Ornstein–Uhlenbeck gusts (Settings → Environment).

### Flight controller (Betaflight-style)
- **Actual rates** — the exact Betaflight formula and defaults
  (center 70°/s, max 670°/s, expo 0.54).
- Rate-loop PID per axis with feedforward, D-term PT2 low-pass, I-term
  clamp, saturation-aware anti-windup, setpoint smoothing (models RC-link
  smoothing), ~3 ms loop/ESC group delay, light gyro noise.
- **Airmode mixer** with Betaflight differential-preserving scaling: full
  authority at zero throttle, motors never below idle while armed.
- Angle mode (self-level, 55° max) for the first hour; acro is the goal.
- Arming requires throttle low. Hidden tab = auto-disarm.

### Collisions & damage
- 5-sphere drone proxy (body + 4 prop discs) vs ground/boxes/cylinders/
  spheres, impulse response with friction and restitution applied at the
  contact point — clipping a gate with one corner cartwheels you.
- Impacts above ~8 m/s (≈ 29 km/h) while armed = **crash**: disarm, R to
  reset. That threshold is roughly where real frames start breaking arms and
  ripping motors. Turn "Crash damage" off in Settings if you want bouncy-castle
  mode, but the default teaches consequences.

### Validation
`node tests/run.mjs` — 33 assertions against real-world data, all passing:

| Quantity | Simulated | Real 6S 5" reference |
|---|---|---|
| Thrust-to-weight | 8.7 | 8–12 |
| Full-throttle RPM | 35,200 | 32–38k |
| Full-throttle pack current | 131 A | 100–160 A |
| Punch voltage sag | 4.4 V | 3–5 V |
| Hover throttle | 27 % | 20–30 % |
| Hover current | 4.1 A | 3–6 A |
| Roll step rise (670°/s) | 37 ms | 30–90 ms (blackbox) |
| Flat-fall terminal velocity | 27 m/s | 25–35 m/s |
| Max speed | 138 km/h | 120–160 km/h |
| Hover endurance (1300 mAh) | ~15 min | 10–15 min |

## The quads

- **5" Freestyle 6S** (default): 665 g, 2207 1860KV, 5.1×3 props, 1300 mAh.
- **5" Race 6S**: 560 g, stripped, sharper rates and response.
- **Tiny Whoop 65 mm 1S**: 27 g, TWR ~2.3 — slow, forgiving, great first hovers.

Rates, PIDs, camera tilt/FOV are all live-tunable (Esc) and persisted per-preset.

## The field

Launch pad, 6-gate race loop with lap timing and best-lap persistence
(next gate glows orange), slalom flags, trees, a building you can fly through,
a 1.1 m gap wall, a 12 m dive tower, scattered rocks for ground reference.

## Learning path (from a fellow beginner's curriculum)

1. **Angle mode hover** (M) — hold position over the pad at 1–2 m. Boring;
   do it anyway. Learn the throttle, it's 80% of flying.
2. **Acro hover** — same drill, no self-leveling. Use slow-mo (T) at first.
   Small corrections early beat big corrections late.
3. **Coordinated circuits** — gentle laps around the field, yaw+roll together,
   nose always leading. Climb with pitch+throttle, not throttle alone.
4. **Gates** — enable racing, chase your best lap. Smooth beats fast;
   fast follows smooth.
5. **Camera tilt up** — every 5° of tilt (Settings → Camera) forces you to fly
   faster to see ahead. 25° → 35° is a rite of passage.
6. **Propwash management** — dive the tower, flare late, feel the shake;
   learn to carry speed out of descents instead of dropping throttle.
7. **Watch the graph** (G) — if gyro lags setpoint you're fighting the tune;
   if it oscillates after flicks, lower D or your rates.

When a maneuver scares you here, it would have cost you a frame, four props,
or a VTX out there. That is the entire business case of this repo.

## Design decisions & assumptions (as requested, no questions asked)

- **Browser + Three.js + hand-written physics.** Zero install for you, runs
  anywhere, real radios work via the Gamepad API — and physics engines built
  for boxes are the wrong tool for prop aerodynamics anyway; everything that
  matters here is custom and testable headless (`src/sim` has zero DOM/Three
  dependencies).
- **1 kHz physics / FC loop** (real Betaflight runs 4–8 kHz): the slowest
  relevant dynamics (motor τ ≈ 18 ms, body modes) are far below 500 Hz, so
  1 kHz is transparent; it keeps 100+ fps headroom in JS.
- **Average-value ESC model** (V = duty × V_pack), no PWM ripple or motor
  inductance — their time constants are µs-scale, invisible at quad scale.
- **Coefficient-based prop aero** (Ct/Cq with linear J washout) rather than
  blade-element: matches thrust-stand data to within a few percent over the
  flight envelope; blade-element would add cost, not believable fidelity.
- **Propwash as physically-triggered stochastic turbulence** (per-motor OU
  noise gated by wake re-ingestion conditions): the trigger conditions and
  magnitudes are physical, the turbulence realization is random — same
  approach as commercial sims, because resolving actual vortex dynamics is
  CFD territory.
- **Stochastic-only VRS**: deep vortex-ring-state thrust collapse is partially
  modeled (washout + turbulence + mean thrust loss), not a full inflow model.
- **Betaflight-equivalent, not Betaflight-binary**: the rates formula is
  exact; PID gains are normalized (mixer-units) rather than BF's scaled
  integers. Defaults were tuned until step-response metrics matched healthy
  blackbox logs (37 ms rise, <15% overshoot, no residual oscillation).
- **Crash threshold 8 m/s** while armed: below that real quads usually
  tumble and survive; above it you're buying parts. Disarmed tumbles never
  "break" (you can't damage what physics already took from you).
- **Default conditions**: ISA sea level air (ρ = 1.225), wind off (turn it on
  once hovering is comfortable).
- **Ground effect only over flat ground** (not rooftops/obstacles) — h is
  measured to y=0. Edge case accepted.
- **Angle-mode tilt extraction** uses axis projections; it gets soft near
  ±90° — Betaflight's small-angle behavior has the same flavor. Acro mode has
  no singularities (pure quaternion).
- **No simulated RF/video link** (RSSI, breakup, failsafe) and no turtle mode
  — listed under future work; they don't affect stick skills.

## Known limitations

- No blade flapping / asymmetric blade lift at high advance ratio (affects
  extreme top-speed handling subtly).
- Props never break or bend; motors don't overheat or desync.
- Battery model has no temperature dependence and mild C-rate simplification.
- Collision proxy is spheres — you can't snag an antenna on a gate.
- Keyboard flying will always feel like keyboard flying.

## Project layout

```
index.html            shell, import map, start screen, menu styles
src/sim/              pure physics, no DOM (runs in node)
  math.js             vec3/quat, filters, OU noise
  presets.js          quad configs (the numbers + sources)
  motor.js            BLDC + prop + battery
  fc.js               rates, PID, airmode mixer
  collision.js        sphere-vs-world impulse solver
  sim.js              forces, torques, integration, propwash, wind
src/render/           world, drone model, OSD/HUD (Three.js)
src/input/            gamepad/radio mapping + keyboard
src/audio/            RPM-derived synthesized sound
src/ui/               settings panel, localStorage
tests/run.mjs         33-check physics validation (node tests/run.mjs)
vendor/three.module.js  Three.js r160 (vendored, offline-friendly)
```
