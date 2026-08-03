"use client";
import { Canvas } from "@react-three/fiber";
import { Arena } from "./Arena";
import { PlayerMesh } from "./PlayerMesh";
import { Enemies, Bullets, EnemyBullets, Pickups, Particles, Shockwaves } from "./Swarms";
import { Effects } from "./Effects";
import { GameLoop, CameraRig } from "./systems";

export default function GameCanvas() {
  return (
    <div className="fixed inset-0 cursor-crosshair">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 22, 34], fov: 55, near: 0.5, far: 320 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#04040d"]} />
        <fog attach="fog" args={["#04040d", 48, 130]} />
        <Arena />
        <PlayerMesh />
        <Enemies />
        <Bullets />
        <EnemyBullets />
        <Pickups />
        <Particles />
        <Shockwaves />
        <CameraRig />
        <GameLoop />
        <Effects />
      </Canvas>
    </div>
  );
}
