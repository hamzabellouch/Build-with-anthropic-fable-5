"use client";

import { useEffect, useRef, useState } from "react";
import { FluidSim } from "@/lib/fluid/sim";
import { FluidRenderer } from "@/lib/fluid/renderer";

const SPAWN_PER_TICK = 7;
const POUR_RADIUS = 8;
const POUR_SPEED = 260; // initial downward velocity, px/s

// Each press pours the next color. Stored linearized for correct blending.
const PALETTE = [
  "#3ec5ff", // sky
  "#ff5fa2", // pink
  "#b18cff", // violet
  "#3ee6a8", // mint
  "#ffc24b", // amber
  "#ff7a59", // coral
  "#8df06e", // lime
  "#5e8bff", // blue
].map(hexToLinear);

type Pointer = {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  color: [number, number, number];
};

export default function FluidSimulation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [poured, setPoured] = useState(false);
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: FluidRenderer;
    try {
      renderer = new FluidRenderer(canvas);
    } catch {
      setUnsupported(true);
      return;
    }

    const sim = new FluidSim();
    const pointers = new Map<number, Pointer>();
    let colorCursor = 0;

    const fit = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      sim.resize(w, h);
      renderer.resize(w, h, dpr);
    };
    fit();

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      pointers.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
        prevX: e.clientX,
        prevY: e.clientY,
        color: PALETTE[colorCursor++ % PALETTE.length],
      });
      setPoured(true);
    };
    const onMove = (e: PointerEvent) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      p.x = e.clientX;
      p.y = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
    };
    const stopAll = () => {
      pointers.clear();
    };

    const pour = () => {
      for (const p of pointers.values()) {
        // Carry some of the pointer's drag velocity into the stream.
        const throwX = (p.x - p.prevX) * 60 * 0.4;
        const throwY = (p.y - p.prevY) * 60 * 0.4;
        for (let s = 0; s < SPAWN_PER_TICK; s++) {
          const a = Math.random() * Math.PI * 2;
          const r = Math.sqrt(Math.random()) * POUR_RADIUS;
          sim.spawn(
            p.x + Math.cos(a) * r,
            p.y + Math.sin(a) * r,
            throwX + (Math.random() - 0.5) * 60,
            POUR_SPEED + throwY + (Math.random() - 0.5) * 80,
            p.color[0],
            p.color[1],
            p.color[2],
          );
        }
        p.prevX = p.x;
        p.prevY = p.y;
      }
    };

    const STEP_MS = 1000 / 60;
    let last = performance.now();
    let acc = 0;
    let raf = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      acc += Math.min(now - last, 50); // clamp pauses; degrade to slow-motion
      last = now;
      let steps = 0;
      while (acc >= STEP_MS && steps < 3) {
        pour();
        sim.step();
        acc -= STEP_MS;
        steps++;
      }
      if (acc >= STEP_MS) acc = 0;
      renderer.render(sim);
    };
    raf = requestAnimationFrame(frame);

    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("blur", stopAll);
    window.addEventListener("resize", fit);
    const onCtx = (e: Event) => e.preventDefault();
    canvas.addEventListener("contextmenu", onCtx);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("blur", stopAll);
      window.removeEventListener("resize", fit);
      canvas.removeEventListener("contextmenu", onCtx);
      renderer.dispose();
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="fluid-canvas" />
      {unsupported ? (
        <div className="hint">this experiment needs webgl2</div>
      ) : (
        <div className={poured ? "hint hint-gone" : "hint"}>press and drag to pour</div>
      )}
    </>
  );
}

function hexToLinear(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  const lin = (c: number) => Math.pow(c / 255, 2.2);
  return [lin((v >> 16) & 255), lin((v >> 8) & 255), lin(v & 255)];
}
