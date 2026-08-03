import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import { fontSetup, PALETTE as P } from './brand.ts';
import type { ConceptSpec, ElementKind, IntroSpec, LayerAnim, RegionTarget } from './types.ts';
import { clamp } from './util.ts';

/**
 * Preconfigured design elements — RTL-first, Arabic copy, Qomra type, fixed
 * brand palette. The model never draws; it only fills in short Arabic text and
 * (for arrow/highlight) a normalized target region. Everything else is
 * deterministic, which is what keeps the designs consistent video to video.
 */

// ---------------------------------------------------------------------------
// text helpers (SVG has no auto-wrap; estimate width per character class)
// ---------------------------------------------------------------------------
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const AR_DIACRITIC = /[\u064B-\u065F\u0670\u0640]/; // harakat + tatweel
const ARABIC = /[\u0600-\u06FF\u0750-\u077F]/;

/** Estimated advance width of one char relative to font-size (calibrated on Qomra). */
function charW(ch: string): number {
  if (AR_DIACRITIC.test(ch)) return 0.08;
  if (/[\u0660-\u0669]/.test(ch)) return 0.5; // arabic-indic digits
  if (ARABIC.test(ch)) return 0.44;
  if (ch === ' ') return 0.28;
  if (/[0-9]/.test(ch)) return 0.55;
  if (/[A-Z]/.test(ch)) return 0.62;
  if (/[a-z]/.test(ch)) return 0.52;
  return 0.55;
}

export function estW(text: string, fs: number, bold = false): number {
  let w = 0;
  for (const ch of text) w += charW(ch);
  return w * fs * (bold ? 1.06 : 1);
}

function wrap(text: string, maxWpx: number, fs: number, maxLines: number, bold = false): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const cand = cur ? `${cur} ${w}` : w;
    if (estW(cand, fs, bold) <= maxWpx || !cur) cur = cand;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const cut = lines.slice(0, maxLines);
    cut[maxLines - 1] = `${cut[maxLines - 1]}…`;
    return cut;
  }
  return lines;
}

/** RTL text element. Never uses letter-spacing (it would disconnect Arabic glyphs). */
function txt(
  x: number,
  y: number,
  s: string,
  fs: number,
  color: string,
  font: string,
  opts: { weight?: number; anchor?: 'start' | 'middle' | 'end' } = {},
): string {
  const anchor = opts.anchor ?? 'end';
  return `<text x="${x}" y="${y}" direction="rtl" font-family="${esc(font)}" font-size="${fs}" fill="${color}"${
    opts.weight && opts.weight !== 400 ? ` font-weight="${opts.weight}"` : ''
  } text-anchor="${anchor}">${esc(s)}</text>`;
}

// ---------------------------------------------------------------------------
// shared svg bits
// ---------------------------------------------------------------------------
function svgDoc(W: number, H: number, body: string, defs = ''): string {
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <filter id="ds" x="-30%" y="-30%" width="160%" height="160%">
    <feDropShadow dx="0" dy="5" stdDeviation="12" flood-color="#000000" flood-opacity="0.45"/>
  </filter>
  <linearGradient id="acc" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${P.red}"/>
    <stop offset="1" stop-color="${P.orange}"/>
  </linearGradient>
${defs}
</defs>
${body}
</svg>`;
}

function panelRect(x: number, y: number, w: number, h: number, rx: number): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${P.panel}" stroke="${P.panelStroke}" stroke-width="1.5"/>`;
}

/** Vertical accent bar on the RIGHT edge of a panel (RTL reading starts there). */
function accentBar(x: number, y: number, w: number, h: number, barW: number): string {
  const inset = barW * 1.6; // keep clear of the panel's rounded corners
  return `<rect x="${x + w - barW}" y="${y + inset}" width="${barW}" height="${h - inset * 2}" rx="${barW / 2}" fill="url(#acc)"/>`;
}

function pngDataUrl(file: string): string {
  return `data:image/png;base64,${fs.readFileSync(file).toString('base64')}`;
}

