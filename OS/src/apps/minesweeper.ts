/** Minesweeper — classic rules, first-click safe, flags, chording-free. */
import { h } from '../core/utils';
import { AppManifest, AppContext } from '../core/kernel';
import { icons } from '../icons';

interface Cell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  count: number;
  el: HTMLElement;
}

const LEVELS = {
  beginner: { w: 9, h: 9, mines: 10 },
  intermediate: { w: 16, h: 16, mines: 40 },
  expert: { w: 24, h: 16, mines: 99 },
} as const;
type LevelKey = keyof typeof LEVELS;

const FACES = {
  happy: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#fbbf24"/><circle cx="8.5" cy="10" r="1.4" fill="#1f2937"/><circle cx="15.5" cy="10" r="1.4" fill="#1f2937"/><path d="M8 14.5c1.2 1.6 2.6 2.3 4 2.3s2.8-.7 4-2.3" stroke="#1f2937" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>',
  dead: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#fbbf24"/><path d="M7 8.5l3 3m0-3l-3 3M14 8.5l3 3m0-3l-3 3" stroke="#1f2937" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="16" r="2" fill="none" stroke="#1f2937" stroke-width="1.5"/></svg>',
  cool: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#fbbf24"/><path d="M5.5 9h13l-1 3.4a2.4 2.4 0 01-2.3 1.6h-1.6a2.4 2.4 0 01-2.3-1.6L11 10.5l-.3 1.9a2.4 2.4 0 01-2.3 1.6H6.8a2.4 2.4 0 01-2.3-1.6L5.5 9z" fill="#1f2937"/><path d="M8.5 16.5c1 1.1 2.1 1.7 3.5 1.7s2.5-.6 3.5-1.7" stroke="#1f2937" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>',
};

function launchMinesweeper(ctx: AppContext) {
  let level: LevelKey = 'beginner';
  let grid: Cell[][] = [];
  let started = false;
  let over = false;
  let time = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  let flagsLeft = 0;

  const minesEl = h('span', { class: 'ms-counter' }, '010');
  const timeEl = h('span', { class: 'ms-counter' }, '000');
  const faceBtn = h('button', { class: 'ms-face', html: FACES.happy });
  faceBtn.addEventListener('click', () => reset());

  const levelSel = h('select', { class: 'input ms-level' },
    h('option', { value: 'beginner' }, 'Beginner 9×9'),
    h('option', { value: 'intermediate' }, 'Intermediate 16×16'),
    h('option', { value: 'expert' }, 'Expert 24×16'),
  );
  levelSel.addEventListener('change', () => {
    level = levelSel.value as LevelKey;
    reset();
  });

  const boardEl = h('div', { class: 'ms-board' });
  ctx.root.append(
    h('div', { class: 'ms' },
      h('div', { class: 'ms-top' }, levelSel),
      h('div', { class: 'ms-hud' }, minesEl, faceBtn, timeEl),
      h('div', { class: 'ms-board-wrap' }, boardEl),
    ),
  );

  const fmt = (n: number) => String(Math.max(0, Math.min(999, n))).padStart(3, '0');

  function stopTimer() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function reset() {
    const cfg = LEVELS[level];
    stopTimer();
    started = false;
    over = false;
    time = 0;
    flagsLeft = cfg.mines;
    timeEl.textContent = fmt(0);
    minesEl.textContent = fmt(flagsLeft);
    faceBtn.innerHTML = FACES.happy;
    boardEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = `repeat(${cfg.w}, 26px)`;
    grid = [];
    for (let y = 0; y < cfg.h; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < cfg.w; x++) {
        const el = h('button', { class: 'ms-cell' });
        const cell: Cell = { mine: false, revealed: false, flagged: false, count: 0, el };
        el.addEventListener('click', () => reveal(x, y));
        el.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFlag(x, y);
        });
        row.push(cell);
        boardEl.append(el);
      }
      grid.push(row);
    }
  }

  function plantMines(avoidX: number, avoidY: number) {
    const cfg = LEVELS[level];
    let planted = 0;
    while (planted < cfg.mines) {
      const x = Math.floor(Math.random() * cfg.w);
      const y = Math.floor(Math.random() * cfg.h);
      if (grid[y][x].mine || (Math.abs(x - avoidX) <= 1 && Math.abs(y - avoidY) <= 1)) continue;
      grid[y][x].mine = true;
      planted++;
    }
    for (let y = 0; y < cfg.h; y++) {
      for (let x = 0; x < cfg.w; x++) {
        grid[y][x].count = neighbors(x, y).filter(([nx, ny]) => grid[ny][nx].mine).length;
      }
    }
  }

  function neighbors(x: number, y: number): Array<[number, number]> {
    const cfg = LEVELS[level];
    const out: Array<[number, number]> = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < cfg.w && ny < cfg.h) out.push([nx, ny]);
      }
    }
    return out;
  }

  function reveal(x: number, y: number) {
    if (over) return;
    const cell = grid[y][x];
    if (cell.revealed || cell.flagged) return;
    if (!started) {
      started = true;
      plantMines(x, y);
      timer = setInterval(() => { time++; timeEl.textContent = fmt(time); }, 1000);
    }
    if (cell.mine) { lose(x, y); return; }
    flood(x, y);
    checkWin();
  }

  function flood(x: number, y: number) {
    const stack: Array<[number, number]> = [[x, y]];
    while (stack.length) {
      const [cx, cy] = stack.pop()!;
      const cell = grid[cy][cx];
      if (cell.revealed || cell.flagged) continue;
      cell.revealed = true;
      cell.el.classList.add('open');
      if (cell.count > 0) {
        cell.el.textContent = String(cell.count);
        cell.el.dataset.n = String(cell.count);
      } else {
        neighbors(cx, cy).forEach(([nx, ny]) => {
          if (!grid[ny][nx].revealed) stack.push([nx, ny]);
        });
      }
    }
  }

  function toggleFlag(x: number, y: number) {
    if (over) return;
    const cell = grid[y][x];
    if (cell.revealed) return;
    cell.flagged = !cell.flagged;
    cell.el.classList.toggle('flag', cell.flagged);
    cell.el.textContent = cell.flagged ? '⚑' : '';
    flagsLeft += cell.flagged ? -1 : 1;
    minesEl.textContent = fmt(flagsLeft);
  }

  function lose(hitX: number, hitY: number) {
    over = true;
    stopTimer();
    faceBtn.innerHTML = FACES.dead;
    grid.forEach((row, y) => row.forEach((cell, x) => {
      if (cell.mine) {
        cell.el.classList.add('open', 'mine');
        cell.el.textContent = '✸';
        if (x === hitX && y === hitY) cell.el.classList.add('hit');
      } else if (cell.flagged) {
        cell.el.classList.add('wrong');
      }
    }));
  }

  function checkWin() {
    const cfg = LEVELS[level];
    const unrevealed = grid.flat().filter((c) => !c.revealed).length;
    if (unrevealed === cfg.mines) {
      over = true;
      stopTimer();
      faceBtn.innerHTML = FACES.cool;
      grid.flat().forEach((c) => {
        if (c.mine && !c.flagged) {
          c.el.classList.add('flag');
          c.el.textContent = '⚑';
        }
      });
      minesEl.textContent = fmt(0);
    }
  }

  ctx.onClose(stopTimer);
  reset();
}

export const minesweeperApp: AppManifest = {
  id: 'minesweeper',
  name: 'Minesweeper',
  icon: icons.minesweeper,
  description: 'The classic. First click is always safe',
  window: { width: 420, height: 520, minWidth: 320, minHeight: 380 },
  launch: launchMinesweeper,
};
