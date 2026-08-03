#!/usr/bin/env node
/* Zero-dependency static file server for Horizons Flight Simulator. */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const ROOT = __dirname;
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found: ' + urlPath);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
});

function tryListen(port, attemptsLeft) {
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      console.log(`Port ${port} busy, trying ${port + 1}...`);
      tryListen(port + 1, attemptsLeft - 1);
    } else {
      console.error('Server error:', err.message);
      process.exit(1);
    }
  });
  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log('');
    console.log('  ✈  HORIZONS — Flight Simulator');
    console.log('  ───────────────────────────────');
    console.log(`  Ready for takeoff at:  ${url}`);
    console.log('  (Ctrl+C to stop)');
    console.log('');
    // Best-effort: open the default browser. Harmless if it fails (e.g. headless).
    const opener = process.platform === 'darwin' ? 'open'
      : process.platform === 'win32' ? 'start ""'
      : 'xdg-open';
    exec(`${opener} ${url}`, () => {});
  });
}

tryListen(PORT, 20);
