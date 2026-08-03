/* CutRoom review UI — vanilla JS, no build step.
   Mirrors src/timeline.ts so the in-browser preview matches the final render. */
const $ = (s) => document.querySelector(s);

let plan = null;
let utterances = [];
let dur = 0;
let keeps = [];
let totalOut = 0;
let resolved = []; // scheduled overlays on the output timeline
let mode = 'edited';
let layerEls = []; // [{ov, layer, img}]
let saveTimer = null;
let pollTimer = null;

const fmt = (t) => {
  t = Math.max(0, t);
  const m = Math.floor(t / 60);
  return `${m}:${(t - m * 60).toFixed(1).padStart(4, '0')}`;
};
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

/* ---------------- timeline math (port of src/timeline.ts) ---------------- */
function mergeSegs(segs, joinGap = 0) {
  const sorted = segs.filter((s) => s.end > s.start).map((s) => ({ ...s })).sort((a, b) => a.start - b.start);
  const out = [];
  for (const s of sorted) {
    const last = out[out.length - 1];
    if (last && s.start - last.end <= joinGap) last.end = Math.max(last.end, s.end);
    else out.push(s);
  }
  return out;
}
function cutsToKeeps(cuts, duration, minKeep) {
  const merged = mergeSegs(cuts.map((c) => ({ start: clamp(c.startS, 0, duration), end: clamp(c.endS, 0, duration) })), 0.001);
  let ks = [];
  let cursor = 0;
  for (const c of merged) {
    if (c.start > cursor) ks.push({ start: cursor, end: c.start });
    cursor = Math.max(cursor, c.end);
  }
  if (cursor < duration) ks.push({ start: cursor, end: duration });
  ks = ks.filter((k) => k.end - k.start >= minKeep);
  return ks.length ? ks : [{ start: 0, end: duration }];
}
function outDuration(ks) {
  return ks.reduce((a, k) => a + (k.end - k.start), 0);
}
function srcToOut(ks, t) {
  let acc = 0;
  for (const k of ks) {
    if (t < k.start) return acc;
    if (t <= k.end) return acc + (t - k.start);
    acc += k.end - k.start;
  }
  return acc;
}
function scheduleOverlays(overlays, ks, minGap = 1.5) {
  const total = outDuration(ks);
  const out = [];
  const intro = overlays.find((o) => o.enabled && o.kind === 'intro');
  if (intro) out.push({ ov: intro, startOut: 0, endOut: Math.min(intro.durationS, Math.max(1, total - 0.2)) });
  const introEnd = out.length ? out[0].endOut : 0;
  const concepts = overlays
    .filter((o) => o.enabled && o.kind === 'concept')
    .map((o) => ({ o, start: o.anchorSpace === 'source' ? srcToOut(ks, o.anchorS) : o.anchorS }))
    .sort((a, b) => a.start - b.start);
  let prevEnd = introEnd + 0.8;
  for (const { o, start } of concepts) {
    const s = Math.max(start, prevEnd + (out.length > 1 ? minGap : 0));
    let e = s + o.durationS;
    if (s >= total - 3 || e > total - 0.2) {
      e = Math.min(e, total - 0.2);
      if (e - s < 3) continue;
    }
    out.push({ ov: o, startOut: s, endOut: e });
    prevEnd = e;
  }
  return out;
}

/* ---------------- state recompute ---------------- */
function recompute() {
  const enabled = plan.cuts.filter((c) => c.enabled);
  keeps = cutsToKeeps(enabled, dur, plan.settings.minKeepSegment);
  totalOut = outDuration(keeps);
  resolved = scheduleOverlays(plan.overlays, keeps);

  $('#statOrig').textContent = fmt(dur);
  $('#statEdited').textContent = fmt(totalOut);
  const saved = dur - totalOut;
  $('#statSaved').textContent = `${fmt(saved)} (${dur ? Math.round((saved / dur) * 100) : 0}%)`;
  $('#statCuts').textContent = `${enabled.length} / ${plan.cuts.length}`;
  $('#statGfx').textContent = `${resolved.length} / ${plan.overlays.length}`;

  buildStrip();
  refreshRowStates();
  buildOverlayImgs();
}

/* ---------------- timeline strip ---------------- */
function buildStrip() {
  const strip = $('#strip');
  strip.querySelectorAll('.seg, .gfx-marker').forEach((el) => el.remove());
  for (const c of plan.cuts) {
    const el = document.createElement('div');
    el.className = `seg ${c.enabled ? 'cut' : 'cut-off'}`;
    el.style.left = `${(c.startS / dur) * 100}%`;
    el.style.width = `${(Math.max(0.15, c.endS - c.startS) / dur) * 100}%`;
    el.title = `${c.kind}: ${c.reason} (${fmt(c.startS)}–${fmt(c.endS)})${c.enabled ? '' : ' — disabled'}`;
    strip.appendChild(el);
  }
  for (const o of plan.overlays) {
    const el = document.createElement('div');
    el.className = `gfx-marker${o.enabled ? '' : ' off'}`;
    const src = o.kind === 'intro' ? (keeps[0] ? keeps[0].start : 0) : o.anchorS;
    el.style.left = `${(src / dur) * 100}%`;
    el.title = `${o.id}: ${o.spec.title || o.spec.headline || ''}`;
    strip.appendChild(el);
  }
}

