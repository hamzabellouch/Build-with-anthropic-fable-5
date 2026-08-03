#!/usr/bin/env node
// Zero-dependency static server fallback (used when python3 is unavailable).
// Usage: node server.js [port]   |   NO_OPEN=1 to skip opening the browser.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = __dirname;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
  if (urlPath.endsWith('/')) filePath = path.join(filePath, 'index.html');
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(data);
  });
});

function listen(port, remaining) {
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && remaining > 0) listen(port + 1, remaining - 1);
    else { console.error(err.message); process.exit(1); }
  });
  server.listen(port, '127.0.0.1', () => {
    const url = `http://localhost:${server.address().port}`;
    console.log(`\n  ⚛  Veritas physics engine\n     running at ${url}\n     press Ctrl+C to stop\n`);
    if (!process.env.NO_OPEN) {
      const opener = process.platform === 'darwin' ? 'open'
        : process.platform === 'win32' ? 'start' : 'xdg-open';
      spawn(opener, [url], { stdio: 'ignore', detached: true }).on('error', () => {});
    }
  });
}

listen(process.argv[2] ? Number(process.argv[2]) : 8080, process.argv[2] ? 0 : 19);
