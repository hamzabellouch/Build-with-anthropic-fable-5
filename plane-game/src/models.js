// Procedural low-poly aircraft models with animated control surfaces,
// propellers, retractable gear, flaps and afterburner.
// Body frame: +X right wing, +Y up, -Z nose (matches physics).

import * as THREE from 'three';
import { DEG2RAD, lerp, clamp } from './util.js';

function phong(color, opts = {}) {
  return new THREE.MeshPhongMaterial({ color, shininess: 70, specular: 0x4a4a4a, ...opts });
}

function glassMat(color = 0x274a66) {
  return new THREE.MeshPhongMaterial({
    color, shininess: 220, specular: 0xbbccdd,
    transparent: true, opacity: 0.72,
  });
}

// Tapered wing panel extruded from a planform shape.
// sign=+1 right panel (+X), -1 left. Origin at the root quarter-chord.
// Returns geometry with: x = span, z = chord (aft +), y = thickness.
function wingPanelGeo({ span, cRoot, cTip, sweep = 0, thickness = 0.14, dihedral = 0, sign = 1 }) {
  const s = span;
  const pts = [
    [0, -0.25 * cRoot],
    [s, -0.25 * cTip + sweep],
    [s, 0.75 * cTip + sweep],
    [0, 0.75 * cRoot],
  ];
  const shape = new THREE.Shape();
  const order = sign > 0 ? [0, 1, 2, 3] : [0, 3, 2, 1];
  shape.moveTo(sign * pts[order[0]][0], pts[order[0]][1]);
  for (let i = 1; i < 4; i++) shape.lineTo(sign * pts[order[i]][0], pts[order[i]][1]);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness, bevelEnabled: true, bevelThickness: thickness * 0.25,
    bevelSize: Math.min(0.05, thickness * 0.5), bevelSegments: 1, steps: 1,
  });
  geo.translate(0, 0, -thickness / 2);
  geo.rotateX(Math.PI / 2);                  // shape-Y (chord) -> +Z aft
  geo.rotateZ(sign * dihedral);
  return geo;
}

// Hinged control surface: origin = hinge line, surface extends aft (+Z).
function ctrlSurfaceGeo({ span, chord, thickness = 0.08, sign = 1, taper = 1 }) {
  return wingPanelGeo({ span, cRoot: chord, cTip: chord * taper, thickness, sign, sweep: 0 })
    .translate(0, 0, 0.25 * chord); // hinge at LE
}

function strut(a, b, r, material) {
  const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b);
  const dir = bv.clone().sub(av);
  const len = dir.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), material);
  mesh.position.copy(av).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return mesh;
}

function wheelMesh(radius, width, dark, hub) {
  const g = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 18), dark);
  tire.rotation.z = Math.PI / 2;
  const hubM = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.45, radius * 0.45, width * 1.1, 12), hub);
  hubM.rotation.z = Math.PI / 2;
  g.add(tire, hubM);
  return g;
}

function fuselageLathe(profile, material, segments = 18) {
  // profile: [[radius, zBody], ...] zBody negative = nose
  const pts = profile.map(([r, z]) => new THREE.Vector2(Math.max(r, 0.012), -z));
  pts.sort((a, b) => a.y - b.y);
  const geo = new THREE.LatheGeometry(pts, segments);
  geo.rotateX(-Math.PI / 2); // +Y(profile) -> -Z nose
  return new THREE.Mesh(geo, material);
}

function propAssembly({ blades, radius, spinnerR, spinnerL, spinnerColor, z }) {
  const g = new THREE.Group();
  g.position.set(0, 0, z);
  const dark = phong(0x1b1d20, { shininess: 30 });
  const spinner = new THREE.Mesh(new THREE.CylinderGeometry(spinnerR * 0.35, spinnerR, spinnerL, 12), phong(spinnerColor));
  spinner.rotation.x = -Math.PI / 2;
  spinner.position.z = -spinnerL / 2;
  g.add(spinner);
  const bladeGroup = new THREE.Group();
  for (let i = 0; i < blades; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.085, radius, 0.028), dark);
    blade.position.y = radius / 2 + spinnerR * 0.3;
    blade.rotation.y = 0.32;                       // blade pitch
    const holder = new THREE.Group();
    holder.add(blade);
    holder.rotation.z = (i / blades) * Math.PI * 2;
    bladeGroup.add(holder);
  }
  g.add(bladeGroup);
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(radius + spinnerR * 0.3, 30),
    new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }),
  );
  disc.visible = false;
  g.add(disc);
  return { group: g, blades: bladeGroup, disc };
}

