import fs from 'node:fs';
import { CONFIG } from './config.ts';
import { extractJson, logInfo, logWarn, sleep } from './util.ts';

const URL = 'https://openrouter.ai/api/v1/chat/completions';

export type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }
  | { type: 'video_url'; video_url: { url: string } };

export interface ChatOpts {
  model: string;
  /** per-role fallback chain (defaults to CONFIG.textFallbacks) */
  fallbacks?: string[];
  system?: string;
  user: string | ContentPart[];
  temperature?: number;
  maxTokens?: number;
  label?: string;
}

export function imagePart(jpegPath: string): ContentPart {
  const b64 = fs.readFileSync(jpegPath).toString('base64');
  return { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}` } };
}

/** Base64 data URL video part — OpenRouter forwards it to video-native models (Gemini). */
export function videoPart(mp4Path: string): ContentPart {
  const b64 = fs.readFileSync(mp4Path).toString('base64');
  return { type: 'video_url', video_url: { url: `data:video/mp4;base64,${b64}` } };
}

function modelChain(primary: string, fallbacks: string[]): string[] {
  return [primary, ...fallbacks.filter((m) => m !== primary)];
}

interface RawRequest {
  model: string;
  body: Record<string, unknown>;
  label: string;
}

/**
 * One POST with retry on 429/5xx/network. Returns the parsed message on
 * success, 'next-model' when this model should be skipped, throws on hard
 * client errors. The caller owns the fallback loop.
 */
async function requestWithRetry(
  req: RawRequest,
): Promise<{ message: any; usage: any } | 'next-model'> {
  let useReasoning = req.body.reasoning !== undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    let res: Response;
    try {
      const body: Record<string, unknown> = { ...req.body, model: req.model };
      if (!useReasoning) delete body.reasoning;
      res = await fetch(URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CONFIG.openrouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://localhost/cutroom',
          'X-Title': 'CutRoom',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(240_000),
      });
    } catch (e) {
      logWarn(`${req.label}: request failed (${(e as Error).message}), retrying`);
      await sleep(2000 * (attempt + 1));
      continue;
    }
    const text = await res.text();
    if (res.ok) {
      let j: any;
      try {
        j = JSON.parse(text);
      } catch {
        logWarn(`${req.label}: unparseable response from ${req.model}`);
        return 'next-model';
      }
      if (j.error) {
        logWarn(`${req.label}: ${req.model} error ${JSON.stringify(j.error).slice(0, 200)}`);
        return 'next-model';
      }
      const msg = j.choices?.[0]?.message;
      if (!msg) return 'next-model';
      if (j.usage) {
        logInfo(
          `${req.label}: ${req.model} — ${j.usage.prompt_tokens ?? '?'}+${j.usage.completion_tokens ?? '?'} tokens`,
        );
      }
      return { message: { ...msg, finish_reason: j.choices[0].finish_reason }, usage: j.usage };
    }
    if (res.status === 429 || res.status >= 500) {
      await sleep(2500 * (attempt + 1));
      continue;
    }
    if (res.status === 400 && useReasoning && /reasoning/i.test(text)) {
      useReasoning = false; // model rejects the reasoning param — retry without it
      attempt--;
      continue;
    }
    if (res.status === 404 || (res.status === 400 && /model/i.test(text))) {
      logWarn(`model ${req.model} unavailable, trying fallback`);
      return 'next-model';
    }
    throw new Error(`OpenRouter ${res.status} (${req.model}): ${text.slice(0, 500)}`);
  }
  logWarn(`${req.label}: ${req.model} kept failing, trying fallback`);
  return 'next-model';
}

/** Text chat completion with retry and per-role model fallback. */
export async function chat(opts: ChatOpts): Promise<string> {
  const models = modelChain(opts.model, opts.fallbacks ?? CONFIG.textFallbacks);
  let lastErr = 'no models attempted';
  for (const model of models) {
    const r = await requestWithRetry({
      model,
      label: opts.label ?? 'llm',
      body: {
        messages: [
          ...(opts.system ? [{ role: 'system', content: opts.system }] : []),
          { role: 'user', content: opts.user },
        ],
        temperature: opts.temperature ?? 0.3,
        max_tokens: opts.maxTokens ?? 8000,
        // reasoning models (gemini, gpt-5) otherwise burn the whole token
        // budget thinking and return truncated/empty content
        reasoning: { effort: 'low' },
      },
    });
    if (r === 'next-model') {
      lastErr = `model ${model} unavailable or erroring`;
      continue;
    }
    if (r.message.finish_reason === 'length') {
      lastErr = `completion truncated (finish_reason=length) on ${model}`;
      continue;
    }
    const content = r.message.content;
    const out =
      typeof content === 'string'
        ? content
        : Array.isArray(content)
          ? content.map((p: any) => p.text ?? '').join('')
          : '';
    if (!out.trim()) {
      lastErr = `empty completion from ${model}`;
      continue;
    }
    return out;
  }
  throw new Error(`${opts.label ?? 'llm'}: all models failed — ${lastErr}`);
}

/**
 * JSON-mode chat: instructs the model to answer with bare JSON, extracts a
 * balanced JSON value, optionally validates, and retries once with the error
 * fed back. Works across models without relying on response_format support.
 */
export async function chatJson<T>(
  opts: ChatOpts & { validate?: (x: unknown) => string | null },
): Promise<T> {
  const jsonSuffix =
    '\n\nRespond with ONLY a single valid JSON value (no markdown fences, no commentary).';
  const baseUser = opts.user;
  let feedback = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    const user: string | ContentPart[] =
      typeof baseUser === 'string'
        ? baseUser + jsonSuffix + feedback
        : [...baseUser, { type: 'text', text: jsonSuffix + feedback }];
    const raw = await chat({ ...opts, user });
    try {
      const parsed = extractJson(raw);
      const problem = opts.validate?.(parsed) ?? null;
      if (problem) throw new Error(problem);
      return parsed as T;
    } catch (e) {
      feedback = `\n\nYour previous response was invalid: ${(e as Error).message}. Fix it and return only the corrected JSON.`;
      if (attempt === 1) throw new Error(`${opts.label ?? 'llm'}: could not get valid JSON — ${(e as Error).message}`);
    }
  }
  throw new Error('unreachable');
}

export interface ImageOpts {
  prompt: string;
  /** e.g. '16:9' (1344×768) or '1:1' (1024×1024) */
  aspectRatio: string;
  label?: string;
  model?: string;
}

/**
 * Image generation through OpenRouter chat completions (modalities: image).
 * Returns the decoded PNG/JPEG bytes of the first generated image.
 */
export async function generateImage(opts: ImageOpts): Promise<Buffer> {
  const models = modelChain(opts.model ?? CONFIG.imageModel, CONFIG.imageFallbacks);
  let lastErr = 'no models attempted';
  for (const model of models) {
    const r = await requestWithRetry({
      model,
      label: opts.label ?? 'image',
      body: {
        messages: [{ role: 'user', content: opts.prompt }],
        modalities: ['image', 'text'],
        image_config: { aspect_ratio: opts.aspectRatio },
      },
    });
    if (r === 'next-model') {
      lastErr = `model ${model} unavailable or erroring`;
      continue;
    }
    const url: string | undefined = r.message.images?.[0]?.image_url?.url;
    if (!url) {
      lastErr = `no image in response from ${model}`;
      logWarn(`${opts.label ?? 'image'}: ${lastErr}`);
      continue;
    }
    const m = url.match(/^data:image\/\w+;base64,(.+)$/s);
    if (!m) {
      lastErr = `unexpected image url format from ${model}`;
      continue;
    }
    return Buffer.from(m[1], 'base64');
  }
  throw new Error(`${opts.label ?? 'image'}: all image models failed — ${lastErr}`);
}
