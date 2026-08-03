"""Turn ink components into ordered pen strokes.

Pipeline per component: binarize → Zhang-Suen thinning → skeleton graph
(nodes = endpoints/junctions, edges = pixel chains) → prune spurs → walk the
graph the way a calligrapher's hand moves (enter top-right, flow down and
left, keep going straight through junctions) → measure local stroke radius
with a distance transform.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from scipy import ndimage

from .glyphs import DrawComp, Patch
from .util import cumulative_arclength

INK_THRESHOLD = 96


@dataclass
class Stroke:
    pts: np.ndarray      # (N,2) float32 canvas coords
    radii: np.ndarray    # (N,) float32
    mode: str = "path"   # 'path' | 'stamp'

    @property
    def cumlen(self):
        if not hasattr(self, "_cumlen"):
            self._cumlen = cumulative_arclength(self.pts)
        return self._cumlen

    @property
    def length(self):
        c = self.cumlen
        return float(c[-1]) if len(c) else 0.0

# ------------------------------------------------------------- thinning


def _neighbors(p):
    """P2..P9 clockwise from north for a padded binary image."""
    return (p[:-2, 1:-1], p[:-2, 2:], p[1:-1, 2:], p[2:, 2:],
            p[2:, 1:-1], p[2:, :-2], p[1:-1, :-2], p[:-2, :-2])


def zhang_suen(mask: np.ndarray, max_iter: int = 200) -> np.ndarray:
    img = np.pad((mask > 0).astype(np.uint8), 1)
    for _ in range(max_iter):
        changed = False
        for step in (0, 1):
            P = _neighbors(img)
            c = img[1:-1, 1:-1]
            B = sum(p.astype(np.int16) for p in P)
            seq = P + (P[0],)
            A = sum(((seq[i] == 0) & (seq[i + 1] == 1)) for i in range(8))
            if step == 0:
                cond_d = (P[0] * P[2] * P[4] == 0) & (P[2] * P[4] * P[6] == 0)
            else:
                cond_d = (P[0] * P[2] * P[6] == 0) & (P[0] * P[4] * P[6] == 0)
            kill = (c == 1) & (B >= 2) & (B <= 6) & (A == 1) & cond_d
            if kill.any():
                c[kill] = 0
                changed = True
        if not changed:
            break
    return img[1:-1, 1:-1].astype(bool)

# ------------------------------------------------------------- graph

OFFSETS = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]


def _build_graph(skel: np.ndarray):
    """-> (node_label_map, node_centers, edges); edge = (na, nb, pts list)."""
    deg = ndimage.convolve(skel.astype(np.uint8), np.ones((3, 3), np.uint8),
                           mode="constant") - skel.astype(np.uint8)
    deg = np.where(skel, deg, 0)
    node_mask = skel & (deg != 2)
    node_lbl, n_nodes = ndimage.label(node_mask, structure=np.ones((3, 3), np.uint8))
    centers = ndimage.center_of_mass(node_mask, node_lbl, range(1, n_nodes + 1)) \
        if n_nodes else []
    centers = [np.array((c[1], c[0]), np.float32) for c in centers]  # (x, y)

    H, W = skel.shape
    visited = np.zeros_like(skel, bool)
    edges = []

    def neighbors_of(y, x):
        for dy, dx in OFFSETS:
            yy, xx = y + dy, x + dx
            if 0 <= yy < H and 0 <= xx < W and skel[yy, xx]:
                yield yy, xx

    node_px = np.argwhere(node_mask)
    for y0, x0 in node_px:
        for y1, x1 in neighbors_of(y0, x0):
            if node_lbl[y1, x1]:
                # direct node-to-node contact between different clusters
                if node_lbl[y1, x1] != node_lbl[y0, x0] and (y0, x0) < (y1, x1):
                    edges.append((node_lbl[y0, x0] - 1, node_lbl[y1, x1] - 1,
                                  [(x0, y0), (x1, y1)]))
                continue
            if visited[y1, x1]:
                continue
            chain = [(x0, y0), (x1, y1)]
            visited[y1, x1] = True
            py, px_, cy, cx = y0, x0, y1, x1
            while True:
                nxt = None
                for yy, xx in neighbors_of(cy, cx):
                    if (yy, xx) == (py, px_):
                        continue
                    if node_lbl[yy, xx]:
                        nxt = (yy, xx, True)
                        break
                    if not visited[yy, xx]:
                        nxt = (yy, xx, False)
                        break
                if nxt is None:
                    edges.append((node_lbl[y0, x0] - 1, -1, chain))  # dead end
                    break
                yy, xx, is_node = nxt
                chain.append((xx, yy))
                if is_node:
                    edges.append((node_lbl[y0, x0] - 1, node_lbl[yy, xx] - 1, chain))
                    break
                visited[yy, xx] = True
                py, px_, cy, cx = cy, cx, yy, xx

    # pure cycles (no nodes at all): walk remaining unvisited deg-2 pixels
    leftover = skel & ~visited & ~node_mask
    lbl, n = ndimage.label(leftover, structure=np.ones((3, 3), np.uint8))
    for ci in range(1, n + 1):
        ys, xs = np.nonzero(lbl == ci)
        if len(ys) < 2:
            continue
        start = int(np.argmax(xs - 0.6 * ys))  # top-right point of the loop
        y0, x0 = ys[start], xs[start]
        chain = [(x0, y0)]
        visited[y0, x0] = True
        py, px_ = -1, -1
        cy, cx = y0, x0
        while True:
            nxt = None
            for yy, xx in neighbors_of(cy, cx):
                if (yy, xx) == (py, px_) or not leftover[yy, xx]:
                    continue
                if not visited[yy, xx]:
                    nxt = (yy, xx)
                    break
            if nxt is None:
                break
            yy, xx = nxt
            chain.append((xx, yy))
            visited[yy, xx] = True
            py, px_, cy, cx = cy, cx, yy, xx
        chain.append((x0, y0))  # close the loop
        node_id = len(centers)
        centers.append(np.array((x0, y0), np.float32))
        edges.append((node_id, node_id, chain))

    return centers, edges


def _prune_and_merge(centers, edges, min_spur: float):
    """Drop short leaf edges, then fuse chains through degree-2 nodes."""
    def adjacency(eds):
        adj: dict[int, list[int]] = {}
        for i, (a, b, _pts) in enumerate(eds):
            adj.setdefault(a, []).append(i)
            if b != a:
                adj.setdefault(b, []).append(i)
        return adj

    def chain_len(pts):
        p = np.asarray(pts, np.float32)
        return float(np.hypot(*(p[1:] - p[:-1]).T).sum()) if len(p) > 1 else 0.0

    edges = [e for e in edges if len(e[2]) >= 2]
    for _ in range(3):
        adj = adjacency(edges)
        keep = []
        dropped = False
        for i, (a, b, pts) in enumerate(edges):
            la, lb = len(adj.get(a, [])), len(adj.get(b, []))
            is_leaf = (b == -1) or la == 1 or lb == 1
            junctioned = (la > 1 or lb > 1)
            if is_leaf and junctioned and chain_len(pts) < min_spur and len(edges) > 1:
                dropped = True
                continue
            keep.append((a, b, pts))
        edges = keep
        if not dropped:
            break

    # fuse through nodes that now have exactly two edge ends
    changed = True
    while changed:
        changed = False
        adj = adjacency(edges)
        for node, eids in adj.items():
            if node == -1 or len(eids) != 2 or eids[0] == eids[1]:
                continue
            i, j = eids
            a1, b1, p1 = edges[i]
            a2, b2, p2 = edges[j]
            if a1 == b1 or a2 == b2:
                continue  # don't fuse cycles
            q1 = p1 if b1 == node else p1[::-1]      # q1 ends at node
            q2 = p2 if a2 == node else p2[::-1]      # q2 starts at node
            na = a1 if b1 == node else b1
            nb = b2 if a2 == node else a2
            fused = (na, nb, q1 + q2[1:])
            edges = [e for k, e in enumerate(edges) if k not in (i, j)] + [fused]
            changed = True
            break
    return centers, edges

# ------------------------------------------------------------- ordering


def _walk_strokes(centers, edges, em: float, pen_start, rtl: bool = True):
    """Assemble edges into pen strokes with calligraphic preferences."""
    if not edges:
        return []
    sx = -1.0 if rtl else 1.0
    unused = set(range(len(edges)))
    adj: dict[int, list[int]] = {}
    for i, (a, b, _p) in enumerate(edges):
        adj.setdefault(a, []).append(i)
        if b != a:
            adj.setdefault(b, []).append(i)

    def edge_end_pts(i, node):
        a, b, pts = edges[i]
        pts = np.asarray(pts, np.float32)
        return pts if a == node else pts[::-1]

    def start_score(node, pen):
        c = centers[node] if node >= 0 and node < len(centers) else None
        if c is None:
            return -1e9
        deg = len([e for e in adj.get(node, []) if e in unused])
        endpoint_bonus = 0.9 if len(adj.get(node, [])) == 1 else 0.0
        d = np.linalg.norm(c - pen) / max(em, 1)
        return (-sx * c[0] / em) - 0.85 * c[1] / em + endpoint_bonus - 0.38 * d + 0.02 * deg

    strokes = []
    pen = np.asarray(pen_start, np.float32)
    while unused:
        candidates = {n for n in adj if n != -1
                      and any(e in unused for e in adj[n])}
        if not candidates:
            i = unused.pop()
            pts = np.asarray(edges[i][2], np.float32)
            strokes.append(pts)
            pen = pts[-1]
            continue
        node = max(candidates, key=lambda n: start_score(n, pen))
        path = []
        prev_dir = None
        cur = node
        while True:
            options = [e for e in adj.get(cur, []) if e in unused]
            if not options:
                break

            def edge_score(i):
                pts = edge_end_pts(i, cur)
                k = min(len(pts) - 1, 6)
                d = pts[k] - pts[0]
                norm = np.linalg.norm(d)
                if norm < 1e-6:
                    return -1e9
                d = d / norm
                if prev_dir is None:
                    return 0.62 * d[1] + 0.30 * sx * d[0]
                return 1.25 * float(np.dot(prev_dir, d)) + 0.30 * d[1] + 0.12 * sx * d[0]

            best = max(options, key=edge_score)
            pts = edge_end_pts(best, cur)
            unused.discard(best)
            if len(path) == 0:
                path.extend(pts.tolist())
            else:
                path.extend(pts[1:].tolist())
            k = min(len(pts) - 1, 6)
            tail = pts[-1] - pts[-1 - k] if len(pts) > k else pts[-1] - pts[0]
            n = np.linalg.norm(tail)
            prev_dir = tail / n if n > 1e-6 else prev_dir
            a, b, _ = edges[best]
            cur = b if a == cur else a
            if cur == -1:
                break
        if len(path) >= 2:
            pts = np.asarray(path, np.float32)
            strokes.append(pts)
            pen = pts[-1]
    return strokes


def _smooth_polyline(pts: np.ndarray, k: int = 5) -> np.ndarray:
    if len(pts) <= k:
        return pts
    pad = k // 2
    padded = np.concatenate([pts[:1].repeat(pad, 0), pts, pts[-1:].repeat(pad, 0)])
    kernel = np.ones(k, np.float32) / k
    out = np.stack([np.convolve(padded[:, i], kernel, mode="valid") for i in (0, 1)], 1)
    out[0], out[-1] = pts[0], pts[-1]
    return out.astype(np.float32)

# ------------------------------------------------------------- public


def build_strokes(comp: DrawComp, em: float, pen_start=(0.0, 0.0), rtl=True,
                  stamp_dim: float | None = None) -> None:
    """Fill comp.strokes with ordered Stroke objects (canvas coordinates)."""
    p = comp.patch
    mask = p.a >= INK_THRESHOLD
    if not mask.any():
        comp.strokes = []
        return
    h, w = mask.shape
    stamp_dim = stamp_dim if stamp_dim is not None else 0.13 * em

    if comp.kind == "dot" or max(h, w) <= stamp_dim:
        ys, xs = np.nonzero(mask)
        cx, cy = float(xs.mean()) + p.x, float(ys.mean()) + p.y
        r = max(2.0, 0.5 * max(h, w))
        comp.strokes = [Stroke(pts=np.array([[cx, cy]], np.float32),
                               radii=np.array([r], np.float32), mode="stamp")]
        return

    skel = zhang_suen(mask)
    if not skel.any():
        ys, xs = np.nonzero(mask)
        cx, cy = float(xs.mean()) + p.x, float(ys.mean()) + p.y
        comp.strokes = [Stroke(pts=np.array([[cx, cy]], np.float32),
                               radii=np.array([max(2.0, 0.5 * max(h, w))], np.float32),
                               mode="stamp")]
        return

    edt = ndimage.distance_transform_edt(mask)
    centers, edges = _build_graph(skel)
    centers, edges = _prune_and_merge(centers, edges, min_spur=0.055 * em)

    local_pen = np.asarray(pen_start, np.float32) - (p.x, p.y)
    polylines = _walk_strokes(centers, edges, em, local_pen, rtl=rtl)

    strokes = []
    for pts in polylines:
        pts = _smooth_polyline(pts, k=5)
        xs = np.clip(pts[:, 0].round().astype(int), 0, w - 1)
        ys = np.clip(pts[:, 1].round().astype(int), 0, h - 1)
        radii = (edt[ys, xs] * 1.22 + 1.2).astype(np.float32)
        strokes.append(Stroke(pts=pts + (p.x, p.y), radii=radii))
    comp.strokes = strokes


def stamp_alpha(shape, strokes, supersample: int = 1):
    """Render strokes fully into an alpha patch (used for synthetic comps)."""
    from PIL import Image, ImageDraw
    h, w = shape
    img = Image.new("L", (w * supersample, h * supersample), 0)
    d = ImageDraw.Draw(img)
    for st in strokes:
        for (x, y), r in zip(st.pts, st.radii):
            rr = r * supersample
            d.ellipse([x * supersample - rr, y * supersample - rr,
                       x * supersample + rr, y * supersample + rr], fill=255)
    if supersample > 1:
        img = img.resize((w, h), Image.LANCZOS)
    return np.asarray(img, np.uint8).copy()


def build_flourish(x_center: float, y: float, width: float, em: float,
                   rng: np.random.Generator) -> DrawComp:
    """A tapered swash drawn under the text, right to left."""
    from .util import bezier_points
    w = width
    x_r, x_l = x_center + w / 2, x_center - w / 2
    sag = 0.16 * em
    p0 = (x_r, y - 0.06 * em)
    p1 = (x_r - 0.28 * w, y + sag)
    p2 = (x_l + 0.22 * w, y - 0.4 * sag)
    p3 = (x_l, y + 0.02 * em + float(rng.uniform(-0.02, 0.02)) * em)
    pts = bezier_points(p0, p1, p2, p3, max(24, int(w / 3)))
    t = np.linspace(0, 1, len(pts))
    radii = (0.018 * em + 0.034 * em * np.sin(np.pi * t) ** 1.3).astype(np.float32)

    x0 = int(np.floor(pts[:, 0].min() - radii.max() - 2))
    y0 = int(np.floor(pts[:, 1].min() - radii.max() - 2))
    x1 = int(np.ceil(pts[:, 0].max() + radii.max() + 2))
    y1 = int(np.ceil(pts[:, 1].max() + radii.max() + 2))
    local = pts - (x0, y0)
    stroke = Stroke(pts=pts.astype(np.float32), radii=radii)
    alpha = stamp_alpha((y1 - y0, x1 - x0),
                        [Stroke(pts=local.astype(np.float32), radii=radii)],
                        supersample=2)
    comp = DrawComp(patch=Patch(x0, y0, alpha), kind="flourish",
                    order_x=x_center, logical=0)
    comp.strokes = [stroke]
    return comp