function navLights(group, span, tailZ, tailY) {
  const mk = (color, x, y, z, size = 0.09) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(size, 8, 6),
      new THREE.MeshBasicMaterial({ color }));
    m.position.set(x, y, z);
    group.add(m);
    return m;
  };
  const red = mk(0xff2a1a, -span / 2 + 0.05, 0.02, 0);
  const green = mk(0x21d843, span / 2 - 0.05, 0.02, 0);
  const strobe = mk(0xffffff, 0, tailY, tailZ, 0.07);
  return { red, green, strobe };
}

// ===========================================================================
// CESSNA 172
// ===========================================================================
function buildC172(af) {
  const root = new THREE.Group();
  const C = af.visual;
  const white = phong(C.fuselage);
  const accent = phong(C.accent);
  const wingM = phong(C.wing);
  const dark = phong(0x202326, { shininess: 25 });
  const glass = glassMat();

  // fuselage
  root.add(fuselageLathe([
    [0.34, -4.00], [0.56, -3.50], [0.66, -2.75], [0.70, -1.70],
    [0.72, -0.60], [0.66, 0.30], [0.52, 1.30], [0.34, 2.40],
    [0.18, 3.40], [0.06, 4.05],
  ], white));
  // engine cowl accent
  const cowl = fuselageLathe([[0.35, -3.98], [0.57, -3.45], [0.60, -3.05]], accent);
  cowl.scale.multiplyScalar(1.01);
  root.add(cowl);
  // cabin glass
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.52, 1.85), glass);
  cabin.position.set(0, 0.62, -0.85);
  root.add(cabin);
  const canopy = cabin;
  // accent stripe down the side
  const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 5.6), accent);
  stripeL.position.set(-0.62, 0.05, 0.6);
  const stripeR = stripeL.clone(); stripeR.position.x = 0.62;
  root.add(stripeL, stripeR);

  // high wing
  const wingY = 0.92, wingZ = -0.55;
  const wingR = new THREE.Mesh(wingPanelGeo({ span: af.b / 2, cRoot: 1.65, cTip: 1.15, sweep: 0.10, thickness: 0.16, dihedral: 1.8 * DEG2RAD, sign: 1 }), wingM);
  const wingL = new THREE.Mesh(wingPanelGeo({ span: af.b / 2, cRoot: 1.65, cTip: 1.15, sweep: 0.10, thickness: 0.16, dihedral: 1.8 * DEG2RAD, sign: -1 }), wingM);
  wingR.position.set(0, wingY, wingZ); wingL.position.set(0, wingY, wingZ);
  root.add(wingR, wingL);

  // ailerons (outboard) & flaps (inboard)
  const mkSurf = (sign, spanFrac0, spanFrac1, chord) => {
    const s0 = (af.b / 2) * spanFrac0, s1 = (af.b / 2) * spanFrac1;
    const m = new THREE.Mesh(ctrlSurfaceGeo({ span: s1 - s0, chord, thickness: 0.07, sign }), wingM);
    m.position.x = sign * s0;
    m.rotation.z = sign * 1.8 * DEG2RAD;  // follow wing dihedral
    const g = new THREE.Group();
    g.position.set(0, wingY + Math.sin(1.8 * DEG2RAD) * s0, wingZ + 0.75 * 1.45);
    g.add(m);
    root.add(g);
    return g;
  };
  const flapR = mkSurf(1, 0.12, 0.52, 0.42);
  const flapL = mkSurf(-1, 0.12, 0.52, 0.42);
  const ailR = mkSurf(1, 0.55, 0.95, 0.38);
  const ailL = mkSurf(-1, 0.55, 0.95, 0.38);

  // wing struts
  root.add(strut([0.62, -0.30, -0.75], [2.6, 0.95, -0.65], 0.035, white));
  root.add(strut([-0.62, -0.30, -0.75], [-2.6, 0.95, -0.65], 0.035, white));

  // tail
  const stabR = new THREE.Mesh(wingPanelGeo({ span: 1.70, cRoot: 0.95, cTip: 0.62, sweep: 0.18, thickness: 0.09, sign: 1 }), wingM);
  const stabL = new THREE.Mesh(wingPanelGeo({ span: 1.70, cRoot: 0.95, cTip: 0.62, sweep: 0.18, thickness: 0.09, sign: -1 }), wingM);
  stabR.position.set(0, 0.12, 3.45); stabL.position.set(0, 0.12, 3.45);
  root.add(stabR, stabL);
  const elevGroup = new THREE.Group();
  elevGroup.position.set(0, 0.12, 3.45 + 0.71);
  const elevR = new THREE.Mesh(ctrlSurfaceGeo({ span: 1.70, chord: 0.42, thickness: 0.06, sign: 1, taper: 0.7 }), wingM);
  const elevL = new THREE.Mesh(ctrlSurfaceGeo({ span: 1.70, chord: 0.42, thickness: 0.06, sign: -1, taper: 0.7 }), wingM);
  elevGroup.add(elevR, elevL);
  root.add(elevGroup);

  const finGeo = wingPanelGeo({ span: 1.45, cRoot: 1.45, cTip: 0.72, sweep: 0.72, thickness: 0.09, sign: 1 });
  finGeo.rotateZ(Math.PI / 2); // span -> +Y
  const fin = new THREE.Mesh(finGeo, accent);
  fin.position.set(0, 0.25, 3.45);
  root.add(fin);
  const rudGeo = ctrlSurfaceGeo({ span: 1.5, chord: 0.5, thickness: 0.06, sign: 1, taper: 0.65 });
  rudGeo.rotateZ(Math.PI / 2);
  const rudder = new THREE.Mesh(rudGeo, white);
  const rudderGroup = new THREE.Group();
  rudderGroup.position.set(0, 0.22, 3.45 + 0.78);
  rudderGroup.add(rudder);
  root.add(rudderGroup);

  // fixed tricycle gear
  const tire = phong(0x141518, { shininess: 12 });
  const hub = phong(0xb9c0c7);
  const ng = new THREE.Group();
  ng.add(strut([0, 0.1, 0], [0, -0.95, -0.08], 0.045, dark));
  const nw = wheelMesh(0.20, 0.13, tire, hub);
  nw.position.set(0, -1.02, -0.08);
  ng.add(nw);
  ng.position.set(0, -0.35, -1.55);
  root.add(ng);
  for (const s of [-1, 1]) {
    const mg = new THREE.Group();
    mg.add(strut([0, 0, 0], [s * 1.24, -0.74, 0.06], 0.05, white));
    const mw = wheelMesh(0.23, 0.15, tire, hub);
    mw.position.set(s * 1.28, -0.80, 0.06);
    mg.add(mw);
    mg.position.set(0, -0.35, 0.30);
    root.add(mg);
  }

  const prop = propAssembly({ blades: 2, radius: 0.94, spinnerR: 0.16, spinnerL: 0.42, spinnerColor: C.accent, z: -4.02 });
  root.add(prop.group);

  const lights = navLights(root, af.b, 4.0, 1.55);
  lights.red.position.y = wingY + Math.sin(1.8 * DEG2RAD) * af.b / 2;
  lights.green.position.y = lights.red.position.y;
  lights.red.position.z = wingZ; lights.green.position.z = wingZ;

  return {
    root,
    prop, gearLegs: [],
    aileronL: ailL, aileronR: ailR, flapL, flapR,
    elevator: elevGroup, rudder: rudderGroup,
    abFlame: null, lights, canopy,
  };
}

