// Physics validation suite. Run: node tests/run.mjs
// Asserts the simulated 5" freestyle quad matches published real-world
// figures (thrust stands, blackbox logs, race telemetry) within tolerance.

import { Simulation, PHYS_DT } from '../src/sim/sim.js';
import { getPreset } from '../src/sim/presets.js';
import { actualRates } from '../src/sim/fc.js';
import { qrotate, vlen, DEG } from '../src/sim/math.js';

let passed = 0, failed = 0;
function check(name, cond, detail = '') {
  if (cond) { passed++; console.log(`  PASS  ${name}${detail ? '  [' + detail + ']' : ''}`); }
  else { failed++; console.log(`  FAIL  ${name}${detail ? '  [' + detail + ']' : ''}`); }
}
function inRange(x, lo, hi) { return Number.isFinite(x) && x >= lo && x <= hi; }
const fmt = (x, d = 2) => Number.isFinite(x) ? x.toFixed(d) : String(x);

function makeSim(opts = {}) {
  const cfg = getPreset(opts.preset || 'freestyle5');
  const sim = new Simulation(cfg, { colliders: [] });
  if (opts.airborne) {
    sim.reset([0, opts.alt ?? 50, 0], 0);
  }
  return sim;
}
function run(sim, seconds, inputFn) {
  const steps = Math.round(seconds / PHYS_DT);
  for (let i = 0; i < steps; i++) {
    if (inputFn) inputFn(sim, i * PHYS_DT);
    sim.step(PHYS_DT);
    if (!Number.isFinite(sim.pos[0] + sim.pos[1] + sim.pos[2] + vlen(sim.omega))) {
      throw new Error(`NaN state at t=${(i * PHYS_DT).toFixed(3)}`);
    }
  }
}

console.log('\n=== Static performance (5" freestyle, 6S) ===');
{
  // Full-throttle static thrust: lock the quad in place, motors only.
  const sim = makeSim({ airborne: true });
  sim.fc.arm();
  sim.inputs.throttle = 1;
  // Hold position artificially to measure static numbers.
  for (let i = 0; i < 1500; i++) {
    sim.vel[0] = sim.vel[1] = sim.vel[2] = 0;
    sim.omega[0] = sim.omega[1] = sim.omega[2] = 0;
    sim.pos[0] = 0; sim.pos[1] = 50; sim.pos[2] = 0;
    sim.step(PHYS_DT);
  }
  const T = sim.totalThrust, W = sim.cfg.mass * 9.80665;
  const twr = T / W;
  check('max static thrust-to-weight 8..13 (real 6S freestyle ~9-12)', inRange(twr, 8, 13), `TWR=${fmt(twr, 1)}, T=${fmt(T / 9.81 * 1000, 0)}g`);
  check('full-throttle RPM 30k..42k', inRange(sim.avgRpm, 30000, 42000), `${fmt(sim.avgRpm, 0)} rpm`);
  check('full-throttle pack current 90..170A', inRange(sim.battery.I, 90, 170), `${fmt(sim.battery.I, 0)}A`);
  check('pack sag at full punch 2..6V', inRange(sim.battery.ocv(sim.battery.soc) - sim.battery.V, 2, 6), `${fmt(sim.battery.ocv(sim.battery.soc) - sim.battery.V, 1)}V`);

  // Spool-up time: idle -> 90% of final RPM.
  const sim2 = makeSim({ airborne: true });
  sim2.fc.arm();
  sim2.inputs.throttle = 0;
  for (let i = 0; i < 500; i++) { sim2.vel[1] = 0; sim2.pos[1] = 50; sim2.step(PHYS_DT); }
  const w0 = sim2.motors[0].w;
  sim2.inputs.throttle = 1;
  const wHist = [];
  for (let i = 0; i < 1000; i++) {
    sim2.vel[0] = sim2.vel[1] = sim2.vel[2] = 0; sim2.pos[1] = 50;
    sim2.step(PHYS_DT);
    wHist.push(sim2.motors[0].w);
  }
  const wFinal = wHist[wHist.length - 1];
  const target = w0 + (wFinal - w0) * 0.9;
  const t90 = (wHist.findIndex(w => w > target) + 1) * PHYS_DT;
  check('motor spool idle->90% full in 40..250 ms', inRange(t90, 0.04, 0.25), `${fmt(t90 * 1000, 0)} ms, ${fmt(w0 * 60 / 6.283, 0)}->${fmt(wFinal * 60 / 6.283, 0)} rpm`);
}

