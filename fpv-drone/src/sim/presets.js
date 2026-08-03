// Quad configurations. All values SI unless noted, derived from published
// bench data for real components (thrust-stand numbers, motor specs, pack IR).
//
// Body frame convention (matches the Three.js object):
//   +X = right, +Y = up (thrust axis), +Z = back  =>  forward = -Z.
// Motor order follows Betaflight: M1 rear-right, M2 front-right,
// M3 rear-left, M4 front-left. spin: +1 = CCW seen from above (+Y),
// -1 = CW. Default direction is Betaflight "props in": M1/M4 CW, M2/M3 CCW.

function motorLayout(armX, armZ, propY) {
  return [
    { name: 'M1 RR', pos: [+armX, propY, +armZ], spin: -1 },
    { name: 'M2 FR', pos: [+armX, propY, -armZ], spin: +1 },
    { name: 'M3 RL', pos: [-armX, propY, +armZ], spin: +1 },
    { name: 'M4 FL', pos: [-armX, propY, -armZ], spin: -1 },
  ];
}

// LiPo open-circuit voltage per cell vs state-of-charge (1.0 .. 0.0).
// Typical high-C pouch cell curve.
const LIPO_OCV = [4.20, 4.08, 3.98, 3.89, 3.82, 3.76, 3.70, 3.62, 3.50, 3.30, 3.00];

