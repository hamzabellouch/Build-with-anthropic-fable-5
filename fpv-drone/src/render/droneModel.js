// Procedural 5"-class quad model: carbon plates, arms, motors, battery,
// canted FPV cam pod, prop discs that blur with RPM. Geometry follows the
// physics config (arm positions/prop diameter) so the visual matches the
// collision and force model.

import * as THREE from 'three';

export function buildDrone(cfg) {
  const g = new THREE.Group();
  const carbon = new THREE.MeshLambertMaterial({ color: 0x16181c });
  const accent = new THREE.MeshLambertMaterial({ color: 0xff7300 });
  const metal = new THREE.MeshLambertMaterial({ color: 0x9aa2ac });

  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.028, 0.14), carbon);
  plate.castShadow = true;
  g.add(plate);

  const batt = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.038, 0.115), accent);
  batt.position.y = 0.036;
  batt.castShadow = true;
  g.add(batt);

  // FPV cam pod, canted up by the configured tilt.
  const cam = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.03), carbon);
  cam.position.set(0, 0.012, -0.075);
  cam.rotation.x = -(cfg.cam.tiltDeg * Math.PI / 180);
  g.add(cam);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.0095, 0.0095, 0.012, 10), metal);
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, 0, -0.017);
  cam.add(lens);

  // Rear "LED strip" for line-of-sight orientation.
  const led = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.008, 0.006),
    new THREE.MeshBasicMaterial({ color: 0x00ff66 })
  );
  led.position.set(0, 0.006, 0.072);
  g.add(led);

  // Arms + motors + props at the physics motor positions.
  const propR = cfg.prop.D / 2;
  const props = [];
  for (const m of cfg.motors) {
    const [x, y, z] = m.pos;
    const len = Math.hypot(x, z);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.012, len + 0.02), carbon);
    arm.position.set(x / 2, 0, z / 2);
    arm.rotation.y = Math.atan2(-x, -z) + Math.PI;
    arm.castShadow = true;
    g.add(arm);

    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.0135, 0.0145, 0.018, 12), metal);
    motor.position.set(x, y - 0.008, z);
    motor.castShadow = true;
    g.add(motor);

    // Slow prop: visible blades; fast prop: translucent blur disc.
    const bladeGrp = new THREE.Group();
    bladeGrp.position.set(x, y, z);
    const bladeMat = new THREE.MeshLambertMaterial({ color: 0xff9a3d, side: THREE.DoubleSide });
    for (let b = 0; b < cfg.prop.blades; b++) {
      const blade = new THREE.Mesh(new THREE.PlaneGeometry(propR * 0.92, 0.016), bladeMat);
      blade.position.x = 0;
      blade.rotation.y = (b / cfg.prop.blades) * Math.PI * 2;
      blade.rotation.z = 0.0;
      blade.translateX(propR * 0.46);
      blade.rotation.x = -Math.PI / 2 + 0.18;
      bladeGrp.add(blade);
    }
    g.add(bladeGrp);

    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(propR, 24),
      new THREE.MeshBasicMaterial({ color: 0xffaa55, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(x, y + 0.002, z);
    g.add(disc);
    props.push({ bladeGrp, disc, spin: m.spin });
  }

  return {
    group: g,
    // Call each frame with per-motor angular speed (rad/s).
    updateProps(motorW, dt) {
      for (let i = 0; i < props.length; i++) {
        const p = props[i], w = motorW[i];
        p.bladeGrp.rotation.y += p.spin * w * dt;
        const fast = Math.min(w / 900, 1);
        p.bladeGrp.visible = fast < 0.9;
        p.disc.visible = fast > 0.25;
        p.disc.material.opacity = 0.05 + fast * 0.13;
      }
    },
  };
}