console.log('\n=== Hover ===');
{
  // Find hover throttle with a PD + slow-integrator altitude hold.
  const sim = makeSim({ airborne: true });
  sim.fc.arm();
  let thrI = 0.3, thr = 0.3;
  run(sim, 8, (s) => {
    thrI += -0.0008 * (s.pos[1] - 50) * PHYS_DT;
    thr = Math.max(0.05, Math.min(0.8, thrI - 0.10 * s.vel[1] - 0.03 * (s.pos[1] - 50)));
    s.inputs.throttle = thr;
  });
  check('hover throttle 18..35% (linear ESC map, 6S)', inRange(thr, 0.18, 0.35), `${fmt(thr * 100, 1)}%`);
  check('hover holds altitude (|vz| < 0.5 m/s)', Math.abs(sim.vel[1]) < 0.5, `vz=${fmt(sim.vel[1])}`);
  check('hover pack current 3..8A', inRange(sim.battery.I, 3, 8), `${fmt(sim.battery.I, 1)}A`);
  check('hover RPM 10k..15k', inRange(sim.avgRpm, 10000, 15000), `${fmt(sim.avgRpm, 0)} rpm`);
  const hoverMin = sim.battery.cfg.capacity_mAh * 0.8 / (sim.battery.I * 1000 / 60);
  check('implied hover endurance 8..20 min', inRange(hoverMin, 8, 20), `${fmt(hoverMin, 1)} min`);
  // Quaternion stays normalized.
  const qn = Math.hypot(...sim.q);
  check('quaternion norm 1±1e-6', Math.abs(qn - 1) < 1e-6, `|q|=${qn.toFixed(8)}`);
}

console.log('\n=== Control response (acro) ===');
{
  // Roll step: full stick = 670 deg/s. Measure rise time/overshoot like a blackbox log.
  const sim = makeSim({ airborne: true });
  sim.fc.arm();
  sim.inputs.throttle = 0.35;
  run(sim, 1.0);
  sim.inputs.roll = 1.0;
  let t63 = -1, peak = 0, sumErr = 0, nErr = 0;
  const target = 670;
  for (let i = 0; i < 600; i++) {
    sim.step(PHYS_DT);
    const rollRate = -sim.omega[2] / DEG;   // pilot roll rate
    if (t63 < 0 && rollRate > target * 0.63) t63 = i * PHYS_DT;
    peak = Math.max(peak, rollRate);
    if (i > 350) { sumErr += Math.abs(rollRate - target); nErr++; }
  }
  const ssErr = sumErr / nErr;
  check('roll step 63% rise time 25..120 ms (real BF quad ~40-90)', inRange(t63, 0.025, 0.12), `${fmt(t63 * 1000, 0)} ms`);
  check('roll overshoot < 25%', peak < target * 1.25, `peak=${fmt(peak, 0)} dps`);
  check('roll steady-state error < 6%', ssErr < target * 0.06, `err=${fmt(ssErr, 1)} dps`);

  // Direction conventions: roll right must move the quad +X, pitch fwd -Z, yaw right cw.
  const s2 = makeSim({ airborne: true });
  s2.fc.arm(); s2.inputs.throttle = 0.32;
  run(s2, 0.8);
  s2.inputs.roll = 0.4;
  run(s2, 0.35, () => {});
  s2.inputs.roll = 0;
  check('roll-right stick translates quad +X', s2.vel[0] > 0.5, `vx=${fmt(s2.vel[0])}`);

  const s3 = makeSim({ airborne: true });
  s3.fc.arm(); s3.inputs.throttle = 0.32;
  run(s3, 0.8);
  s3.inputs.pitch = -0.4;          // stick forward = nose down
  run(s3, 0.35);
  s3.inputs.pitch = 0;
  check('pitch-forward stick translates quad forward (-Z)', s3.vel[2] < -0.5, `vz=${fmt(s3.vel[2])}`);

  const s4 = makeSim({ airborne: true });
  s4.fc.arm(); s4.inputs.throttle = 0.32;
  run(s4, 0.8);
  const fwd0 = qrotate([0, 0, 0], s4.q, [0, 0, -1]);
  const head0 = Math.atan2(-fwd0[0], -fwd0[2]);
  s4.inputs.yaw = 0.5;
  run(s4, 0.5);
  const fwd1 = qrotate([0, 0, 0], s4.q, [0, 0, -1]);
  const head1 = Math.atan2(-fwd1[0], -fwd1[2]);
  let dh = (head1 - head0);
  while (dh > Math.PI) dh -= 2 * Math.PI;
  while (dh < -Math.PI) dh += 2 * Math.PI;
  check('yaw-right stick turns nose right', dh < -10 * DEG, `dHeading=${fmt(dh / DEG, 0)} deg`);
  // Half stick through Actual-rates expo commands ~109 dps; expect >85% tracking.
  const yawCmdDps = actualRates(0.5, s4.cfg.fc.ratesYaw);
  check('yaw tracks commanded rate within 15%', Math.abs(dh / DEG) / 0.5 > yawCmdDps * 0.85,
    `${fmt(Math.abs(dh / DEG) / 0.5, 0)} dps avg vs ${fmt(yawCmdDps, 0)} commanded`);
}