export const PRESETS = {
  freestyle5: {
    id: 'freestyle5',
    name: '5" Freestyle (6S)',
    desc: '5-inch freestyle quad, ~665 g AUW, 2207 1860KV on 6S 1300 mAh. TWR ~10.',
    mass: 0.665,                      // kg, all-up weight with battery
    // Inertia about body axes [Ix (pitch), Iy (yaw), Iz (roll)], kg*m^2.
    // From published pendulum measurements of 5" freestyle frames.
    inertia: [0.0017, 0.0030, 0.0015],
    motors: motorLayout(0.0795, 0.0795, 0.022),  // 225 mm wheelbase, props 22 mm above CG
    prop: {
      D: 0.1295,        // 5.1" diameter, m
      blades: 3,
      Ct0: 0.120,       // static thrust coefficient: T = Ct*rho*n^2*D^4
      Cq0: 0.0105,      // torque coefficient:        Q = Cq*rho*n^2*D^5
      J0: 0.75,         // advance ratio where thrust washes out (pitch/D ~ 0.9)
      Jr: 1.3e-5,       // rotor+prop moment of inertia, kg*m^2
    },
    motor: {
      Kv: 1860,         // rpm/V
      R: 0.045,         // winding+ESC resistance, ohm
      fricStatic: 0.0018, // bearing/iron drag torque, N*m
      fricVisc: 1.2e-6,   // viscous loss, N*m per rad/s
      ImaxBurst: 70,    // ESC burst current clamp, A
      IbrakeMax: 25,    // regenerative braking clamp, A
    },
    battery: {
      cells: 6,
      capacity_mAh: 1300,
      R_int: 0.034,     // full-pack internal resistance incl. wiring/ESC, ohm
      ocv: LIPO_OCV,
    },
    aero: {
      // Effective drag area CdA per body axis [x: side, y: top/bottom, z: frontal], m^2.
      // Tuned for ~30 m/s flat-fall terminal velocity, ~40 m/s max level speed.
      CdA: [0.0085, 0.0145, 0.0055],
      Ch: 0.045,        // rotor in-plane drag (H-force) coefficient
      propwashGain: 1.0,
    },
    fc: {
      idle: 0.055,
      rates: { centerDps: 70, maxDps: 670, expo: 0.54 },        // Betaflight "Actual" defaults
      ratesYaw: { centerDps: 70, maxDps: 670, expo: 0.54 },
      // Normalized PID: output is mixer units per rad/s (P), per rad (I), per rad/s^2 (D).
      pid: {
        rollPitch: { P: 0.052, I: 0.28, D: 0.0013, FF: 0.010 },
        yaw: { P: 0.12, I: 0.55, D: 0.0, FF: 0.010 },
      },
      dtermCutoffHz: 90,
      setpointCutoffHz: 30,   // models RC-link smoothing
      gyroCutoffHz: 250,
      itermLimit: 0.35,
      angle: { maxDeg: 55, Kp: 7.5 },   // angle mode
      outputDelaySec: 0.003,            // loop+ESC+filter group delay
    },
    cam: { tiltDeg: 25, fovH: 125 },
    collision: { bodyR: 0.05, motorR: 0.07, crashSpeed: 8.0 },
  },

  race5: {
    id: 'race5',
    name: '5" Race (6S)',
    desc: 'Stripped 5-inch race build, ~560 g AUW, faster response, higher rates.',
    mass: 0.560,
    inertia: [0.0013, 0.0024, 0.0012],
    motors: motorLayout(0.074, 0.074, 0.020),
    prop: { D: 0.1295, blades: 3, Ct0: 0.125, Cq0: 0.0110, J0: 0.80, Jr: 1.15e-5 },
    motor: { Kv: 1950, R: 0.040, fricStatic: 0.0016, fricVisc: 1.1e-6, ImaxBurst: 75, IbrakeMax: 25 },
    battery: { cells: 6, capacity_mAh: 1100, R_int: 0.030, ocv: LIPO_OCV },
    aero: { CdA: [0.0070, 0.0120, 0.0045], Ch: 0.040, propwashGain: 0.9 },
    fc: {
      idle: 0.05,
      rates: { centerDps: 90, maxDps: 850, expo: 0.50 },
      ratesYaw: { centerDps: 90, maxDps: 750, expo: 0.50 },
      pid: {
        rollPitch: { P: 0.046, I: 0.26, D: 0.0011, FF: 0.012 },
        yaw: { P: 0.11, I: 0.50, D: 0.0, FF: 0.010 },
      },
      dtermCutoffHz: 100, setpointCutoffHz: 35, gyroCutoffHz: 250,
      itermLimit: 0.35,
      angle: { maxDeg: 60, Kp: 8.5 },
      outputDelaySec: 0.0025,
    },
    cam: { tiltDeg: 35, fovH: 130 },
    collision: { bodyR: 0.05, motorR: 0.07, crashSpeed: 8.0 },
  },

  whoop65: {
    id: 'whoop65',
    name: 'Tiny Whoop 65mm (1S)',
    desc: '65 mm brushless whoop, 27 g AUW. Slow and forgiving — good indoors/first hovers.',
    mass: 0.027,
    inertia: [2.6e-6, 4.4e-6, 2.6e-6],
    motors: motorLayout(0.0232, 0.0232, 0.006),
    prop: { D: 0.031, blades: 4, Ct0: 0.105, Cq0: 0.0125, J0: 0.55, Jr: 6.0e-9 },
    motor: { Kv: 22000, R: 0.95, fricStatic: 6e-5, fricVisc: 6e-9, ImaxBurst: 6, IbrakeMax: 2 },
    battery: { cells: 1, capacity_mAh: 300, R_int: 0.085, ocv: LIPO_OCV },
    aero: { CdA: [0.0011, 0.0022, 0.0009], Ch: 0.050, propwashGain: 0.7 },
    fc: {
      idle: 0.06,
      rates: { centerDps: 60, maxDps: 500, expo: 0.40 },
      ratesYaw: { centerDps: 60, maxDps: 450, expo: 0.40 },
      pid: {
        rollPitch: { P: 0.060, I: 0.35, D: 0.0009, FF: 0.008 },
        yaw: { P: 0.12, I: 0.55, D: 0.0, FF: 0.008 },
      },
      dtermCutoffHz: 90, setpointCutoffHz: 25, gyroCutoffHz: 250,
      itermLimit: 0.40,
      angle: { maxDeg: 45, Kp: 7.0 },
      outputDelaySec: 0.003,
    },
    cam: { tiltDeg: 15, fovH: 115 },
    collision: { bodyR: 0.022, motorR: 0.022, crashSpeed: 12.0 },
  },
};

export const DEFAULT_PRESET = 'freestyle5';

// Deep-clone a preset so UI edits don't mutate the source.
export function getPreset(id) {
  return JSON.parse(JSON.stringify(PRESETS[id] || PRESETS[DEFAULT_PRESET]));
}