// ===========================================================================
// P-51D MUSTANG
// ===========================================================================
function buildP51(af) {
  const root = new THREE.Group();
  const C = af.visual;
  const silver = phong(C.fuselage, { shininess: 130, specular: 0x888888 });
  const wingM = phong(C.wing, { shininess: 130, specular: 0x777777 });
  const accent = phong(C.accent);
  const dark = phong(0x17181c, { shininess: 25 });
  const glass = glassMat(0x1d3346);

  root.add(fuselageLathe([
    [0.34, -4.55], [0.52, -3.90], [0.62, -2.80], [0.66, -1.40],
    [0.64, -0.20], [0.58, 0.80], [0.44, 2.20], [0.26, 3.50], [0.10, 4.55],
  ], silver));

  // belly radiator scoop
  const scoop = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.34, 1.9, 12, 1, false), silver);
  scoop.rotation.x = Math.PI / 2;
  scoop.position.set(0, -0.55, 0.85);
  scoop.scale.set(0.85, 1, 0.62);
  root.add(scoop);

  // bubble canopy
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.52, 16, 12), glass);
  canopy.scale.set(0.78, 0.85, 1.85);
  canopy.position.set(0, 0.62, 0.05);
  root.add(canopy);
  // anti-glare panel
  const ag = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 2.6), dark);
  ag.position.set(0, 0.62, -2.6);
  root.add(ag);

  // low wing
  const wingY = -0.42, wingZ = -0.30;
  const wopts = { span: af.b / 2, cRoot: 2.55, cTip: 1.25, sweep: 0.45, thickness: 0.20, dihedral: 5 * DEG2RAD };
  const wingR = new THREE.Mesh(wingPanelGeo({ ...wopts, sign: 1 }), wingM);
  const wingL = new THREE.Mesh(wingPanelGeo({ ...wopts, sign: -1 }), wingM);
  wingR.position.set(0, wingY, wingZ); wingL.position.set(0, wingY, wingZ);
  root.add(wingR, wingL);

  const dihS = Math.sin(5 * DEG2RAD);
  const mkSurf = (sign, f0, f1, chord, zOff) => {
    const s0 = (af.b / 2) * f0, s1 = (af.b / 2) * f1;
    const m = new THREE.Mesh(ctrlSurfaceGeo({ span: s1 - s0, chord, thickness: 0.08, sign, taper: 0.85 }), wingM);
    m.position.x = sign * s0;
    m.rotation.z = sign * 5 * DEG2RAD;   // follow wing dihedral
    const g = new THREE.Group();
    g.position.set(0, wingY + dihS * s0, wingZ + zOff);
    g.add(m);
    root.add(g);
    return g;
  };
  const flapR = mkSurf(1, 0.10, 0.52, 0.55, 1.35);
  const flapL = mkSurf(-1, 0.10, 0.52, 0.55, 1.35);
  const ailR = mkSurf(1, 0.56, 0.94, 0.45, 1.05);
  const ailL = mkSurf(-1, 0.56, 0.94, 0.45, 1.05);

  // tail
  const stabR = new THREE.Mesh(wingPanelGeo({ span: 2.0, cRoot: 1.15, cTip: 0.70, sweep: 0.25, thickness: 0.10, sign: 1 }), wingM);
  const stabL = new THREE.Mesh(wingPanelGeo({ span: 2.0, cRoot: 1.15, cTip: 0.70, sweep: 0.25, thickness: 0.10, sign: -1 }), wingM);
  stabR.position.set(0, 0.30, 3.95); stabL.position.set(0, 0.30, 3.95);
  root.add(stabR, stabL);
  const elevGroup = new THREE.Group();
  elevGroup.position.set(0, 0.30, 3.95 + 0.85);
  elevGroup.add(
    new THREE.Mesh(ctrlSurfaceGeo({ span: 1.95, chord: 0.46, thickness: 0.07, sign: 1, taper: 0.7 }), silver),
    new THREE.Mesh(ctrlSurfaceGeo({ span: 1.95, chord: 0.46, thickness: 0.07, sign: -1, taper: 0.7 }), silver),
  );
  root.add(elevGroup);

  const finGeo = wingPanelGeo({ span: 1.55, cRoot: 1.55, cTip: 0.85, sweep: 0.55, thickness: 0.10, sign: 1 });
  finGeo.rotateZ(Math.PI / 2);
  const fin = new THREE.Mesh(finGeo, silver);
  fin.position.set(0, 0.45, 3.95);
  root.add(fin);
  const rudGeo = ctrlSurfaceGeo({ span: 1.75, chord: 0.55, thickness: 0.07, sign: 1, taper: 0.6 });
  rudGeo.rotateZ(Math.PI / 2);
  const rudderGroup = new THREE.Group();
  rudderGroup.position.set(0, 0.30, 3.95 + 0.92);
  rudderGroup.add(new THREE.Mesh(rudGeo, accent));
  root.add(rudderGroup);

  // retractable mains (rotate outward-up into wing) + tailwheel
  const tire = phong(0x141518, { shininess: 12 });
  const hub = phong(0x9aa1a8);
  const gearLegs = [];
  for (const s of [-1, 1]) {
    const leg = new THREE.Group();
    leg.add(strut([0, 0, 0], [0, -1.42, 0], 0.06, dark));
    const wm = wheelMesh(0.33, 0.22, tire, hub);
    wm.position.set(0, -1.45, 0);
    leg.add(wm);
    leg.position.set(s * 1.85, -0.55, -0.55);
    // rotation axis: fold inboard about Z
    root.add(leg);
    gearLegs.push({ group: leg, axis: 'z', down: 0, up: s * 1.9 });
  }
  const tleg = new THREE.Group();
  tleg.add(strut([0, 0, 0], [0, -0.50, 0.05], 0.04, dark));
  const tw = wheelMesh(0.15, 0.10, tire, hub);
  tw.position.set(0, -0.55, 0.05);
  tleg.add(tw);
  tleg.position.set(0, -0.50, 4.40);
  root.add(tleg);
  gearLegs.push({ group: tleg, axis: 'x', down: 0, up: -1.4 });

  const prop = propAssembly({ blades: 4, radius: 1.62, spinnerR: 0.34, spinnerL: 0.95, spinnerColor: C.accent, z: -4.55 });
  root.add(prop.group);

  const lights = navLights(root, af.b, 4.5, 1.7);
  lights.red.position.y = wingY + dihS * af.b / 2;
  lights.green.position.y = lights.red.position.y;

  return {
    root, prop, gearLegs,
    aileronL: ailL, aileronR: ailR, flapL, flapR,
    elevator: elevGroup, rudder: rudderGroup,
    abFlame: null, lights, canopy,
  };
}

