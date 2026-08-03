/**
 * Paint — canvas drawing app. Pen, eraser, shapes, flood fill, eyedropper,
 * undo/redo, save as PNG into the VFS, export to host.
 */
import { h, clamp } from '../core/utils';
import { vfs, homeDir } from '../core/vfs';
import { AppManifest, AppContext } from '../core/kernel';
import { icons } from '../icons';
import { pickFile, confirmDialog, alertDialog } from '../ui/dialogs';
import { notify } from '../ui/notifications';

const W = 960, H = 560;
const PALETTE = [
  '#0f172a', '#64748b', '#ffffff', '#ef4444', '#f97316', '#facc15',
  '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#a16207',
];
type Tool = 'pen' | 'eraser' | 'line' | 'rect' | 'ellipse' | 'fill' | 'pick';

function launchPaint(ctx: AppContext) {
  const canvas = h('canvas', { class: 'paint-canvas', width: String(W), height: String(H) });
  const g = canvas.getContext('2d', { willReadFrequently: true })!;
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, W, H);
  g.lineCap = 'round';
  g.lineJoin = 'round';

  let tool: Tool = 'pen';
  let color = '#0f172a';
  let size = 4;
  let drawing = false;
  let start = { x: 0, y: 0 };
  let last = { x: 0, y: 0 };
  let snapshot: ImageData | null = null;
  const undoStack: string[] = [];
  const redoStack: string[] = [];

  const pushUndo = () => {
    undoStack.push(canvas.toDataURL());
    if (undoStack.length > 25) undoStack.shift();
    redoStack.length = 0;
  };

  const restore = (dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      g.clearRect(0, 0, W, H);
      g.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
  };

  const pos = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return {
      x: clamp(((e.clientX - r.left) / r.width) * W, 0, W - 1),
      y: clamp(((e.clientY - r.top) / r.height) * H, 0, H - 1),
    };
  };

  function floodFill(sx: number, sy: number, fill: string) {
    const data = g.getImageData(0, 0, W, H);
    const px = data.data;
    const idx = (x: number, y: number) => (y * W + x) * 4;
    const sxi = Math.round(sx), syi = Math.round(sy);
    const startIdx = idx(sxi, syi);
    const target = [px[startIdx], px[startIdx + 1], px[startIdx + 2], px[startIdx + 3]];

    const tmp = document.createElement('canvas');
    tmp.width = 1; tmp.height = 1;
    const tg = tmp.getContext('2d')!;
    tg.fillStyle = fill;
    tg.fillRect(0, 0, 1, 1);
    const [fr, fg2, fb, fa] = tg.getImageData(0, 0, 1, 1).data;
    if (target[0] === fr && target[1] === fg2 && target[2] === fb && target[3] === fa) return;

    const match = (i: number) =>
      Math.abs(px[i] - target[0]) < 12 && Math.abs(px[i + 1] - target[1]) < 12 &&
      Math.abs(px[i + 2] - target[2]) < 12 && Math.abs(px[i + 3] - target[3]) < 12;

    const stack = [[sxi, syi]];
    let guard = W * H;
    while (stack.length && guard-- > 0) {
      const [x, y] = stack.pop()!;
      const i = idx(x, y);
      if (x < 0 || y < 0 || x >= W || y >= H || !match(i)) continue;
      px[i] = fr; px[i + 1] = fg2; px[i + 2] = fb; px[i + 3] = fa;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    g.putImageData(data, 0, 0);
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const p = pos(e);
    if (tool === 'fill') { pushUndo(); floodFill(p.x, p.y, color); return; }
    if (tool === 'pick') {
      const d = g.getImageData(Math.round(p.x), Math.round(p.y), 1, 1).data;
      color = `#${[d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
      colorInput.value = color;
      refreshSwatches();
      return;
    }
    pushUndo();
    drawing = true;
    start = p;
    last = p;
    canvas.setPointerCapture(e.pointerId);
    if (tool === 'line' || tool === 'rect' || tool === 'ellipse') {
      snapshot = g.getImageData(0, 0, W, H);
    } else {
      g.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
      g.lineWidth = tool === 'eraser' ? size * 2.5 : size;
      g.beginPath();
      g.moveTo(p.x, p.y);
      g.lineTo(p.x + 0.01, p.y + 0.01);
      g.stroke();
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    const p = pos(e);
    if (tool === 'pen' || tool === 'eraser') {
      g.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
      g.lineWidth = tool === 'eraser' ? size * 2.5 : size;
      g.beginPath();
      g.moveTo(last.x, last.y);
      g.lineTo(p.x, p.y);
      g.stroke();
      last = p;
    } else if (snapshot) {
      g.putImageData(snapshot, 0, 0);
      g.strokeStyle = color;
      g.lineWidth = size;
      g.beginPath();
      if (tool === 'line') {
        g.moveTo(start.x, start.y);
        g.lineTo(p.x, p.y);
      } else if (tool === 'rect') {
        g.rect(Math.min(start.x, p.x), Math.min(start.y, p.y), Math.abs(p.x - start.x), Math.abs(p.y - start.y));
      } else {
        g.ellipse((start.x + p.x) / 2, (start.y + p.y) / 2, Math.abs(p.x - start.x) / 2, Math.abs(p.y - start.y) / 2, 0, 0, Math.PI * 2);
      }
      g.stroke();
    }
  });

  const endStroke = () => { drawing = false; snapshot = null; };
  canvas.addEventListener('pointerup', endStroke);
  canvas.addEventListener('pointercancel', endStroke);

  /* ---- toolbar ---- */
  const toolDefs: Array<[Tool, string, string]> = [
    ['pen', 'Pen', icons.rename],
    ['eraser', 'Eraser', icons.close],
    ['line', 'Line', icons.minimize],
    ['rect', 'Rectangle', icons.maximize],
    ['ellipse', 'Ellipse', icons.minesweeper],
    ['fill', 'Fill', icons.paint],
    ['pick', 'Eyedropper', icons.search],
  ];
  const toolBtns = new Map<Tool, HTMLElement>();
  const toolbar = h('div', { class: 'paint-tools' });
  for (const [t, title, icon] of toolDefs) {
    const b = h('button', { class: `tool-btn${t === tool ? ' active' : ''}`, title, html: icon });
    b.addEventListener('click', () => {
      tool = t;
      toolBtns.forEach((el, key) => el.classList.toggle('active', key === t));
    });
    toolBtns.set(t, b);
    toolbar.append(b);
  }

  toolbar.append(h('span', { class: 'tool-sep' }));
  const sizeInput = h('input', { type: 'range', min: '1', max: '32', value: String(size), class: 'paint-size', title: 'Brush size' });
  sizeInput.addEventListener('input', () => { size = parseInt(sizeInput.value, 10); });
  toolbar.append(sizeInput);

  const swatches = h('div', { class: 'paint-swatches' });
  const refreshSwatches = () => {
    swatches.querySelectorAll('.swatch').forEach((el) => {
      el.classList.toggle('active', (el as HTMLElement).dataset.c === color);
    });
  };
  for (const c of PALETTE) {
    const s = h('button', { class: 'swatch', dataset: { c }, style: { background: c }, title: c });
    s.addEventListener('click', () => { color = c; colorInput.value = c; refreshSwatches(); });
    swatches.append(s);
  }
  const colorInput = h('input', { type: 'color', value: color, class: 'paint-color', title: 'Custom color' });
  colorInput.addEventListener('input', () => { color = colorInput.value; refreshSwatches(); });
  toolbar.append(swatches, colorInput);

  toolbar.append(h('span', { class: 'tool-sep' }));
  const action = (title: string, icon: string, fn: () => void) => {
    const b = h('button', { class: 'tool-btn', title, html: icon });
    b.addEventListener('click', fn);
    toolbar.append(b);
  };
  action('Undo', icons.undo, () => {
    const prev = undoStack.pop();
    if (prev) { redoStack.push(canvas.toDataURL()); restore(prev); }
  });
  action('Redo', icons.redo, () => {
    const next = redoStack.pop();
    if (next) { undoStack.push(canvas.toDataURL()); restore(next); }
  });
  action('Clear canvas', icons.trash, async () => {
    if (await confirmDialog({ title: 'Clear the canvas?', okText: 'Clear', danger: true })) {
      pushUndo();
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, W, H);
    }
  });
  action('Save to Pictures', icons.save, async () => {
    const p = await pickFile({
      mode: 'save', title: 'Save drawing',
      startDir: `${homeDir()}/Pictures`, defaultName: 'drawing.png',
    });
    if (!p) return;
    try {
      vfs.writeFile(p.endsWith('.png') ? p : p + '.png', canvas.toDataURL('image/png'));
      notify({ title: 'Drawing saved', body: p, icon: icons.paint });
    } catch (e) {
      void alertDialog({ title: 'Save failed', body: String(e) });
    }
  });
  action('Download as PNG', icons.download, () => {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'fableos-drawing.png';
    a.click();
  });

  refreshSwatches();
  ctx.root.append(
    h('div', { class: 'paint' },
      toolbar,
      h('div', { class: 'paint-stage' }, canvas),
    ),
  );
}

export const paintApp: AppManifest = {
  id: 'paint',
  name: 'Paint',
  icon: icons.paint,
  description: 'Draw, fill, undo — save art into Pictures',
  multiInstance: true,
  window: { width: 920, height: 640, minWidth: 560, minHeight: 380 },
  launch: launchPaint,
};
