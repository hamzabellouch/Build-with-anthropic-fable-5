// Small DOM widget helpers for the Properties panel.
// Number fields scrub on drag (Blender-style), click to type.

export function section(parent, title, open = true) {
  const sec = document.createElement('div');
  sec.className = 'prop-section' + (open ? '' : ' collapsed');
  const head = document.createElement('div');
  head.className = 'sec-title';
  head.innerHTML = `<span class="tri">${open ? '▼' : '▶'}</span>${title}`;
  const body = document.createElement('div');
  body.className = 'sec-body';
  head.addEventListener('click', () => {
    sec.classList.toggle('collapsed');
    head.querySelector('.tri').textContent = sec.classList.contains('collapsed') ? '▶' : '▼';
  });
  sec.appendChild(head);
  sec.appendChild(body);
  parent.appendChild(sec);
  return body;
}

export function row(parent, label) {
  const r = document.createElement('div');
  r.className = 'prop-row';
  const l = document.createElement('div');
  l.className = 'lbl';
  l.textContent = label;
  const c = document.createElement('div');
  c.className = 'ctl';
  r.appendChild(l);
  r.appendChild(c);
  parent.appendChild(r);
  return c;
}

function fmt(v, int) {
  if (int) return String(Math.round(v));
  const a = Math.abs(v);
  if (a >= 1000) return v.toFixed(1);
  if (a >= 100) return v.toFixed(2);
  return v.toFixed(3);
}

export function numberField(parent, opts) {
  const {
    get, set, commit, step = 0.01, min = -Infinity, max = Infinity,
    int = false, axis = null, tag = null, slider = false, unit = '',
  } = opts;

  const el = document.createElement('div');
  el.className = 'num-field' + (axis ? ` axis-${axis}` : '');
  let fill = null;
  if (slider && Number.isFinite(min) && Number.isFinite(max)) {
    fill = document.createElement('div');
    fill.className = 'fill';
    el.appendChild(fill);
  }
  if (tag) {
    const t = document.createElement('span');
    t.className = 'axis-tag';
    t.textContent = tag;
    el.appendChild(t);
  }
  const val = document.createElement('span');
  val.className = 'val';
  el.appendChild(val);
  parent.appendChild(el);

  const clamp = (v) => Math.min(max, Math.max(min, int ? Math.round(v) : v));

  const refresh = () => {
    const v = get();
    val.textContent = fmt(v, int) + unit;
    if (fill) fill.style.width = `${((v - min) / (max - min)) * 100}%`;
  };

  let drag = null;

  const beginType = () => {
    const input = document.createElement('input');
    input.value = fmt(get(), int).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    el.appendChild(input);
    input.focus();
    input.select();
    const before = get();
    const done = (apply) => {
      input.remove();
      if (apply) {
        const v = parseFloat(input.value);
        if (Number.isFinite(v)) {
          const nv = clamp(v);
          if (nv !== before) {
            set(nv);
            commit && commit(before, nv);
          }
        }
      }
      refresh();
    };
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') done(true);
      if (e.key === 'Escape') done(false);
    });
    input.addEventListener('blur', () => done(true));
  };

  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || el.querySelector('input')) return;
    drag = { startX: e.clientX, startVal: get(), moved: false, id: e.pointerId };
    try { el.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
  });
  el.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    if (!drag.moved && Math.abs(dx) < 3) return;
    drag.moved = true;
    const k = e.shiftKey ? 0.1 : 1;
    set(clamp(drag.startVal + dx * step * k));
    refresh();
  });
  el.addEventListener('pointerup', () => {
    if (!drag) return;
    try { el.releasePointerCapture(drag.id); } catch { /* synthetic events */ }
    const wasDrag = drag.moved;
    const startVal = drag.startVal;
    drag = null;
    if (wasDrag) {
      if (get() !== startVal) commit && commit(startVal, get());
    } else {
      beginType();
    }
  });

  refresh();
  return { el, refresh };
}

export function vec3Field(parent, label, opts) {
  const ctl = row(parent, label);
  const axes = ['x', 'y', 'z'];
  const fields = axes.map((a) =>
    numberField(ctl, {
      ...opts,
      axis: a,
      get: () => opts.get(a),
      set: (v) => opts.set(a, v),
      commit: opts.commit ? (b, v) => opts.commit(a, b, v) : undefined,
    })
  );
  return { refresh: () => fields.forEach((f) => f.refresh()) };
}

export function colorField(parent, label, { get, set, commit }) {
  const ctl = row(parent, label);
  const wrap = document.createElement('div');
  wrap.className = 'color-swatch';
  const input = document.createElement('input');
  input.type = 'color';
  wrap.appendChild(input);
  ctl.appendChild(wrap);
  let before = null;
  const refresh = () => {
    input.value = get();
  };
  input.addEventListener('input', () => {
    if (before === null) before = get();
    set(input.value);
  });
  input.addEventListener('change', () => {
    if (before !== null && before !== input.value) commit && commit(before, input.value);
    before = null;
  });
  refresh();
  return { refresh };
}

export function checkField(parent, label, { get, set }) {
  const ctl = row(parent, label);
  const lab = document.createElement('label');
  lab.className = 'check-row';
  const input = document.createElement('input');
  input.type = 'checkbox';
  lab.appendChild(input);
  ctl.appendChild(lab);
  const refresh = () => {
    input.checked = !!get();
  };
  input.addEventListener('change', () => set(input.checked));
  refresh();
  return { refresh };
}

export function textField(parent, label, { get, set }) {
  const ctl = row(parent, label);
  const input = document.createElement('input');
  input.className = 'text-field';
  input.spellcheck = false;
  ctl.appendChild(input);
  const refresh = () => {
    input.value = get();
  };
  const done = () => {
    if (input.value !== get()) set(input.value);
    refresh();
  };
  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') input.blur();
    if (e.key === 'Escape') {
      refresh();
      input.blur();
    }
  });
  input.addEventListener('blur', done);
  refresh();
  return { refresh };
}

export function buttonRow(parent, label, text, onClick) {
  const ctl = row(parent, label);
  const btn = document.createElement('button');
  btn.className = 'prop-btn';
  btn.textContent = text;
  btn.addEventListener('click', onClick);
  ctl.appendChild(btn);
  return btn;
}

export function note(parent, text) {
  const div = document.createElement('div');
  div.className = 'prop-note';
  div.textContent = text;
  parent.appendChild(div);
}
