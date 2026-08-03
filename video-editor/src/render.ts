import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { LayerAnim, ResolvedTimeline } from './types.ts';

const PRESET = process.env.RENDER_PRESET?.trim() || 'medium';
const CRF = process.env.RENDER_CRF?.trim() || '18';

const f3 = (n: number) => {
  const s = n.toFixed(3);
  return s === '-0.000' ? '0.000' : s;
};

/** Eased slide offset expression: anim.slide{X,Y} px decaying to 0 (cubic ease-out). */
function slideExpr(offset: number, tStart: number, dur: number): string {
  if (!offset) return '0';
  const d = dur > 0.01 ? dur : 0.3;
  return `${f3(offset)}*pow(1-min(max((t-${f3(tStart)})/${f3(d)},0),1),3)`;
}

function fadeChain(startOut: number, endOut: number, anim: LayerAnim): string {
  const inSt = startOut + anim.delay;
  const fadeIn = Math.max(0.05, anim.fadeIn);
  const fadeOut = Math.max(0.05, anim.fadeOut);
  const outSt = Math.max(inSt + fadeIn + 0.05, endOut - fadeOut);
  return `fade=t=in:st=${f3(inSt)}:d=${f3(fadeIn)}:alpha=1,fade=t=out:st=${f3(outSt)}:d=${f3(fadeOut)}:alpha=1`;
}

export interface RenderJob {
  srcPath: string;
  hasAudio: boolean;
  fps: number;
  timeline: ResolvedTimeline;
  outPath: string;
  workDir: string;
}

export function buildFfmpegArgs(job: RenderJob): { args: string[]; graphFile: string } {
  const { timeline: tl } = job;
  const fps = Math.max(10, Math.min(60, job.fps || 30));
  const lines: string[] = [];

  // 1. trims + concat
  const pairs: string[] = [];
  tl.keeps.forEach((k, i) => {
    lines.push(`[0:v]trim=start=${f3(k.start)}:end=${f3(k.end)},setpts=PTS-STARTPTS[v${i}]`);
    if (job.hasAudio) lines.push(`[0:a]atrim=start=${f3(k.start)}:end=${f3(k.end)},asetpts=PTS-STARTPTS[a${i}]`);
    pairs.push(job.hasAudio ? `[v${i}][a${i}]` : `[v${i}]`);
  });
  lines.push(
    `${pairs.join('')}concat=n=${tl.keeps.length}:v=1:a=${job.hasAudio ? 1 : 0}[vcat]${job.hasAudio ? '[acat]' : ''}`,
  );
  lines.push(`[vcat]fps=${f3(fps)}[vbase]`);

  // 2. overlay layers (inputs 1..N), each its own fade + slide animation
  const layerInputs: string[] = [];
  let prev = 'vbase';
  let li = 0;
  for (const ov of tl.overlays) {
    for (const layer of ov.layers) {
      const inputIdx = li + 1;
      layerInputs.push(layer.pngPath);
      const a = layer.anim;
      lines.push(
        `[${inputIdx}:v]format=rgba,trim=end=${f3(ov.endOut + 1)},${fadeChain(ov.startOut, ov.endOut, a)}[ov${li}]`,
      );
      const ts = ov.startOut + a.delay;
      const x = slideExpr(a.slideX, ts, a.slideDur);
      const y = slideExpr(a.slideY, ts, a.slideDur);
      lines.push(
        `[${prev}][ov${li}]overlay=x='${x}':y='${y}':eval=frame:enable='between(t,${f3(ov.startOut)},${f3(ov.endOut)})'[vo${li}]`,
      );
      prev = `vo${li}`;
      li++;
    }
  }
  lines.push(`[${prev}]format=yuv420p[vout]`);

  // 3. audio polish
  if (job.hasAudio) lines.push(`[acat]loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[aout]`);

  const graphFile = path.join(job.workDir, 'filtergraph.txt');
  fs.writeFileSync(graphFile, lines.join(';\n'));

  const args: string[] = ['-y', '-v', 'error', '-nostdin', '-i', job.srcPath];
  for (const png of layerInputs) args.push('-loop', '1', '-framerate', f3(fps), '-i', png);
  args.push('-filter_complex_script', graphFile, '-map', '[vout]');
  if (job.hasAudio) args.push('-map', '[aout]', '-c:a', 'aac', '-b:a', '192k');
  else args.push('-an');
  args.push(
    '-c:v', 'libx264',
    '-preset', PRESET,
    '-crf', CRF,
    '-movflags', '+faststart',
    '-progress', 'pipe:1',
    job.outPath,
  );
  return { args, graphFile };
}

export interface RenderHandle {
  child: ChildProcess;
  done: Promise<void>;
}

export function startRender(job: RenderJob, onProgress?: (frac: number) => void): RenderHandle {
  const { args } = buildFfmpegArgs(job);
  const child = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = '';
  let buf = '';
  child.stderr!.on('data', (d: Buffer) => (stderr += d.toString()));
  child.stdout!.on('data', (d: Buffer) => {
    buf += d.toString();
    const linesArr = buf.split('\n');
    buf = linesArr.pop() ?? '';
    for (const line of linesArr) {
      const m = line.match(/^out_time=(\d+):(\d+):([\d.]+)/);
      if (m && onProgress) {
        const t = Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
        onProgress(Math.min(1, t / Math.max(0.1, job.timeline.outDuration)));
      }
      if (line.startsWith('progress=end') && onProgress) onProgress(1);
    }
  });
  const done = new Promise<void>((resolve, reject) => {
    child.on('error', (e) => reject(new Error(`failed to spawn ffmpeg: ${e.message}`)));
    child.on('close', (code, signal) => {
      if (code === 0) resolve();
      else if (signal) reject(new Error(`render cancelled (${signal})`));
      else reject(new Error(`ffmpeg exited with ${code}\n${stderr.split('\n').slice(-20).join('\n')}`));
    });
  });
  return { child, done };
}