console.log('\n=== Aerodynamics ===');
{
  // Free-fall terminal velocity, motors off, flat attitude.
  const sim = makeSim({ airborne: true, alt: 400 });
  run(sim, 7);
  check('disarmed flat-fall terminal velocity 20..40 m/s', inRange(-sim.vel[1], 20, 40), `${fmt(-sim.vel[1], 1)} m/s`);

  // Max level-ish speed: angle mode pinned at max tilt, full throttle.
  const s2 = makeSim({ airborne: true, alt: 60 });
  s2.fc.arm();
  s2.fc.angleMode = true;
  s2.inputs.throttle = 1; s2.inputs.pitch = -1;
  let vmax = 0;
  run(s2, 10, (s) => {
    if (s.pos[1] < 20) { s.pos[1] = 20; if (s.vel[1] < 0) s.vel[1] = 0; }  // keep it off the floor
    vmax = Math.max(vmax, Math.hypot(s.vel[0], s.vel[2]));
  });
  check('max speed at 55 deg tilt 22..45 m/s (real: ~25-40)', inRange(vmax, 22, 45), `${fmt(vmax * 3.6, 0)} km/h`);

  // Propwash: fast vertical descent should shake the quad measurably.
  const s3 = makeSim({ airborne: true, alt: 300 });
  s3.fc.arm();
  s3.inputs.throttle = 0.28;
  run(s3, 1);
  // Force a steady -7 m/s descent and measure gyro RMS.
  let rms = 0, n = 0, rmsHover = 0, nH = 0;
  run(s3, 4, (s) => {
    s.vel[1] = -7;
    rms += s.omega[0] ** 2 + s.omega[2] ** 2; n++;
  });
  const washRms = Math.sqrt(rms / n) / DEG;
  const s4 = makeSim({ airborne: true, alt: 100 });
  s4.fc.arm(); s4.inputs.throttle = 0.28;
  run(s4, 1);
  run(s4, 4, (s) => { s.vel[1] = 0; rmsHover += s.omega[0] ** 2 + s.omega[2] ** 2; nH++; });
  const hoverRms = Math.sqrt(rmsHover / nH) / DEG;
  check('propwash shake in descent >> still hover', washRms > 4 * hoverRms && washRms > 5, `descent ${fmt(washRms, 1)} dps RMS vs hover ${fmt(hoverRms, 2)}`);

  // Ground effect: thrust at fixed RPM higher near the floor.
  const s5 = makeSim();
  s5.reset([0, 0.06, 0], 0);
  s5.fc.arm(); s5.inputs.throttle = 0.25;
  let nearT = 0;
  run(s5, 0.6, (s) => { s.pos[1] = 0.06; s.vel[1] = 0; });
  nearT = s5.totalThrust / (s5.avgRpm ** 2);
  const s6 = makeSim({ airborne: true, alt: 5 });
  s6.fc.arm(); s6.inputs.throttle = 0.25;
  run(s6, 0.6, (s) => { s.pos[1] = 5; s.vel[1] = 0; });
  const farT = s6.totalThrust / (s6.avgRpm ** 2);
  check('ground effect boosts thrust/RPM^2 near floor by 3%+', nearT > farT * 1.03, `+${fmt((nearT / farT - 1) * 100, 1)}%`);
}

