// Aircraft database. Coefficients are per-radian, SI units throughout.
// Derived from published wind-tunnel / flight-test data (Roskam, NASA reports),
// lightly tuned for the sim's integrator.
//
// Sign conventions used by the physics engine (see physics.js):
//   pitchInput +1 = stick back (nose up)     -> Cmde is positive
//   rollInput  +1 = stick right (roll right) -> Clda is positive
//   yawInput   +1 = right rudder (nose right)-> Cndr is positive
//   Cnda: adverse yaw (negative = nose swings away from roll input)
// Body frame: +X right wing, +Y up, -Z nose (three.js convention).

import { DEG2RAD } from './util.js';

export const AIRFRAMES = [
  {
    id: 'c172',
    name: 'Skyhawk C-172',
    role: 'Trainer · General Aviation',
    blurb: 'Forgiving and honest. Docile stall, fixed gear, slow and stable — the aircraft half the world learned to fly in.',
    stats: { 'Top speed': '122 kt', 'Stall': '47 kt', 'Power': '180 hp piston', 'Service ceiling': '13,500 ft' },

    mass: 1050,                       // kg, near gross
    inertia: { roll: 1285, pitch: 1825, yaw: 2667 },  // Ixx, Iyy, Izz (std axes)
    S: 16.17, b: 11.0, c: 1.49, e: 0.78,
    length: 8.28,

    CL0: 0.31, CLa: 5.1,
    aStall: 16 * DEG2RAD, stallSharp: 14,
    CD0: 0.034,
    CYb: -0.31,

    Cm0: 0.045, Cma: -0.89, Cmq: -12.4, Cmde: 1.28, Cmadot: -5.2,
    Clb: -0.105, Clp: -0.47, Clr: 0.07, Clda: 0.17,
    Cnb: 0.065, Cnr: -0.165, Cndr: 0.07, Cnda: -0.0065,

    maxDef: { ail: 20 * DEG2RAD, elev: 24 * DEG2RAD, rud: 17 * DEG2RAD },
    trimAuthority: 0.45,              // fraction of elevator throw

    flapNotches: [0, 10, 20, 30],     // degrees
    flapCL: 0.020,                    // ΔCL per degree of flap
    flapCD: 0.00135,                  // ΔCD per degree
    flapCm: -0.004,                   // nose-down per degree
    flapAStallShift: -0.10 * DEG2RAD, // per degree

    engine: {
      type: 'piston',
      power: 134000,                  // W (180 hp)
      propDiam: 1.93,
      propEff: 0.78,
      rpmIdle: 700, rpmMax: 2700,
      torqueFactor: 0.30,             // fraction of true engine torque applied as roll
      pFactor: 0.006,                 // yaw-left at high power / low speed
    },

    gear: {
      type: 'tricycle', retractable: false, cd: 0.0,    // gear drag already in CD0
      cgHeight: 1.15,                 // m, CG above ground at rest
      wheels: [
        { name: 'nose', pos: [0, -1.15, -1.60], share: 0.18, steer: 14 * DEG2RAD, brake: 0 },
        { name: 'left', pos: [-1.28, -1.15, 0.35], share: 0.41, steer: 0, brake: 1 },
        { name: 'right', pos: [1.28, -1.15, 0.35], share: 0.41, steer: 0, brake: 1 },
      ],
    },

    vne: 84,                          // m/s (163 kt)
    gLimitPos: 4.4, gLimitNeg: -1.76,
    fbw: null,

    camera: { chaseDist: 16, chaseHeight: 4.2, cockpit: [0, 0.60, -1.52], fov: 60 },
    visual: { builder: 'c172', fuselage: 0xf2f4f6, accent: 0xc92a2a, wing: 0xe8eaec },
  },

  {
    id: 'p51',
    name: 'Mustang P-51D',
    role: 'Warbird · WWII Fighter',
    blurb: 'A 1,490 hp Merlin up front and a laminar-flow wing. Heavy on the controls, vicious torque on takeoff — respect the tailwheel.',
    stats: { 'Top speed': '380 kt', 'Stall': '87 kt', 'Power': '1,490 hp V-12', 'Service ceiling': '41,900 ft' },

    mass: 4175,
    inertia: { roll: 9500, pitch: 18000, yaw: 25500 },
    S: 21.83, b: 11.28, c: 2.03, e: 0.75,
    length: 9.83,

    CL0: 0.13, CLa: 4.85,
    aStall: 15 * DEG2RAD, stallSharp: 22,   // sharper laminar-wing stall
    CD0: 0.0175,
    CYb: -0.35,

    Cm0: 0.025, Cma: -0.72, Cmq: -15.5, Cmde: 1.10, Cmadot: -4.5,
    Clb: -0.062, Clp: -0.44, Clr: 0.06,  Clda: 0.155,
    Cnb: 0.075, Cnr: -0.180, Cndr: 0.085, Cnda: -0.0045,

    maxDef: { ail: 17 * DEG2RAD, elev: 25 * DEG2RAD, rud: 22 * DEG2RAD },
    trimAuthority: 0.5,

    flapNotches: [0, 10, 20, 30, 40, 50],
    flapCL: 0.016, flapCD: 0.0016, flapCm: -0.0035, flapAStallShift: -0.08 * DEG2RAD,

    engine: {
      type: 'piston',
      power: 1100000,                 // W (~1,475 hp)
      propDiam: 3.40,
      propEff: 0.85,
      rpmIdle: 600, rpmMax: 3000,
      torqueFactor: 0.38,
      pFactor: 0.024,
    },

    gear: {
      type: 'taildragger', retractable: true, cd: 0.021,
      cgHeight: 2.05,
      wheels: [
        { name: 'left', pos: [-1.85, -2.05, -0.55], share: 0.46, steer: 0, brake: 1 },
        { name: 'right', pos: [1.85, -2.05, -0.55], share: 0.46, steer: 0, brake: 1 },
        { name: 'tail', pos: [0, -1.05, 4.40], share: 0.08, steer: 24 * DEG2RAD, brake: 0 },
      ],
    },

    vne: 260,                         // m/s (505 mph)
    gLimitPos: 8, gLimitNeg: -4,
    fbw: null,

    camera: { chaseDist: 19, chaseHeight: 4.6, cockpit: [0, 0.84, -0.55], fov: 62 },
    visual: { builder: 'p51', fuselage: 0x8a929b, accent: 0xd8b440, wing: 0x848c95 },
  },

  {
    id: 'f16',
    name: 'Viper F-16C',
    role: 'Jet · Multirole Fighter',
    blurb: 'Relaxed static stability tamed by fly-by-wire. Rate-command controls, 9 G available, afterburner on demand. Point it straight up.',
    stats: { 'Top speed': 'Mach 1.2+', 'Stall': '~120 kt', 'Thrust': '129 kN w/ AB', 'Limit': '9.0 G' },

    mass: 9300,
    inertia: { roll: 12875, pitch: 75674, yaw: 85552 },
    S: 27.87, b: 9.45, c: 3.45, e: 0.82,
    length: 15.06,

    CL0: 0.06, CLa: 3.95,             // low AR + LEX vortex lift
    aStall: 27 * DEG2RAD, stallSharp: 9,
    CD0: 0.0195,
    machDragK: 18,                    // wave-drag rise coefficient above Mcrit
    machCrit: 0.87,
    CYb: -0.65,

    Cm0: 0.02, Cma: -0.28, Cmq: -8.5, Cmde: 0.95, Cmadot: -2.0,
    Clb: -0.060, Clp: -0.32, Clr: 0.05, Clda: 0.21,
    Cnb: 0.16, Cnr: -0.32, Cndr: 0.11, Cnda: -0.002,

    maxDef: { ail: 21 * DEG2RAD, elev: 25 * DEG2RAD, rud: 30 * DEG2RAD },
    trimAuthority: 0.4,

    flapNotches: [0, 20],             // simple TEF
    flapCL: 0.014, flapCD: 0.0011, flapCm: -0.002, flapAStallShift: 0,

    engine: {
      type: 'jet',
      thrust: 78000,                  // N military power
      abThrust: 129000,               // N full afterburner
      spoolRate: 0.45,                // throttle response lag (1/s)... jets spool slowly
      ramK: 0.25,
    },

    gear: {
      type: 'tricycle', retractable: true, cd: 0.024,
      cgHeight: 1.85,
      wheels: [
        { name: 'nose', pos: [0, -1.85, -3.05], share: 0.14, steer: 30 * DEG2RAD, brake: 0 },
        { name: 'left', pos: [-1.18, -1.85, 0.85], share: 0.43, steer: 0, brake: 1 },
        { name: 'right', pos: [1.18, -1.85, 0.85], share: 0.43, steer: 0, brake: 1 },
      ],
    },

    vne: 420,                         // m/s
    gLimitPos: 9.0, gLimitNeg: -3.0,
    fbw: {
      pitchRateMax: 28 * DEG2RAD,     // rad/s commanded at full stick
      rollRateMax: 240 * DEG2RAD,
      kqP: 5.5, kqI: 2.2,             // pitch rate-command PI gains
      kpP: 0.45,                      // roll rate P gain
      aoaLimit: 25 * DEG2RAD,
      yawDamp: 1.4,
    },

    camera: { chaseDist: 26, chaseHeight: 6.0, cockpit: [0, 0.95, -4.6], fov: 68 },
    visual: { builder: 'f16', fuselage: 0x6b7686, accent: 0x39414d, wing: 0x646e7d },
  },
];

export function getAirframe(id) {
  return AIRFRAMES.find((a) => a.id === id) || AIRFRAMES[0];
}
