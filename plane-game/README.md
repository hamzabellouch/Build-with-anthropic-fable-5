# ✈ HORIZONS — Flight Simulator

A realistic flight simulator that runs entirely in your browser. No build step,
no dependencies to install — the 3D engine is bundled.

## Run it

```bash
npm start
```

Then open **http://localhost:8000** (it opens automatically on most systems).
That's it — one command. (`node server.js` or `python3 -m http.server` from this
folder work too.)

## The simulation

This is not an arcade flight model. The engine integrates full 6-degree-of-freedom
rigid-body dynamics at 240 Hz:

- **Aerodynamics** — lift-curve with a smooth post-stall flat-plate blend
  (Beard–McLain), induced + parasitic + compressibility drag, sideslip forces,
  real stability derivatives per aircraft (pitch/roll/yaw damping, dihedral
  effect, weathervane stability, adverse yaw).
- **Stall & spin tendencies** — buffet, wing drop, full post-stall physics.
  G-load and Vne structural limits: exceed them and the airframe fails.
- **ISA atmosphere** — density, temperature and speed of sound fall with
  altitude; indicated vs true airspeed divergence; engine power fades with
  density altitude (the P-51's supercharger holds power to ~24,000 ft).
- **Propulsion** — momentum-theory propeller thrust with windmilling drag,
  engine torque roll, P-factor/slipstream yaw (hold right rudder on the
  Mustang's takeoff!), spool-lagged turbofan with afterburner and ram effect.
- **Ground physics** — per-wheel spring/damper suspension, tyre side-slip and
  rolling friction, differential surfaces (asphalt vs grass), nosewheel &
  tailwheel steering, weight-on-wheels logic, hard-landing gear collapse.
- **Ground effect**, wind, gusts and turbulence (selectable), pitch trim.
- **F-16 fly-by-wire** — rate-command control augmentation with AoA and
  G-limiters, like the real aircraft.

## Aircraft

| | |
|---|---|
| **Skyhawk C-172** | Docile trainer. Fixed gear, honest stall. Rotate ~55 kt. |
| **Mustang P-51D** | 1,490 hp taildragger. Torque will pull you left — feed in right rudder. Rotate ~100 kt, raise the tail first. |
| **Viper F-16C** | Fly-by-wire, afterburner (Tab), 9 G available. Rotate ~150 kt. |

## Controls

| Key | Action |
|---|---|
| ↑ / ↓ | Pitch (stick forward / back) |
| ← / → | Roll |
| A / D | Rudder |
| W / S | Throttle up / down (also mouse wheel, 1–9/0 presets) |
| F / R | Flaps extend / retract |
| G | Landing gear |
| B (hold) | Wheel brakes |
| P | Parking brake |
| Z / X | Pitch trim |
| Tab | Afterburner (F-16) |
| C | Cycle camera: chase → cockpit → orbit → tower → flyby |
| H | Toggle military HUD overlay |
| M | Mouse yoke (steer with cursor) |
| K | Stability assist (for beginners) |
| Y | Invert pitch axis |
| Shift+R | Reset to runway |
| Esc | Pause |

Gamepad: left stick = pitch/roll, right stick X = rudder, RT = throttle,
LT = brakes, A = gear, X/Y = flaps, B = afterburner, RB = camera.

## Quick flight (C-172)

1. **P** to release the parking brake, hold **W** to full throttle.
2. At ~55 kt ease the stick back (**↓**). Climb at ~75 kt.
3. Throttle back to ~75%, trim (**X**) until she holds the nose herself.
4. To land: fly the pattern, flaps one notch under 110 kt (**F**), aim for the
   numbers at ~65 kt with full flaps, flare gently, hold the nose off.
   The PAPI lights left of the runway show your glidepath (2 white + 2 red = on profile).

Landing rating is judged on touchdown sink rate — under ~70 fpm is "butter".
