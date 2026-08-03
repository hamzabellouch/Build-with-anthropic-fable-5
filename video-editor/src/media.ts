import fs from 'node:fs';
import path from 'node:path';
import { CONFIG } from './config.ts';
import type { ProbeInfo, SceneScore, Seg } from './types.ts';
import { logInfo, run } from './util.ts';

function parseFps(rate: string | undefined): number {
  if (!rate) return 30;
  const m = rate.match(/^(\d+)\/(\d+)$/);
  if (m) {
    const num = Number(m[1]);
    const den = Number(m[2]);
    if (num > 0 && den > 0) return num / den;
    return 30;
  }
  const n = Number(rate);
  return Number.isFinite(n) && n > 0 ? n : 30;
}

export async function probe(file: string): Promise<ProbeInfo> {
  const { stdout } = await run('ffprobe', [
    '-v', 'error',
    '-print_format', 'json',
    '-show_format', '-show_streams',
    file,
  ]);
  const j = JSON.parse(stdout);
  const streams: any[] = j.streams ?? [];
  const v = streams.find((s) => s.codec_type === 'video' && (s.disposition?.attached_pic ?? 0) === 0);
  const a = streams.find((s) => s.codec_type === 'audio');
  if (!v) throw new Error(`no video stream found in ${file}`);
  const durationS = Number(j.format?.duration ?? v.duration ?? 0);
  if (!Number.isFinite(durationS) || durationS <= 0) throw new Error(`could not determine duration of ${file}`);
  return {
    path: path.resolve(file),
    container: String(j.format?.format_name ?? ''),
    durationS,
    width: Number(v.width),
    height: Number(v.height),
    fps: Math.min(120, parseFps(v.avg_frame_rate !== '0/0' ? v.avg_frame_rate : v.r_frame_rate)),
    vcodec: String(v.codec_name ?? ''),
    hasAudio: Boolean(a),
    acodec: a ? String(a.codec_name) : null,
  };
}

/** 16 kHz mono WAV for STT */
export async function extractAudio(src: string, outWav: string): Promise<void> {
  await run('ffmpeg', ['-y', '-i', src, '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', outWav]);
}

/** Audio-energy silence detection (used as fallback when the transcript is empty). */
export async function detectSilences(src: string): Promise<Seg[]> {
  const segs: Seg[] = [];
  let pendingStart: number | null = null;
  await run(
    'ffmpeg',
    ['-i', src, '-af', `silencedetect=noise=${CONFIG.silenceNoiseDb}dB:d=${CONFIG.silenceMinDur}`, '-f', 'null', '-'],
    {
      onStderrLine: (line) => {
        let m = line.match(/silence_start:\s*(-?[\d.]+)/);
        if (m) pendingStart = Number(m[1]);
        m = line.match(/silence_end:\s*(-?[\d.]+)/);
        if (m && pendingStart !== null) {
          segs.push({ start: Math.max(0, pendingStart), end: Number(m[1]) });
          pendingStart = null;
        }
      },
    },
  );
  return segs;
}

/**
 * Per-frame scene-change scores sampled at CONFIG.sceneFps on a downscaled
 * stream. Low scores over a long stretch = visually stale screen.
 */
export async function sceneScores(src: string, workDir: string): Promise<SceneScore[]> {
  const metaFile = path.join(workDir, 'scene-meta.txt');
  await run('ffmpeg', [
    '-y', '-i', src,
    '-vf',
    `fps=${CONFIG.sceneFps},scale=320:-2,select='gte(scene,0)',metadata=print:file=${escapeFilterPath(metaFile)}`,
    '-an', '-f', 'null', '-',
  ]);
  const scores: SceneScore[] = [];
  let t: number | null = null;
  for (const line of fs.readFileSync(metaFile, 'utf8').split('\n')) {
    let m = line.match(/pts_time:([\d.]+)/);
    if (m) t = Number(m[1]);
    m = line.match(/lavfi\.scene_score=([\d.]+)/);
    if (m && t !== null) {
      scores.push({ t, score: Number(m[1]) });
      t = null;
    }
  }
  fs.rmSync(metaFile, { force: true });
  return scores;
}

function escapeFilterPath(p: string): string {
  // ffmpeg filter option values treat ':' and '\' specially
  return p.replace(/\\/g, '\\\\').replace(/:/g, '\\:');
}

/**
 * Compressed, downscaled, muted clip of a window — sent (base64) to the
 * video-native model. ~15 s at 640px/8fps/crf30 is a few hundred KB.
 */
export async function extractClip(src: string, startS: number, endS: number, outMp4: string): Promise<void> {
  const dur = Math.min(Math.max(1, endS - startS), CONFIG.clipMaxSeconds);
  await run('ffmpeg', [
    '-y', '-ss', Math.max(0, startS).toFixed(3), '-t', dur.toFixed(3), '-i', src,
    '-vf', `scale=${CONFIG.clipWidth}:-2,fps=${CONFIG.clipFps}`,
    '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '30',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    outMp4,
  ]);
}

/** Extract one frame as JPEG (used for the vision model). */
export async function extractFrame(src: string, atS: number, outJpg: string, width = 896): Promise<void> {
  await run('ffmpeg', [
    '-y', '-ss', atS.toFixed(3), '-i', src,
    '-frames:v', '1', '-vf', `scale=${width}:-2`, '-q:v', '4', outJpg,
  ]);
}

const BROWSER_VCODECS = new Set(['h264', 'vp9', 'av1', 'vp8']);

/**
 * The review UI needs a browser-playable file. If the source already is one
 * (h264/vp9/av1 in mp4/webm), just symlink it; otherwise transcode a 720p proxy.
 * Returns the preview filename inside the project dir.
 */
export async function makePreview(info: ProbeInfo, projDir: string): Promise<string> {
  const containerOk = /mp4|mov|webm/.test(info.container);
  const safe = containerOk && BROWSER_VCODECS.has(info.vcodec) && (!info.hasAudio || ['aac', 'opus', 'mp3', 'vorbis'].includes(info.acodec ?? ''));
  if (safe) {
    const name = 'preview' + (info.container.includes('webm') ? '.webm' : '.mp4');
    const dest = path.join(projDir, name);
    fs.rmSync(dest, { force: true });
    try {
      fs.symlinkSync(info.path, dest);
    } catch {
      fs.copyFileSync(info.path, dest);
    }
    return name;
  }
  logInfo(`source (${info.vcodec}/${info.container}) is not browser-safe — building 720p preview proxy`);
  const name = 'preview.mp4';
  const dest = path.join(projDir, name);
  const args = ['-y', '-i', info.path, '-vf', 'scale=-2:720', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart'];
  if (info.hasAudio) args.push('-c:a', 'aac', '-b:a', '128k');
  else args.push('-an');
  args.push(dest);
  await run('ffmpeg', args);
  return name;
}
