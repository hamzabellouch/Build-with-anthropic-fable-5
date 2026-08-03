/**
 * FableTerm — terminal emulator running fsh, the Fable shell.
 * Supports pipes, output redirection, &&, quoting, env vars, ~ expansion,
 * tab completion and persistent history.
 */
import { h, Path, escapeHtml, formatBytes, formatDuration, sleep } from '../core/utils';
import { vfs, homeDir } from '../core/vfs';
import { settings } from '../core/settings';
import { kernel, AppManifest, AppContext, KERNEL_VERSION, OS_VERSION, OS_CODENAME } from '../core/kernel';
import { openPath } from '../core/open';
import { icons } from '../icons';
import { panic } from '../ui/boot';
import { showShutdown } from '../ui/boot';

/* ------------------------------------------------------------ shell core */

interface ShellCtx {
  cwd: string;
  setCwd(p: string): void;
  tty: boolean;
  print(text: string, cls?: string): void;
  printHtml(html: string): void;
  clear(): void;
  closeWindow(): void;
}

interface Cmd {
  desc: string;
  usage?: string;
  run(ctx: ShellCtx, args: string[], stdin: string): string | void | Promise<string | void>;
}

interface Token { v: string; q: boolean }

function tokenize(line: string): Token[] {
  const tokens: Token[] = [];
  let cur = '';
  let quote: '"' | "'" | null = null;
  let hasCur = false;
  let curQ = false;
  const push = () => { if (hasCur) { tokens.push({ v: cur, q: curQ }); cur = ''; hasCur = false; curQ = false; } };

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === quote) quote = null;
      else if (c === '\\' && quote === '"' && i + 1 < line.length) { cur += line[++i]; }
      else cur += c;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c as '"' | "'";
      hasCur = true;
      if (c === "'") curQ = true;
      continue;
    }
    if (c === '\\' && i + 1 < line.length) { cur += line[++i]; hasCur = true; continue; }
    if (/\s/.test(c)) { push(); continue; }
    if (c === '|' || c === '>' || c === '&') {
      const two = line.slice(i, i + 2);
      if (two === '>>' || two === '&&') {
        push(); tokens.push({ v: two, q: false }); i++;
        continue;
      }
      if (c === '|' || c === '>') { push(); tokens.push({ v: c, q: false }); continue; }
    }
    cur += c;
    hasCur = true;
  }
  push();
  return tokens;
}

function expand(tok: Token, cwd: string): string {
  if (tok.q) return tok.v;
  let v = tok.v;
  if (v === '~') v = homeDir();
  else if (v.startsWith('~/')) v = homeDir() + v.slice(1);
  v = v.replace(/\$\{?(\w+)\}?/g, (_, name: string) => {
    const env: Record<string, string> = {
      USER: settings.get('username'), HOME: homeDir(),
      HOSTNAME: settings.get('hostname'), PWD: cwd, SHELL: '/bin/fsh',
    };
    return env[name] ?? '';
  });
  return v;
}

const FORTUNES = [
  'The best way to predict the future is to implement it.',
  'There are only two hard things in computer science: cache invalidation, naming things, and off-by-one errors.',
  'A user interface is like a joke. If you have to explain it, it is not that good.',
  'It works on my machine — and this time, your machine IS my machine.',
  'Weeks of coding can save you hours of planning.',
  'Real operating systems ship with games. That is the rule.',
  'Any sufficiently advanced web page is indistinguishable from an operating system.',
  'rm -rf / — just kidding. This file system has guard rails.',
  'The cloud is just someone else’s computer. This OS is just your browser.',
  'First, solve the problem. Then, write the code. Finally, draw the icons.',
];

function flagSplit(args: string[]): { flags: Set<string>; rest: string[] } {
  const flags = new Set<string>();
  const rest: string[] = [];
  for (const a of args) {
    if (a.startsWith('-') && a.length > 1 && !/^-?\d+$/.test(a)) {
      for (const f of a.slice(1)) flags.add(f);
    } else rest.push(a);
  }
  return { flags, rest };
}

