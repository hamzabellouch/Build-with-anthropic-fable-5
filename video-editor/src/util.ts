import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// ---------- tiny ansi logger ----------
const tty = process.stdout.isTTY;
const c = (code: number, s: string) => (tty ? `\x1b[${code}m${s}\x1b[0m` : s);
export const dim = (s: string) => c(2, s);
export const bold = (s: string) => c(1, s);
export const cyan = (s: string) => c(36, s);
export const green = (s: string) => c(32, s);
export const yellow = (s: string) => c(33, s);
export const red = (s: string) => c(31, s);

export function logStep(title: string): (note?: string) => void {
  const t0 = Date.now();
  process.stdout.write(`${cyan('▸')} ${title}\n`);
  return (note?: string) => {
    const dt = ((Date.now() - t0) / 1000).toFixed(1);
    process.stdout.write(`  ${green('✓')} ${title} ${dim(`(${dt}s${note ? ` — ${note}` : ''})`)}\n`);
  };
}
export function logInfo(msg: string): void {
  process.stdout.write(`  ${dim('·')} ${msg}\n`);
}
export function logWarn(msg: string): void {
  process.stdout.write(`  ${yellow('!')} ${msg}\n`);
}

// ---------- .env loader (no dependency) ----------
export function loadDotEnv(dir: string): void {
  const file = path.join(dir, '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}

// ---------- subprocess ----------
export interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

export async function run(
  cmd: string,
  args: string[],
  opts: { allowFail?: boolean; onStderrLine?: (line: string) => void; onStdoutLine?: (line: string) => void } = {},
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let outBuf = '';
    let errBuf = '';
    child.stdout.on('data', (d: Buffer) => {
      const s = d.toString();
      stdout += s;
      if (opts.onStdoutLine) {
        outBuf += s;
        const lines = outBuf.split('\n');
        outBuf = lines.pop() ?? '';
        for (const l of lines) opts.onStdoutLine(l);
      }
    });
    child.stderr.on('data', (d: Buffer) => {
      const s = d.toString();
      stderr += s;
      if (opts.onStderrLine) {
        errBuf += s;
        const lines = errBuf.split('\n');
        errBuf = lines.pop() ?? '';
        for (const l of lines) opts.onStderrLine(l);
      }
    });
    child.on('error', (e) => reject(new Error(`failed to spawn ${cmd}: ${e.message}`)));
    child.on('close', (code) => {
      if (code !== 0 && !opts.allowFail) {
        const tail = stderr.split('\n').slice(-25).join('\n');
        reject(new Error(`${cmd} exited with code ${code}\n--- stderr tail ---\n${tail}`));
      } else {
        resolve({ code: code ?? -1, stdout, stderr });
      }
    });
  });
}

export async function checkBinary(name: string): Promise<boolean> {
  try {
    await run(name, ['-version'], { allowFail: true });
    return true;
  } catch {
    return false;
  }
}

// ---------- fs helpers ----------
export function ensureDir(p: string): void {
  fs.mkdirSync(p, { recursive: true });
}
export function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}
export function writeJson(file: string, data: unknown): void {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
export function exists(p: string): boolean {
  return fs.existsSync(p);
}

// ---------- misc ----------
export const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));
export const round3 = (x: number): number => Math.round(x * 1000) / 1000;

export function fmtTime(s: number): string {
  const sign = s < 0 ? '-' : '';
  s = Math.abs(s);
  const m = Math.floor(s / 60);
  const sec = s - m * 60;
  return `${sign}${m}:${sec.toFixed(1).padStart(4, '0')}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function shortHash(s: string): string {
  // djb2 — stable project slugs without pulling in crypto
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36).slice(0, 6);
}

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'video'
  );
}

/**
 * Extract the first balanced JSON object/array from LLM output.
 * Tolerates markdown fences and prose around the JSON.
 */
export function extractJson(text: string): unknown {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const start = t.search(/[[{]/);
  if (start === -1) throw new Error(`no JSON found in response: ${t.slice(0, 200)}`);
  const open = t[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  let inStr = false;
  let escaped = false;
  for (let i = start; i < t.length; i++) {
    const ch = t[i];
    if (inStr) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return JSON.parse(t.slice(start, i + 1));
    }
  }
  throw new Error(`unbalanced JSON in response: ${t.slice(0, 200)}`);
}