// ---------------------------------------------------------------------------
// intro — 3 full-frame layers (backdrop+veil, deco, title), animated separately
// ---------------------------------------------------------------------------
export function introBackdropSvg(spec: IntroSpec, W: number, H: number): string {
  let art: string;
  if (spec.backdropFile && fs.existsSync(spec.backdropFile)) {
    art = `<image href="${pngDataUrl(spec.backdropFile)}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>
<rect width="${W}" height="${H}" fill="${P.bg}" opacity="0.45"/>`;
  } else {
    art = `<circle cx="${W * 0.85}" cy="${H * 0.15}" r="${H * 0.55}" fill="${P.red}" opacity="0.10"/>
<circle cx="${W * 0.12}" cy="${H * 0.92}" r="${H * 0.5}" fill="${P.orange}" opacity="0.07"/>`;
  }
  const body = `
<rect width="${W}" height="${H}" fill="${P.bg}"/>
${art}
<rect width="${W}" height="${H}" fill="url(#veil)"/>`;
  const defs = `  <linearGradient id="veil" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="${P.bg}" stop-opacity="0.85"/>
    <stop offset="0.45" stop-color="${P.bg}" stop-opacity="0.35"/>
    <stop offset="1" stop-color="${P.bg}" stop-opacity="0.15"/>
  </linearGradient>`;
  return svgDoc(W, H, body, defs);
}

export function introDecoSvg(_spec: IntroSpec, W: number, H: number): string {
  const dots: string[] = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 8; c++)
      dots.push(
        `<circle cx="${W * 0.78 + c * H * 0.028}" cy="${H * 0.8 + r * H * 0.028}" r="${H * 0.004}" fill="#ffffff" opacity="0.18"/>`,
      );
  const body = `
<circle cx="${W * 0.11}" cy="${H * 0.18}" r="${H * 0.26}" fill="none" stroke="${P.red}" stroke-width="${H * 0.008}" opacity="0.32"/>
<circle cx="${W * 0.11 + H * 0.26 * 0.707}" cy="${H * 0.18 + H * 0.26 * 0.707}" r="${H * 0.014}" fill="${P.orange}" opacity="0.8"/>
<rect x="${W * 0.86}" y="${H * 0.08}" width="${H * 0.22}" height="${H * 0.22}" rx="${H * 0.035}" fill="none" stroke="${P.orange}" stroke-width="${H * 0.006}" opacity="0.25" transform="rotate(18 ${W * 0.86 + H * 0.11} ${H * 0.08 + H * 0.11})"/>
${dots.join('\n')}`;
  return svgDoc(W, H, body);
}

export function introTitleSvg(spec: IntroSpec, W: number, H: number, font: string): string {
  const cx = W / 2;
  const maxW = W * 0.78;

  // adaptive title size: prefer big, shrink until it fits two lines
  let fsT = H * 0.1;
  let titleLines = [spec.title];
  for (const f of [H * 0.1, H * 0.085, H * 0.07, H * 0.058]) {
    fsT = f;
    titleLines = wrap(spec.title, maxW, f, 2, true);
    if (titleLines.length <= 2 && titleLines.every((l) => estW(l, f, true) <= maxW)) break;
  }
  const fsK = H * 0.027;
  const chipH = H * 0.058;
  const fsSub = H * 0.032;
  const subLines = spec.subtitle?.trim() ? wrap(spec.subtitle, W * 0.6, fsSub, 2) : [];

  const titleBlockH = titleLines.length * fsT * 1.3;
  const kick = spec.kicker?.trim().slice(0, 30) ?? '';
  const total =
    (kick ? chipH + H * 0.045 : 0) +
    titleBlockH +
    H * 0.035 +
    H * 0.012 +
    (subLines.length ? H * 0.035 + subLines.length * fsSub * 1.55 : 0);
  let y = (H - total) / 2;

  const parts: string[] = [];
  if (kick) {
    const kw = estW(kick, fsK) + fsK * 2.6;
    parts.push(`<rect x="${cx - kw / 2}" y="${y}" width="${kw}" height="${chipH}" rx="${chipH / 2}" fill="${P.red}" opacity="0.16"/>`);
    parts.push(`<rect x="${cx - kw / 2}" y="${y}" width="${kw}" height="${chipH}" rx="${chipH / 2}" fill="none" stroke="${P.red}" stroke-width="1.6" opacity="0.85"/>`);
    parts.push(txt(cx, y + chipH / 2 + fsK * 0.36, kick, fsK, P.redBright, font, { weight: 500, anchor: 'middle' }));
    y += chipH + H * 0.045;
  }
  for (const line of titleLines) {
    y += fsT * 0.95;
    parts.push(txt(cx, y, line, fsT, P.text, font, { weight: 900, anchor: 'middle' }));
    y += fsT * 0.35;
  }
  y += H * 0.035;
  parts.push(`<rect x="${cx - H * 0.11}" y="${y}" width="${H * 0.22}" height="${H * 0.012}" rx="${H * 0.006}" fill="url(#acc)"/>`);
  y += H * 0.012;
  if (subLines.length) {
    y += H * 0.035;
    for (const line of subLines) {
      y += fsSub * 1.05;
      parts.push(txt(cx, y, line, fsSub, P.text2, font, { anchor: 'middle' }));
      y += fsSub * 0.5;
    }
  }
  return svgDoc(W, H, `<g filter="url(#ds)">${parts.join('\n')}</g>`);
}

