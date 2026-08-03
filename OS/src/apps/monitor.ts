/** System Monitor — process table, live CPU/memory/FPS charts. */
import { h, formatBytes, formatDuration } from '../core/utils';
import { kernel, AppManifest, AppContext, Process } from '../core/kernel';
import { icons } from '../icons';

class Sparkline {
  data: number[] = new Array(60).fill(0);
  constructor(public canvas: HTMLCanvasElement, private color: string, public max = 100) {}
  push(v: number) {
    this.data.push(Math.min(v, this.max));
    this.data.shift();
    this.draw();
  }
  draw() {
    const g = this.canvas.getContext('2d')!;
    const { width: w, height: hgt } = this.canvas;
    g.clearRect(0, 0, w, hgt);
    g.strokeStyle = this.color + '44';
    g.beginPath();
    for (let i = 1; i <= 3; i++) {
      g.moveTo(0, (hgt / 4) * i);
      g.lineTo(w, (hgt / 4) * i);
    }
    g.lineWidth = 1;
    g.stroke();
    g.beginPath();
    this.data.forEach((v, i) => {
      const x = (i / (this.data.length - 1)) * w;
      const y = hgt - (v / this.max) * (hgt - 4) - 2;
      i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    });
    g.strokeStyle = this.color;
    g.lineWidth = 2;
    g.stroke();
    g.lineTo(w, hgt);
    g.lineTo(0, hgt);
    g.closePath();
    g.fillStyle = this.color + '22';
    g.fill();
  }
}

/** Per-pid simulated CPU load (random walk, looks plausible). */
const cpuSim = new Map<number, number>();
function cpuFor(pid: number): number {
  const cur = cpuSim.get(pid) ?? 2 + Math.random() * 6;
  const next = Math.max(0.1, Math.min(38, cur + (Math.random() - 0.5) * 4));
  cpuSim.set(pid, next);
  return next;
}

function launchMonitor(ctx: AppContext) {
  const cpuCanvas = h('canvas', { width: '560', height: '90' });
  const memCanvas = h('canvas', { width: '560', height: '90' });
  const cpuChart = new Sparkline(cpuCanvas, '#34d399');
  const memChart = new Sparkline(memCanvas, '#818cf8');
  const cpuLabel = h('span', { class: 'mon-val' }, '—');
  const memLabel = h('span', { class: 'mon-val' }, '—');
  const fpsLabel = h('span', { class: 'mon-val' }, '—');
  const upLabel = h('span', { class: 'mon-val' }, '—');
  const tbody = h('tbody');

  ctx.root.append(
    h('div', { class: 'mon' },
      h('div', { class: 'mon-charts' },
        h('div', { class: 'mon-chart' },
          h('div', { class: 'mon-chart-head' }, h('span', null, 'CPU (simulated)'), cpuLabel), cpuCanvas),
        h('div', { class: 'mon-chart' },
          h('div', { class: 'mon-chart-head' }, h('span', null, 'JS heap'), memLabel), memCanvas),
      ),
      h('div', { class: 'mon-stats' },
        h('span', null, 'FPS: ', fpsLabel),
        h('span', null, 'Uptime: ', upLabel),
        h('span', null, 'Threads: ', h('span', { class: 'mon-val' }, String(navigator.hardwareConcurrency ?? '?'))),
      ),
      h('div', { class: 'mon-table-wrap' },
        h('table', { class: 'mon-table' },
          h('thead', null, h('tr', null,
            h('th', null, 'PID'), h('th', null, 'Process'), h('th', null, 'CPU %'),
            h('th', null, 'DOM nodes'), h('th', null, 'Uptime'), h('th', null, ''))),
          tbody,
        ),
      ),
    ),
  );

  /* FPS via rAF */
  let frames = 0;
  let fps = 60;
  let rafId = 0;
  let lastFpsT = performance.now();
  const rafLoop = (t: number) => {
    frames++;
    if (t - lastFpsT >= 1000) {
      fps = frames;
      frames = 0;
      lastFpsT = t;
    }
    rafId = requestAnimationFrame(rafLoop);
  };
  rafId = requestAnimationFrame(rafLoop);

  const update = () => {
    const procs = kernel.processes();
    let totalCpu = 1.5 + Math.random() * 3;
    tbody.innerHTML = '';
    for (const p of procs) {
      const cpu = cpuFor(p.pid);
      totalCpu += cpu;
      const nodes = p.win.content.querySelectorAll('*').length;
      const killBtn = h('button', { class: 'btn small danger' }, 'End');
      killBtn.addEventListener('click', () => kernel.kill(p.pid));
      tbody.append(h('tr', null,
        h('td', null, String(p.pid)),
        h('td', null, h('span', { class: 'mon-proc-icon', html: p.app.icon }), p.app.name),
        h('td', null, cpu.toFixed(1)),
        h('td', null, String(nodes)),
        h('td', null, formatDuration(Date.now() - p.started)),
        h('td', null, killBtn),
      ));
    }
    for (const pid of [...cpuSim.keys()]) {
      if (!procs.some((p: Process) => p.pid === pid)) cpuSim.delete(pid);
    }
    totalCpu = Math.min(100, totalCpu);
    cpuChart.push(totalCpu);
    cpuLabel.textContent = `${totalCpu.toFixed(0)}%`;

    const mem = (performance as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    if (mem) {
      const pct = (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100;
      memChart.max = 100;
      memChart.push(Math.max(pct, 1));
      memLabel.textContent = formatBytes(mem.usedJSHeapSize);
    } else {
      const fake = 30 + Math.sin(Date.now() / 9000) * 10 + Math.random() * 3;
      memChart.push(fake);
      memLabel.textContent = 'n/a';
    }
    fpsLabel.textContent = String(fps);
    upLabel.textContent = formatDuration(kernel.uptime());
  };

  update();
  const interval = setInterval(update, 1000);
  ctx.onClose(() => {
    clearInterval(interval);
    cancelAnimationFrame(rafId);
  });
}

export const monitorApp: AppManifest = {
  id: 'monitor',
  name: 'System Monitor',
  icon: icons.monitor,
  description: 'Processes, CPU, memory and FPS',
  window: { width: 640, height: 540, minWidth: 480, minHeight: 360 },
  launch: launchMonitor,
};
