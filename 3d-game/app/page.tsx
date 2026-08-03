"use client";
import dynamic from "next/dynamic";
import { HUD } from "@/components/ui/HUD";
import { Menus } from "@/components/ui/Menus";

const GameCanvas = dynamic(() => import("@/components/game/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-[#04040d] font-mono text-xs tracking-[0.5em] text-cyan-200/60">
      INITIALIZING VOID…
    </div>
  ),
});

export default function Home() {
  return (
    <main className="h-dvh w-screen overflow-hidden bg-[#04040d]">
      <GameCanvas />
      {/* subtle CRT scanlines */}
      <div className="scanlines pointer-events-none fixed inset-0" />
      <HUD />
      <Menus />
    </main>
  );
}