// ---------------------------------------------------------------------------
// info card — title + up to 3 points (+ optional AI illustration on top)
// ---------------------------------------------------------------------------
export function infoCardSvg(spec: ConceptSpec, W: number, H: number, font: string): string {
  const cw = clamp(W * 0.3, 300, W * 0.4);
  const m = H * 0.07;
  const x = spec.side === 'left' ? m : W - m - cw;
  const pad = cw * 0.085;
  const barW = H * 0.008;
  const innerW = cw - pad * 2 - barW;
  const rightX = x + cw - pad - barW; // RTL text anchor

  const fsT = H * 0.04;
  const fsS = H * 0.027;
  const fsB = H * 0.028;

  const titleLines = wrap(spec.headline, innerW, fsT, 2, true);
  const subLines = spec.sub?.trim() ? wrap(spec.sub, innerW, fsS, 2) : [];
  const points = (spec.lines ?? []).slice(0, 3).map((b) => wrap(b, innerW - fsB * 1.3, fsB, 2));

  const hasIllu = Boolean(spec.illustrationFile && fs.existsSync(spec.illustrationFile));
  const illuH = hasIllu ? (cw - pad * 2) * 0.52 : 0;

  // measure
  let ch = pad + (hasIllu ? illuH + pad * 0.8 : pad * 0.1);
  const titleY = ch + fsT * 0.85;
  ch = titleY + (titleLines.length - 1) * fsT * 1.32 + fsT * 0.35;
  const subY = subLines.length ? ch + fsS * 1.1 : ch;
  ch = subY + subLines.length * fsS * 1.5;
  const pointsY = points.length ? ch + fsB * 1.2 : ch;
  let py = pointsY;
  for (const lines of points) py += lines.length * fsB * 1.55 + fsB * 0.5;
  ch = (points.length ? py - fsB * 0.9 : ch) + pad;

  const y = clamp(H * 0.5 - ch / 2, H * 0.08, H - ch - H * 0.08);

  const parts: string[] = [panelRect(x, y, cw, ch, H * 0.022), accentBar(x, y, cw, ch, barW)];
  if (hasIllu) {
    const iw = cw - pad * 2;
    parts.push(`<clipPath id="illu"><rect x="${x + pad}" y="${y + pad}" width="${iw}" height="${illuH}" rx="${H * 0.014}"/></clipPath>`);
    parts.push(`<image clip-path="url(#illu)" href="${pngDataUrl(spec.illustrationFile!)}" x="${x + pad}" y="${y + pad}" width="${iw}" height="${illuH}" preserveAspectRatio="xMidYMid slice"/>`);
    parts.push(`<rect x="${x + pad}" y="${y + pad}" width="${iw}" height="${illuH}" rx="${H * 0.014}" fill="none" stroke="${P.panelStroke}" stroke-width="1"/>`);
  }
  titleLines.forEach((l, i) => parts.push(txt(rightX, y + titleY + i * fsT * 1.32, l, fsT, P.text, font, { weight: 700 })));
  subLines.forEach((l, i) => parts.push(txt(rightX, y + subY + i * fsS * 1.5, l, fsS, P.text2, font)));

  let cy = y + pointsY;
  for (const lines of points) {
    const sq = fsB * 0.34;
    parts.push(`<rect x="${rightX - sq}" y="${cy - fsB * 0.62}" width="${sq}" height="${sq}" rx="${sq * 0.3}" fill="${P.red}"/>`);
    lines.forEach((l, i) => parts.push(txt(rightX - fsB * 1.0, cy + i * fsB * 1.55, l, fsB, P.text2, font)));
    cy += lines.length * fsB * 1.55 + fsB * 0.5;
  }
  return svgDoc(W, H, `<g filter="url(#ds)">${parts.join('\n')}</g>`);
}