// ===========================================================================
// F-16C VIPER
// ===========================================================================
function buildF16(af) {
  const root = new THREE.Group();
  const C = af.visual;
  const grey = phong(C.fuselage, { shininess: 45 });
  const wingM = phong(C.wing, { shininess: 45 });
  const darkM = phong(C.accent, { shininess: 35 });
  const glass = glassMat(0x3a2f10);
  glass.opacity = 0.66;

  root.add(fuselageLathe([
    [0.06, -7.50], [0.28, -6.60], [0.48, -5.40], [0.62, -3.80],
    [0.72, -1.80], [0.78, 0.50], [0.76, 2.80], [0.66, 5.20],
    [0.52, 6.80], [0.46, 7.30],
  ], grey, 16));

  // canopy
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.60, 16, 12), glass);
  canopy.scale.set(0.72, 0.78, 2.1);
  canopy.position.set(0, 0.66, -4.05);
  root.add(canopy);

  // intake under fuselage
  const intake = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.52, 3.4, 14), darkM);
  intake.rotation.x = Math.PI / 2;
  intake.position.set(0, -0.62, -0.6);
  root.add(intake);
  const intakeLip = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.05, 8, 14), grey);
  intakeLip.position.set(0, -0.62, -2.3);
  root.add(intakeLip);

  // LEX strakes
  for (const s of [-1, 1]) {
    const lexShape = new THREE.Shape();
    lexShape.moveTo(0, 0); lexShape.lineTo(s * 0.95, 3.4); lexShape.lineTo(0, 3.4); lexShape.closePath();
    const lex = new THREE.Mesh(new THREE.ExtrudeGeometry(lexShape, { depth: 0.05, bevelEnabled: false }), wingM);
    lex.geometry.rotateX(Math.PI / 2);
    lex.position.set(s * 0.55, 0.08, -4.6);
    root.add(lex);
  }

  // wing (cropped delta), mounted mid-aft
  const wingZ = 1.45;
  const wopts = { span: af.b / 2 - 0.6, cRoot: 4.6, cTip: 1.05, sweep: 1.85, thickness: 0.16, dihedral: 0 };
  const wingR = new THREE.Mesh(wingPanelGeo({ ...wopts, sign: 1 }), wingM);
  const wingL = new THREE.Mesh(wingPanelGeo({ ...wopts, sign: -1 }), wingM);
  wingR.position.set(0.6, -0.05, wingZ); wingL.position.set(-0.6, -0.05, wingZ);
  root.add(wingR, wingL);
  // wingtip missile rails
  for (const s of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.10, 2.4), darkM);
    rail.position.set(s * (af.b / 2 - 0.05), -0.05, wingZ + 1.4);
    root.add(rail);
    const msl = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 2.9, 8), phong(0xdfe3e8));
    msl.rotation.x = Math.PI / 2;
    msl.position.set(s * (af.b / 2 - 0.05), -0.16, wingZ + 1.2);
    const fins = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.02, 0.3), phong(0xdfe3e8));
    fins.position.copy(msl.position); fins.position.z += 1.2;
    root.add(msl, fins);
  }

  // flaperons (act as both flaps and ailerons)
  const mkSurf = (sign) => {
    const m = new THREE.Mesh(ctrlSurfaceGeo({ span: 2.5, chord: 0.55, thickness: 0.08, sign, taper: 0.8 }), wingM);
    m.position.x = sign * 0.9;
    const g = new THREE.Group();
    g.position.set(0, -0.05, wingZ + 2.45);
    g.add(m);
    root.add(g);
    return g;
  };
  const ailR = mkSurf(1), ailL = mkSurf(-1);

  // all-moving stabilators
  const stabGroup = new THREE.Group();
  stabGroup.position.set(0, -0.12, 6.35);
  const sopts = { span: 2.6, cRoot: 2.1, cTip: 0.85, sweep: 1.05, thickness: 0.10 };
  const stR = new THREE.Mesh(wingPanelGeo({ ...sopts, sign: 1 }), wingM);
  const stL = new THREE.Mesh(wingPanelGeo({ ...sopts, sign: -1 }), wingM);
  stR.position.x = 0.4; stL.position.x = -0.4;
  stabGroup.add(stR, stL);
  root.add(stabGroup);

  // fin + rudder
  const finGeo = wingPanelGeo({ span: 2.65, cRoot: 2.6, cTip: 0.95, sweep: 1.55, thickness: 0.11, sign: 1 });
  finGeo.rotateZ(Math.PI / 2);
  const fin = new THREE.Mesh(finGeo, wingM);
  fin.position.set(0, 0.55, 5.05);
  root.add(fin);
  const rudGeo = ctrlSurfaceGeo({ span: 1.5, chord: 0.55, thickness: 0.07, sign: 1, taper: 0.7 });
  rudGeo.rotateZ(Math.PI / 2);
  const rudderGroup = new THREE.Group();
  rudderGroup.position.set(0, 1.45, 5.05 + 1.45);
  rudderGroup.add(new THREE.Mesh(rudGeo, wingM));
  root.add(rudderGroup);
  // ventral fins
  for (const s of [-1, 1]) {
    const vf = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.55, 1.5), wingM);
    vf.position.set(s * 0.55, -0.85, 4.4);
    vf.rotation.z = s * 0.5;
    root.add(vf);
  }

  // nozzle + afterburner
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.38, 0.9, 14, 1, true), darkM);
  nozzle.rotation.x = Math.PI / 2;
  nozzle.position.set(0, 0, 7.6);
  root.add(nozzle);
  const abFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.34, 3.6, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xff8c2a, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  abFlame.rotation.x = -Math.PI / 2;
  abFlame.position.set(0, 0, 9.5);
  abFlame.visible = false;
  root.add(abFlame);
  const abCore = new THREE.Mesh(
    new THREE.ConeGeometry(0.2, 2.2, 10, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  abCore.rotation.x = -Math.PI / 2;
  abCore.position.set(0, 0, 8.8);
  abCore.visible = false;
  root.add(abCore);

  // retractable tricycle gear
  const tire = phong(0x141518, { shininess: 12 });
  const hub = phong(0x9aa1a8);
  const gearLegs = [];
  const ng = new THREE.Group();
  ng.add(strut([0, 0, 0], [0, -1.55, -0.1], 0.06, grey));
  const nw = wheelMesh(0.26, 0.14, tire, hub);
  nw.position.set(0, -1.60, -0.1);
  ng.add(nw);
  ng.position.set(0, -0.25, -3.05);
  root.add(ng);
  gearLegs.push({ group: ng, axis: 'x', down: 0, up: 1.65 });
  for (const s of [-1, 1]) {
    const leg = new THREE.Group();
    leg.add(strut([0, 0, 0], [s * 0.55, -1.45, 0], 0.07, grey));
    const wm = wheelMesh(0.34, 0.24, tire, hub);
    wm.position.set(s * 0.58, -1.52, 0);
    leg.add(wm);
    leg.position.set(s * 0.62, -0.32, 0.85);
    root.add(leg);
    gearLegs.push({ group: leg, axis: 'z', down: 0, up: s * -1.7 });
  }

  const lights = navLights(root, af.b, 7.2, 2.9);
  lights.red.position.set(-af.b / 2 + 0.1, 0, wingZ + 0.6);
  lights.green.position.set(af.b / 2 - 0.1, 0, wingZ + 0.6);

  return {
    root, prop: null, gearLegs,
    aileronL: ailL, aileronR: ailR, flapL: null, flapR: null,
    elevator: stabGroup, rudder: rudderGroup,
    abFlame, abCore, lights, canopy,
  };
}

// ===========================================================================
const BUILDERS = { c172: buildC172, p51: buildP51, f16: buildF16 };

export function buildAircraft(af) {
  const vis = BUILDERS[af.visual.builder](af);
  vis.root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = false;
    }
  });
  vis.af = af;
  vis.propAngle = 0;
  vis.time = 0;
  return vis;
}