/* ---------------- sidebar: cuts ---------------- */
const GROUPS = [
  { title: 'Pacing — silences', kinds: ['silence', 'lead', 'tail'] },
  { title: 'Takes & content (AI)', kinds: ['retake', 'false-start', 'filler', 'mistake'] },
];

function buildCutsList() {
  const root = $('#cutsList');
  root.innerHTML = '';
  if (!plan.cuts.length) {
    root.innerHTML = '<div class="empty">No cuts proposed — nice clean take!</div>';
    return;
  }
  for (const g of GROUPS) {
    const cuts = plan.cuts.filter((c) => g.kinds.includes(c.kind)).sort((a, b) => a.startS - b.startS);
    if (!cuts.length) continue;
    const head = document.createElement('div');
    head.className = 'group-head';
    head.innerHTML = `<span>${g.title} · ${cuts.length}</span>`;
    const btn = document.createElement('button');
    btn.textContent = 'toggle all';
    btn.onclick = () => {
      const target = !cuts.every((c) => c.enabled);
      cuts.forEach((c) => (c.enabled = target));
      root.querySelectorAll('input[data-cut]').forEach((cb) => {
        const c = plan.cuts.find((x) => x.id === cb.dataset.cut);
        if (c && g.kinds.includes(c.kind)) cb.checked = c.enabled;
      });
      recompute();
      saveSoon();
    };
    head.appendChild(btn);
    root.appendChild(head);

    for (const c of cuts) {
      const row = document.createElement('div');
      row.className = 'row';
      row.dataset.cutRow = c.id;
      row.innerHTML = `
        <input type="checkbox" data-cut="${c.id}" ${c.enabled ? 'checked' : ''}/>
        <div class="body">
          <div class="line1">
            <span class="badge ${c.kind}">${c.kind}</span>
            <span class="time" data-seek="${c.startS}">${fmt(c.startS)} – ${fmt(c.endS)}</span>
            <span class="dur">−${(c.endS - c.startS).toFixed(1)}s</span>
          </div>
          <div class="reason">${escapeHtml(c.reason)}${c.confidence < 0.99 ? ` · ${(c.confidence * 100).toFixed(0)}%` : ''}</div>
        </div>`;
      row.querySelector('input').onchange = (e) => {
        c.enabled = e.target.checked;
        recompute();
        saveSoon();
      };
      root.appendChild(row);
    }
  }
}

/* ---------------- sidebar: graphics ---------------- */
function buildGfxList() {
  const root = $('#gfxList');
  root.innerHTML = '';
  if (!plan.overlays.length) {
    root.innerHTML = '<div class="empty">No graphics were generated.</div>';
    return;
  }
  for (const o of plan.overlays) {
    const title = o.kind === 'intro' ? o.spec.title : o.spec.headline;
    const sub = o.kind === 'intro' ? o.spec.subtitle : o.spec.sub || (o.note || '');
    const thumb = o.kind === 'intro' ? 'overlays/intro-title.png' : `overlays/${o.layers[0].file}`;
    const row = document.createElement('div');
    row.className = 'row gfx-card';
    row.dataset.gfxRow = o.id;
    row.innerHTML = `
      <div style="display:flex; gap:10px; align-items:flex-start;">
        <input type="checkbox" data-gfx="${o.id}" ${o.enabled ? 'checked' : ''}/>
        <div class="body">
          <div class="line1">
            <span class="badge ${o.kind}">${o.kind}</span>
            <span class="time" data-seek-overlay="${o.id}">${fmt(o.kind === 'intro' ? (keeps[0] ? keeps[0].start : 0) : o.anchorS)}</span>
            <span class="dur">${o.durationS.toFixed(0)}s</span>
          </div>
          <div class="reason">${escapeHtml(title || '')}${sub ? ` — ${escapeHtml(sub)}` : ''}</div>
        </div>
      </div>
      <img class="thumb" loading="lazy" src="/media/${thumb}" alt=""/>`;
    row.querySelector('input').onchange = (e) => {
      o.enabled = e.target.checked;
      recompute();
      saveSoon();
    };
    root.appendChild(row);
  }
}