// ---------------------------------------------------------------------------
// lower third — bottom-right strip for a term / definition
// ---------------------------------------------------------------------------
export function lowerThirdSvg(spec: ConceptSpec, W: number, H: number, font: string): string {
  const m = H * 0.06;
  const fs1 = H * 0.044;
  const fs2 = H * 0.029;
  const padX = H * 0.038;
  const padY = H * 0.03;
  const barW = H * 0.008;
  const hasSub = Boolean(spec.sub && spec.sub.trim());

  const maxTextW = W * 0.55;
  const head = wrap(spec.headline, maxTextW, fs1, 1, true)[0] ?? '';
  const sub = hasSub ? (wrap(spec.sub!, maxTextW, fs2, 1)[0] ?? '') : '';

  const panelH = padY * 2 + fs1 * 1.15 + (hasSub ? fs2 * 1.55 : 0);
  const textW = Math.max(estW(head, fs1, true), hasSub ? estW(sub, fs2) : 0);
  const panelW = clamp(padX * 2 + barW + textW, W * 0.22, W * 0.62);
  const px = W - m - panelW;
  const py = H - m - panelH;
  const rightX = px + panelW - padX - barW;

  const body = `
<g filter="url(#ds)">
  ${panelRect(px, py, panelW, panelH, H * 0.02)}
  ${accentBar(px, py, panelW, panelH, barW)}
  ${txt(rightX, py + padY + fs1 * 0.9, head, fs1, P.text, font, { weight: 700 })}
  ${hasSub ? txt(rightX, py + padY + fs1 * 1.18 + fs2 * 1.05, sub, fs2, P.text2, font) : ''}
</g>`;
  return svgDoc(W, H, body);
}

// ---------------------------------------------------------------------------
// arrow — points at a spot on screen, short label at the tail
// ---------------------------------------------------------------------------
export function arrowSvg(spec: ConceptSpec, W: number, H: number, font: string): string {
  const t = normTarget(spec.target);
  const tip = { x: clamp(t.x + t.w / 2, 0.05, 0.95) * W, y: clamp(t.y + t.h / 2, 0.06, 0.94) * H };
  const dx = tip.x < W / 2 ? 1 : -1; // tail sits on the emptier horizontal side
  const dy = tip.y < H / 2 ? 1 : -1;
  const tail = {
    x: clamp(tip.x + dx * W * 0.16, W * 0.06, W * 0.94),
    y: clamp(tip.y + dy * H * 0.17, H * 0.08, H * 0.9),
  };

  // gentle quadratic curve: control = midpoint pushed perpendicular
  const v = { x: tip.x - tail.x, y: tip.y - tail.y };
  const len = Math.hypot(v.x, v.y) || 1;
  const perp = { x: -v.y / len, y: v.x / len };
  const ctrl = { x: (tip.x + tail.x) / 2 + perp.x * len * 0.18, y: (tip.y + tail.y) / 2 + perp.y * len * 0.18 };

  // arrowhead aligned with the curve's end tangent, line shortened behind it
  const head = H * 0.03;
  const tan = { x: tip.x - ctrl.x, y: tip.y - ctrl.y };
  const tl = Math.hypot(tan.x, tan.y) || 1;
  const u = { x: tan.x / tl, y: tan.y / tl };
  const base = { x: tip.x - u.x * head * 1.4, y: tip.y - u.y * head * 1.4 };
  const pp = { x: -u.y, y: u.x };
  const headPts = [
    `${tip.x},${tip.y}`,
    `${base.x + pp.x * head * 0.62},${base.y + pp.y * head * 0.62}`,
    `${base.x - pp.x * head * 0.62},${base.y - pp.y * head * 0.62}`,
  ].join(' ');
  const path = `M ${tail.x} ${tail.y} Q ${ctrl.x} ${ctrl.y} ${base.x} ${base.y}`;

  // label pill just past the tail
  const label = (spec.headline ?? '').trim();
  let labelSvg = '';
  if (label) {
    const fs = H * 0.032;
    const ph = fs * 2.0;
    const pw = estW(label, fs, true) + fs * 2.2;
    const off = { x: -u.x * (ph * 0.9), y: -u.y * (ph * 0.9) };
    const cx = clamp(tail.x + off.x, pw / 2 + W * 0.02, W - pw / 2 - W * 0.02);
    const cy = clamp(tail.y + off.y, ph, H - ph * 0.6);
    labelSvg = `
  ${panelRect(cx - pw / 2, cy - ph / 2, pw, ph, ph / 2)}
  ${txt(cx, cy + fs * 0.36, label, fs, P.text, font, { weight: 700, anchor: 'middle' })}`;
  }

  const body = `
<g filter="url(#ds)">
  <path d="${path}" fill="none" stroke="#ffffff" stroke-width="${H * 0.02}" stroke-linecap="round" opacity="0.92"/>
  <polygon points="${headPts}" fill="${P.red}" stroke="#ffffff" stroke-width="${H * 0.005}" stroke-linejoin="round"/>
  <path d="${path}" fill="none" stroke="${P.red}" stroke-width="${H * 0.011}" stroke-linecap="round"/>
  ${labelSvg}
</g>`;
  return svgDoc(W, H, body);
}

