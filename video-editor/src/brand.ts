import fs from 'node:fs';
import path from 'node:path';
import { CONFIG } from './config.ts';
import { logWarn, run } from './util.ts';

/**
 * Hani's brand kit. Colors are taken verbatim from the Hyprland/waybar theme
 * (~/.config/waybar/colors.css, ~/.config/hypr/ui.conf) so the graphics match
 * the rest of the desktop. The AI never invents colors — everything renders
 * from this fixed palette, which is what keeps videos visually consistent.
 */
export const PALETTE = {
  bg: '#141929', //          waybar @background
  panel: 'rgba(20,25,41,0.92)',
  panelStroke: 'rgba(255,255,255,0.10)',
  text: '#E0E4EC', //        waybar @foreground
  text2: '#C8CCD4', //       light gray
  red: '#E8364F', //         primary accent (hypr active border stop 1)
  redBright: '#FF4D63',
  orange: '#F28A2E', //      secondary accent (hypr active border stop 2)
  orangeBright: '#FFAA44',
  yellow: '#F9C846', //      highlight element
  yellowBright: '#FFD866',
  dark: '#2A2E3D',
  gray: '#4A4E5D',
};

// ---------------------------------------------------------------------------
// Qomra font (itf Qomra Arabic) from ~/.local/share/fonts
// ---------------------------------------------------------------------------
export const QOMRA_FAMILY = 'itf Qomra Arabic';

let cachedFiles: string[] | null = null;
/** All itfQomraArabic-*.ttf files found in CONFIG.fontDir ('' when absent). */
export function qomraFontFiles(): string[] {
  if (cachedFiles) return cachedFiles;
  try {
    cachedFiles = fs
      .readdirSync(CONFIG.fontDir)
      .filter((f) => /^itfQomraArabic-.*\.ttf$/i.test(f))
      .map((f) => path.join(CONFIG.fontDir, f));
  } catch {
    cachedFiles = [];
  }
  if (cachedFiles.length === 0) {
    logWarn(`Qomra font not found in ${CONFIG.fontDir} — falling back to system sans (set FONT_DIR in .env)`);
  }
  return cachedFiles;
}

let cachedFallback: string | null = null;
async function systemSans(): Promise<string> {
  if (cachedFallback) return cachedFallback;
  try {
    const { stdout } = await run('fc-match', ['-f', '%{family}', 'sans-serif'], { allowFail: true });
    cachedFallback = stdout.split(',')[0].trim() || 'DejaVu Sans';
  } catch {
    cachedFallback = 'Arial';
  }
  return cachedFallback;
}

export interface FontSetup {
  family: string;
  resvg: { loadSystemFonts: boolean; fontFiles?: string[]; defaultFontFamily: string };
}

/** Font setup for resvg: explicit Qomra files when present, system sans otherwise. */
export async function fontSetup(): Promise<FontSetup> {
  const files = qomraFontFiles();
  if (files.length > 0) {
    return {
      family: QOMRA_FAMILY,
      resvg: { loadSystemFonts: false, fontFiles: files, defaultFontFamily: QOMRA_FAMILY },
    };
  }
  const fam = await systemSans();
  return { family: fam, resvg: { loadSystemFonts: true, defaultFontFamily: fam } };
}
