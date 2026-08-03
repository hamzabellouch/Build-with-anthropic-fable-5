/**
 * Inline SVG icon set for FableOS. Every icon is a self-contained <svg> string
 * (24x24 viewBox unless noted) so rendering never depends on system emoji fonts.
 */

const svg = (inner: string, vb = '0 0 24 24') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" fill="none">${inner}</svg>`;

const grad = (id: string, a: string, b: string) =>
  `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;

export const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
${grad('lg0', '#7c6cff', '#38bdf8')}
<rect x="2" y="2" width="44" height="44" rx="12" fill="url(#lg0)"/>
<rect x="15" y="12" width="7" height="24" rx="1.5" fill="#fff" opacity="0.96"/>
<rect x="15" y="12" width="19" height="6" rx="1.5" fill="#fff" opacity="0.96"/>
<rect x="15" y="23" width="14" height="6" rx="1.5" fill="#fff" opacity="0.82"/>
</svg>`;

export const icons: Record<string, string> = {
  terminal: svg(`${grad('it', '#1e293b', '#0f172a')}
    <rect x="2" y="3" width="20" height="18" rx="4" fill="url(#it)" stroke="#475569" stroke-width="1"/>
    <path d="M6.5 9l3.5 3-3.5 3" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 15.5h5" stroke="#4ade80" stroke-width="2" stroke-linecap="round"/>`),

  files: svg(`${grad('if', '#fbbf24', '#f59e0b')}
    <path d="M3 6a2 2 0 012-2h4.6a2 2 0 011.4.6L12.4 6H19a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" fill="url(#if)"/>
    <path d="M3 9h18v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" fill="#fcd34d"/>`),

  editor: svg(`${grad('ie', '#38bdf8', '#2563eb')}
    <rect x="3" y="2.5" width="15" height="19" rx="3" fill="url(#ie)"/>
    <path d="M7 8h7M7 12h7M7 16h4" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M15.5 14.5l5-5 2 2-5 5-2.6.6.6-2.6z" fill="#fbbf24" stroke="#b45309" stroke-width="0.8"/>`),

  browser: svg(`${grad('ib', '#22d3ee', '#3b82f6')}
    <circle cx="12" cy="12" r="9.5" fill="url(#ib)"/>
    <ellipse cx="12" cy="12" rx="4.2" ry="9.5" stroke="#e0f2fe" stroke-width="1.4"/>
    <path d="M2.5 12h19M4 7.5h16M4 16.5h16" stroke="#e0f2fe" stroke-width="1.4"/>`),

  calculator: svg(`${grad('ic', '#64748b', '#334155')}
    <rect x="4" y="2.5" width="16" height="19" rx="3" fill="url(#ic)"/>
    <rect x="6.5" y="5" width="11" height="4" rx="1" fill="#a5f3fc"/>
    <g fill="#e2e8f0"><circle cx="8.2" cy="12.5" r="1.4"/><circle cx="12" cy="12.5" r="1.4"/><circle cx="15.8" cy="12.5" r="1.4"/>
    <circle cx="8.2" cy="17" r="1.4"/><circle cx="12" cy="17" r="1.4"/><circle cx="15.8" cy="17" r="1.4" fill="#fb923c"/></g>`),

  paint: svg(`${grad('ip', '#f472b6', '#a855f7')}
    <path d="M12 2.5c5.5 0 9.5 3.8 9.5 8.3 0 3-2.2 4.7-4.6 4.7h-2a1.6 1.6 0 00-1.2 2.6c.5.6.8 1.1.8 1.8 0 1-.9 1.9-2.5 1.9-5.5 0-9.5-4.3-9.5-9.6S6.5 2.5 12 2.5z" fill="url(#ip)"/>
    <circle cx="7.5" cy="9" r="1.6" fill="#fef08a"/><circle cx="12" cy="6.8" r="1.6" fill="#bbf7d0"/>
    <circle cx="16.5" cy="9" r="1.6" fill="#bfdbfe"/><circle cx="6.8" cy="13.8" r="1.6" fill="#fecaca"/>`),

  settings: svg(`${grad('is', '#94a3b8', '#475569')}
    <path d="M10.3 2.8a2 2 0 013.4 0l.8 1.3a2 2 0 001.9.9l1.5-.2a2 2 0 012 1.8l.1 1.5a2 2 0 001.1 1.7l1.4.7a2 2 0 01.7 3l-1 1.2a2 2 0 000 2.4l.9 1.2a2 2 0 01-.8 3l-1.4.6a2 2 0 00-1.1 1.7l-.1 1.5a2 2 0 01-2 1.8h-.2" fill="none"/>
    <path d="M13.8 21.6a2 2 0 01-3.6 0l-.6-1.2a2 2 0 00-1.8-1.2l-1.4.1a2 2 0 01-2.1-1.7l-.2-1.4a2 2 0 00-1-1.5l-1.2-.7a2 2 0 01-.7-2.8l.8-1.2a2 2 0 000-2.2l-.8-1.2a2 2 0 01.7-2.8l1.2-.7a2 2 0 001-1.5l.2-1.4A2 2 0 016.4 2.7l1.4.1a2 2 0 001.8-1.2l.6-1.2" fill="none"/>
    <path d="M12 1.8l1.2 2a2.4 2.4 0 002.3 1.2l2.3-.3.9 2.2-1.6 1.7a2.4 2.4 0 000 2.8l1.6 1.7-.9 2.2-2.3-.3a2.4 2.4 0 00-2.3 1.2l-1.2 2-1.2-2a2.4 2.4 0 00-2.3-1.2l-2.3.3-.9-2.2 1.6-1.7a2.4 2.4 0 000-2.8L4.3 6.9l.9-2.2 2.3.3a2.4 2.4 0 002.3-1.2l1.2-2z" fill="url(#is)" transform="translate(0 1.7)"/>
    <circle cx="12" cy="12" r="3.2" fill="#0f172a" stroke="#cbd5e1" stroke-width="1.2"/>`),

  monitor: svg(`${grad('im', '#34d399', '#059669')}
    <rect x="2.5" y="3.5" width="19" height="13" rx="2.5" fill="#0f172a" stroke="url(#im)" stroke-width="1.6"/>
    <path d="M5.5 12.5l3-4 2.5 3 3-5 2.5 4.5" stroke="#34d399" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M9 20.5h6M12 17v3.5" stroke="#64748b" stroke-width="1.7" stroke-linecap="round"/>`),

  piano: svg(`${grad('ik', '#e2e8f0', '#94a3b8')}
    <rect x="2.5" y="4" width="19" height="16" rx="2.5" fill="url(#ik)" stroke="#475569"/>
    <path d="M8.8 4v16M15.2 4v16" stroke="#475569" stroke-width="1"/>
    <rect x="6.8" y="4" width="3" height="9" fill="#1e293b"/><rect x="13.2" y="4" width="3" height="9" fill="#1e293b"/>`),

  minesweeper: svg(`${grad('iw', '#475569', '#1e293b')}
    <circle cx="12" cy="13" r="7" fill="url(#iw)"/>
    <circle cx="9.6" cy="10.8" r="1.8" fill="#cbd5e1" opacity="0.7"/>
    <path d="M12 3v4M12 19v2.5M3.5 13H6m12 0h2.5M6 7l1.8 1.8M18 7l-1.8 1.8M6 19l1.8-1.8M18 19l-1.8-1.8" stroke="#f87171" stroke-width="1.8" stroke-linecap="round"/>`),

  snake: svg(`${grad('isn', '#4ade80', '#16a34a')}
    <path d="M4 18.5c0-2 1.6-3.2 3.6-3.2h8c1.2 0 2-.8 2-1.9s-.8-1.9-2-1.9h-8C5.6 11.5 4 10 4 8s1.6-3.5 3.6-3.5H17" stroke="url(#isn)" stroke-width="3.4" stroke-linecap="round" fill="none"/>
    <circle cx="17.5" cy="4.5" r="2.6" fill="#16a34a"/><circle cx="18.3" cy="3.9" r="0.7" fill="#fff"/>
    <circle cx="5.5" cy="18.5" r="1.2" fill="#f87171"/>`),

  viewer: svg(`${grad('iv', '#818cf8', '#6366f1')}
    <rect x="2.5" y="4" width="19" height="16" rx="3" fill="url(#iv)"/>
    <circle cx="8.5" cy="9.5" r="2" fill="#fef08a"/>
    <path d="M4.5 18.5l5-6 3.5 4 2.5-3 4 5z" fill="#c7d2fe"/>`),

  welcome: svg(`${grad('ih', '#fb7185', '#e11d48')}
    <path d="M12 21s-8.5-5.2-8.5-11A4.8 4.8 0 0112 7a4.8 4.8 0 018.5 3c0 5.8-8.5 11-8.5 11z" fill="url(#ih)"/>
    <path d="M8 9.5c.3-1.4 1.5-2.3 2.7-2.4" stroke="#fecdd3" stroke-width="1.4" stroke-linecap="round" fill="none"/>`),

  folder: svg(`${grad('ifo', '#fbbf24', '#f59e0b')}
    <path d="M3 6a2 2 0 012-2h4.6a2 2 0 011.4.6L12.4 6H19a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" fill="url(#ifo)"/>
    <path d="M3 9h18v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" fill="#fcd34d"/>`),

  file: svg(`<path d="M6 2.5h7.5L19 8v12a1.8 1.8 0 01-1.8 1.8H6A1.8 1.8 0 014.2 20V4.3A1.8 1.8 0 016 2.5z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="0.8"/>
    <path d="M13.5 2.5L19 8h-5.5V2.5z" fill="#cbd5e1"/>`),

  fileText: svg(`<path d="M6 2.5h7.5L19 8v12a1.8 1.8 0 01-1.8 1.8H6A1.8 1.8 0 014.2 20V4.3A1.8 1.8 0 016 2.5z" fill="#dbeafe" stroke="#60a5fa" stroke-width="0.8"/>
    <path d="M13.5 2.5L19 8h-5.5V2.5z" fill="#bfdbfe"/>
    <path d="M7.5 12h9M7.5 15h9M7.5 18h5.5" stroke="#3b82f6" stroke-width="1.2" stroke-linecap="round"/>`),

  fileCode: svg(`<path d="M6 2.5h7.5L19 8v12a1.8 1.8 0 01-1.8 1.8H6A1.8 1.8 0 014.2 20V4.3A1.8 1.8 0 016 2.5z" fill="#dcfce7" stroke="#4ade80" stroke-width="0.8"/>
    <path d="M13.5 2.5L19 8h-5.5V2.5z" fill="#bbf7d0"/>
    <path d="M9.5 12l-2.5 3 2.5 3M14.5 12l2.5 3-2.5 3" stroke="#16a34a" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`),

  fileImage: svg(`<path d="M6 2.5h7.5L19 8v12a1.8 1.8 0 01-1.8 1.8H6A1.8 1.8 0 014.2 20V4.3A1.8 1.8 0 016 2.5z" fill="#ede9fe" stroke="#a78bfa" stroke-width="0.8"/>
    <path d="M13.5 2.5L19 8h-5.5V2.5z" fill="#ddd6fe"/>
    <circle cx="9" cy="12.5" r="1.4" fill="#fbbf24"/>
    <path d="M6.5 19l3.2-4 2.3 2.7 1.8-2.2 3.2 3.5z" fill="#8b5cf6"/>`),

  fileMusic: svg(`<path d="M6 2.5h7.5L19 8v12a1.8 1.8 0 01-1.8 1.8H6A1.8 1.8 0 014.2 20V4.3A1.8 1.8 0 016 2.5z" fill="#fce7f3" stroke="#f472b6" stroke-width="0.8"/>
    <path d="M13.5 2.5L19 8h-5.5V2.5z" fill="#fbcfe8"/>
    <path d="M10 17.5V11l5-1.2v6.4" stroke="#db2777" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="8.7" cy="17.6" r="1.6" fill="#db2777"/><circle cx="13.7" cy="16.4" r="1.6" fill="#db2777"/>`),

  home: svg(`<path d="M3.5 11L12 3.5 20.5 11v8.5a1.5 1.5 0 01-1.5 1.5h-4.5v-6h-5v6H5a1.5 1.5 0 01-1.5-1.5V11z" fill="#94a3b8"/>`),
  desktopIcon: svg(`<rect x="3" y="4" width="18" height="12" rx="2" fill="#64748b"/><rect x="5" y="6" width="14" height="8" rx="1" fill="#38bdf8"/><path d="M9 20h6M12 16.5V20" stroke="#64748b" stroke-width="1.8" stroke-linecap="round"/>`),
  documents: svg(`<path d="M5 3h9l5 5v13H5V3z" fill="#60a5fa"/><path d="M14 3l5 5h-5V3z" fill="#93c5fd"/><path d="M8 12h8M8 15h8M8 18h5" stroke="#eff6ff" stroke-width="1.3" stroke-linecap="round"/>`),
  pictures: svg(`<rect x="3" y="5" width="18" height="14" rx="2" fill="#8b5cf6"/><circle cx="8.5" cy="10" r="1.7" fill="#fde047"/><path d="M5 17.5l4-5 3 3.6 2.3-2.8 4.7 4.2z" fill="#ddd6fe"/>`),
  music: svg(`<path d="M9 18.5V7l10-2.4V16" stroke="#ec4899" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="6.8" cy="18.6" r="2.6" fill="#ec4899"/><circle cx="16.8" cy="16.1" r="2.6" fill="#ec4899"/>`),
  downloads: svg(`<path d="M12 3v10m0 0l-4-4m4 4l4-4" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" stroke="#34d399" stroke-width="2" stroke-linecap="round"/>`),
  drive: svg(`<rect x="3" y="9" width="18" height="8" rx="2" fill="#475569"/><circle cx="17.5" cy="13" r="1.3" fill="#4ade80"/><path d="M5 9l2.2-4.5h9.6L19 9" stroke="#475569" stroke-width="1.6" fill="none"/>`),

  close: svg(`<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`),
  minimize: svg(`<path d="M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`),
  maximize: svg(`<rect x="5.5" y="5.5" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>`),
  restore: svg(`<rect x="5" y="8" width="11" height="11" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><path d="M9 5h8a2 2 0 012 2v8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>`),

  back: svg(`<path d="M14.5 5.5L8 12l6.5 6.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`),
  forward: svg(`<path d="M9.5 5.5L16 12l-6.5 6.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`),
  up: svg(`<path d="M5.5 14.5L12 8l6.5 6.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`),
  reload: svg(`<path d="M19 12a7 7 0 11-2-4.9M19 4v4h-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`),
  homeNav: svg(`<path d="M4.5 10.5L12 4l7.5 6.5V19a1 1 0 01-1 1H14v-5h-4v5H5.5a1 1 0 01-1-1v-8.5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="none"/>`),
  plus: svg(`<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>`),
  newFolder: svg(`<path d="M3 6a2 2 0 012-2h4l1.5 2H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M12 10v5M9.5 12.5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`),
  newFile: svg(`<path d="M6 2.5h7.5L19 8v12a1.8 1.8 0 01-1.8 1.8H6A1.8 1.8 0 014.2 20V4.3A1.8 1.8 0 016 2.5z" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M12 11v6M9 14h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`),
  trash: svg(`<path d="M5 7h14M10 7V5a1 1 0 011-1h2a1 1 0 011 1v2M7 7l.8 12.2a1.5 1.5 0 001.5 1.3h5.4a1.5 1.5 0 001.5-1.3L17 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`),
  rename: svg(`<path d="M15 5.5l3.5 3.5L8 19.5 4 20l.5-4L15 5.5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" fill="none"/>`),
  download: svg(`<path d="M12 4v10m0 0l-3.5-3.5M12 14l3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 17v2a1.5 1.5 0 001.5 1.5h11A1.5 1.5 0 0019 19v-2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`),
  upload: svg(`<path d="M12 15V5m0 0L8.5 8.5M12 5l3.5 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 17v2a1.5 1.5 0 001.5 1.5h11A1.5 1.5 0 0019 19v-2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`),
  grid: svg(`<rect x="4" y="4" width="7" height="7" rx="1.5" fill="currentColor"/><rect x="13" y="4" width="7" height="7" rx="1.5" fill="currentColor"/><rect x="4" y="13" width="7" height="7" rx="1.5" fill="currentColor"/><rect x="13" y="13" width="7" height="7" rx="1.5" fill="currentColor"/>`),
  list: svg(`<path d="M8 6h12M8 12h12M8 18h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="4.5" cy="6" r="1.3" fill="currentColor"/><circle cx="4.5" cy="12" r="1.3" fill="currentColor"/><circle cx="4.5" cy="18" r="1.3" fill="currentColor"/>`),
  search: svg(`<circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="2" fill="none"/><path d="M16 16l4.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`),
  power: svg(`<path d="M12 3v8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M7.5 5.6a8 8 0 109 0" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"/>`),
  lock: svg(`<rect x="5" y="10.5" width="14" height="9.5" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><path d="M8 10.5V8a4 4 0 018 0v2.5" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="15.2" r="1.4" fill="currentColor"/>`),
  restart: svg(`<path d="M5 12a7 7 0 112 4.9M5 20v-4h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`),
  sun: svg(`<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5m14 0h2.5M5 5l1.8 1.8M19 5l-1.8 1.8M5 19l1.8-1.8M19 19l-1.8-1.8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`),
  moon: svg(`<path d="M20 14.5A8.5 8.5 0 119.5 4 7 7 0 0020 14.5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="none"/>`),
  volume: svg(`<path d="M4 9.5v5h3.5L12 19V5L7.5 9.5H4z" fill="currentColor"/><path d="M15 9a4.5 4.5 0 010 6M17.5 6.5a8 8 0 010 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>`),
  volumeMute: svg(`<path d="M4 9.5v5h3.5L12 19V5L7.5 9.5H4z" fill="currentColor"/><path d="M15.5 9.5l5 5m0-5l-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`),
  check: svg(`<path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`),
  info: svg(`<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="7.5" r="1.3" fill="currentColor"/>`),
  user: svg(`<circle cx="12" cy="8" r="4" fill="currentColor"/><path d="M4 20.5c.8-4 4-6 8-6s7.2 2 8 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none"/>`),
  apps: svg(`<circle cx="6" cy="6" r="2.2" fill="currentColor"/><circle cx="12" cy="6" r="2.2" fill="currentColor"/><circle cx="18" cy="6" r="2.2" fill="currentColor"/><circle cx="6" cy="12" r="2.2" fill="currentColor"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/><circle cx="18" cy="12" r="2.2" fill="currentColor"/><circle cx="6" cy="18" r="2.2" fill="currentColor"/><circle cx="12" cy="18" r="2.2" fill="currentColor"/><circle cx="18" cy="18" r="2.2" fill="currentColor"/>`),
  play: svg(`<path d="M8 5.5v13l10-6.5L8 5.5z" fill="currentColor"/>`),
  stop: svg(`<rect x="6.5" y="6.5" width="11" height="11" rx="1.5" fill="currentColor"/>`),
  zoomIn: svg(`<circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="2" fill="none"/><path d="M16 16l4.5 4.5M8.5 11h5M11 8.5v5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`),
  zoomOut: svg(`<circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="2" fill="none"/><path d="M16 16l4.5 4.5M8.5 11h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`),
  fit: svg(`<path d="M9 4H5.5A1.5 1.5 0 004 5.5V9m11-5h3.5A1.5 1.5 0 0120 5.5V9m0 6v3.5a1.5 1.5 0 01-1.5 1.5H15M9 20H5.5A1.5 1.5 0 014 18.5V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>`),
  undo: svg(`<path d="M8 7L4 11l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M4 11h10a5 5 0 015 5v1" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>`),
  redo: svg(`<path d="M16 7l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M20 11H10a5 5 0 00-5 5v1" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>`),
  save: svg(`<path d="M5 4h11l4 4v11a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="none"/><path d="M8 4v5h7V4M8 14h8v6H8z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="none"/>`),
  open: svg(`<path d="M4 7a2 2 0 012-2h3l1.5 2H18a2 2 0 012 2v1H7.2a2 2 0 00-1.9 1.4L3.5 16.5 4 7z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" fill="none"/><path d="M3.6 16.4l2-5A2 2 0 017.4 10H21l-2.4 7a2 2 0 01-1.9 1.4H5.5a2 2 0 01-1.9-2z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" fill="none"/>`),
  eye: svg(`<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/>`),
  showDesktop: svg(`<rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.6" fill="none"/>`),
};

/** Maps file extensions to icon keys. */
const extIcons: Record<string, string> = {
  txt: 'fileText', md: 'fileText', log: 'fileText', conf: 'fileText', csv: 'fileText',
  js: 'fileCode', ts: 'fileCode', json: 'fileCode', html: 'fileCode', css: 'fileCode',
  sh: 'fileCode', py: 'fileCode', xml: 'fileCode',
  png: 'fileImage', jpg: 'fileImage', jpeg: 'fileImage', gif: 'fileImage', svg: 'fileImage',
  webp: 'fileImage', bmp: 'fileImage', ico: 'fileImage',
  mp3: 'fileMusic', wav: 'fileMusic', ogg: 'fileMusic', flac: 'fileMusic',
};

export function iconForFile(name: string, isDir: boolean): string {
  if (isDir) return icons.folder;
  const i = name.lastIndexOf('.');
  const ext = i > 0 ? name.slice(i + 1).toLowerCase() : '';
  return icons[extIcons[ext] ?? 'file'];
}
