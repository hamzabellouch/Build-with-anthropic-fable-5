/** Calculator with a hand-written recursive-descent expression parser. */
import { h } from '../core/utils';
import { AppManifest, AppContext } from '../core/kernel';
import { icons } from '../icons';

/** Parses + evaluates: numbers, + - * / % ^, parentheses, unary minus. */
export function evaluate(expr: string): number {
  let pos = 0;
  const src = expr.replace(/\s+/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  if (!src) throw new Error('empty expression');

  const peek = () => src[pos];
  const eat = (c: string) => { if (src[pos] !== c) throw new Error(`expected ${c}`); pos++; };

  function parseExpr(): number {
    let v = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = src[pos++];
      const r = parseTerm();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }
  function parseTerm(): number {
    let v = parsePower();
    while (peek() === '*' || peek() === '/' || peek() === '%') {
      const op = src[pos++];
      const r = parsePower();
      if (op === '*') v *= r;
      else if (op === '/') {
        if (r === 0) throw new Error('division by zero');
        v /= r;
      } else v %= r;
    }
    return v;
  }
  function parsePower(): number {
    const base = parseFactor();
    if (peek() === '^') { pos++; return Math.pow(base, parsePower()); }
    return base;
  }
  function parseFactor(): number {
    if (peek() === '-') { pos++; return -parseFactor(); }
    if (peek() === '+') { pos++; return parseFactor(); }
    if (peek() === '(') {
      eat('(');
      const v = parseExpr();
      eat(')');
      return v;
    }
    const m = src.slice(pos).match(/^(\d+\.?\d*|\.\d+)/);
    if (!m) throw new Error(`unexpected '${src[pos] ?? 'end'}'`);
    pos += m[0].length;
    return parseFloat(m[0]);
  }

  const result = parseExpr();
  if (pos !== src.length) throw new Error(`unexpected '${src[pos]}'`);
  if (!Number.isFinite(result)) throw new Error('not a number');
  return result;
}

function formatResult(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return String(n);
  const s = n.toPrecision(12);
  return String(parseFloat(s));
}

function launchCalculator(ctx: AppContext) {
  let expr = '';
  let justEvaluated = false;

  const exprEl = h('div', { class: 'calc-expr' }, ' ');
  const resultEl = h('div', { class: 'calc-result' }, '0');
  const tape = h('div', { class: 'calc-tape' });

  const update = (preview = true) => {
    exprEl.textContent = expr || ' ';
    if (!preview) return;
    try {
      resultEl.classList.remove('err');
      resultEl.textContent = expr ? formatResult(evaluate(expr)) : '0';
    } catch {
      resultEl.textContent = '…';
    }
  };

  const press = (key: string) => {
    if (key === 'C') { expr = ''; justEvaluated = false; update(); return; }
    if (key === '⌫') { expr = expr.slice(0, -1); update(); return; }
    if (key === '=') {
      if (!expr) return;
      try {
        const value = formatResult(evaluate(expr));
        tape.prepend(h('div', { class: 'calc-tape-row' }, `${expr} = ${value}`));
        while (tape.children.length > 30) tape.lastElementChild?.remove();
        resultEl.classList.remove('err');
        resultEl.textContent = value;
        expr = value;
        justEvaluated = true;
        exprEl.textContent = ' ';
      } catch (e) {
        resultEl.classList.add('err');
        resultEl.textContent = (e as Error).message;
      }
      return;
    }
    if (justEvaluated && /[\d.]/.test(key)) expr = '';
    justEvaluated = false;
    expr += key;
    update();
  };

  const LAYOUT: Array<[string, string?]> = [
    ['C', 'fn'], ['(', 'fn'], [')', 'fn'], ['⌫', 'fn'],
    ['7'], ['8'], ['9'], ['÷', 'op'],
    ['4'], ['5'], ['6'], ['×', 'op'],
    ['1'], ['2'], ['3'], ['-', 'op'],
    ['0'], ['.'], ['%', 'op'], ['+', 'op'],
    ['^', 'op'], ['=', 'eq eq-wide'],
  ];

  const pad = h('div', { class: 'calc-pad' });
  for (const [key, cls] of LAYOUT) {
    const b = h('button', { class: `calc-btn ${cls ?? ''}` }, key);
    b.addEventListener('click', () => press(key));
    pad.append(b);
  }

  const root = h('div', { class: 'calc', tabindex: '0' },
    h('div', { class: 'calc-display' }, exprEl, resultEl),
    pad,
    tape,
  );
  ctx.root.append(root);

  root.addEventListener('keydown', (e) => {
    if (/^[\d.+\-*/%^()]$/.test(e.key)) { press(e.key === '*' ? '×' : e.key === '/' ? '÷' : e.key); e.preventDefault(); }
    else if (e.key === 'Enter' || e.key === '=') { press('='); e.preventDefault(); }
    else if (e.key === 'Backspace') press('⌫');
    else if (e.key === 'Escape') press('C');
  });
  setTimeout(() => root.focus(), 60);
}

export const calculatorApp: AppManifest = {
  id: 'calculator',
  name: 'Calculator',
  icon: icons.calculator,
  description: 'Expression calculator with history tape',
  window: { width: 330, height: 540, minWidth: 280, minHeight: 430 },
  launch: launchCalculator,
};