// ---------------------------------------------------------------------------
// highlight — dims the frame except a region, yellow outline + optional label
// ---------------------------------------------------------------------------
function normTarget(t?: RegionTarget): RegionTarget {
  const x = clamp(Number(t?.x) || 0.5, 0, 1);
  const y = clamp(Number(t?.y) || 0.5, 0, 1);
  const w = clamp(Number(t?.w) || 0, 0, 0.92);
  const h = clamp(Number(t?.h) || 0, 0, 0.92);
  return { x: clamp(x, 0.01, 1 - w - 0.01), y: clamp(y, 0.01, 1 - h - 0.01), w, h };
}

export function highlightSvg(spec: ConceptSpec, W: number, H: number, font: string): string {
  const t = normTarget(spec.target);
  const bw = Math.max(t.w, 0.06) * W;
  const bh = Math.max(t.h, 0.06) * H;
  const bx = clamp(t.x * W, W * 0.01, W - bw - W * 0.01);
  const by = clamp(t.y * H, H * 0.01, H - bh - H * 0.01);
  const rx = H * 0.018;

  const label = (spec.headline ?? '').trim();
  let labelSvg = '';
  if (label) {
    const fs = H * 0.032;
    const ph = fs * 2.0;
    const pw = estW(label, fs, true) + fs * 2.2;
    const above = by > ph * 1.6;
    const cy = above ? by - ph * 0.85 : by + bh + ph * 0.85;
    const cx = clamp(bx + bw / 2, pw / 2 + W * 0.02, W - pw / 2 - W * 0.02);
    labelSvg = `
  ${panelRect(cx - pw / 2, cy - ph / 2, pw, ph, ph / 2)}
  ${txt(cx, cy + fs * 0.36, label, fs, P.yellowBright, font, { weight: 700, anchor: 'middle' })}`;
  }

  const body = `
<path d="M0 0H${W}V${H}H0Z M${bx} ${by + rx}
  a${rx} ${rx} 0 0 1 ${rx} ${-rx} h${bw - 2 * rx} a${rx} ${rx} 0 0 1 ${rx} ${rx}
  v${bh - 2 * rx} a${rx} ${rx} 0 0 1 ${-rx} ${rx} h${-(bw - 2 * rx)} a${rx} ${rx} 0 0 1 ${-rx} ${-rx} Z"
  fill="#070B12" opacity="0.45" fill-rule="evenodd"/>
<g filter="url(#ds)">
  <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${rx}" fill="none" stroke="${P.yellowBright}" stroke-width="${H * 0.012}" opacity="0.35"/>
  <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${rx}" fill="none" stroke="${P.yellow}" stroke-width="${H * 0.006}"/>
  ${labelSvg}
</g>`;
  return svgDoc(W, H, body);
}

