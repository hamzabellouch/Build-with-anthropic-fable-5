/* ============================================================================
   The Spread of Islam — interactive globe
   D3 orthographic projection on <canvas>; all data local, no network needed.
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------ constants */
  const YEAR_MIN = 610, YEAR_MAX = 2026;
  const PLAY_YEARS_PER_SEC = 22;
  const SPEEDS = [0.5, 1, 2, 4];
  const COLORS = {
    ocean0: "#17263f", ocean1: "#0b1322",
    land: "#2b3140", coast: "rgba(255,255,255,0.25)",
    graticule: "rgba(255,255,255,0.045)",
    core: "rgba(47,191,113,0.60)", coreStroke: "rgba(150,240,190,0.40)",
    light: "rgba(47,191,113,0.26)", faint: "rgba(47,191,113,0.13)",
    gold: "#e3b341"
  };

  /* ------------------------------------------------------------- data prep */
  const H = window.HISTORY;
  const topo = window.WORLD_TOPO;

  const countriesFC = topojson.feature(topo, topo.objects.countries);
  const countries = countriesFC.features;
  const land = topo.objects.land
    ? topojson.feature(topo, topo.objects.land)
    : { type: "Feature", properties: {}, geometry: topojson.merge(topo, topo.objects.countries.geometries) };
  const borders = topojson.mesh(topo, topo.objects.countries, (a, b) => a !== b);
  const coast = topo.objects.land
    ? topojson.mesh(topo, topo.objects.land)
    : topojson.mesh(topo, topo.objects.countries, (a, b) => a === b);

  // Pre-compute country bounding boxes for cheap hover hit-testing
  const countryBounds = countries.map(f => d3.geoBounds(f));

  // Close + winding-normalize every hand-drawn ring (spherical convention):
  // whichever winding gives area < 2π is the "small polygon" reading we want.
  function normalizeRing(ring) {
    const r = ring.map(p => [+p[0], +p[1]]);
    const a = r[0], b = r[r.length - 1];
    if (a[0] !== b[0] || a[1] !== b[1]) r.push([a[0], a[1]]);
    if (d3.geoArea({ type: "Polygon", coordinates: [r] }) > 2 * Math.PI) r.reverse();
    return r;
  }
  H.regions.forEach(reg => {
    const rings = reg.polys.map(normalizeRing);
    reg.feature = {
      type: "Feature", properties: reg,
      geometry: rings.length === 1
        ? { type: "Polygon", coordinates: [rings[0]] }
        : { type: "MultiPolygon", coordinates: rings.map(r => [r]) }
    };
    if (reg.fade == null) reg.fade = 25;
  });
  H.routes.forEach(rt => { rt.feature = { type: "LineString", coordinates: rt.pts }; });

  const graticule = d3.geoGraticule10();
  const SPHERE = { type: "Sphere" };

  /* ----------------------------------------------------------------- state */
  const state = {
    year: YEAR_MIN,
    playing: false,
    speedIdx: 1,
    rotate: [-43, -22],
    zoom: 1.16,
    autorotate: true,
    dragging: false,
    selEvent: null,        // index into H.events
    hover: null,           // tooltip payload
    anim: null,            // {fromR, toR, fromZ, toZ, t0, dur}
    userTouched: false
  };

  /* ------------------------------------------------------------ DOM handles */
  const canvas = document.getElementById("globe");
  const ctx = canvas.getContext("2d");
  const stage = document.getElementById("stage");
  const tooltip = document.getElementById("tooltip");
  const yearBig = document.getElementById("year-big");
  const eraChip = document.getElementById("era-chip");
  const eraBlurb = document.getElementById("era-blurb");
  const statMuslims = document.getElementById("stat-muslims");
  const statShare = document.getElementById("stat-share");
  const eventsList = document.getElementById("events-list");
  const slider = document.getElementById("year-slider");
  const yearInput = document.getElementById("year-input");
  const playBtn = document.getElementById("play-btn");
  const speedBtn = document.getElementById("speed-btn");
  const spinBtn = document.getElementById("spin-btn");
  const homeBtn = document.getElementById("home-btn");
  const panel = document.getElementById("panel");
  const panelToggle = document.getElementById("panel-toggle");

  /* ----------------------------------------------------------- projection */
  const projection = d3.geoOrthographic().clipAngle(90).precision(0.5);
  const path = d3.geoPath(projection, ctx);
  let W = 0, Hpx = 0, baseScale = 100, DPR = 1;

  function resize() {
    const rect = stage.getBoundingClientRect();
    W = Math.max(rect.width, 100); Hpx = Math.max(rect.height, 100);
    DPR = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(Hpx * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    // keep globe clear of the side panel on wide screens
    const panelW = (W > 920 && !panel.classList.contains("hidden")) ? 330 : 0;
    const cx = (W - panelW) / 2, cy = Hpx / 2;
    baseScale = Math.min(W - panelW, Hpx) / 2 - 18;
    if (baseScale < 60) baseScale = Math.min(W, Hpx) / 2 - 10;
    projection.translate([cx, cy]);
    makeStars();
  }

  /* ---------------------------------------------------------------- stars */
  let stars = [];
  function makeStars() {
    const rng = d3.randomLcg(42);
    stars = d3.range(320).map(() => ({
      x: rng() * W, y: rng() * Hpx,
      r: 0.4 + rng() * 1.1, a: 0.25 + rng() * 0.55, ph: rng() * Math.PI * 2
    }));
  }

  /* ------------------------------------------------------- interpolations */
  function interpAnchors(anchors, y) {
    if (y <= anchors[0][0]) return anchors[0][1];
    for (let i = 1; i < anchors.length; i++) {
      if (y <= anchors[i][0]) {
        const [y0, v0] = anchors[i - 1], [y1, v1] = anchors[i];
        return v0 + (v1 - v0) * (y - y0) / (y1 - y0);
      }
    }
    return anchors[anchors.length - 1][1];
  }
  const muslimsAt = y => interpAnchors(H.muslimsM, y);
  const shareAt = y => 100 * muslimsAt(y) / interpAnchors(H.worldM, y);

  function regionAlpha(reg, year) {
    if (year < reg.start || (reg.end != null && year >= reg.end)) return 0;
    let a = Math.min(1, 0.25 + 0.75 * (year - reg.start) / Math.max(reg.fade, 1));
    if (reg.end != null) a = Math.min(a, Math.max(0.15, (reg.end - year) / 8)); // crisp-ish exit
    return Math.min(a, 1);
  }
  const eraAt = y => H.eras.find(e => y >= e.s && y < e.e) || H.eras[H.eras.length - 1];

  /* -------------------------------------------------------------- drawing */
  function smooth(a, b, x) { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

  function draw(t) {
    const year = state.year;
    projection.rotate([state.rotate[0], state.rotate[1], 0])
              .scale(baseScale * state.zoom);
    const [cx, cy] = projection.translate();
    const R = baseScale * state.zoom;

    ctx.clearRect(0, 0, W, Hpx);

    // stars
    for (const s of stars) {
      ctx.globalAlpha = s.a * (0.7 + 0.3 * Math.sin(t / 900 + s.ph));
      ctx.fillStyle = "#cdd6e4";
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // atmosphere glow
    const glow = ctx.createRadialGradient(cx, cy, R * 0.86, cx, cy, R * 1.16);
    glow.addColorStop(0, "rgba(80,130,200,0)");
    glow.addColorStop(0.72, "rgba(90,150,220,0.16)");
    glow.addColorStop(1, "rgba(90,150,220,0)");
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.16, 0, 6.2832); ctx.fill();

    // ocean sphere
    const og = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.05, cx, cy, R * 1.02);
    og.addColorStop(0, COLORS.ocean0); og.addColorStop(1, COLORS.ocean1);
    ctx.beginPath(); path(SPHERE); ctx.fillStyle = og; ctx.fill();

    // graticule
    ctx.beginPath(); path(graticule);
    ctx.strokeStyle = COLORS.graticule; ctx.lineWidth = 1; ctx.stroke();

    // land
    ctx.beginPath(); path(land);
    ctx.fillStyle = COLORS.land; ctx.fill();

    // ---- historical overlay, clipped to land --------------------------------
    const active = [];
    for (const reg of H.regions) {
      const a = regionAlpha(reg, year);
      if (a > 0) active.push([reg, a]);
    }
    ctx.save();
    ctx.beginPath(); path(land); ctx.clip();

    for (const type of ["faint", "light", "core"]) {
      const full = [], fading = [];
      for (const [reg, a] of active) {
        if (reg.type !== type) continue;
        (a >= 0.999 ? full : fading).push([reg, a]);
      }
      if (full.length) {
        ctx.beginPath();
        for (const [reg] of full) path(reg.feature);
        ctx.fillStyle = COLORS[type]; ctx.fill();
      }
      for (const [reg, a] of fading) {
        ctx.globalAlpha = a;
        ctx.beginPath(); path(reg.feature);
        ctx.fillStyle = COLORS[type]; ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (type === "core" && (full.length || fading.length)) {
        ctx.beginPath();
        for (const [reg] of full) path(reg.feature);
        for (const [reg] of fading) path(reg.feature);
        ctx.strokeStyle = COLORS.coreStroke; ctx.lineWidth = 0.7; ctx.stroke();
      }
    }
    ctx.restore();

    // coast + country borders (borders emerge toward the modern era)
    ctx.beginPath(); path(coast);
    ctx.strokeStyle = COLORS.coast; ctx.lineWidth = 0.6; ctx.stroke();
    const bAlpha = 0.07 + 0.16 * smooth(1840, 1950, year);
    ctx.beginPath(); path(borders);
    ctx.strokeStyle = `rgba(255,255,255,${bAlpha})`; ctx.lineWidth = 0.5; ctx.stroke();

    // trade routes
    for (const rt of H.routes) {
      const a = Math.min(smooth(rt.start, rt.start + 40, year), 1 - smooth(rt.end - 60, rt.end, year));
      if (a <= 0.01) continue;
      ctx.save();
      ctx.beginPath(); path(SPHERE); ctx.clip();
      ctx.beginPath(); path(rt.feature);
      ctx.setLineDash([2, 6]);
      ctx.lineDashOffset = -((t * 0.008) % 8);
      ctx.strokeStyle = `rgba(227,179,65,${0.55 * a})`;
      ctx.lineWidth = 1.3; ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // labels
    const center = [-state.rotate[0], -state.rotate[1]];
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "italic 600 11.5px Georgia, serif";
    for (const lb of H.labels) {
      if (year < lb.s || year > lb.e) continue;
      const a = Math.min(smooth(lb.s, lb.s + 20, year), 1 - smooth(lb.e - 20, lb.e, year));
      if (a <= 0.02) continue;
      if (d3.geoDistance([lb.lon, lb.lat], center) > 1.35) continue;
      const p = projection([lb.lon, lb.lat]);
      if (!p) continue;
      ctx.globalAlpha = a * 0.85;
      ctx.strokeStyle = "rgba(8,12,18,0.85)"; ctx.lineWidth = 3;
      ctx.strokeText(lb.t, p[0], p[1]);
      ctx.fillStyle = "rgba(240,240,235,0.92)";
      ctx.fillText(lb.t, p[0], p[1]);
      ctx.globalAlpha = 1;
    }

    // events
    visibleEventPts.length = 0;
    for (let i = 0; i < H.events.length; i++) {
      const ev = H.events[i];
      const sel = state.selEvent === i;
      if (!sel && (year < ev.y || year > ev.y + 40)) continue;
      if (d3.geoDistance([ev.lon, ev.lat], center) > Math.PI / 2 - 0.02) continue;
      const p = projection([ev.lon, ev.lat]);
      if (!p) continue;
      visibleEventPts.push([p[0], p[1], i]);
      const age = year - ev.y;
      const fade = sel ? 1 : Math.max(0.35, 1 - age / 40);
      const pulse = 0.5 + 0.5 * Math.sin(t / 280 + i);
      // pulse ring
      ctx.beginPath(); ctx.arc(p[0], p[1], (sel ? 7 : 4.5) + pulse * 4, 0, 6.2832);
      ctx.strokeStyle = `rgba(227,179,65,${(sel ? 0.8 : 0.45) * (1 - pulse) * fade + 0.05})`;
      ctx.lineWidth = 1.4; ctx.stroke();
      // dot
      ctx.beginPath(); ctx.arc(p[0], p[1], sel ? 4 : 2.8, 0, 6.2832);
      ctx.fillStyle = sel ? "#ffd56b" : `rgba(227,179,65,${0.55 + 0.45 * fade})`;
      ctx.fill();
      ctx.strokeStyle = "rgba(10,13,19,0.9)"; ctx.lineWidth = 1; ctx.stroke();
    }

    // rim
    ctx.beginPath(); path(SPHERE);
    ctx.strokeStyle = "rgba(160,200,255,0.28)"; ctx.lineWidth = 1.2; ctx.stroke();
  }
  const visibleEventPts = [];

  /* ----------------------------------------------------------- main loop */
  let lastT = 0, lastIntYear = -1, lastEra = null;
  function tick(t) {
    const dt = Math.min((t - lastT) / 1000 || 0.016, 0.1);
    lastT = t;

    if (state.anim) {
      const a = state.anim, k = Math.min(1, (t - a.t0) / a.dur);
      const e = d3.easeCubicInOut(k);
      state.rotate[0] = a.fromR[0] + a.dR[0] * e;
      state.rotate[1] = a.fromR[1] + a.dR[1] * e;
      state.zoom = a.fromZ + (a.toZ - a.fromZ) * e;
      if (k >= 1) state.anim = null;
    } else if (state.autorotate && !state.dragging && !state.playingPausedSpin) {
      state.rotate[0] += dt * 1.5;
    }

    if (state.playing) {
      state.year += dt * PLAY_YEARS_PER_SEC * SPEEDS[state.speedIdx];
      if (state.year >= YEAR_MAX) { state.year = YEAR_MAX; setPlaying(false); }
    }

    const iy = Math.round(state.year);
    if (iy !== lastIntYear) { lastIntYear = iy; syncYearUI(iy); }

    draw(t);
    requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------- year UI */
  const fmtInt = new Intl.NumberFormat("en-US");
  function fmtMuslims(m) {
    if (m < 0.05) return "The first believers — a few thousand";
    if (m < 1) return `≈ ${Math.round(m * 1000)} thousand Muslims`;
    if (m < 1000) return `≈ ${m < 10 ? m.toFixed(1) : fmtInt.format(Math.round(m))} million Muslims`;
    return `≈ ${(m / 1000).toFixed(2).replace(/0$/, "")} billion Muslims`;
  }
  function fmtShare(s) {
    if (s < 0.01) return "a new faith in Mecca";
    if (s < 0.1) return `≈ ${s.toFixed(2)}% of humanity`;
    if (s < 1) return `≈ ${s.toFixed(1)}% of humanity`;
    return `≈ ${Math.round(s)}% of humanity`;
  }

  function syncYearUI(iy) {
    yearBig.textContent = iy;
    if (document.activeElement !== yearInput) yearInput.value = iy;
    if (+slider.value !== iy) slider.value = iy;

    const era = eraAt(iy);
    if (era !== lastEra) {
      lastEra = era;
      eraChip.textContent = era.name;
      eraChip.style.borderColor = era.color;
      eraChip.style.color = era.color;
      eraBlurb.textContent = era.blurb;
      [...eraStrip.children].forEach((seg, i) => seg.classList.toggle("current", H.eras[i] === era));
    }
    statMuslims.textContent = fmtMuslims(muslimsAt(iy));
    statShare.textContent = fmtShare(shareAt(iy));
    sparkMarker.setAttribute("cx", sparkX(iy));
    sparkMarker.setAttribute("cy", sparkY(shareAt(iy)));
    renderEvents(iy);
  }

  function setYear(y, fromSlider) {
    state.year = Math.max(YEAR_MIN, Math.min(YEAR_MAX, y));
    if (!fromSlider) slider.value = Math.round(state.year);
  }

  /* --------------------------------------------------------- events panel */
  let lastEvKey = "";
  function renderEvents(iy) {
    const items = [];
    for (let i = H.events.length - 1; i >= 0; i--) {
      const ev = H.events[i];
      if (ev.y <= iy && ev.y >= iy - 60) items.push(i);
      if (items.length >= 7) break;
    }
    const key = items.join(",") + "|" + state.selEvent;
    if (key === lastEvKey) return;
    lastEvKey = key;
    if (state.selEvent != null && !items.includes(state.selEvent)) state.selEvent = null;
    if (!items.length) {
      eventsList.innerHTML = `<div class="ev-empty">No recorded events in the last 60 years — drag the timeline onward…</div>`;
      return;
    }
    eventsList.innerHTML = items.map(i => {
      const ev = H.events[i];
      return `<div class="ev${state.selEvent === i ? " sel" : ""}" data-i="${i}">
        <span class="ev-y">${ev.y}</span> <span class="ev-t">${ev.t}</span>
        <div class="ev-d">${ev.d}</div></div>`;
    }).join("");
  }
  eventsList.addEventListener("click", e => {
    const el = e.target.closest(".ev"); if (!el) return;
    const i = +el.dataset.i;
    state.selEvent = (state.selEvent === i) ? null : i;
    lastEvKey = "";
    renderEvents(Math.round(state.year));
    if (state.selEvent != null) flyTo(H.events[i].lon, H.events[i].lat);
  });

  function flyTo(lon, lat, zoom) {
    const toR = [-lon, -Math.max(-65, Math.min(65, lat))];
    const dL = ((toR[0] - state.rotate[0] + 540) % 360) - 180;
    state.anim = {
      fromR: [...state.rotate], dR: [dL, toR[1] - state.rotate[1]],
      fromZ: state.zoom, toZ: zoom || Math.max(state.zoom, 1.3),
      t0: performance.now(), dur: 950
    };
  }

  /* ------------------------------------------------------------ sparkline */
  const spark = document.getElementById("sparkline");
  const sparkX = y => ((y - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * 280;
  const sparkY = s => 40 - (s / 27) * 36;
  let sparkMarker;
  (function buildSpark() {
    let dArea = `M0,42 `, dLine = "";
    for (let y = YEAR_MIN; y <= YEAR_MAX; y += 8) {
      const x = sparkX(y).toFixed(1), yy = sparkY(shareAt(y)).toFixed(1);
      dArea += `L${x},${yy} `;
      dLine += (dLine ? "L" : "M") + `${x},${yy} `;
    }
    dArea += `L280,42 Z`;
    spark.innerHTML =
      `<path d="${dArea}" fill="rgba(47,191,113,0.12)"></path>
       <path d="${dLine}" fill="none" stroke="rgba(47,191,113,0.85)" stroke-width="1.5"></path>
       <circle r="3" fill="#e3b341" stroke="#0a0d13" stroke-width="1"></circle>`;
    sparkMarker = spark.querySelector("circle");
  })();

  /* ------------------------------------------------------------ era strip */
  const eraStrip = document.getElementById("era-strip");
  H.eras.forEach(era => {
    const seg = document.createElement("div");
    seg.className = "era-seg";
    seg.style.width = `${(100 * (era.e - era.s)) / (YEAR_MAX - YEAR_MIN)}%`;
    seg.style.background = era.color;
    seg.title = `${era.name} (${era.s}–${era.e})`;
    seg.innerHTML = `<span>${era.name}</span>`;
    seg.addEventListener("click", () => { state.userTouched = true; setYear(era.s + 0.01); });
    eraStrip.appendChild(seg);
  });
  function updateEraLabels() {
    [...eraStrip.children].forEach(seg => {
      seg.firstElementChild.style.display = seg.offsetWidth < 64 ? "none" : "";
    });
  }
  const tickRow = document.getElementById("tick-row");
  [700, 900, 1100, 1300, 1500, 1700, 1900].forEach(y => {
    const el = document.createElement("div");
    el.className = "tick";
    el.style.left = `${(100 * (y - YEAR_MIN)) / (YEAR_MAX - YEAR_MIN)}%`;
    el.textContent = y;
    tickRow.appendChild(el);
  });

  /* ----------------------------------------------------------- transport */
  function setPlaying(p) {
    state.playing = p;
    playBtn.textContent = p ? "❚❚" : "▶";
    playBtn.title = p ? "Pause (space)" : "Play (space)";
  }
  playBtn.addEventListener("click", () => {
    state.userTouched = true;
    if (!state.playing && state.year >= YEAR_MAX - 0.5) state.year = YEAR_MIN;
    setPlaying(!state.playing);
  });
  speedBtn.addEventListener("click", () => {
    state.speedIdx = (state.speedIdx + 1) % SPEEDS.length;
    speedBtn.textContent = `${SPEEDS[state.speedIdx]}×`;
  });
  spinBtn.addEventListener("click", () => {
    state.autorotate = !state.autorotate;
    spinBtn.classList.toggle("active", state.autorotate);
  });
  homeBtn.addEventListener("click", () => {
    state.anim = null;
    flyTo(43, 24, 1.16);
    state.anim.toZ = 1.16;
  });
  slider.addEventListener("input", () => { state.userTouched = true; setYear(+slider.value, true); });
  yearInput.addEventListener("change", () => { state.userTouched = true; setYear(+yearInput.value || YEAR_MIN); yearInput.blur(); });

  /* -------------------------------------------------------- globe gestures */
  const pointers = new Map();
  let lastPinchDist = 0;

  canvas.addEventListener("pointerdown", e => {
    state.userTouched = true;
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (pointers.size === 1) {
      state.dragging = true; state.anim = null;
      canvas.classList.add("dragging");
      dragMoved = 0;
    } else if (pointers.size === 2) {
      const pts = [...pointers.values()];
      lastPinchDist = Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]);
    }
  });
  let dragMoved = 0;
  canvas.addEventListener("pointermove", e => {
    if (pointers.has(e.pointerId)) {
      const prev = pointers.get(e.pointerId);
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
      if (pointers.size === 1 && state.dragging) {
        const k = 78 / projection.scale();
        state.rotate[0] += (e.clientX - prev[0]) * k;
        state.rotate[1] = Math.max(-89, Math.min(89, state.rotate[1] - (e.clientY - prev[1]) * k));
        dragMoved += Math.abs(e.clientX - prev[0]) + Math.abs(e.clientY - prev[1]);
        if (dragMoved > 3) state.autorotate = false, spinBtn.classList.remove("active");
      } else if (pointers.size === 2) {
        const pts = [...pointers.values()];
        const d = Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]);
        if (lastPinchDist > 0) state.zoom = clampZoom(state.zoom * d / lastPinchDist);
        lastPinchDist = d;
      }
    } else {
      queueHover(e);
    }
  });
  function endPointer(e) {
    pointers.delete(e.pointerId);
    if (pointers.size === 0) {
      if (state.dragging && dragMoved <= 3) handleClick(e); // a tap, not a drag
      state.dragging = false;
      canvas.classList.remove("dragging");
    }
    lastPinchDist = 0;
  }
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);
  canvas.addEventListener("pointerleave", () => { hideTip(); });

  const clampZoom = z => Math.max(0.7, Math.min(9, z));
  canvas.addEventListener("wheel", e => {
    e.preventDefault();
    state.userTouched = true;
    state.zoom = clampZoom(state.zoom * Math.exp(-e.deltaY * 0.0012));
  }, { passive: false });

  /* ----------------------------------------------------- hover & clicking */
  let hoverTimer = null, lastHoverEvt = null;
  function queueHover(e) {
    lastHoverEvt = e;
    if (!hoverTimer) hoverTimer = setTimeout(processHover, 70);
  }
  function canvasPos(e) {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }
  function nearestEvent(x, y) {
    let best = null, bd = 14 * 14;
    for (const [px, py, i] of visibleEventPts) {
      const d = (px - x) ** 2 + (py - y) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }
  function processHover() {
    hoverTimer = null;
    if (!lastHoverEvt || state.dragging) return;
    const [x, y] = canvasPos(lastHoverEvt);
    const year = Math.round(state.year);

    const evIdx = nearestEvent(x, y);
    if (evIdx != null) {
      const ev = H.events[evIdx];
      showTip(x, y, `<div class="tt-name"><span class="tt-gold">${ev.y}</span> · ${ev.t}</div><div class="tt-sub">Click to read more</div>`);
      canvas.style.cursor = "pointer";
      return;
    }
    canvas.style.cursor = "";

    const ll = projection.invert([x, y]);
    const center = [-state.rotate[0], -state.rotate[1]];
    if (!ll || isNaN(ll[0]) || d3.geoDistance(ll, center) > Math.PI / 2) { hideTip(); return; }

    // region hit: prefer the most recently established active layer
    let hit = null;
    for (const reg of H.regions) {
      if (regionAlpha(reg, year) <= 0) continue;
      if (d3.geoContains(reg.feature, ll) && (!hit || reg.start > hit.start)) hit = reg;
    }
    // country (modern era only)
    let countryLine = "";
    if (year >= 1985) {
      for (let i = 0; i < countries.length; i++) {
        const b = countryBounds[i];
        if (b[0][0] <= b[1][0] && (ll[0] < b[0][0] || ll[0] > b[1][0] || ll[1] < b[0][1] || ll[1] > b[1][1])) continue;
        if (d3.geoContains(countries[i], ll)) {
          const name = countries[i].properties.name;
          const pct = H.countryPct[name];
          countryLine = `<div class="tt-sub">${name}${pct != null ? ` · ≈${pct}% Muslim today` : ""}</div>`;
          break;
        }
      }
    }
    if (hit) {
      const kind = hit.type === "core" ? "Muslim rule / majority" : hit.type === "light" ? "Muslim presence & influence" : "Small Muslim minority";
      const when = hit.end ? `${hit.start}–${hit.end}` : `since ${hit.start}`;
      showTip(x, y, `<div class="tt-name">${hit.name}</div><div class="tt-sub">${kind} · ${when} CE</div>${countryLine}`);
    } else if (countryLine) {
      showTip(x, y, countryLine);
    } else hideTip();
  }
  function showTip(x, y, html) {
    tooltip.innerHTML = html;
    tooltip.hidden = false;
    const tw = tooltip.offsetWidth, th = tooltip.offsetHeight;
    tooltip.style.left = `${Math.min(x + 14, W - tw - 8)}px`;
    tooltip.style.top = `${Math.min(y + 14, Hpx - th - 8)}px`;
  }
  function hideTip() { tooltip.hidden = true; }

  function handleClick(e) {
    const [x, y] = canvasPos(e);
    const i = nearestEvent(x, y);
    if (i != null) {
      state.selEvent = (state.selEvent === i) ? null : i;
      if (state.selEvent != null && H.events[i].y > state.year) setYear(H.events[i].y);
      lastEvKey = "";
      renderEvents(Math.round(state.year));
      const el = eventsList.querySelector(`.ev[data-i="${i}"]`);
      if (el) el.scrollIntoView({ block: "nearest" });
    }
  }

  /* ------------------------------------------------------------- keyboard */
  window.addEventListener("keydown", e => {
    if (e.target === yearInput) return;
    if (e.code === "Space") { e.preventDefault(); playBtn.click(); }
    else if (e.key === "ArrowRight") { state.userTouched = true; setYear(Math.round(state.year) + (e.shiftKey ? 10 : 1)); }
    else if (e.key === "ArrowLeft") { state.userTouched = true; setYear(Math.round(state.year) - (e.shiftKey ? 10 : 1)); }
    else if (e.key === "Escape") aboutModal.hidden = true;
  });

  /* ---------------------------------------------------------- modal/panel */
  const aboutModal = document.getElementById("about-modal");
  document.getElementById("about-btn").addEventListener("click", () => aboutModal.hidden = false);
  aboutModal.addEventListener("click", e => {
    if (e.target === aboutModal || e.target.closest(".modal-close")) aboutModal.hidden = true;
  });
  panelToggle.addEventListener("click", () => { panel.classList.toggle("hidden"); resize(); });

  /* ----------------------------------------------------------------- boot */
  window.addEventListener("resize", () => { resize(); updateEraLabels(); });
  resize();
  updateEraLabels();
  syncYearUI(YEAR_MIN);
  requestAnimationFrame(t => { lastT = t; tick(t); });

  // gentle auto-start of the story unless the user already took the wheel
  setTimeout(() => { if (!state.userTouched) setPlaying(true); }, 1400);

  // hooks for tests / power users
  window.__app = {
    state,
    setYear: y => { state.userTouched = true; setPlaying(false); setYear(y); syncYearUI(Math.round(state.year)); },
    setView: (lon, lat, zoom) => {
      state.userTouched = true; state.autorotate = false; spinBtn.classList.remove("active");
      state.anim = null;
      state.rotate[0] = -lon; state.rotate[1] = -Math.max(-89, Math.min(89, lat));
      if (zoom) state.zoom = clampZoom(zoom);
    },
    flyTo
  };
})();
