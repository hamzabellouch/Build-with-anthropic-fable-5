// Settings panel (Esc). Schema-driven rows -> live-applied to the running
// sim; persisted to localStorage.

export class Store {
  constructor(ns) { this.ns = ns; }
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(this.ns + ':' + key);
      return v == null ? fallback : JSON.parse(v);
    } catch { return fallback; }
  }
  set(key, val) {
    try { localStorage.setItem(this.ns + ':' + key, JSON.stringify(val)); } catch { }
  }
}

export class Menu {
  constructor(el, app) {
    this.el = el;
    this.app = app;
    this.open = false;
  }

  toggle(force) {
    this.open = force ?? !this.open;
    this.el.classList.toggle('open', this.open);
    if (this.open) this.render();
  }

  row(label, inputHtml, valueId = '') {
    return `<div class="row"><label>${label}</label>${inputHtml}${valueId ? `<span class="val" id="${valueId}"></span>` : ''}</div>`;
  }

  render() {
    const a = this.app;
    const cfg = a.sim.cfg;
    const s = [];
    s.push(`<h2>Settings</h2><div class="note">Everything applies live. Esc to close &amp; resume.</div>`);

    s.push(`<h3>Quad</h3>`);
    s.push(this.row('Preset', `<select id="preset">${a.presetList.map(p =>
      `<option value="${p.id}" ${cfg.id === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}</select>`));
    s.push(`<div class="note">${cfg.desc || ''}</div>`);
    s.push(this.row('Flight mode', `<select id="mode"><option value="acro" ${!a.sim.fc.angleMode ? 'selected' : ''}>Acro (rate)</option><option value="angle" ${a.sim.fc.angleMode ? 'selected' : ''}>Angle (self-level)</option></select>`));
    s.push(this.row('Crash damage', `<input type="checkbox" id="damage" ${a.settings.damage ? 'checked' : ''}>`));
    s.push(`<div class="note">ON: hard impacts disarm you until reset — like the field, minus the wallet damage.</div>`);

    s.push(`<h3>Rates (Betaflight "Actual")</h3>`);
    s.push(this.slider('rcenter', 'Center sens °/s', 30, 200, 1, cfg.fc.rates.centerDps));
    s.push(this.slider('rmax', 'Max rate °/s', 200, 1400, 10, cfg.fc.rates.maxDps));
    s.push(this.slider('rexpo', 'Expo', 0, 1, 0.01, cfg.fc.rates.expo));

    s.push(`<h3>PID (normalized)</h3>`);
    s.push(this.slider('pidp', 'P', 0.01, 0.12, 0.001, cfg.fc.pid.rollPitch.P));
    s.push(this.slider('pidi', 'I', 0.05, 0.8, 0.01, cfg.fc.pid.rollPitch.I));
    s.push(this.slider('pidd', 'D', 0, 0.004, 0.0001, cfg.fc.pid.rollPitch.D));
    s.push(this.slider('pidff', 'Feedforward', 0, 0.04, 0.001, cfg.fc.pid.rollPitch.FF));

    s.push(`<h3>Camera</h3>`);
    s.push(this.slider('tilt', 'Cam tilt °', 0, 60, 1, cfg.cam.tiltDeg));
    s.push(this.slider('fov', 'FOV (horizontal) °', 90, 160, 1, cfg.cam.fovH));

    s.push(`<h3>Environment</h3>`);
    s.push(this.slider('wind', 'Wind m/s', 0, 12, 0.5, a.settings.wind));
    s.push(this.slider('gust', 'Gustiness', 0, 4, 0.1, a.settings.gust));

    s.push(`<h3>Input</h3>`);
    const gp = a.input.gamepad();
    s.push(`<div class="note">${gp ? 'Controller: <span class="det">' + gp.id.slice(0, 44) + '</span>' : 'No controller — keyboard active. Plug in your radio (USB joystick mode) and move a stick.'}</div>`);
    if (gp) {
      for (const ch of ['throttle', 'yaw', 'pitch', 'roll'])
        s.push(this.row(ch + ` (axis ${a.input.map.axes[ch]})`, `<button class="small" data-detect="${ch}">Detect: move ${ch}</button>`));
      s.push(this.row('Centered throttle (gamepad)', `<input type="checkbox" id="thrcenter" ${a.input.map.throttleCentered ? 'checked' : ''}>`));
      s.push(this.row('Capture stick centers', `<button class="small" id="calib">Calibrate now</button>`));
      s.push(`<div class="note">Calibrate with both sticks at rest (throttle LOW). Move all sticks to their corners afterwards so ranges are learned.</div>`);
    }
    s.push(this.slider('kbrate', 'Keyboard rate scale', 0.2, 1, 0.05, a.input.kbRateScale));

    s.push(`<h3>HUD / Race</h3>`);
    s.push(this.row('Stick overlay', `<input type="checkbox" id="sticks" ${a.hud.showSticks ? 'checked' : ''}>`));
    s.push(this.row('Race gates', `<input type="checkbox" id="race" ${a.race.enabled ? 'checked' : ''}>`));

    s.push(`<h3>Audio / Graphics</h3>`);
    s.push(this.slider('vol', 'Volume', 0, 1, 0.05, a.sound.volume));
    s.push(this.slider('rscale', 'Render scale', 0.5, 2, 0.25, a.settings.renderScale));

    s.push(`<h3></h3>`);
    s.push(this.row('', `<button class="small" id="resetdef">Reset all to defaults</button>`));

    this.el.innerHTML = s.join('');

    // wire events
    const $ = id => this.el.querySelector('#' + id);
    $('preset').onchange = e => a.setPreset(e.target.value);
    $('mode').onchange = e => { a.sim.fc.angleMode = e.target.value === 'angle'; a.persist(); };
    $('damage').onchange = e => { a.settings.damage = e.target.checked; a.persist(); };

    this.bindSlider('rcenter', v => { cfg.fc.rates.centerDps = v; cfg.fc.ratesYaw.centerDps = v; a.persist(); });
    this.bindSlider('rmax', v => { cfg.fc.rates.maxDps = v; cfg.fc.ratesYaw.maxDps = v; a.persist(); });
    this.bindSlider('rexpo', v => { cfg.fc.rates.expo = v; cfg.fc.ratesYaw.expo = v; a.persist(); });
    this.bindSlider('pidp', v => { cfg.fc.pid.rollPitch.P = v; a.persist(); });
    this.bindSlider('pidi', v => { cfg.fc.pid.rollPitch.I = v; a.persist(); });
    this.bindSlider('pidd', v => { cfg.fc.pid.rollPitch.D = v; a.persist(); });
    this.bindSlider('pidff', v => { cfg.fc.pid.rollPitch.FF = v; a.persist(); });
    this.bindSlider('tilt', v => a.setCamTilt(v));
    this.bindSlider('fov', v => a.setFov(v));
    this.bindSlider('wind', v => { a.settings.wind = v; a.applyWind(); a.persist(); });
    this.bindSlider('gust', v => { a.settings.gust = v; a.applyWind(); a.persist(); });
    this.bindSlider('kbrate', v => { a.input.kbRateScale = v; a.persist(); });
    this.bindSlider('vol', v => { a.sound.volume = v; a.persist(); });
    this.bindSlider('rscale', v => { a.settings.renderScale = v; a.applyRenderScale(); a.persist(); });

    const sticks = $('sticks'); if (sticks) sticks.onchange = e => { a.hud.showSticks = e.target.checked; a.persist(); };
    const race = $('race'); if (race) race.onchange = e => { a.race.enabled = e.target.checked; a.resetRace(); a.persist(); };
    const thrc = $('thrcenter'); if (thrc) thrc.onchange = e => { a.input.map.throttleCentered = e.target.checked; a.input.saveMap(); };
    const calib = $('calib'); if (calib) calib.onclick = () => { a.input.calibrate(); a.hud.message('Centers captured — now move sticks to all corners'); };
    const rd = $('resetdef'); if (rd) rd.onclick = () => a.resetDefaults();
    this.el.querySelectorAll('[data-detect]').forEach(btn => {
      btn.onclick = () => {
        const ch = btn.dataset.detect;
        btn.textContent = 'MOVE ' + ch.toUpperCase() + ' NOW...';
        a.input.startDetect(ch, () => this.render());
      };
    });
  }

  slider(id, label, min, max, step, val) {
    return this.row(label,
      `<input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}">`,
      id + 'v');
  }
  bindSlider(id, fn) {
    const el = this.el.querySelector('#' + id);
    const out = this.el.querySelector('#' + id + 'v');
    if (!el) return;
    const show = () => { if (out) out.textContent = (+el.value).toFixed(el.step.includes('.') ? Math.min(4, el.step.split('.')[1].length) : 0); };
    show();
    el.oninput = () => { show(); fn(+el.value); };
  }
}
