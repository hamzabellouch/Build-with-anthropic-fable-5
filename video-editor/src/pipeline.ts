import fs from 'node:fs';
import path from 'node:path';
import {
  detectBadTakes,
  findStaleWindows,
  logCutSummary,
  makeConceptSpec,
  makeIntroSpec,
  pickGraphicMoments,
  planSilenceCuts,
  type GraphicMoment,
} from './agent.ts';
import { fontSetup } from './brand.ts';
import { CONFIG, requireKeys } from './config.ts';
import {
  ANIM,
  animFor,
  elementSvg,
  introBackdropSvg,
  introDecoSvg,
  introTitleSvg,
  renderPng,
} from './design.ts';
import { detectSilences, extractAudio, makePreview, probe, sceneScores } from './media.ts';
import { mockTranscript } from './mock.ts';
import { generateImage } from './openrouter.ts';
import { transcribe } from './soniox.ts';
import { cutsToKeeps, makeOutputToSource, makeSourceToOutput, outDuration, resolveTimeline } from './timeline.ts';
import { toUtterances } from './transcript.ts';
import type { ConceptSpec, EditPlan, Overlay, Seg, Transcript } from './types.ts';
import {
  bold,
  checkBinary,
  ensureDir,
  exists,
  fmtTime,
  green,
  logInfo,
  logStep,
  logWarn,
  readJson,
  shortHash,
  slugify,
  writeJson,
} from './util.ts';
import { startRender, type RenderHandle } from './render.ts';

export function projectDirFor(videoPath: string): string {
  const abs = path.resolve(videoPath);
  return path.join(CONFIG.projectsDir, `${slugify(path.basename(abs).replace(/\.[^.]+$/, ''))}-${shortHash(abs)}`);
}

function invert(segs: Seg[], duration: number): Seg[] {
  const out: Seg[] = [];
  let cursor = 0;
  for (const s of [...segs].sort((a, b) => a.start - b.start)) {
    if (s.start > cursor) out.push({ start: cursor, end: s.start });
    cursor = Math.max(cursor, s.end);
  }
  if (cursor < duration) out.push({ start: cursor, end: duration });
  return out;
}

/**
 * Brand style enforced on every AI-generated image. The model only supplies
 * the subject; palette, style and the no-text rule are fixed (image models
 * cannot render Arabic type — all text is set locally in Qomra instead).
 */
const IMAGE_STYLE = `Flat minimal vector-style illustration for a simple Arabic educational video.
Dark navy background (#141929). Use ONLY these accent colors: crimson red (#E8364F), warm orange (#F28A2E), soft yellow (#F9C846), and light gray (#E0E4EC) line work.
Simple geometric shapes, generous negative space, calm and uncluttered composition.
Absolutely NO text, NO letters, NO numbers, NO logos, NO watermarks anywhere in the image.`;

async function generateBrandImage(brief: string, aspectRatio: string, outPng: string, label: string): Promise<boolean> {
  try {
    const buf = await generateImage({
      prompt: `${IMAGE_STYLE}\n\nSubject: ${brief}`,
      aspectRatio,
      label,
    });
    fs.writeFileSync(outPng, buf);
    return true;
  } catch (e) {
    logWarn(`${label}: image generation failed — continuing without (${(e as Error).message})`);
    return false;
  }
}

