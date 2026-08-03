import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { CONFIG } from './config.ts';
import { loadPlan, startProjectRender, type RenderState } from './pipeline.ts';
import type { RenderHandle } from './render.ts';
import { bold, cyan, green, logInfo, readJson, writeJson } from './util.ts';

export async function startServer(projDir: string, port = CONFIG.port): Promise<void> {
  loadPlan(projDir); // fail fast if not analyzed

  const app = express();
  app.use(express.json({ limit: '2mb' }));

  const render: RenderState = { state: 'idle', progress: 0 };
  let handle: RenderHandle | null = null;

  app.get('/api/project', (_req, res) => {
    const plan = loadPlan(projDir);
    const uttPath = path.join(projDir, 'utterances.json');
    res.json({
      plan,
      utterances: fs.existsSync(uttPath) ? readJson(uttPath) : [],
      hasOutput: fs.existsSync(path.join(projDir, 'output.mp4')),
    });
  });

  app.post('/api/plan', (req, res) => {
    const { cuts = {}, overlays = {} } = req.body as {
      cuts?: Record<string, boolean>;
      overlays?: Record<string, boolean>;
    };
    const plan = loadPlan(projDir);
    for (const c of plan.cuts) if (typeof cuts[c.id] === 'boolean') c.enabled = cuts[c.id];
    for (const o of plan.overlays) if (typeof overlays[o.id] === 'boolean') o.enabled = overlays[o.id];
    writeJson(path.join(projDir, 'plan.json'), plan);
    res.json({ ok: true });
  });

  app.post('/api/render', (_req, res) => {
    if (render.state === 'running') return res.status(409).json({ error: 'render already running' });
    render.state = 'running';
    render.progress = 0;
    render.error = undefined;
    try {
      const job = startProjectRender(projDir, (frac) => (render.progress = frac));
      handle = job.handle;
      render.outPath = job.outPath;
      render.outDuration = job.outDuration;
      job.handle.done
        .then(() => {
          render.state = 'done';
          render.progress = 1;
          logInfo(`render finished: ${job.outPath}`);
        })
        .catch((e: Error) => {
          render.state = 'error';
          render.error = e.message;
        });
      res.json({ ok: true });
    } catch (e) {
      render.state = 'error';
      render.error = (e as Error).message;
      res.status(500).json({ error: render.error });
    }
  });

  app.post('/api/render/cancel', (_req, res) => {
    if (render.state === 'running' && handle) {
      handle.child.kill('SIGKILL');
      render.state = 'idle';
      render.progress = 0;
      res.json({ ok: true });
    } else res.status(400).json({ error: 'no render running' });
  });

  app.get('/api/render/status', (_req, res) => res.json(render));

  app.use('/media', express.static(projDir, { index: false }));
  app.use(express.static(CONFIG.webDir));

  await new Promise<void>((resolve) => {
    const server = app.listen(port, '127.0.0.1', () => {
      console.log(`\n${green('●')} ${bold('CutRoom review UI')} → ${cyan(`http://localhost:${port}`)}  ${'' /* keep line */}`);
      console.log(`  review the cuts and graphics, then hit ${bold('Render final video')} — Ctrl-C to quit\n`);
    });
    server.on('close', resolve);
  });
}