// Per-frame visual update from flight model state.
export function updateAircraft(vis, fm, dt) {
  const out = fm.out, ctrl = out.ctrl;
  vis.time += dt;

  const ailDef = 0.38, elevDef = 0.42, rudDef = 0.45;
  if (vis.aileronR) vis.aileronR.rotation.x = -ctrl.ail * ailDef;
  if (vis.aileronL) vis.aileronL.rotation.x = ctrl.ail * ailDef;
  if (vis.elevator) vis.elevator.rotation.x = -ctrl.elev * elevDef;
  if (vis.rudder) vis.rudder.rotation.y = ctrl.rud * rudDef;
  const flapRad = (out.flapDeg || 0) * DEG2RAD;
  if (vis.flapL) { vis.flapL.rotation.x = flapRad; vis.flapR.rotation.x = flapRad; }
  else if (vis.aileronL && fm.af.id === 'f16') {
    // flaperons: superimpose flap droop on aileron deflection
    vis.aileronR.rotation.x += flapRad * 0.6;
    vis.aileronL.rotation.x += flapRad * 0.6;
  }

  if (vis.prop) {
    const rps = out.rpm / 60;
    vis.propAngle += rps * Math.PI * 2 * dt;
    vis.prop.blades.rotation.z = vis.propAngle;
    const blur = out.rpm > 1050;
    vis.prop.disc.visible = blur;
    vis.prop.blades.visible = !blur;
    vis.prop.disc.material.opacity = blur ? 0.08 + 0.05 * Math.min((out.rpm - 1050) / 1500, 1) : 0;
  }

  for (const leg of vis.gearLegs) {
    const a = lerp(leg.up, leg.down, out.gearPos);
    leg.group.rotation[leg.axis] = a;
    leg.group.visible = out.gearPos > 0.04;
  }

  if (vis.abFlame) {
    const ab = fm.inputs.afterburner && out.powerFrac > 1.05;
    vis.abFlame.visible = ab;
    vis.abCore.visible = ab;
    if (ab) {
      const pulse = 0.9 + 0.18 * Math.sin(vis.time * 53) + 0.08 * Math.sin(vis.time * 31);
      vis.abFlame.scale.set(pulse, 0.8 + 0.45 * (out.powerFrac - 1), pulse);
      vis.abCore.scale.copy(vis.abFlame.scale);
    }
  }

  // strobe blink
  if (vis.lights) {
    const t = vis.time % 1.4;
    vis.lights.strobe.visible = t < 0.06 || (t > 0.12 && t < 0.18);
  }
}
