"use client";
import { create } from "zustand";
import { sim } from "./sim";
import { audio } from "./audio";

export type Phase = "menu" | "playing" | "paused" | "gameover";

const BEST_KEY = "neonvoid_best";

interface GameState {
  phase: Phase;
  score: number;
  best: number;
  newBest: boolean;
  wave: number;
  hp: number;
  maxHp: number;
  mult: number;
  kills: number;
  time: number;
  shards: number;
  shardsNeed: number;
  weaponLvl: number;
  dashCd: number;
  triple: number;
  rapid: number;
  shield: number;
  intermission: number;
  muted: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  quitToMenu: () => void;
  gameOver: () => void;
  toggleMute: () => void;
  loadPersisted: () => void;
}

export const useGame = create<GameState>((set, get) => ({
  phase: "menu",
  score: 0,
  best: 0,
  newBest: false,
  wave: 0,
  hp: 100,
  maxHp: 100,
  mult: 1,
  kills: 0,
  time: 0,
  shards: 0,
  shardsNeed: 40,
  weaponLvl: 1,
  dashCd: 0,
  triple: 0,
  rapid: 0,
  shield: 0,
  intermission: 0,
  muted: false,

  start: () => {
    sim.reset();
    audio.init();
    audio.startMusic();
    set({ phase: "playing", newBest: false });
  },
  pause: () => {
    if (get().phase === "playing") set({ phase: "paused" });
  },
  resume: () => {
    if (get().phase === "paused") set({ phase: "playing" });
  },
  restart: () => {
    sim.reset();
    set({ phase: "playing", newBest: false });
  },
  quitToMenu: () => {
    sim.reset();
    audio.stopMusic();
    set({ phase: "menu" });
  },
  gameOver: () => {
    const { score, best } = get();
    const newBest = score > best;
    if (newBest) {
      try { localStorage.setItem(BEST_KEY, String(score)); } catch {}
    }
    set({ phase: "gameover", best: Math.max(best, score), newBest });
  },
  toggleMute: () => {
    const muted = !get().muted;
    audio.setMuted(muted);
    try { localStorage.setItem("neonvoid_muted", muted ? "1" : "0"); } catch {}
    set({ muted });
  },
  loadPersisted: () => {
    try {
      const best = parseInt(localStorage.getItem(BEST_KEY) ?? "0", 10) || 0;
      const muted = localStorage.getItem("neonvoid_muted") === "1";
      audio.muted = muted;
      set({ best, muted });
    } catch {}
  },
}));

// Called every frame from the game loop; zustand selectors bail on
// unchanged values so HUD components only re-render when numbers move.
export function syncStore() {
  useGame.setState({
    score: sim.score,
    wave: sim.wave,
    hp: Math.ceil(sim.hp),
    maxHp: sim.maxHp,
    mult: sim.mult,
    kills: sim.kills,
    time: sim.time,
    shards: sim.shards,
    shardsNeed: sim.shardsNeeded(),
    weaponLvl: sim.weaponLvl,
    dashCd: sim.dashCd,
    triple: sim.triple,
    rapid: sim.rapid,
    shield: sim.shield,
    intermission: sim.intermission,
  });
}
