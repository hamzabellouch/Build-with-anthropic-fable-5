"use client";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { sim } from "@/lib/game/sim";
import { audio } from "@/lib/game/audio";
import { useGame, syncStore } from "@/lib/game/store";

/** Input wiring + fixed game loop. Runs the simulation before anything renders. */
export function GameLoop() {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const ndc = useRef({ x: 0, y: 0 });
  const pointerHeld = useRef(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) e.preventDefault();
      sim.keys.add(key);
      const g = useGame.getState();
      if (key === "p" || key === "escape") {
        if (g.phase === "playing") g.pause();
        else if (g.phase === "paused") g.resume();
      } else if (key === "m") {
        g.toggleMute();
      } else if (key === "enter") {
        if (g.phase === "menu") g.start();
        else if (g.phase === "gameover") g.restart();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => sim.keys.delete(e.key.toLowerCase());
    const onBlur = () => {
      sim.keys.clear();
      pointerHeld.current = false;
      useGame.getState().pause();
    };
    const onVis = () => { if (document.hidden) onBlur(); };

    const el = gl.domElement;
    const onPointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      ndc.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    const onPointerDown = (e: PointerEvent) => { if (e.button === 0) pointerHeld.current = true; };
    const onPointerUp = (e: PointerEvent) => { if (e.button === 0) pointerHeld.current = false; };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVis);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVis);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [gl]);

  const rayDir = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const phase = useGame.getState().phase;
    if (phase !== "playing") return;

    if (!sim.autopilot) {
      // project cursor onto the y=0 gameplay plane
      const dir = rayDir.current;
      dir.set(ndc.current.x, ndc.current.y, 0.5).unproject(camera).sub(camera.position).normalize();
      if (dir.y < -0.05) {
        const t = -camera.position.y / dir.y;
        sim.aimPx = camera.position.x + dir.x * t;
        sim.aimPz = camera.position.z + dir.z * t;
      }
      sim.firing = pointerHeld.current || sim.keys.has(" ");
    }
    sim.update(Math.min(delta, 0.05));
    syncStore();

    for (const ev of sim.events) {
      audio.handleEvent(ev.type, ev.mag);
      if (ev.type === "over") useGame.getState().gameOver();
    }
    sim.events.length = 0;
  }, -100);

  return null;
}

/** Camera: slow orbit in menus, smooth chase + screen shake in game. */
export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const pos = useRef(new THREE.Vector3(0, 22, 34));
  const tgt = useRef(new THREE.Vector3(0, 0, 0));
  const desired = useRef(new THREE.Vector3());

  useFrame(({ clock }, delta) => {
    const phase = useGame.getState().phase;
    const t = clock.elapsedTime;
    const k = 1 - Math.exp(-4.5 * Math.min(delta, 0.1));

    if (phase === "menu" || phase === "gameover") {
      desired.current.set(Math.sin(t * 0.07) * 33, 19, Math.cos(t * 0.07) * 33);
      pos.current.lerp(desired.current, k * 0.6);
      tgt.current.lerp(new THREE.Vector3(0, 0.5, 0), k);
    } else {
      desired.current.set(sim.px, 23, sim.pz + 12.5);
      pos.current.lerp(desired.current, k * 1.6);
      tgt.current.lerp(new THREE.Vector3(sim.px, 0.6, sim.pz), k * 1.8);
    }

    const sh = phase === "playing" ? sim.trauma * sim.trauma : 0;
    camera.position.set(
      pos.current.x + (Math.random() * 2 - 1) * sh * 0.9,
      pos.current.y + (Math.random() * 2 - 1) * sh * 0.5,
      pos.current.z + (Math.random() * 2 - 1) * sh * 0.9
    );
    camera.lookAt(tgt.current);
  });

  return null;
}