export async function analyze(videoPath: string): Promise<string> {
  if (!(await checkBinary('ffmpeg')) || !(await checkBinary('ffprobe'))) {
    throw new Error('ffmpeg/ffprobe not found on PATH — install ffmpeg first (e.g. pacman -S ffmpeg / brew install ffmpeg)');
  }
  if (!exists(videoPath)) throw new Error(`input video not found: ${videoPath}`);
  requireKeys(true, true);
  if (CONFIG.mock) logWarn('MOCK mode — no API calls, synthetic transcript and canned design specs');

  const projDir = projectDirFor(videoPath);
  const overlaysDir = path.join(projDir, 'overlays');
  const workDir = path.join(projDir, 'work');
  ensureDir(overlaysDir);
  ensureDir(workDir);

  // ---- 1. probe + browser preview ----
  let done = logStep('probe input');
  const info = await probe(videoPath);
  done(`${info.width}x${info.height} @ ${info.fps.toFixed(2)}fps, ${fmtTime(info.durationS)}, audio: ${info.hasAudio ? info.acodec : 'none'}`);

  done = logStep('prepare browser preview');
  const preview = await makePreview(info, projDir);
  done();

  // ---- 2. audio + silences ----
  const audioPath = path.join(workDir, 'audio.wav');
  let silences: Seg[] = [];
  if (info.hasAudio) {
    done = logStep('extract audio (16 kHz mono)');
    await extractAudio(info.path, audioPath);
    done();
    done = logStep('detect silences (audio energy)');
    silences = await detectSilences(audioPath);
    done(`${silences.length} silent stretches`);
  } else {
    logWarn('no audio stream — skipping transcription, silence cuts and bad-take detection');
  }

  // ---- 3. transcript ----
  let transcript: Transcript = { model: 'none', text: '', tokens: [] };
  if (info.hasAudio) {
    if (CONFIG.mock) {
      transcript = mockTranscript(invert(silences, info.durationS), info.durationS);
    } else {
      done = logStep(`transcribe with Soniox (${CONFIG.sonioxModel})`);
      transcript = await transcribe(audioPath, path.join(workDir, 'soniox-raw.json'));
      done(`${transcript.tokens.length} tokens`);
    }
  }
  writeJson(path.join(projDir, 'transcript.json'), transcript);
  const utterances = toUtterances(transcript.tokens);
  writeJson(path.join(projDir, 'utterances.json'), utterances);

  // ---- 4. cuts: silences + bad takes ----
  done = logStep('plan silence cuts');
  const cuts = planSilenceCuts(transcript.tokens, info.durationS, silences);
  done(`${cuts.length} cuts`);

  if (utterances.length >= 3) {
    done = logStep(`detect bad takes (${CONFIG.mock ? 'mock' : CONFIG.editModel})`);
    const bad = await detectBadTakes(utterances);
    cuts.push(...bad);
    done(`${bad.length} found`);
  }
  logCutSummary(cuts);

  // ---- 5. stale-screen analysis ----
  done = logStep('scan visual change (scene scores)');
  const scores = await sceneScores(info.path, workDir);
  const staleWins = findStaleWindows(scores, CONFIG.staleMinSeconds, CONFIG.staleScoreMax);
  done(`${staleWins.length} stale windows ≥ ${CONFIG.staleMinSeconds}s`);

  // ---- 6. intro + concept specs ----
  done = logStep(`write Arabic intro card (${CONFIG.mock ? 'mock' : CONFIG.editModel})`);
  const introSpec = await makeIntroSpec(transcript.text, info);
  done(`"${introSpec.title}"`);

  const { keeps } = cutsToKeeps(cuts.filter((c) => c.enabled), info.durationS, CONFIG.minKeepSegment);
  const srcToOut = makeSourceToOutput(keeps);
  const moments = pickGraphicMoments(
    staleWins,
    keeps,
    srcToOut,
    CONFIG.introSeconds,
    CONFIG.maxGraphics,
    CONFIG.graphicSpacing,
  );

  const concepts: { moment: GraphicMoment; spec: ConceptSpec }[] = [];
  for (let i = 0; i < moments.length; i++) {
    done = logStep(`design element ${i + 1}/${moments.length} (${CONFIG.mock ? 'mock' : CONFIG.videoModel}, video-native)`);
    try {
      const spec = await makeConceptSpec(moments[i], i, info, transcript.tokens, workDir);
      if (spec) {
        concepts.push({ moment: moments[i], spec });
        done(`"${spec.headline}" (${spec.element})`);
      } else {
        done('model passed — nothing would help here');
      }
    } catch (e) {
      logWarn(`element ${i + 1} failed, skipping: ${(e as Error).message}`);
    }
  }

  // ---- 7. AI imagery (OpenAI image model, hard budget per video) ----
  let imageBudget = CONFIG.mock ? 0 : CONFIG.maxImages;
  if (imageBudget > 0 && introSpec.backdrop) {
    done = logStep(`generate intro backdrop (${CONFIG.imageModel})`);
    const file = path.join(workDir, 'intro-backdrop-src.png');
    if (await generateBrandImage(introSpec.backdrop, '16:9', file, 'image-intro')) {
      introSpec.backdropFile = file;
      imageBudget--;
      done();
    } else done('skipped');
  }
  for (let i = 0; i < concepts.length && imageBudget > 0; i++) {
    const spec = concepts[i].spec;
    if (spec.element !== 'info-card' || !spec.illustration) continue;
    done = logStep(`generate card illustration ${i + 1} (${CONFIG.imageModel})`);
    const file = path.join(workDir, `illustration-${i + 1}.png`);
    if (await generateBrandImage(spec.illustration, '1:1', file, `image-card-${i + 1}`)) {
      spec.illustrationFile = file;
      imageBudget--;
      done();
    } else done('skipped');
  }

  // ---- 8. render overlay PNGs (Qomra, brand palette, RTL) ----
  done = logStep('render overlay graphics (SVG → PNG)');
  const { family: font } = await fontSetup();
  const W = info.width;
  const H = info.height;
  const overlays: Overlay[] = [];

  await renderPng(introBackdropSvg(introSpec, W, H), path.join(overlaysDir, 'intro-backdrop.png'));
  await renderPng(introDecoSvg(introSpec, W, H), path.join(overlaysDir, 'intro-deco.png'));
  await renderPng(introTitleSvg(introSpec, W, H, font), path.join(overlaysDir, 'intro-title.png'));
  overlays.push({
    id: 'intro',
    kind: 'intro',
    anchorSpace: 'output',
    anchorS: 0,
    durationS: CONFIG.introSeconds,
    spec: introSpec,
    enabled: true,
    layers: [
      { file: 'intro-backdrop.png', anim: ANIM.backdrop },
      { file: 'intro-deco.png', anim: ANIM.deco },
      { file: 'intro-title.png', anim: ANIM.title },
    ],
  });

  for (let i = 0; i < concepts.length; i++) {
    const { moment, spec } = concepts[i];
    const file = `concept-${i + 1}.png`;
    await renderPng(elementSvg(spec, W, H, font), path.join(overlaysDir, file));
    overlays.push({
      id: `concept-${i + 1}`,
      kind: 'concept',
      anchorSpace: 'source',
      anchorS: moment.anchorS,
      durationS: spec.durationS,
      spec,
      enabled: true,
      layers: [{ file, anim: animFor(spec.element, spec.side) }],
      note: `screen static ${fmtTime(moment.window.start)}–${fmtTime(moment.window.end)}`,
    });
  }

  // ---- 9. subscribe card — deterministic, near the end of longer videos ----
  const outDur = outDuration(keeps);
  if (CONFIG.subscribeCard && outDur >= 90) {
    const outToSrc = makeOutputToSource(keeps);
    const spec: ConceptSpec = {
      element: 'subscribe',
      headline: CONFIG.channelName ? `اشترك في قناة ${CONFIG.channelName}` : 'اشترك في القناة',
      sub: 'حتى يصلك كل جديد',
      lines: [],
      side: 'left',
      durationS: 7,
    };
    await renderPng(elementSvg(spec, W, H, font), path.join(overlaysDir, 'subscribe.png'));
    overlays.push({
      id: 'subscribe',
      kind: 'concept',
      anchorSpace: 'source',
      anchorS: outToSrc(Math.max(CONFIG.introSeconds + 10, outDur - 35)),
      durationS: spec.durationS,
      spec,
      enabled: true,
      layers: [{ file: 'subscribe.png', anim: ANIM.subscribe }],
      note: 'auto-placed near the end',
    });
  }
  done(`${overlays.length} overlays (${overlays.length - 1} elements + intro)`);

  // ---- 10. save plan ----
  const plan: EditPlan = {
    version: 1,
    project: path.basename(projDir),
    createdAt: new Date().toISOString(),
    mock: CONFIG.mock,
    source: info,
    preview,
    cuts,
    overlays,
    settings: {
      introSeconds: CONFIG.introSeconds,
      minSilenceGap: CONFIG.minSilenceGap,
      keepAfterSpeech: CONFIG.keepAfterSpeech,
      keepBeforeSpeech: CONFIG.keepBeforeSpeech,
      minKeepSegment: CONFIG.minKeepSegment,
      staleMinSeconds: CONFIG.staleMinSeconds,
      staleScoreMax: CONFIG.staleScoreMax,
      maxGraphics: CONFIG.maxGraphics,
    },
    models: {
      stt: CONFIG.mock ? 'mock' : CONFIG.sonioxModel,
      edit: CONFIG.mock ? 'mock' : CONFIG.editModel,
      video: CONFIG.mock ? 'mock' : CONFIG.videoModel,
      image: CONFIG.mock ? 'mock' : CONFIG.maxImages > 0 ? CONFIG.imageModel : 'disabled',
    },
  };
  writeJson(path.join(projDir, 'plan.json'), plan);

  const tl = resolveTimeline(plan.cuts, plan.overlays, info.durationS, overlaysDir, CONFIG.minKeepSegment);
  console.log(
    `\n${green('●')} ${bold('analysis complete')} — ${fmtTime(info.durationS)} → ${fmtTime(tl.outDuration)} ` +
      `(${(((info.durationS - tl.outDuration) / info.durationS) * 100).toFixed(0)}% tighter), ` +
      `${plan.cuts.filter((c) => c.enabled).length} cuts, ${tl.overlays.length} overlays`,
  );
  logInfo(`project: ${projDir}`);
  return projDir;
}