/* ---------------- sidebar: transcript ---------------- */
function buildTranscript() {
  const root = $('#transcriptList');
  root.innerHTML = '';
  if (!utterances.length) {
    root.innerHTML = '<div class="empty">No speech transcript for this video.</div>';
    return;
  }
  for (const u of utterances) {
    const el = document.createElement('div');
    el.className = 'utt';
    el.dataset.utt = u.idx;
    el.innerHTML = `<span class="t">${fmt(u.startS)}</span>${escapeHtml(u.text)}`;
    el.onclick = () => seekTo(u.startS + 0.01);
    root.appendChild(el);
  }
}

function refreshRowStates() {
  document.querySelectorAll('[data-cut-row]').forEach((row) => {
    const c = plan.cuts.find((x) => x.id === row.dataset.cutRow);
    row.classList.toggle('off', !(c && c.enabled));
  });
  document.querySelectorAll('[data-gfx-row]').forEach((row) => {
    const o = plan.overlays.find((x) => x.id === row.dataset.gfxRow);
    row.classList.toggle('off', !(o && o.enabled));
  });
  const enabled = plan.cuts.filter((c) => c.enabled);
  document.querySelectorAll('.utt').forEach((el) => {
    const u = utterances[Number(el.dataset.utt)];
    const mid = (u.startS + u.endS) / 2;
    el.classList.toggle('cut-out', enabled.some((c) => mid >= c.startS && mid <= c.endS));
  });
}

/* ---------------- overlay preview layers ---------------- */
function buildOverlayImgs() {
  const layer = $('#overlayLayer');
  layer.innerHTML = '';
  layerEls = [];
  for (const r of resolved) {
    for (const l of r.ov.layers) {
      const img = document.createElement('img');
      img.src = `/media/overlays/${l.file}`;
      layer.appendChild(img);
      layerEls.push({ r, anim: l.anim, img });
    }
  }
}

function layerStyle(outT, r, anim) {
  const t0 = r.startOut + anim.delay;
  const fadeIn = Math.max(0.05, anim.fadeIn);
  const fadeOut = Math.max(0.05, anim.fadeOut);
  const outSt = Math.max(t0 + fadeIn + 0.05, r.endOut - fadeOut);
  let a = 0;
  if (outT >= t0 && outT <= r.endOut + 0.05) {
    a = clamp((outT - t0) / fadeIn, 0, 1);
    if (outT > outSt) a = Math.min(a, clamp(1 - (outT - outSt) / fadeOut, 0, 1));
  }
  const p = clamp((outT - t0) / (anim.slideDur > 0.01 ? anim.slideDur : 0.3), 0, 1);
  const ease = Math.pow(1 - p, 3);
  const scale = $('#playerWrap').clientWidth / plan.source.width;
  return { a, dx: (anim.slideX || 0) * ease * scale, dy: (anim.slideY || 0) * ease * scale };
}

/* ---------------- playback loop ---------------- */
const video = () => $('#video');
let lastUttRefresh = 0;

function tick(now) {
  const v = video();
  if (plan) {
    const t = v.currentTime;
    if (mode === 'edited') {
      // skip over enabled cuts
      if (!v.paused && !v.seeking) {
        const inKeep = keeps.find((k) => t >= k.start && t < k.end);
        if (!inKeep) {
          const next = keeps.find((k) => k.start > t);
          if (next) {
            v.currentTime = next.start + 0.01;
            flashSkip();
          } else {
            v.pause();
            v.currentTime = keeps.length ? keeps[keeps.length - 1].end - 0.05 : t;
          }
        }
      }
      const outT = srcToOut(keeps, v.currentTime);
      for (const le of layerEls) {
        const { a, dx, dy } = layerStyle(outT, le.r, le.anim);
        le.img.style.opacity = a.toFixed(3);
        le.img.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
      }
    } else {
      for (const le of layerEls) le.img.style.opacity = '0';
    }
    $('#playhead').style.left = `${(t / dur) * 100}%`;
    if (now - lastUttRefresh > 250) {
      lastUttRefresh = now;
      document.querySelectorAll('.utt').forEach((el) => {
        const u = utterances[Number(el.dataset.utt)];
        el.classList.toggle('now', t >= u.startS && t <= u.endS);
      });
    }
  }
  requestAnimationFrame(tick);
}

let flashTimer = null;
function flashSkip() {
  const el = $('#skipFlash');
  el.classList.add('show');
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => el.classList.remove('show'), 600);
}

function seekTo(t) {
  const v = video();
  v.currentTime = clamp(t, 0, dur - 0.05);
  if (v.paused) v.play().catch(() => {});
}

/* ---------------- persistence ---------------- */
function saveSoon() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const cuts = {};
    const overlays = {};
    plan.cuts.forEach((c) => (cuts[c.id] = c.enabled));
    plan.overlays.forEach((o) => (overlays[o.id] = o.enabled));
    await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cuts, overlays }),
    }).catch(() => {});
  }, 350);
}

