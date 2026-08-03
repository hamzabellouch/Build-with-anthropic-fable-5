# Assumptions

The brief said "don't ask questions, assume answers and document what you assumed."
Here is everything that was assumed, and why.

## 2026-06-10 redesign — Arabic brand design system

The follow-up brief: designs were bad/random → use OpenAI's image-2 model and
OpenAI for normal LLMs, use a video-native Google model, all designs in Arabic
and super simple (educational), use the Qomra font and "my colors", and add
preconfigured elements (info card, subscribe card, arrow, highlight).

24. **"OpenAI's image 2 model" → `openai/gpt-5.4-image-2`** — verified live on
    OpenRouter's model list (2026-06-10). Fallbacks `gpt-5-image-mini` then
    `gemini-3.1-flash-image-preview`. Generation goes through chat completions
    with `modalities: ["image","text"]` + `image_config.aspect_ratio` (16:9
    backdrop, 1:1 card illustrations). Measured live: ~$0.06–0.11 and
    **~2 minutes per image** — hence `MAX_IMAGES=3` budget per video and
    `MAX_IMAGES=0` to disable entirely. Within the $10 OpenRouter cap a full
    run costs ≈ $0.20.
25. **"Normal LLMs" → `openai/gpt-5-mini`** for bad takes + intro copy ($0.25/M
    input). Per-role fallback chains replaced the single global chain.
26. **Video-native is now real**: OpenRouter added `video_url` content parts
    (base64 mp4) — the previous build pre-dated this and sent single JPEG
    frames. Stale stretches are now compressed to ≤20 s, 640 px, 8 fps muted
    clips (~hundreds of KB) and `google/gemini-3.5-flash` watches them
    (verified live: 2.1k prompt tokens per clip). Single-frame analysis remains
    as an automatic fallback if a video request fails.
27. **All copy is Arabic regardless of the video's language** (verified live on
    an English-narration sample). The transcript can be any language; prompts
    force Modern Standard Arabic, Arabic-Indic numerals, Latin tech terms kept
    Latin, hard word caps (title ≤ 5, card lines ≤ 4 words). Soniox
    `LANGUAGE_HINTS` default changed `en` → `ar,en`.
28. **The AI no longer picks colors, fonts, icons or layouts.** Designs were
    "random" because each video got an LLM-invented accent. Now everything
    renders from a fixed brand kit (`src/brand.ts`): palette read from Hani's
    waybar/Hyprland theme (`#141929` bg, `#E0E4EC` text, red `#E8364F` →
    orange `#F28A2E` gradient = the Hyprland active-border gradient, yellow
    `#F9C846` for highlights) and the **itf Qomra Arabic** typeface from
    `~/.local/share/fonts` (override: `FONT_DIR`), loaded as explicit `.ttf`
    files into resvg. Falls back to system sans with a warning if missing.
29. **Preconfigured element library** (`src/design.ts`), all RTL-first
    full-frame SVG → PNG: `info-card` (title + ≤3 points + optional AI
    illustration), `lower-third` (term/definition), `arrow` (curved brand
    arrow + ≤3-word label pointing at a normalized x/y the video model picked),
    `highlight` (dims everything except a region + yellow outline),
    `subscribe` (fixed wording, red pill, bell). The model only chooses the
    element, the Arabic words, and the target coordinates — it can also answer
    `"none"` (verified the prompt allows declining; fewer-but-better graphics).
30. **resvg shapes Arabic correctly** (verified by rendering: joined glyphs,
    bidi with inline Latin/digits, all Qomra weights). Letter-spacing is never
    used (it would disconnect Arabic letters); width estimation is per-char
    class calibrated on Qomra; `direction="rtl"` set on every text element.
31. **Image models never render text**: gpt-image output contains NO
    words/letters by prompt (image models mangle Arabic); all type is set
    locally in Qomra. Generated images are style-locked to the brand palette
    via a fixed prompt prefix in `src/pipeline.ts`.
32. **Subscribe card placement is deterministic, not AI**: bottom-left, ~35 s
    before the end, only when the edited video is ≥ 90 s (`SUBSCRIBE_CARD=0`
    disables; `CHANNEL_NAME` personalizes the wording).
33. **Intro is now a full-cover Arabic title card** (backdrop illustration or
    brand wash + veil, deco, centered Qomra-Black title) instead of a scrim
    over footage — and topic chips were dropped ("super simple").

## Stack & architecture

1. **No agent SDK; the "agent" is a pipeline of LLM decision points.** The brief
   allowed "claude agent sdk, pi agent, ai sdk, or whatever". The only keys
   permitted are OpenRouter + Soniox, which rules out the Claude Agent SDK (it
   needs an Anthropic key). I chose plain OpenRouter REST calls orchestrated by
   deterministic TypeScript: video editing needs reproducible, debuggable
   decisions, and a free-roaming tool-use agent adds failure modes without
   adding editing quality. The AI still makes every *creative* decision (what
   is a bad take, what the intro says, what each graphic shows, where it sits);
   code does the mechanical work (timing math, ffmpeg).