console.log('\n=== Battery over a flight ===');
{
  const sim = makeSim({ airborne: true });
  sim.fc.arm();
  const v0 = sim.battery.V;
  run(sim, 60, (s, t) => {
    s.inputs.throttle = 0.30 + 0.25 * Math.max(0, Math.sin(t * 0.8));   // mixed cruising/punching
    s.pos[1] = 50; if (Math.abs(s.vel[1]) > 8) s.vel[1] *= 0.9;
  });
  const used = sim.battery.mAhUsed;
  // Real-world reference: relaxed cruise ~100-150 mAh/min, aggressive freestyle
  // drains a 1300 pack in 3-4 min (~330-430 mAh/min). Profile here is moderate.
  check('mixed-flight consumption ~80..350 mAh per minute', inRange(used, 80, 350), `${fmt(used, 0)} mAh/min`);
  check('voltage sagged from full', sim.battery.V < v0, `${fmt(v0, 1)} -> ${fmt(sim.battery.V, 1)}V`);
}

console.log('\n=== Stability / robustness ===');
{
  // Random stick fuzz must never NaN or exceed physical bounds.
  const sim = makeSim({ airborne: true, alt: 150 });
  sim.fc.arm();
  let ok = true, maxRate = 0, maxSpeed = 0;
  try {
    run(sim, 30, (s, t) => {
      if (Math.floor(t * 4) !== Math.floor((t - PHYS_DT) * 4)) {
        s.inputs.roll = Math.random() * 2 - 1;
        s.inputs.pitch = Math.random() * 2 - 1;
        s.inputs.yaw = Math.random() * 2 - 1;
        s.inputs.throttle = Math.random();
      }
      if (s.pos[1] < 5) { s.pos[1] = 5; if (s.vel[1] < 0) s.vel[1] = 0; }
      maxRate = Math.max(maxRate, vlen(s.omega) / DEG);
      maxSpeed = Math.max(maxSpeed, s.speed);
    });
  } catch (e) { ok = false; console.log('   ', e.message); }
  check('30s random-stick fuzz: finite state', ok);
  check('angular rate stays physical (< 3000 dps)', maxRate < 3000, `${fmt(maxRate, 0)} dps`);
  check('speed stays physical (< 70 m/s)', maxSpeed < 70, `${fmt(maxSpeed, 1)} m/s`);

  // Resting on ground: settles, no jitter, no sink.
  const s2 = makeSim();
  s2.reset([0, 0.3, 0], 0.3);
  run(s2, 4);
  check('disarmed quad settles on ground', s2.pos[1] > 0.0 && s2.pos[1] < 0.12 && vlen(s2.vel) < 0.05,
    `y=${fmt(s2.pos[1], 3)} |v|=${fmt(vlen(s2.vel), 3)}`);

  // Crash detection: full-speed dive into the floor reports a big impact.
  const s3 = makeSim({ airborne: true, alt: 30 });
  let big = 0;
  run(s3, 4, (s) => { big = Math.max(big, s.lastImpact); });
  check('hard ground impact registers > crash threshold', big > s3.cfg.collision.crashSpeed, `${fmt(big, 1)} m/s`);
}

console.log('\n=== Angle mode ===');
{
  const sim = makeSim({ airborne: true });
  sim.fc.arm();
  sim.fc.angleMode = true;
  sim.inputs.throttle = 0.30;
  sim.inputs.roll = 1;
  run(sim, 1.5, (s) => { s.pos[1] = 50; if (s.vel[1] < -3) s.vel[1] = -3; });
  const att = sim.attitude();
  check('full right stick holds ~max bank', inRange(att.roll / DEG, 40, 62), `${fmt(att.roll / DEG, 0)} deg`);
  sim.inputs.roll = 0;
  run(sim, 1.5, (s) => { s.pos[1] = 50; });
  check('stick release self-levels (< 6 deg)', Math.abs(sim.attitude().roll / DEG) < 6, `${fmt(sim.attitude().roll / DEG, 1)} deg`);
}

console.log('\n=== Whoop preset sanity ===');
{
  const sim = makeSim({ preset: 'whoop65', airborne: true, alt: 5 });
  sim.fc.arm();
  let thrI = 0.5, thr = 0.5;
  run(sim, 6, (s) => {
    thrI += -0.0008 * (s.pos[1] - 5) * PHYS_DT;
    thr = Math.max(0.05, Math.min(0.95, thrI - 0.10 * s.vel[1] - 0.03 * (s.pos[1] - 5)));
    s.inputs.throttle = thr;
  });
  check('whoop hovers at 35..70% throttle (TWR ~2-3)', inRange(thr, 0.35, 0.70), `${fmt(thr * 100, 0)}%`);
  check('whoop hover current 1.5..5A', inRange(sim.battery.I, 1.5, 5), `${fmt(sim.battery.I, 1)}A`);
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