/* ---------------- render flow ---------------- */
function setRenderUI(st) {
  const bar = $('#renderBar');
  const title = $('#renderTitle');
  const detail = $('#renderDetail');
  const status = $('#renderStatus');
  if (st.state === 'running') {
    title.textContent = 'Rendering final video…';
    bar.style.width = `${Math.round(st.progress * 100)}%`;
    detail.textContent = `${Math.round(st.progress * 100)}% — single-pass ffmpeg (cuts + graphics + loudness)`;
    status.textContent = `rendering ${Math.round(st.progress * 100)}%`;
    $('#btnCancelRender').classList.remove('hidden');
    $('#btnCloseModal').classList.add('hidden');
    $('#renderPreview').classList.add('hidden');
  } else if (st.state === 'done') {
    title.textContent = 'Render complete';
    bar.style.width = '100%';
    detail.textContent = `output.mp4 · ${fmt(st.outDuration || totalOut)} — saved inside the project folder`;
    status.textContent = 'render done ✓';
    const prev = $('#renderPreview');
    prev.src = `/media/output.mp4?t=${Date.now()}`;
    prev.classList.remove('hidden');
    $('#btnCancelRender').classList.add('hidden');
    $('#btnCloseModal').classList.remove('hidden');
  } else if (st.state === 'error') {
    title.textContent = 'Render failed';
    detail.textContent = st.error || 'unknown error';
    status.textContent = 'render failed';
    $('#btnCancelRender').classList.add('hidden');
    $('#btnCloseModal').classList.remove('hidden');
  }
}

async function pollRender() {
  const st = await (await fetch('/api/render/status')).json();
  setRenderUI(st);
  if (st.state === 'running') pollTimer = setTimeout(pollRender, 700);
}

async function startRenderFlow() {
  $('#renderModal').classList.remove('hidden');
  $('#video').pause();
  const res = await fetch('/api/render', { method: 'POST' });
  if (!res.ok && res.status !== 409) {
    setRenderUI({ state: 'error', error: (await res.json()).error });
    return;
  }
  clearTimeout(pollTimer);
  pollRender();
}

/* ---------------- misc ---------------- */
function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
}

function setMode(m) {
  mode = m;
  $('#modeOriginal').classList.toggle('active', m === 'original');
  $('#modeEdited').classList.toggle('active', m === 'edited');
}

/* ---------------- boot ---------------- */
async function boot() {
  const data = await (await fetch('/api/project')).json();
  plan = data.plan;
  utterances = data.utterances || [];
  dur = plan.source.durationS;

  $('#projectName').textContent = `${plan.project} · ${plan.source.width}×${plan.source.height} · ${plan.mock ? 'mock mode' : plan.models.stt}`;
  const wrap = $('#playerWrap');
  wrap.style.setProperty('--ar', (plan.source.width / plan.source.height).toFixed(4));
  const v = video();
  v.src = `/media/${plan.preview}`;
  v.controls = true;

  buildCutsList();
  buildGfxList();
  buildTranscript();
  recompute();
  if (data.hasOutput) $('#renderStatus').textContent = 'previous render available';

  // tabs
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.onclick = () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.tab-page').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      $(`#tab-${tab.dataset.tab}`).classList.add('active');
    };
  });

  $('#modeOriginal').onclick = () => setMode('original');
  $('#modeEdited').onclick = () => setMode('edited');
  $('#btnRender').onclick = startRenderFlow;
  $('#btnCancelRender').onclick = async () => {
    await fetch('/api/render/cancel', { method: 'POST' }).catch(() => {});
    $('#renderModal').classList.add('hidden');
    $('#renderStatus').textContent = 'render cancelled';
  };
  $('#btnCloseModal').onclick = () => $('#renderModal').classList.add('hidden');

  $('#strip').onclick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    seekTo(((e.clientX - rect.left) / rect.width) * dur);
  };
  document.body.addEventListener('click', (e) => {
    const seek = e.target.closest('[data-seek]');
    if (seek) seekTo(Number(seek.dataset.seek) - 0.4);
    const so = e.target.closest('[data-seek-overlay]');
    if (so) {
      const o = plan.overlays.find((x) => x.id === so.dataset.seekOverlay);
      if (o) seekTo(o.kind === 'intro' ? (keeps[0] ? keeps[0].start : 0) : o.anchorS - 0.4);
    }
  });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !['INPUT', 'BUTTON', 'VIDEO'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      const vv = video();
      vv.paused ? vv.play() : vv.pause();
    }
  });

  requestAnimationFrame(tick);
}

boot().catch((e) => {
  document.body.innerHTML = `<div class="empty" style="margin-top:80px">Failed to load project: ${escapeHtml(e.message)}</div>`;
});
