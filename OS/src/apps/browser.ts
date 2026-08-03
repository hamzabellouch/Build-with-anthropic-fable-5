/**
 * Voyage — the FableOS web browser. Renders local VFS pages (sandboxed),
 * a built-in home page, and external sites in an iframe (sites that send
 * X-Frame-Options/CSP frame-ancestors will refuse — that's the web, baby).
 */
import { h, Path, escapeHtml } from '../core/utils';
import { vfs, homeDir } from '../core/vfs';
import { AppManifest, AppContext } from '../core/kernel';
import { icons } from '../icons';

type Page = { kind: 'home' } | { kind: 'url'; url: string } | { kind: 'vfs'; path: string };

function homeHtml(): string {
  return `<!doctype html><html><head><style>
  body{font-family:system-ui,sans-serif;background:linear-gradient(160deg,#0b1020,#101a33);color:#dbe4f3;
       display:flex;flex-direction:column;align-items:center;min-height:92vh;margin:0;padding-top:9vh}
  h1{font-size:2.6rem;margin:.2rem 0;background:linear-gradient(90deg,#7c6cff,#38bdf8);
     -webkit-background-clip:text;background-clip:text;color:transparent}
  p{color:#8fa0bd} .cards{display:flex;gap:14px;margin-top:28px;flex-wrap:wrap;justify-content:center;max-width:680px}
  .card{background:#16203a;border:1px solid #283a55;border-radius:14px;padding:18px 22px;width:170px;text-align:left}
  .card b{display:block;margin-bottom:6px;color:#e8eefc} .card span{font-size:.85rem;color:#8fa0bd}
  code{background:#1d2a4a;padding:2px 7px;border-radius:6px;font-size:.85em}
  </style></head><body>
  <h1>Voyage</h1>
  <p>The FableOS browser</p>
  <div class="cards">
    <div class="card"><b>Local pages</b><span>Open <code>.html</code> files from the Files app — scripts run sandboxed.</span></div>
    <div class="card"><b>Real web</b><span>Type a URL above. Sites that allow embedding will load right here.</span></div>
    <div class="card"><b>Heads up</b><span>Many big sites send <code>X-Frame-Options</code> and refuse to be framed.</span></div>
  </div>
  </body></html>`;
}

function launchBrowser(ctx: AppContext) {
  const back: Page[] = [];
  const fwd: Page[] = [];
  let current: Page = { kind: 'home' };

  const urlInput = h('input', { class: 'br-url', type: 'text', spellcheck: 'false', placeholder: 'Enter a URL or vfs path…' });
  const frameWrap = h('div', { class: 'br-frame-wrap' });

  const labelFor = (p: Page) => p.kind === 'home' ? 'about:home' : p.kind === 'url' ? p.url : `vfs://${p.path}`;

  function render() {
    urlInput.value = labelFor(current);
    frameWrap.innerHTML = '';
    if (current.kind === 'home') {
      const f = h('iframe', { class: 'br-frame', sandbox: 'allow-scripts' });
      f.srcdoc = homeHtml();
      frameWrap.append(f);
      ctx.win.setTitle('Voyage — Home');
    } else if (current.kind === 'vfs') {
      let content = '';
      try { content = vfs.readFile(current.path); } catch {
        frameWrap.append(h('div', { class: 'br-err' }, `No such file: ${current.path}`));
        return;
      }
      const f = h('iframe', { class: 'br-frame', sandbox: 'allow-scripts allow-forms allow-modals' });
      f.srcdoc = content;
      frameWrap.append(f);
      ctx.win.setTitle(`Voyage — ${Path.basename(current.path)}`);
    } else {
      const f = h('iframe', {
        class: 'br-frame',
        src: current.url,
        referrerpolicy: 'no-referrer',
        allow: 'fullscreen',
      });
      const note = h('div', { class: 'br-note' },
        `If this stays blank, ${escapeHtml(new URL(current.url).hostname)} refuses to be embedded (X-Frame-Options).`);
      frameWrap.append(f, note);
      setTimeout(() => note.remove(), 6000);
      ctx.win.setTitle(`Voyage — ${new URL(current.url).hostname}`);
    }
  }

  function go(p: Page, pushHist = true) {
    if (pushHist) { back.push(current); fwd.length = 0; }
    current = p;
    render();
  }

  function navigateInput() {
    const raw = urlInput.value.trim();
    if (!raw || raw === 'about:home') { go({ kind: 'home' }); return; }
    if (raw.startsWith('vfs://')) { go({ kind: 'vfs', path: raw.slice(6) || '/' }); return; }
    if (raw.startsWith('/') && vfs.exists(raw)) { go({ kind: 'vfs', path: raw }); return; }
    if (raw.startsWith('~/')) {
      const p = homeDir() + raw.slice(1);
      if (vfs.exists(p)) { go({ kind: 'vfs', path: p }); return; }
    }
    let url = raw;
    if (!/^https?:\/\//.test(url)) url = 'https://' + url;
    try { new URL(url); } catch { return; }
    go({ kind: 'url', url });
  }

  urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') navigateInput(); });
  urlInput.addEventListener('focus', () => urlInput.select());

  const tbtn = (title: string, icon: string, onclick: () => void) => {
    const b = h('button', { class: 'tool-btn', title, html: icon });
    b.addEventListener('click', onclick);
    return b;
  };

  const bookmarks = h('div', { class: 'br-bookmarks' });
  const bms: Array<[string, Page]> = [
    ['Home', { kind: 'home' }],
    ['Sample page (local)', { kind: 'vfs', path: `${homeDir()}/Documents/sample-page.html` }],
    ['example.com', { kind: 'url', url: 'https://example.com' }],
    ['First website (CERN)', { kind: 'url', url: 'http://info.cern.ch' }],
  ];
  for (const [label, page] of bms) {
    const b = h('button', { class: 'br-bm' }, label);
    b.addEventListener('click', () => go(page));
    bookmarks.append(b);
  }

  ctx.root.append(
    h('div', { class: 'browser' },
      h('div', { class: 'br-bar' },
        tbtn('Back', icons.back, () => { const p = back.pop(); if (p) { fwd.push(current); go(p, false); } }),
        tbtn('Forward', icons.forward, () => { const p = fwd.pop(); if (p) { back.push(current); go(p, false); } }),
        tbtn('Reload', icons.reload, render),
        tbtn('Home', icons.homeNav, () => go({ kind: 'home' })),
        urlInput,
      ),
      bookmarks,
      frameWrap,
    ),
  );

  if (typeof ctx.args.vfsPath === 'string') current = { kind: 'vfs', path: ctx.args.vfsPath };
  else if (typeof ctx.args.url === 'string') current = { kind: 'url', url: ctx.args.url };
  render();
}

export const browserApp: AppManifest = {
  id: 'browser',
  name: 'Voyage',
  icon: icons.browser,
  description: 'Web browser for local pages and the embeddable web',
  multiInstance: true,
  window: { width: 980, height: 660, minWidth: 480, minHeight: 320 },
  launch: launchBrowser,
};