// ---------------------------------------------------------------------------
// subscribe card — fixed wording, red brand pill, bottom-left
// ---------------------------------------------------------------------------
export function subscribeSvg(spec: ConceptSpec, W: number, H: number, font: string): string {
  const h = H * 0.118;
  const m = H * 0.06;
  const fs1 = h * 0.32;
  const fs2 = h * 0.22;
  const head = (spec.headline?.trim() || 'اشترك في القناة').slice(0, 40);
  const sub = (spec.sub?.trim() || 'حتى يصلك كل جديد').slice(0, 40);

  const bellD = h * 0.52;
  const padX = h * 0.42;
  const gap = h * 0.3;
  const textW = Math.max(estW(head, fs1, true), sub ? estW(sub, fs2) : 0);
  const w = padX * 2 + bellD + gap + textW;
  const x = m;
  const y = H - m - h;

  // bell sits on the RIGHT (Arabic start side), text flows leftward from it
  const bellCx = x + w - padX - bellD / 2;
  const rightX = bellCx - bellD / 2 - gap;
  const bell = `<g transform="translate(${bellCx - bellD / 2} ${y + h / 2 - bellD / 2}) scale(${bellD / 24})" fill="#ffffff">
    <path d="M12 2.8c.9 0 1.6.7 1.6 1.5v.7c2.9.7 5 3.3 5 6.4v3.4l1.6 2.6c.3.6-.1 1.3-.8 1.3H4.6c-.7 0-1.1-.7-.8-1.3l1.6-2.6v-3.4c0-3.1 2.1-5.7 5-6.4v-.7c0-.8.7-1.5 1.6-1.5Z"/>
    <path d="M9.8 20.2h4.4a2.2 2.2 0 0 1-4.4 0Z"/>
  </g>`;

  const body = `
<g filter="url(#ds)">
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="url(#subg)" stroke="rgba(255,255,255,0.22)" stroke-width="1.5"/>
  <circle cx="${bellCx}" cy="${y + h / 2}" r="${bellD * 0.72}" fill="#ffffff" opacity="0.14"/>
  ${bell}
  ${txt(rightX, y + h / 2 - (sub ? fs1 * 0.18 : -fs1 * 0.36), head, fs1, '#ffffff', font, { weight: 700 })}
  ${sub ? txt(rightX, y + h / 2 + fs2 * 1.45, sub, fs2, 'rgba(255,255,255,0.88)', font, { weight: 500 }) : ''}
</g>`;
  const defs = `  <linearGradient id="subg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${P.red}"/>
    <stop offset="1" stop-color="${P.redBright}"/>
  </linearGradient>`;
  return svgDoc(W, H, body, defs);
}

// ---------------------------------------------------------------------------
// dispatch + animations
// ---------------------------------------------------------------------------
export function elementSvg(spec: ConceptSpec, W: number, H: number, font: string): string {
  switch (spec.element) {
    case 'info-card':
      return infoCardSvg(spec, W, H, font);
    case 'arrow':
      return arrowSvg(spec, W, H, font);
    case 'highlight':
      return highlightSvg(spec, W, H, font);
    case 'subscribe':
      return subscribeSvg(spec, W, H, font);
    default:
      return lowerThirdSvg(spec, W, H, font);
  }
}

export const ANIM: Record<string, LayerAnim> = {
  backdrop: { delay: 0, fadeIn: 0.35, fadeOut: 0.55, slideX: 0, slideY: 0, slideDur: 0 },
  deco: { delay: 0.15, fadeIn: 0.6, fadeOut: 0.45, slideX: 60, slideY: 0, slideDur: 1.2 },
  title: { delay: 0.3, fadeIn: 0.5, fadeOut: 0.45, slideX: 0, slideY: 40, slideDur: 0.7 },
  lowerThird: { delay: 0, fadeIn: 0.35, fadeOut: 0.45, slideX: 0, slideY: 34, slideDur: 0.55 },
  infoLeft: { delay: 0, fadeIn: 0.4, fadeOut: 0.5, slideX: -44, slideY: 0, slideDur: 0.6 },
  infoRight: { delay: 0, fadeIn: 0.4, fadeOut: 0.5, slideX: 44, slideY: 0, slideDur: 0.6 },
  arrow: { delay: 0, fadeIn: 0.25, fadeOut: 0.35, slideX: 0, slideY: -22, slideDur: 0.4 },
  highlight: { delay: 0, fadeIn: 0.35, fadeOut: 0.4, slideX: 0, slideY: 0, slideDur: 0 },
  subscribe: { delay: 0, fadeIn: 0.4, fadeOut: 0.45, slideX: 0, slideY: 40, slideDur: 0.55 },
};

export function animFor(element: ElementKind, side: 'left' | 'right'): LayerAnim {
  switch (element) {
    case 'info-card':
      return side === 'left' ? ANIM.infoLeft : ANIM.infoRight;
    case 'arrow':
      return ANIM.arrow;
    case 'highlight':
      return ANIM.highlight;
    case 'subscribe':
      return ANIM.subscribe;
    default:
      return ANIM.lowerThird;
  }
}

// ---------------------------------------------------------------------------
// rasterize
// ---------------------------------------------------------------------------
export async function renderPng(svg: string, outPath: string): Promise<void> {
  const setup = await fontSetup();
  const resvg = new Resvg(svg, { font: setup.resvg });
  fs.writeFileSync(outPath, resvg.render().asPng());
}