export interface RenderState {
  state: 'idle' | 'running' | 'done' | 'error';
  progress: number;
  error?: string;
  outPath?: string;
  outDuration?: number;
}

export function loadPlan(projDir: string): EditPlan {
  const p = path.join(projDir, 'plan.json');
  if (!exists(p)) throw new Error(`no plan.json in ${projDir} — run analyze first`);
  return readJson<EditPlan>(p);
}

export function startProjectRender(
  projDir: string,
  onProgress?: (frac: number) => void,
): { handle: RenderHandle; outPath: string; outDuration: number } {
  const plan = loadPlan(projDir);
  if (!exists(plan.source.path)) throw new Error(`source video moved or deleted: ${plan.source.path}`);
  const overlaysDir = path.join(projDir, 'overlays');
  const tl = resolveTimeline(plan.cuts, plan.overlays, plan.source.durationS, overlaysDir, plan.settings.minKeepSegment);
  if (tl.degenerate) logWarn('all material was cut — rendering the full video instead');
  const outPath = path.join(projDir, 'output.mp4');
  fs.rmSync(outPath, { force: true });
  const handle = startRender(
    {
      srcPath: plan.source.path,
      hasAudio: plan.source.hasAudio,
      fps: plan.source.fps,
      timeline: tl,
      outPath,
      workDir: path.join(projDir, 'work'),
    },
    onProgress,
  );
  return { handle, outPath, outDuration: tl.outDuration };
}
