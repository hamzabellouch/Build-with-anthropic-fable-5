# Blender Web

A compact, Blender-flavored 3D editor that runs entirely in the browser.
Vanilla JavaScript + [three.js](https://threejs.org/), bundled with Vite — no framework.

![status](https://img.shields.io/badge/renderer-three.js-049EF4) ![status](https://img.shields.io/badge/build-vite-646CFF)

## Run it

```bash
npm install
npm run dev        # → http://localhost:5173
```

Production build:

```bash
npm run build      # outputs dist/
npm run preview    # serve the built app
```

## What it does

- **Z-up world**, Blender-style default scene (cube + point light), grid floor with colored X/Y axes.
- **Blender modal transforms** — the heart of the feel:
  `G` / `R` / `S` to move / rotate / scale, then `X` `Y` `Z` to constrain to an axis,
  `Shift+axis` for plane locking, **type numbers for exact values** (`G X 2.5 ⏎`, `R 45 ⏎`),
  `Ctrl` snaps, `Shift` is precision mode, LMB/Enter confirms, RMB/Esc cancels.
  Switch G→R→S mid-operation, just like Blender.
- **Toolbar gizmos** (move / rotate / scale) that operate on the whole multi-selection around its median point.
- **Edit Mode (`Tab`)** — real vertex editing. Duplicated buffer vertices are welded by position
  (a cube is 8 editable corners, not 24), with x-ray vertex + wireframe overlays, click / box / all
  selection, and `G/R/S` on vertices. Normals recompute live. Works on imported meshes too.
- **Selection** like Blender: click, `Shift`-click extend, `A` / `Alt+A` all / none, `B` box select,
  orange outlines with a brighter active object, RMB context menu.
- **Outliner**: select, double-click (or `F2`) to rename with automatic `.001` name collision suffixes,
  per-object hide/show eye.
- **Properties panel**: drag-to-scrub number fields (click to type), location/rotation/scale,
  live primitive parameters (segments, radius…), full PBR material (base color, metallic, roughness,
  emission, alpha, flat shading, wireframe), light settings (power, color, spot angle/blend, shadows).
- **4 shading modes** (`Z` cycles): Wireframe, Solid (camera-following studio rig), Material Preview
  (image-based room environment), Rendered (your lights + shadows, filmic tone mapping).
- **Lights**: Point / Sun / Spot with viewport gizmos (spot shows its cone), real-time PCF soft shadows.
- **Object ops**: duplicate (`Shift+D` drops into grab), delete (`X`), hide (`H` / `Alt+H`),
  Shade Smooth / Flat (true vertex welding / splitting).
- **Full undo/redo** (`Ctrl+Z` / `Ctrl+Shift+Z`) across transforms, adds, deletes, material and
  geometry edits — vertex edits included.
- **Camera**: orbit / pan / zoom-to-cursor, `1/3/7` front/right/top (`Ctrl` for opposites) with
  Blender-style auto-orthographic, `5` persp/ortho, `F` frame selected, `Home` frame all, and a
  clickable orientation widget in the corner.
- **Files**: save/open scene as JSON (geometry edits survive), autosave to localStorage
  ("File ▸ Recover Autosave"), import **GLB/GLTF/OBJ** (or just drag-and-drop files into the viewport),
  export **GLB / OBJ / STL**, and `F12` renders a high-res PNG of the current view.
- **File ▸ Open Demo Scene** for an instant lit showcase.

Press **F1** in the app for the complete keymap.

## Code layout

```
src/
├── core/        app conductor, scene, viewport (cameras/composer/outlines),
│                selection, undo history, edit mode, keymap, object factory
├── tools/       modal G/R/S transform, gizmo manager, box select
├── io/          JSON serializer, GLB/OBJ/STL import & export, demo scene
└── ui/          menubar, menus, outliner, properties, widgets, status bar,
                 toolbar, axis widget, help overlay
```

Notes & honest limits: vertex editing supports moving vertices (no extrude/bevel/loop-cut);
faces/edges aren't separately selectable; no animation, modifiers, or parenting. Autosave
serializes the whole scene, so multi-megabyte imports make it a bit chunky.

Tip for power users: the app instance is exposed as `window.blender` in the console.