function lsLine(name: string, node: { type: string }): string {
  if (node.type === 'dir') return 'dir';
  const ext = Path.ext(name);
  if (name.endsWith('.app')) return 'app';
  if (['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'].includes(ext)) return 'img';
  return '';
}

const commands: Record<string, Cmd> = {
  help: {
    desc: 'List commands, or show help for one',
    usage: 'help [command]',
    run(_ctx, args) {
      if (args[0]) {
        const c = commands[args[0]];
        if (!c) throw new Error(`no such command: ${args[0]}`);
        return `${args[0]} — ${c.desc}\nusage: ${c.usage ?? args[0]}`;
      }
      const names = Object.keys(commands).sort();
      const width = Math.max(...names.map((n) => n.length)) + 2;
      return 'fsh, the Fable shell. Pipes (|), redirection (>, >>), && and tab completion all work.\n\n'
        + names.map((n) => `  ${n.padEnd(width)}${commands[n].desc}`).join('\n');
    },
  },
  man: { desc: 'Alias for help', usage: 'man <command>', run: (c, a, s) => commands.help.run(c, a, s) },
  clear: { desc: 'Clear the screen', run(ctx) { ctx.clear(); } },
  pwd: { desc: 'Print working directory', run: (ctx) => ctx.cwd },
  cd: {
    desc: 'Change directory',
    usage: 'cd [dir]',
    run(ctx, args) {
      const target = args[0] ? Path.resolve(ctx.cwd, args[0]) : homeDir();
      if (!vfs.exists(target)) throw new Error(`no such directory: ${args[0] ?? target}`);
      if (!vfs.isDir(target)) throw new Error(`not a directory: ${args[0]}`);
      ctx.setCwd(target);
    },
  },
  ls: {
    desc: 'List directory contents',
    usage: 'ls [-la] [dir]',
    run(ctx, args) {
      const { flags, rest } = flagSplit(args);
      const target = Path.resolve(ctx.cwd, rest[0] ?? '.');
      const node = vfs.stat(target);
      if (!node) throw new Error(`cannot access '${rest[0] ?? target}': no such file or directory`);
      if (node.type === 'file') return Path.basename(target);
      let entries = vfs.list(target);
      if (!flags.has('a')) entries = entries.filter((e) => !e.name.startsWith('.'));
      if (flags.has('l')) {
        const rows = entries.map(({ name, node: n }) => {
          const t = n.type === 'dir' ? 'd' : '-';
          const size = n.type === 'file' ? formatBytes(n.content.length) : '—';
          const when = new Date(n.mtime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          return `${t}rw-  ${size.padStart(9)}  ${when}  ${name}`;
        });
        return `total ${entries.length}\n` + rows.join('\n');
      }
      if (ctx.tty) {
        const html = entries.map(({ name, node: n }) =>
          `<span class="t-${lsLine(name, n) || 'file'}">${escapeHtml(name)}</span>`).join('  ');
        ctx.printHtml(html || '<span class="t-dim">(empty)</span>');
        return '';
      }
      return entries.map((e) => e.name).join('\n');
    },
  },
  cat: {
    desc: 'Print file contents',
    usage: 'cat <file...>',
    run(ctx, args, stdin) {
      if (!args.length) return stdin;
      return args.map((a) => vfs.readFile(Path.resolve(ctx.cwd, a))).join('\n');
    },
  },
  echo: {
    desc: 'Print arguments',
    usage: 'echo [-n] [text...]',
    run(_ctx, args) {
      const n = args[0] === '-n';
      return (n ? args.slice(1) : args).join(' ') + (n ? '\x00NONL' : '');
    },
  },
  mkdir: {
    desc: 'Create directories',
    usage: 'mkdir [-p] <dir...>',
    run(ctx, args) {
      const { flags, rest } = flagSplit(args);
      if (!rest.length) throw new Error('missing operand');
      for (const a of rest) {
        const p = Path.resolve(ctx.cwd, a);
        if (flags.has('p')) vfs.mkdirp(p);
        else vfs.mkdir(p);
      }
    },
  },
  touch: {
    desc: 'Create empty file / update mtime',
    usage: 'touch <file...>',
    run(ctx, args) {
      if (!args.length) throw new Error('missing operand');
      for (const a of args) vfs.touch(Path.resolve(ctx.cwd, a));
    },
  },
  rm: {
    desc: 'Remove files or directories',
    usage: 'rm [-rf] <path...>',
    run(ctx, args) {
      const { flags, rest } = flagSplit(args);
      if (!rest.length) throw new Error('missing operand');
      for (const a of rest) {
        const p = Path.resolve(ctx.cwd, a);
        if (!vfs.exists(p)) {
          if (flags.has('f')) continue;
          throw new Error(`cannot remove '${a}': no such file or directory`);
        }
        vfs.remove(p, flags.has('r'));
      }
    },
  },
  cp: {
    desc: 'Copy file or directory',
    usage: 'cp <src> <dst>',
    run(ctx, args) {
      if (args.length < 2) throw new Error('usage: cp <src> <dst>');
      const src = Path.resolve(ctx.cwd, args[0]);
      let dst = Path.resolve(ctx.cwd, args[1]);
      if (vfs.isDir(dst)) dst = Path.join(dst, Path.basename(src));
      vfs.copy(src, dst);
    },
  },
  mv: {
    desc: 'Move / rename file or directory',
    usage: 'mv <src> <dst>',
    run(ctx, args) {
      if (args.length < 2) throw new Error('usage: mv <src> <dst>');
      const src = Path.resolve(ctx.cwd, args[0]);
      let dst = Path.resolve(ctx.cwd, args[1]);
      if (vfs.isDir(dst)) dst = Path.join(dst, Path.basename(src));
      vfs.move(src, dst);
    },
  },
  tree: {
    desc: 'Print directory tree',
    usage: 'tree [dir]',
    run(ctx, args) {
      const start = Path.resolve(ctx.cwd, args[0] ?? '.');
      if (!vfs.isDir(start)) throw new Error(`not a directory: ${args[0] ?? start}`);
      const lines: string[] = [start === '/' ? '/' : Path.basename(start)];
      let dirs = 0, files = 0;
      const walk = (p: string, prefix: string, depth: number) => {
        if (depth > 8) return;
        const entries = vfs.list(p);
        entries.forEach(({ name, node }, i) => {
          const last = i === entries.length - 1;
          lines.push(`${prefix}${last ? '└── ' : '├── '}${name}${node.type === 'dir' ? '/' : ''}`);
          if (node.type === 'dir') { dirs++; walk(Path.join(p, name), prefix + (last ? '    ' : '│   '), depth + 1); }
          else files++;
        });
      };
      walk(start, '', 0);
      lines.push('', `${dirs} directories, ${files} files`);
      return lines.join('\n');
    },
  },
  grep: {
    desc: 'Search for a pattern',
    usage: 'grep [-i] <pattern> [file...]',
    run(ctx, args, stdin) {
      const { flags, rest } = flagSplit(args);
      if (!rest.length) throw new Error('usage: grep <pattern> [file...]');
      const [pattern, ...fileArgs] = rest;
      const re = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags.has('i') ? 'i' : '');
      const sources = fileArgs.length
        ? fileArgs.map((f) => vfs.readFile(Path.resolve(ctx.cwd, f)))
        : [stdin];
      const out: string[] = [];
      for (const src of sources) {
        for (const line of src.split('\n')) if (re.test(line)) out.push(line);
      }
      return out.join('\n');
    },
  },
  head: {
    desc: 'First lines of input',
    usage: 'head [-n N] [file]',
    run(ctx, args, stdin) {
      let n = 10;
      const i = args.indexOf('-n');
      if (i >= 0) { n = parseInt(args[i + 1] ?? '10', 10) || 10; args = args.filter((_, j) => j !== i && j !== i + 1); }
      const src = args[0] ? vfs.readFile(Path.resolve(ctx.cwd, args[0])) : stdin;
      return src.split('\n').slice(0, n).join('\n');
    },
  },
  tail: {
    desc: 'Last lines of input',
    usage: 'tail [-n N] [file]',
    run(ctx, args, stdin) {
      let n = 10;
      const i = args.indexOf('-n');
      if (i >= 0) { n = parseInt(args[i + 1] ?? '10', 10) || 10; args = args.filter((_, j) => j !== i && j !== i + 1); }
      const src = args[0] ? vfs.readFile(Path.resolve(ctx.cwd, args[0])) : stdin;
      return src.split('\n').slice(-n).join('\n');
    },
  },
  wc: {
    desc: 'Count lines, words, characters',
    usage: 'wc [file]',
    run(ctx, args, stdin) {
      const src = args[0] ? vfs.readFile(Path.resolve(ctx.cwd, args[0])) : stdin;
      const lines = src.split('\n').length - (src.endsWith('\n') ? 1 : 0);
      const words = src.split(/\s+/).filter(Boolean).length;
      return `${lines}\t${words}\t${src.length}${args[0] ? '\t' + args[0] : ''}`;
    },
  },
  find: {
    desc: 'Find files by name',
    usage: 'find [dir] <name-part>',
    run(ctx, args) {
      if (!args.length) throw new Error('usage: find [dir] <name-part>');
      const base = args.length > 1 ? Path.resolve(ctx.cwd, args[0]) : ctx.cwd;
      const q = args.length > 1 ? args[1] : args[0];
      const found = vfs.find(q, base, 200);
      return found.length ? found.join('\n') : `nothing matching '${q}' under ${base}`;
    },
  },
  date: { desc: 'Print current date and time', run: () => new Date().toString() },
  whoami: { desc: 'Print user name', run: () => settings.get('username') },
  hostname: { desc: 'Print host name', run: () => settings.get('hostname') },
  uname: {
    desc: 'System information',
    usage: 'uname [-a]',
    run(_ctx, args) {
      if (args.includes('-a')) {
        return `FableOS ${settings.get('hostname')} ${KERNEL_VERSION} #1 SMP ${navigator.userAgent.includes('Firefox') ? 'gecko' : 'blink'} web64`;
      }
      return 'FableOS';
    },
  },
  ps: {
    desc: 'List running processes',
    run() {
      const rows = kernel.processes().map((p) =>
        `${String(p.pid).padStart(5)}  ${p.app.id.padEnd(13)}${formatDuration(Date.now() - p.started).padEnd(12)}${p.win.title}`);
      return '  PID  APP          TIME        WINDOW\n' + (rows.join('\n') || '  (none)');
    },
  },
  kill: {
    desc: 'Terminate a process',
    usage: 'kill <pid>',
    run(_ctx, args) {
      const pid = parseInt(args[0], 10);
      if (!pid) throw new Error('usage: kill <pid>');
      if (!kernel.kill(pid)) throw new Error(`no such process: ${pid}`);
      return `process ${pid} terminated`;
    },
  },
  open: {
    desc: 'Open a file or launch an app',
    usage: 'open <path | app-id>',
    run(ctx, args) {
      if (!args[0]) throw new Error('usage: open <path | app-id>');
      const p = Path.resolve(ctx.cwd, args[0]);
      if (vfs.exists(p)) { openPath(p); return; }
      if (kernel.app(args[0])) { void kernel.launch(args[0]); return; }
      throw new Error(`no such file or app: ${args[0]}`);
    },
  },
  apps: {
    desc: 'List installed applications',
    run: () => kernel.listApps().map((a) => `${a.id.padEnd(14)}${a.name.padEnd(16)}${a.description}`).join('\n'),
  },
  edit: {
    desc: 'Open a file in the Editor',
    usage: 'edit <file>',
    run(ctx, args) {
      const p = args[0] ? Path.resolve(ctx.cwd, args[0]) : undefined;
      void kernel.launch('editor', p ? { path: p } : {});
    },
  },
  history: {
    desc: 'Show command history',
    usage: 'history [-c]',
    run(_ctx, args) {
      if (args[0] === '-c') { saveHistory([]); return 'history cleared'; }
      return loadHistory().map((c, i) => `${String(i + 1).padStart(4)}  ${c}`).join('\n') || '(empty)';
    },
  },
  df: {
    desc: 'Storage usage',
    async run() {
      const used = vfs.totalSize();
      let line = `fablefs (IndexedDB)\n  file system size: ${formatBytes(used)} across ${vfs.countFiles()} files`;
      try {
        const est = await navigator.storage.estimate();
        if (est.quota) line += `\n  browser quota:    ${formatBytes(est.usage ?? 0)} used of ${formatBytes(est.quota)}`;
      } catch { /* unsupported */ }
      return line;
    },
  },
  free: {
    desc: 'Memory usage (best effort)',
    run() {
      const mem = (performance as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      if (!mem) return 'memory stats not exposed by this browser';
      return `JS heap: ${formatBytes(mem.usedJSHeapSize)} used / ${formatBytes(mem.jsHeapSizeLimit)} limit`;
    },
  },
  uptime: { desc: 'Time since boot', run: () => `up ${formatDuration(kernel.uptime())}, 1 user, load average: 0.42` },
  sleep: {
    desc: 'Wait N seconds',
    usage: 'sleep <seconds>',
    async run(_ctx, args) {
      await sleep(Math.min(parseFloat(args[0] ?? '1') || 1, 30) * 1000);
    },
  },
  js: {
    desc: 'Evaluate JavaScript',
    usage: 'js <expression>',
    run(_ctx, args, stdin) {
      const src = args.join(' ') || stdin;
      if (!src) throw new Error('usage: js <expression>');
      let result: unknown;
      try {
        result = new Function(`return (${src})`)();
      } catch {
        result = new Function(src)();
      }
      if (result === undefined) return 'undefined';
      if (typeof result === 'function') return String(result);
      return typeof result === 'string' ? result : JSON.stringify(result, null, 1).replace(/\n\s*/g, ' ');
    },
  },
  curl: {
    desc: 'Fetch a URL (subject to CORS)',
    usage: 'curl <url>',
    async run(_ctx, args) {
      if (!args[0]) throw new Error('usage: curl <url>');
      const url = args[0].startsWith('http') ? args[0] : 'https://' + args[0];
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        const text = await res.text();
        return text.length > 64_000 ? text.slice(0, 64_000) + '\n…(truncated)' : text;
      } catch (e) {
        throw new Error(`fetch failed (the target must allow CORS): ${String(e)}`);
      }
    },
  },
  theme: {
    desc: 'Switch UI theme',
    usage: 'theme [dark|light|toggle]',
    run(_ctx, args) {
      const cur = settings.get('theme');
      const next = args[0] === 'toggle' || !args[0] ? (cur === 'dark' ? 'light' : 'dark')
        : args[0] === 'light' ? 'light' : 'dark';
      settings.set('theme', next);
      return `theme set to ${next}`;
    },
  },
  fortune: { desc: 'Words of wisdom', run: () => FORTUNES[Math.floor(Math.random() * FORTUNES.length)] },
  cowsay: {
    desc: 'A cow says things',
    usage: 'cowsay <text>',
    run(_ctx, args, stdin) {
      const msg = (args.join(' ') || stdin.trim() || 'moo').slice(0, 60);
      const border = '-'.repeat(msg.length + 2);
      return [
        ` ${border}`,
        `< ${msg} >`,
        ` ${border}`,
        '        \\   ^__^',
        '         \\  (oo)\\_______',
        '            (__)\\       )\\/\\',
        '                ||----w |',
        '                ||     ||',
      ].join('\n');
    },
  },
  neofetch: {
    desc: 'System info, in style',
    run(ctx) {
      const user = settings.get('username'), host = settings.get('hostname');
      const art = [
        '   ╭─────────╮ ',
        '   │ ╭─────╮ │ ',
        '   │ │  F  │ │ ',
        '   │ ╰─────╯ │ ',
        '   ╰─────────╯ ',
        '    F a b l e  ',
      ];
      const mem = (performance as { memory?: { usedJSHeapSize: number } }).memory;
      const info: Array<[string, string]> = [
        ['OS', `FableOS ${OS_VERSION} (${OS_CODENAME}) web64`],
        ['Kernel', KERNEL_VERSION],
        ['Uptime', formatDuration(kernel.uptime())],
        ['Shell', 'fsh 1.0'],
        ['Resolution', `${window.innerWidth}x${window.innerHeight}`],
        ['DE', 'Aurora'],
        ['WM', 'FableWM'],
        ['Terminal', 'FableTerm'],
        ['CPU', `${navigator.hardwareConcurrency ?? '?'} threads (host)`],
        ['Memory', mem ? formatBytes(mem.usedJSHeapSize) + ' JS heap' : 'n/a'],
        ['Files', `${vfs.countFiles()} on fablefs`],
      ];
      if (!ctx.tty) {
        return info.map(([k, v]) => `${k}: ${v}`).join('\n');
      }
      const lines: string[] = [];
      const head = `<span class="t-accent">${escapeHtml(user)}</span>@<span class="t-accent">${escapeHtml(host)}</span>`;
      lines.push(`<span class="t-logo">${art[0]}</span>  ${head}`);
      lines.push(`<span class="t-logo">${art[1]}</span>  ${'─'.repeat(user.length + host.length + 1)}`);
      info.forEach(([k, v], i) => {
        const a = art[i + 2] ?? ' '.repeat(15);
        lines.push(`<span class="t-logo">${a}</span>  <span class="t-accent">${k}</span>: ${escapeHtml(v)}`);
      });
      const sw = ['#e06c75', '#e5c07b', '#98c379', '#56b6c2', '#61afef', '#c678dd', '#abb2bf']
        .map((c) => `<span style="color:${c}">██</span>`).join('');
      lines.push(`${' '.repeat(15)}  ${sw}`);
      ctx.printHtml(lines.join('\n'));
      return '';
    },
  },
  about: {
    desc: 'About FableOS',
    run: () => `FableOS ${OS_VERSION} "${OS_CODENAME}" — an operating system for your browser.\nKernel ${KERNEL_VERSION} · window manager FableWM · shell fsh\nBuilt from scratch with zero runtime dependencies.`,
  },
  exit: { desc: 'Close this terminal', run(ctx) { ctx.closeWindow(); } },
  reboot: { desc: 'Restart FableOS', run() { kernel.reboot(); } },
  shutdown: { desc: 'Shut down FableOS', run() { showShutdown(); } },
  panic: { desc: 'Trigger a (fake) kernel panic', run() { panic('USER_REQUESTED_DRAMA at fsh.ts:1'); } },
};

