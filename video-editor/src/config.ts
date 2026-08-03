import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDotEnv } from './util.ts';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
loadDotEnv(ROOT);

const env = (name: string, def: string): string => process.env[name]?.trim() || def;
const expandHome = (p: string): string => (p.startsWith('~/') ? path.join(os.homedir(), p.slice(2)) : p);
const envNum = (name: string, def: number): number => {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v >= 0 ? v : def;
};

export const CONFIG = {
  root: ROOT,
  projectsDir: path.join(ROOT, 'projects'),
  webDir: path.join(ROOT, 'web'),

  sonioxApiKey: process.env.SONIOX_API_KEY ?? '',
  openrouterApiKey: process.env.OPENROUTER_API_KEY ?? '',

  // The user asked for Soniox "stt-v3"; the async variant is stt-async-v3.
  // stt-async-v4 also exists — switch via SONIOX_MODEL in .env.
  sonioxModel: env('SONIOX_MODEL', 'stt-async-v3'),
  languageHints: env('LANGUAGE_HINTS', 'ar,en')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  // Three model roles, all through OpenRouter (verified live 2026-06-10):
  //  - edit  (OpenAI text): bad-take detection, Arabic intro copy
  //  - video (Google, video-native): watches actual clips of stale stretches
  //  - image (OpenAI gpt-image-2): backdrop / card illustrations
  editModel: env('EDIT_MODEL', 'openai/gpt-5-mini'),
  videoModel: env('VIDEO_MODEL', process.env.VISION_MODEL?.trim() || 'google/gemini-3.5-flash'),
  imageModel: env('IMAGE_MODEL', 'openai/gpt-5.4-image-2'),
  textFallbacks: ['openai/gpt-5-mini', 'openai/gpt-5.4-mini', 'google/gemini-3.5-flash'],
  // only models with native video input belong here
  videoFallbacks: ['google/gemini-3.5-flash', 'google/gemini-3.1-flash-lite'],
  imageFallbacks: ['openai/gpt-5.4-image-2', 'openai/gpt-5-image-mini', 'google/gemini-3.1-flash-image-preview'],

  /** max AI-generated illustrations per video (intro backdrop + cards). 0 disables. */
  maxImages: envNum('MAX_IMAGES', 3),
  /** auto-place a subscribe card near the end of longer videos */
  subscribeCard: env('SUBSCRIBE_CARD', '1') !== '0',
  /** channel name used on the subscribe card ('' = generic wording) */
  channelName: env('CHANNEL_NAME', ''),
  /** where the Qomra (itf Qomra Arabic) .ttf files live */
  fontDir: expandHome(env('FONT_DIR', path.join(os.homedir(), '.local/share/fonts'))),

  mock: process.env.MOCK === '1',
  port: envNum('PORT', 4321),

  // --- editing policy (tunable via env, defaults documented in ASSUMPTIONS.md) ---
  /** a speech gap longer than this is considered dead air worth cutting */
  minSilenceGap: envNum('MIN_SILENCE_GAP', 0.9),
  /** breathing room kept after the previous word when cutting a gap */
  keepAfterSpeech: 0.2,
  /** breathing room kept before the next word when cutting a gap */
  keepBeforeSpeech: 0.15,
  /** keep-segments shorter than this get absorbed into the surrounding cut */
  minKeepSegment: 0.35,
  /** how long the screen must stay visually static to count as "stale" */
  staleMinSeconds: envNum('STALE_MIN_SECONDS', 18),
  /** max ffmpeg scene-change score within a stale window */
  staleScoreMax: 0.08,
  /** fps at which scene scores are sampled */
  sceneFps: 2,
  /** max number of concept graphics (excluding the intro) */
  maxGraphics: envNum('MAX_GRAPHICS', 5),
  /** minimum spacing between concept graphics on the output timeline */
  graphicSpacing: 25,
  introSeconds: envNum('INTRO_SECONDS', 5),
  /** silencedetect settings (fallback when transcript is empty) */
  silenceNoiseDb: -35,
  silenceMinDur: 0.45,

  // --- video clips sent to the video-native model ---
  clipMaxSeconds: envNum('CLIP_MAX_SECONDS', 20),
  clipWidth: 640,
  clipFps: 8,
};

export function requireKeys(needSoniox: boolean, needOpenrouter: boolean): void {
  if (CONFIG.mock) return;
  const missing: string[] = [];
  if (needSoniox && !CONFIG.sonioxApiKey) missing.push('SONIOX_API_KEY');
  if (needOpenrouter && !CONFIG.openrouterApiKey) missing.push('OPENROUTER_API_KEY');
  if (missing.length) {
    throw new Error(
      `missing ${missing.join(', ')} in ${path.join(ROOT, '.env')} — copy .env.example, or run with MOCK=1 / --mock`,
    );
  }
}
