# The Spread of Islam — Interactive Globe 🕌

An interactive 3D globe tracing how Islam spread from the first revelation near
Mecca in **610 CE** to a worldwide community of ~2 billion people **today** —
with a timeline slider to scrub through 1,400 years of history.

## Run it

Everything is local and self-contained (no build step, no API keys, no network
needed). Two options:

**Option 1 — just open the file**

Open `index.html` directly in any modern browser (double-click it).

**Option 2 — serve it (recommended)**

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Using the map

| Action | How |
|---|---|
| Travel through time | Drag the **slider**, press **▶ play**, or use **← / →** (Shift = ×10) |
| Jump to an era | Click a colored segment of the era strip above the slider |
| Rotate the globe | Drag it (auto-rotation toggles with **⟳**) |
| Zoom | Scroll / pinch |
| Explore | Hover regions for details; click **gold dots** for historical events |
| Exact year | Type into the year box (bottom right) |

**Green** = lands under Muslim rule and/or with Muslim-majority populations.
**Pale green** = significant minorities, rule over non-Muslim majorities, or
strong trading influence. **Dashed gold lines** = the trade routes (Saharan,
Silk Road, Indian Ocean) along which the faith often travelled farther than any
army. The side panel shows the era's story, estimated Muslim population, and
nearby events.

## Notes on accuracy

All boundaries and dates are **approximate by design** — historical frontiers
were zones rather than lines, and popular conversion lagged political conquest
by centuries. The dataset (`data/history.js`) is hand-curated from standard
reference historiography; modern percentages follow Pew Research Center
estimates; base geography is Natural Earth (via world-atlas). This is an
educational visualization, not a scholarly atlas.

## Stack

Plain HTML/CSS/JS + [D3.js](https://d3js.org) (orthographic canvas globe) +
[topojson-client](https://github.com/topojson/topojson-client), all vendored
locally in `vendor/`.

```
index.html        — page shell
css/style.css     — theme & layout
js/app.js         — globe renderer, timeline engine, interactions
data/history.js   — curated dataset: 80+ dated regions, 78 events, routes, eras
data/world-topo.js— Natural Earth 1:110m world (TopoJSON, wrapped as JS)
vendor/           — d3 v7, topojson-client v3
```
