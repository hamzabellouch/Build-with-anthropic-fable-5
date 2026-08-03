import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  cutsToKeeps,
  makeOutputToSource,
  makeSourceToOutput,
  mergeSegs,
  outDuration,
  scheduleOverlays,
} from '../src/timeline.ts';
import type { Overlay } from '../src/types.ts';

test('mergeSegs merges overlapping and touching segments', () => {
  const m = mergeSegs(
    [
      { start: 5, end: 7 },
      { start: 1, end: 3 },
      { start: 2.5, end: 4 },
      { start: 4, end: 4.5 },
    ],
    0,
  );
  assert.deepEqual(m, [
    { start: 1, end: 4.5 },
    { start: 5, end: 7 },
  ]);
});

test('cutsToKeeps inverts cuts and clamps to duration', () => {
  const { keeps, degenerate } = cutsToKeeps(
    [
      { startS: 0, endS: 2 },
      { startS: 5, endS: 6.5 },
      { startS: 9, endS: 99 },
    ],
    10,
  );
  assert.equal(degenerate, false);
  assert.deepEqual(keeps, [
    { start: 2, end: 5 },
    { start: 6.5, end: 9 },
  ]);
  assert.equal(outDuration(keeps), 5.5);
});

test('cutsToKeeps drops keeps shorter than minKeep', () => {
  const { keeps } = cutsToKeeps(
    [
      { startS: 1, endS: 2 },
      { startS: 2.2, endS: 3 }, // 0.2s sliver between cuts
    ],
    4,
    0.35,
  );
  assert.deepEqual(keeps, [
    { start: 0, end: 1 },
    { start: 3, end: 4 },
  ]);
});

test('cutsToKeeps survives cutting everything', () => {
  const { keeps, degenerate } = cutsToKeeps([{ startS: 0, endS: 10 }], 10);
  assert.equal(degenerate, true);
  assert.deepEqual(keeps, [{ start: 0, end: 10 }]);
});

test('source→output mapping is monotonic and collapses cuts', () => {
  const keeps = [
    { start: 2, end: 5 },
    { start: 6.5, end: 9 },
  ];
  const map = makeSourceToOutput(keeps);
  assert.equal(map(0), 0); // before first keep
  assert.equal(map(2), 0);
  assert.equal(map(3.5), 1.5);
  assert.equal(map(5.7), 3); // inside the cut → start of next keep
  assert.equal(map(6.5), 3);
  assert.equal(map(9), 5.5);
  assert.equal(map(100), 5.5);
  let prev = -1;
  for (let t = 0; t <= 10; t += 0.1) {
    const o = map(t);
    assert.ok(o >= prev - 1e-9, `monotonic at ${t}`);
    prev = o;
  }
});

test('output→source mapping inverts inside keeps', () => {
  const keeps = [
    { start: 2, end: 5 },
    { start: 6.5, end: 9 },
  ];
  const inv = makeOutputToSource(keeps);
  assert.equal(inv(0), 2);
  assert.equal(inv(1.5), 3.5);
  assert.equal(inv(3.001), 6.501);
  assert.equal(inv(5.5), 9);
});

const mkOverlay = (id: string, kind: 'intro' | 'concept', anchorS: number, durationS: number): Overlay => ({
  id,
  kind,
  anchorSpace: kind === 'intro' ? 'output' : 'source',
  anchorS,
  durationS,
  spec: { element: 'lower-third', headline: id, lines: [], side: 'left', durationS },
  layers: [{ file: `${id}.png`, anim: { delay: 0, fadeIn: 0.3, fadeOut: 0.3, slideX: 0, slideY: 20, slideDur: 0.5 } }],
  enabled: true,
});

test('scheduleOverlays pins intro at 0 and maps concepts through cuts', () => {
  const keeps = [
    { start: 0, end: 10 },
    { start: 20, end: 40 },
  ]; // 30s output
  const ovs = [mkOverlay('intro', 'intro', 0, 5), mkOverlay('c1', 'concept', 25, 8)];
  const res = scheduleOverlays(ovs, keeps, '/tmp/ov');
  assert.equal(res.length, 2);
  assert.equal(res[0].startOut, 0);
  assert.equal(res[0].endOut, 5);
  assert.equal(res[1].startOut, 15); // src 25 → out 10 + (25-20) = 15
  assert.equal(res[1].endOut, 23);
  assert.ok(res[1].layers[0].pngPath.endsWith('c1.png'));
});

test('scheduleOverlays pushes colliding concepts apart and drops ones off the end', () => {
  const keeps = [{ start: 0, end: 40 }];
  const ovs = [
    mkOverlay('intro', 'intro', 0, 5),
    mkOverlay('a', 'concept', 8, 10),
    mkOverlay('b', 'concept', 9, 10), // would overlap "a"
    mkOverlay('c', 'concept', 39.5, 10), // too close to the end
  ];
  const res = scheduleOverlays(ovs, keeps, '/x');
  const ids = res.map((r) => r.id);
  assert.deepEqual(ids, ['intro', 'a', 'b']);
  const a = res[1];
  const b = res[2];
  assert.ok(b.startOut >= a.endOut + 1.5 - 1e-9, 'b pushed after a');
  assert.ok(b.endOut <= 40 - 0.2 + 1e-9);
});

test('disabled overlays and cuts are ignored', () => {
  const ovs = [mkOverlay('intro', 'intro', 0, 5)];
  ovs[0].enabled = false;
  assert.equal(scheduleOverlays(ovs, [{ start: 0, end: 10 }], '/x').length, 0);
  const { keeps } = cutsToKeeps([], 10);
  assert.deepEqual(keeps, [{ start: 0, end: 10 }]);
});
