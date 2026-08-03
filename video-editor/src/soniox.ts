import fs from 'node:fs';
import path from 'node:path';
import { CONFIG } from './config.ts';
import type { Token, Transcript } from './types.ts';
import { logInfo, sleep } from './util.ts';

const BASE = 'https://api.soniox.com';

function headers(): Record<string, string> {
  return { Authorization: `Bearer ${CONFIG.sonioxApiKey}` };
}

async function api<T>(method: string, urlPath: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: { ...headers(), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Soniox ${method} ${urlPath} → ${res.status}: ${text.slice(0, 500)}`);
  return (text ? JSON.parse(text) : {}) as T;
}

/**
 * Async file transcription against the Soniox REST API:
 *   POST /v1/files (multipart) → POST /v1/transcriptions → poll GET
 *   /v1/transcriptions/{id} → GET /v1/transcriptions/{id}/transcript
 * Token shape per OpenAPI spec: { text, start_ms, end_ms, confidence, speaker? }
 */
export async function transcribe(audioPath: string, rawDumpPath?: string): Promise<Transcript> {
  // 1. upload
  const blob = await fs.openAsBlob(audioPath, { type: 'audio/wav' });
  const form = new FormData();
  form.append('file', blob, path.basename(audioPath));
  const upRes = await fetch(`${BASE}/v1/files`, { method: 'POST', headers: headers(), body: form });
  const upText = await upRes.text();
  if (!upRes.ok) throw new Error(`Soniox file upload → ${upRes.status}: ${upText.slice(0, 500)}`);
  const fileId: string = JSON.parse(upText).id;
  logInfo(`uploaded audio to Soniox (file ${fileId.slice(0, 8)}…)`);

  let transcriptionId: string | null = null;
  try {
    // 2. create transcription
    const created = await api<{ id: string }>('POST', '/v1/transcriptions', {
      model: CONFIG.sonioxModel,
      file_id: fileId,
      ...(CONFIG.languageHints.length ? { language_hints: CONFIG.languageHints } : {}),
    });
    transcriptionId = created.id;

    // 3. poll
    const deadline = Date.now() + 15 * 60_000;
    for (;;) {
      const st = await api<{ status: string; error_message?: string | null }>(
        'GET',
        `/v1/transcriptions/${transcriptionId}`,
      );
      if (st.status === 'completed') break;
      if (st.status === 'error' || st.status === 'failed') {
        throw new Error(`Soniox transcription failed: ${st.error_message ?? 'unknown error'}`);
      }
      if (Date.now() > deadline) throw new Error('Soniox transcription timed out after 15 minutes');
      await sleep(2500);
    }

    // 4. fetch transcript
    const raw = await api<{ text: string; tokens: any[] }>(
      'GET',
      `/v1/transcriptions/${transcriptionId}/transcript`,
    );
    if (rawDumpPath) fs.writeFileSync(rawDumpPath, JSON.stringify(raw, null, 2));

    const tokens: Token[] = (raw.tokens ?? [])
      .map((t) => ({
        text: String(t.text ?? ''),
        startS: Number(t.start_ms ?? t.start ?? 0) / 1000,
        endS: Number(t.end_ms ?? t.end ?? t.start_ms ?? 0) / 1000,
        confidence: Number(t.confidence ?? 1),
        ...(t.speaker != null ? { speaker: String(t.speaker) } : {}),
      }))
      .filter((t) => t.text.length > 0);
    return { model: CONFIG.sonioxModel, text: raw.text ?? tokens.map((t) => t.text).join(''), tokens };
  } finally {
    // best-effort cleanup so the Soniox project doesn't accumulate artifacts
    if (transcriptionId) api('DELETE', `/v1/transcriptions/${transcriptionId}`).catch(() => {});
    api('DELETE', `/v1/files/${fileId}`).catch(() => {});
  }
}
