# CutRoom — an AI video editor

Give it a raw screen-recording / talking-head video and it does what a human editor does:

1. **Tightens pacing** — transcribes with [Soniox](https://soniox.com) (`stt-async-v3`, word-level timestamps) and cuts dead air.
2. **Removes bad takes** — an OpenAI LLM (`gpt-5-mini` via [OpenRouter](https://openrouter.ai)) reads the transcript like an editor: flubbed lines, false starts, "ugh, let me say that again" moments get cut, the last good take is kept.
3. **Designs Arabic graphics when the screen goes stale** — scene-change analysis finds long visually-static stretches; a **video-native** model (`gemini-3.5-flash`) watches an actual clip of that stretch + reads what is being said, then picks ONE element from a preconfigured library — **info card, lower third, arrow, highlight** — and fills in very short Arabic copy (and coordinates for arrow/highlight). Elements are rendered locally from RTL SVG templates in the **Qomra** typeface and the fixed brand palette, so designs stay consistent.
4. **AI imagery + animated intro** — `gpt-5.4-image-2` generates a flat, brand-palette backdrop illustration for the intro and small illustrations inside info cards (never any text — type is always set locally in Qomra). A subscribe card is auto-placed near the end of longer videos.
5. **Review before render** — a browser UI previews the edit *instantly* (no rendering): playback skips cuts in real time and overlays animate in place. Toggle any cut/graphic, then hit **Render final video** (single-pass ffmpeg: frame-accurate trims, animated overlays, EBU R128 loudness).

| Review UI | AI intro | AI concept card |
|---|---|---|
| ![UI](docs/ui-review.png) | ![intro](docs/intro-frame.png) | ![concept](docs/concept-frame.png) |

## Quickstart

```bash
# prerequisites: node >= 24, ffmpeg on PATH
cp .env.example .env        # put SONIOX_API_KEY and OPENROUTER_API_KEY in it
npm install

npm run edit -- path/to/video.mp4    # analyze + open review UI at http://localhost:4321
```

That's it. Review, toggle, render — `output.mp4` lands in the project folder.

### All commands

```bash
npm run analyze -- video.mp4     # AI analysis only (writes the edit plan)
npm run ui -- video.mp4          # review UI for an analyzed video
npm run render -- video.mp4      # headless render from the saved plan
npm run edit -- video.mp4        # analyze + ui

npm run sample                   # generate a synthetic test video (no APIs needed)
npm run edit -- samples/sample.mp4 --mock   # full pipeline offline (mock transcript/specs)
bash scripts/make-speech-sample.sh          # test video with REAL speech (uses Soniox TTS)

npm test                         # timeline-math unit tests
npm run typecheck
```

## How it works

```
video ──ffprobe──▶ probe ──ffmpeg──▶ audio.wav ──Soniox stt-async-v3──▶ word tokens
                                                                            │
        silencedetect (fallback)            utterances ◀── group ───────────┤
                │                               │                           │
                ▼                               ▼                           ▼
        ┌─ silence cuts (timing math) ─┬─ bad-take cuts (LLM) ─┬─ intro copy (LLM)
        │                              │                       │
ffmpeg scene scores ──▶ stale windows ─┴─▶ video clip + transcript ──Gemini (video-native)──▶ element specs (Arabic)
                                                                            │
                       gpt-image-2 illustrations ──▶ RTL SVG templates (Qomra + brand palette) ──resvg──▶ overlay PNGs
                                                                            │
              plan.json ◀───────────── everything lands here ───────────────┘
                  │
        review UI (instant preview, toggles)
                  │
        single ffmpeg pass: trim+concat → fps → animated overlays → loudnorm → output.mp4
```

Everything the AI decides is saved to `projects/<name>/plan.json` — cuts with reasons and confidence, overlay specs, timings. The render is a pure function of that file, so you can hand-edit it too.

## Configuration (.env)

| var | default | |
|---|---|---|
| `SONIOX_API_KEY` | — | required (STT) |
| `OPENROUTER_API_KEY` | — | required (LLM + vision) |
| `SONIOX_MODEL` | `stt-async-v3` | `stt-async-v4` also works |
| `EDIT_MODEL` | `openai/gpt-5-mini` | bad takes + Arabic intro copy |
| `VIDEO_MODEL` | `google/gemini-3.5-flash` | video-native stale-screen analysis |
| `IMAGE_MODEL` | `openai/gpt-5.4-image-2` | backdrop / card illustrations |
| `MAX_IMAGES` | `3` | AI images per video (`0` disables, saves $ and ~2 min/image) |
| `SUBSCRIBE_CARD` | `1` | auto subscribe card near the end (videos ≥ 90 s) |
| `CHANNEL_NAME` | — | name on the subscribe card |
| `FONT_DIR` | `~/.local/share/fonts` | where the Qomra `.ttf` files live |
| `LANGUAGE_HINTS` | `ar,en` | comma-separated |
| `MIN_SILENCE_GAP` | `0.9` | seconds of pause that triggers a cut |
| `STALE_MIN_SECONDS` | `18` | static screen time before a graphic is considered |
| `MAX_GRAPHICS` | `5` | concept overlays per video (intro excluded) |
| `INTRO_SECONDS` | `5` | intro overlay duration |
| `PORT` | `4321` | review UI |
| `MOCK` | `0` | `1` = no API calls (or pass `--mock`) |
| `RENDER_PRESET` / `RENDER_CRF` | `medium` / `18` | x264 settings |

Unknown/renamed OpenRouter models are handled with per-role runtime fallback
chains (text: `gpt-5-mini → gpt-5.4-mini → gemini-3.5-flash`; video:
`gemini-3.5-flash → gemini-3.1-flash-lite`; image: `gpt-5.4-image-2 →
gpt-5-image-mini → gemini-3.1-flash-image-preview`).

## Project folder layout

```
projects/<video>-<hash>/
  plan.json          the edit plan (cuts, overlays, settings) — UI edits this
  transcript.json    word-level transcript
  utterances.json    sentence-level grouping shown in the UI
  preview.mp4        browser-safe proxy (symlink if the source already is)
  overlays/*.png     rendered graphics (transparent, full-frame)
  work/              intermediates (audio.wav, filtergraph.txt, vision frames)
  output.mp4         the final render
```

## Notes & limitations

- See **ASSUMPTIONS.md** for every decision made on your behalf.
- The browser preview skips cuts with ~1-frame precision (rAF-based) — the real render is sample-exact via ffmpeg `trim`/`atrim`.
- Sources that browsers can't play (mkv/hevc/prores…) get an automatic 720p preview proxy; the final render always uses the original.
- Hard cuts at silence midpoints; no audio crossfades (cut points sit in low-energy zones, so clicks are rare).
- Videos with no speech still work: silence cuts fall back to audio energy, graphics still generate (the vision prompt just gets no transcript).