2. **TypeScript run natively by Node ≥ 24** (type-stripping) — zero build step,
   `tsc --noEmit` for checking only. Detected Node 26 on this machine.
3. **ffmpeg/ffprobe from PATH** do all media work (8.1 found locally).
4. **`@resvg/resvg-js`** rasterizes AI-designed SVG to transparent PNGs
   (no browser needed at render time); **Express 5** serves the review UI.
5. Two runtime dependencies only (express, resvg) to keep the one-take build low-risk.

## Models

6. **Soniox `stt-async-v3`**: the brief said "stt-v3"; the async variant is the
   file-transcription model. Verified live against `GET /v1/models`
   (`stt-async-v4` exists too — switchable via `SONIOX_MODEL`). API shapes were
   taken from Soniox's published OpenAPI spec and verified with live calls.
7. **"Gemini video seeing vision model" → Gemini through OpenRouter on
   extracted frames.** OpenRouter chat completions don't accept raw video, so
   "video seeing" is implemented as: ffmpeg scene-score sampling finds static
   stretches → one representative frame + the words spoken in that window go to
   `google/gemini-3.5-flash` (newest stable Gemini on OpenRouter as of today,
   verified against the live model list).
8. **`gemini-3.5-flash` (not -pro) is the default editor brain.** Tested live:
   2.5-pro burned its whole completion budget on internal reasoning (truncated
   JSON, 141 s latency). Flash answered the same prompts correctly in 3–8 s.
   I request `reasoning: { effort: "low" }` and treat `finish_reason=length`
   as failure, with a model fallback chain for renamed/retired models.
9. **The user's OpenRouter key has a $10 limit** — defaults stay on flash-tier
   models; a full run on the test video used well under $0.05.

## Editing policy (what a "typical video editor" does)

10. **Silence cuts**: a pause is cut when the gap between transcribed words
    exceeds **0.9 s**, keeping 0.2 s after the last word and 0.15 s before the
    next (cuts breathe; no slamming words together). Lead-in/tail dead air is
    trimmed. If there's no usable transcript, ffmpeg `silencedetect` (−35 dB,
    0.45 s) is the fallback signal.
11. **Bad takes**: when a line is re-recorded, **the last attempt is kept** —
    that's the near-universal convention (people redo until satisfied). The
    LLM cuts at utterance granularity (never mid-sentence), is prompted to be
    conservative, and returns confidence; suggestions below 0.5 are shown in
    the UI but start disabled. Filler words inside otherwise-good sentences are
    NOT cut (word-level um-removal sounds choppy); only pure-filler utterances are.
12. **"Stale screen"**: ≥ 18 s with every sampled scene-change score < 0.08
    (sampled at 2 fps, downscaled). For talking-head video almost everything
    qualifies — that's expected; the budget (max 5 concept graphics, ≥ 25 s
    apart on the output timeline) decides how many actually appear.
13. **"Intense intro, subtle rest"**: the intro is 3 animated layers (gradient
    scrim + parallax decoration + title block with kicker/chips) for ~5 s;
    concept graphics later are a single quiet lower-third or side-card with one
    fade/slide. Concept cards default to the side of the frame the vision model
    judges less important.
14. **Graphics are template-rendered, not free-form LLM SVG**: the model
    returns a constrained design spec (headline, bullets, icon from a built-in
    set, layout, side, duration, accent); typed templates turn it into SVG.
    This guarantees valid, on-brand, legible graphics. The LLM-chosen accent
    color is validated and lightness-clamped; the intro accent carries through
    the whole video for visual consistency.
15. **Overlays are anchored to source time** (except the intro, pinned to
    output 0:00), so toggling cuts in the UI re-flows graphic timing correctly.

## Rendering

16. **Single ffmpeg pass**: `trim/atrim → concat → fps → overlay chain
    (alpha-fade + eased slide via expressions) → loudnorm (I=-16, TP=-1.5,
    LRA=11) → libx264 CRF 18 medium + AAC 192k`. Output fps = source fps (CFR).
17. Overlay PNGs are full-frame transparent images at source resolution —
    the same asset drives both the ffmpeg composite and the browser preview,
    so what you preview is what renders.
18. Hard cuts, no audio crossfades (cut points are inside detected silence).
    Odd-dimension or VFR sources may need a pre-normalize pass (not built).

## Product

19. **One project per input video** under `projects/<basename>-<hash>/`; the
    review server serves a single project (start it per video).
20. The review preview plays the *source* (or an auto proxy when the source
    isn't browser-safe) and simulates the edit client-side; only "Render final
    video" encodes.
21. `--mock` / `MOCK=1` runs the entire pipeline offline (synthetic transcript
    from audio energy, canned specs) — used for tests, demos, CI.
22. Language hints default to English (`LANGUAGE_HINTS` to change).
23. Everything was verified end-to-end on synthetic footage: a TTS-narrated
    sample (Soniox TTS) with a deliberate flubbed take, long pauses and two
    static sections. The live run cut exactly the flub + meta-commentary, kept
    the retake, removed all ≥ 0.9 s pauses (re-checked with silencedetect on
    the output), and the re-transcribed output read as a clean script.
