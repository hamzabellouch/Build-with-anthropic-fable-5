/** Snake — canvas game with speed-up, pause and persistent high score. */
import { h } from '../core/utils';
import { AppManifest, AppContext } from '../core/kernel';
import { icons } from '../icons';

const COLS = 21, ROWS = 21, CELL = 22;

function launchSnake(ctx: AppContext) {
  const canvas = h('canvas', {
    class: 'snake-canvas',
    width: String(COLS * CELL),
    height: String(ROWS * CELL),
    tabindex: '0',
  });
  const g = canvas.getContext('2d')!;
  const scoreEl = h('span', { class: 'snake-score' }, 'Score 0');
  const hiEl = h('span', { class: 'snake-hi' });

  let snake: Array<{ x: number; y: number }> = [];
  let dir = { x: 1, y: 0 };
  let nextDir = { x: 1, y: 0 };
  let food = { x: 5, y: 5 };
  let score = 0;
  let state: 'idle' | 'running' | 'paused' | 'over' = 'idle';
  let lastStep = 0;
  let rafId = 0;

  const loadHi = () => {
    try { return parseInt(localStorage.getItem('fableos.snake-hi') ?? '0', 10) || 0; } catch { return 0; }
  };
  let hi = loadHi();
  hiEl.textContent = `Best ${hi}`;

  const stepMs = () => Math.max(60, 150 - Math.floor(score / 3) * 8);

  function placeFood() {
    do {
      food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (snake.some((s) => s.x === food.x && s.y === food.y));
  }

  function start() {
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    scoreEl.textContent = 'Score 0';
    placeFood();
    state = 'running';
    lastStep = performance.now();
  }

  function step() {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS ||
      snake.some((s) => s.x === head.x && s.y === head.y)) {
      state = 'over';
      if (score > hi) {
        hi = score;
        hiEl.textContent = `Best ${hi}`;
        try { localStorage.setItem('fableos.snake-hi', String(hi)); } catch { /* quota */ }
      }
      return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score++;
      scoreEl.textContent = `Score ${score}`;
      placeFood();
    } else {
      snake.pop();
    }
  }

  function draw() {
    const w = COLS * CELL, hgt = ROWS * CELL;
    g.fillStyle = '#0c1322';
    g.fillRect(0, 0, w, hgt);
    g.fillStyle = '#111b30';
    for (let y = 0; y < ROWS; y++) {
      for (let x = (y % 2); x < COLS; x += 2) {
        g.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
    // food
    g.fillStyle = '#f87171';
    g.beginPath();
    g.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 4, 0, Math.PI * 2);
    g.fill();
    // snake
    snake.forEach((s, i) => {
      const t = i / Math.max(snake.length - 1, 1);
      g.fillStyle = i === 0 ? '#4ade80' : `rgb(${Math.round(52 + t * 10)}, ${Math.round(211 - t * 90)}, ${Math.round(122 - t * 40)})`;
      g.beginPath();
      g.roundRect(s.x * CELL + 1.5, s.y * CELL + 1.5, CELL - 3, CELL - 3, 6);
      g.fill();
    });
    // overlays
    if (state !== 'running') {
      g.fillStyle = 'rgba(5, 9, 18, 0.72)';
      g.fillRect(0, 0, w, hgt);
      g.fillStyle = '#e8ecf3';
      g.textAlign = 'center';
      g.font = '600 26px system-ui, sans-serif';
      const msg = state === 'idle' ? 'SNAKE' : state === 'paused' ? 'Paused' : 'Game over';
      g.fillText(msg, w / 2, hgt / 2 - 18);
      g.font = '14px system-ui, sans-serif';
      g.fillStyle = '#9aa3b2';
      const sub = state === 'paused' ? 'Space to resume'
        : state === 'over' ? `Score ${score} — Space or Enter to play again`
          : 'Arrow keys / WASD to move · Space to pause';
      g.fillText(sub, w / 2, hgt / 2 + 12);
    }
  }

  function loop(t: number) {
    if (state === 'running' && t - lastStep >= stepMs()) {
      lastStep = t;
      step();
    }
    draw();
    rafId = requestAnimationFrame(loop);
  }

  canvas.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    const dirs: Record<string, { x: number; y: number }> = {
      arrowup: { x: 0, y: -1 }, w: { x: 0, y: -1 },
      arrowdown: { x: 0, y: 1 }, s: { x: 0, y: 1 },
      arrowleft: { x: -1, y: 0 }, a: { x: -1, y: 0 },
      arrowright: { x: 1, y: 0 }, d: { x: 1, y: 0 },
    };
    if (dirs[k]) {
      e.preventDefault();
      const d = dirs[k];
      if (state === 'idle') start();
      if (d.x !== -dir.x || d.y !== -dir.y) nextDir = d;
      return;
    }
    if (k === ' ' || k === 'enter') {
      e.preventDefault();
      if (state === 'running') state = 'paused';
      else if (state === 'paused') { state = 'running'; lastStep = performance.now(); }
      else start();
    }
  });
  canvas.addEventListener('click', () => {
    canvas.focus();
    if (state === 'idle' || state === 'over') start();
  });

  ctx.root.append(
    h('div', { class: 'snake' },
      h('div', { class: 'snake-hud' }, scoreEl, hiEl),
      h('div', { class: 'snake-stage' }, canvas),
    ),
  );

  rafId = requestAnimationFrame(loop);
  ctx.onClose(() => cancelAnimationFrame(rafId));
  setTimeout(() => canvas.focus(), 60);
}

export const snakeApp: AppManifest = {
  id: 'snake',
  name: 'Snake',
  icon: icons.snake,
  description: 'Eat, grow, do not bite yourself',
  window: { width: 500, height: 590, minWidth: 500, minHeight: 590, resizable: false },
  launch: launchSnake,
};