/* ------------------------------------------------------------ history */

function loadHistory(): string[] {
  try { return JSON.parse(localStorage.getItem('fableos.history') ?? '[]'); } catch { return []; }
}
function saveHistory(hist: string[]) {
  try { localStorage.setItem('fableos.history', JSON.stringify(hist.slice(-200))); } catch { /* quota */ }
}

/* ------------------------------------------------------------ the app */

function launchTerminal(ctx: AppContext) {
  let cwd = typeof ctx.args.cwd === 'string' && vfs.isDir(ctx.args.cwd) ? ctx.args.cwd : homeDir();
  let history = loadHistory();
  let histIdx = history.length;
  let running = false;

  const out = h('div', { class: 'term-out' });
  const input = h('input', { class: 'term-input', type: 'text', spellcheck: 'false', autocomplete: 'off' });
  const promptEl = h('span', { class: 'term-prompt' });
  const inputLine = h('div', { class: 'term-line' }, promptEl, input);
  const screen = h('div', { class: 'terminal' }, out, inputLine);
  ctx.root.append(screen);

  const cwdDisplay = () => {
    const home = homeDir();
    return cwd === home ? '~' : cwd.startsWith(home + '/') ? '~' + cwd.slice(home.length) : cwd;
  };
  const promptHtml = () =>
    `<span class="t-user">${escapeHtml(settings.get('username'))}@${escapeHtml(settings.get('hostname'))}</span>`
    + `<span class="t-dim">:</span><span class="t-path">${escapeHtml(cwdDisplay())}</span><span class="t-dim">$</span> `;

  const refreshPrompt = () => {
    promptEl.innerHTML = promptHtml();
    ctx.win.setTitle(`${settings.get('username')}@${settings.get('hostname')}: ${cwdDisplay()}`);
  };

  const scroll = () => { screen.scrollTop = screen.scrollHeight; };

  const print = (text: string, cls?: string) => {
    for (const lineText of text.split('\n')) {
      out.append(h('div', { class: `term-row${cls ? ' ' + cls : ''}` }, lineText));
    }
    while (out.children.length > 3000) out.firstElementChild?.remove();
    scroll();
  };
  const printHtml = (html: string) => {
    const div = h('div', { class: 'term-row' });
    div.innerHTML = html;
    out.append(div);
    scroll();
  };

  const shellCtx: ShellCtx = {
    get cwd() { return cwd; },
    setCwd(p: string) { cwd = p; },
    tty: true,
    print,
    printHtml,
    clear() { out.innerHTML = ''; },
    closeWindow() { setTimeout(() => void ctx.win.close(true), 30); },
  };

  async function runSegment(tokens: Token[], stdin: string, tty: boolean): Promise<string> {
    // extract redirection
    let redirect: { path: string; append: boolean } | null = null;
    const words: Token[] = [];
    for (let i = 0; i < tokens.length; i++) {
      if (!tokens[i].q && (tokens[i].v === '>' || tokens[i].v === '>>')) {
        const target = tokens[i + 1];
        if (!target) throw new Error('syntax error: expected file after ' + tokens[i].v);
        redirect = { path: Path.resolve(cwd, expand(target, cwd)), append: tokens[i].v === '>>' };
        i++;
      } else words.push(tokens[i]);
    }
    if (!words.length) return stdin;
    const name = expand(words[0], cwd);
    const cmd = commands[name];
    if (!cmd) throw new Error(`${name}: command not found (try \`help\`)`);
    const args = words.slice(1).map((t) => expand(t, cwd));

    shellCtx.tty = tty && !redirect;
    let result = await cmd.run(shellCtx, args, stdin);
    let output = result ?? '';
    let noNewline = false;
    if (output.endsWith('\x00NONL')) { output = output.slice(0, -5); noNewline = true; }

    if (redirect) {
      const content = output + (noNewline || !output ? '' : '\n');
      if (redirect.append) vfs.appendFile(redirect.path, content);
      else vfs.writeFile(redirect.path, content);
      return '';
    }
    return output;
  }

  async function execute(line: string) {
    const trimmed = line.trim();
    out.append(h('div', { class: 'term-row', html: promptHtml() + escapeHtml(line) }));
    if (!trimmed) { scroll(); return; }
    history.push(trimmed);
    saveHistory(history);
    history = loadHistory();
    histIdx = history.length;

    const chains = [];
    {
      const tokens = tokenize(trimmed);
      let cur: Token[] = [];
      for (const t of tokens) {
        if (!t.q && t.v === '&&') { chains.push(cur); cur = []; }
        else cur.push(t);
      }
      chains.push(cur);
    }

    for (const chain of chains) {
      if (!chain.length) continue;
      const segments: Token[][] = [];
      let cur: Token[] = [];
      for (const t of chain) {
        if (!t.q && t.v === '|') { segments.push(cur); cur = []; }
        else cur.push(t);
      }
      segments.push(cur);

      try {
        let data = '';
        for (let i = 0; i < segments.length; i++) {
          data = await runSegment(segments[i], data, i === segments.length - 1);
        }
        if (data) print(data);
      } catch (e) {
        print(String((e as Error).message ?? e), 't-err');
        break;
      }
    }
    scroll();
  }

  function complete() {
    const value = input.value;
    const beforeCursor = value.slice(0, input.selectionStart ?? value.length);
    const m = beforeCursor.match(/(\S*)$/);
    const partial = m ? m[1] : '';
    const isFirst = beforeCursor.trimStart() === partial;

    let candidates: string[] = [];
    let prefix = partial;
    if (isFirst && !partial.includes('/')) {
      candidates = Object.keys(commands).filter((c) => c.startsWith(partial));
    } else {
      const expanded = partial.startsWith('~') ? partial.replace(/^~/, homeDir()) : partial;
      const dirPart = expanded.includes('/') ? expanded.slice(0, expanded.lastIndexOf('/') + 1) : '';
      const namePart = expanded.slice(dirPart.length);
      const dirPath = Path.resolve(cwd, dirPart || '.');
      prefix = namePart;
      try {
        candidates = vfs.list(dirPath)
          .filter((e) => e.name.startsWith(namePart))
          .map((e) => e.name + (e.node.type === 'dir' ? '/' : ''));
      } catch { candidates = []; }
    }
    if (!candidates.length) return;
    let fill: string;
    if (candidates.length === 1) {
      fill = candidates[0] + (candidates[0].endsWith('/') ? '' : ' ');
    } else {
      let lcp = candidates[0];
      for (const c of candidates) {
        while (!c.startsWith(lcp)) lcp = lcp.slice(0, -1);
      }
      if (lcp.length <= prefix.length) {
        print(candidates.map((c) => c.replace(/ $/, '')).slice(0, 24).join('   '), 't-dim');
        return;
      }
      fill = lcp;
    }
    const newBefore = beforeCursor.slice(0, beforeCursor.length - prefix.length) + fill;
    input.value = newBefore + value.slice(beforeCursor.length);
    input.setSelectionRange(newBefore.length, newBefore.length);
  }

  input.addEventListener('keydown', (e) => {
    if (running) { e.preventDefault(); return; }
    if (e.key === 'Enter') {
      const line = input.value;
      input.value = '';
      running = true;
      inputLine.style.visibility = 'hidden';
      void execute(line).finally(() => {
        running = false;
        inputLine.style.visibility = '';
        refreshPrompt();
        input.focus();
        scroll();
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histIdx > 0) { histIdx--; input.value = history[histIdx] ?? ''; }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx < history.length) { histIdx++; input.value = history[histIdx] ?? ''; }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      complete();
    } else if (e.key === 'c' && e.ctrlKey) {
      print(promptEl.textContent + input.value + '^C');
      input.value = '';
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      out.innerHTML = '';
    }
  });

  screen.addEventListener('mouseup', () => {
    if (window.getSelection()?.isCollapsed) input.focus();
  });

  printHtml(`<span class="t-accent">FableOS ${OS_VERSION}</span> <span class="t-dim">(${OS_CODENAME})</span> — fsh 1.0`);
  try { print(vfs.readFile('/etc/motd').trimEnd(), 't-dim'); } catch { /* no motd */ }
  refreshPrompt();
  setTimeout(() => input.focus(), 60);
}

export const terminalApp: AppManifest = {
  id: 'terminal',
  name: 'Terminal',
  icon: icons.terminal,
  description: 'FableTerm with fsh — pipes, redirection, completion',
  multiInstance: true,
  window: { width: 740, height: 470, minWidth: 380, minHeight: 240 },
  launch: launchTerminal,
};
