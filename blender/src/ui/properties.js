import * as THREE from 'three';
import {
  section, vec3Field, numberField, row, colorField, checkField, textField, note,
} from './widgets.js';
import { PropCmd, TransformCmd, ReplaceGeometryCmd, geometryState } from '../core/history.js';
import { buildGeometry, paramDefs, refreshLightGizmo, primitiveLabel } from '../core/factory.js';

export class Properties {
  constructor(app, el) {
    this.app = app;
    this.el = el;
    this._fields = [];
    this._obj = null;
    app.events.on('selection-changed', () => this.rebuild());
    app.events.on('mode-changed', () => this.rebuild());
    app.events.on('objects-changed', () => this.rebuild());
    app.events.on('transform-changed', () => this.refreshValues());
    this.rebuild();
  }

  refreshValues() {
    for (const f of this._fields) f.refresh();
  }

  track(field) {
    this._fields.push(field);
    return field;
  }

  rebuild() {
    const app = this.app;
    this.el.innerHTML = '';
    this._fields = [];
    const obj = app.mode === 'edit' ? app.editMode.mesh : app.selection.active;
    this._obj = obj;

    if (!obj) {
      const div = document.createElement('div');
      div.className = 'props-empty';
      div.innerHTML =
        'Nothing selected.<br><br><b>Click</b> an object to select it.<br>' +
        '<b>Shift+A</b> adds objects.<br><b>G / R / S</b> move, rotate, scale.<br>' +
        '<b>Tab</b> edits the active mesh.<br><b>F1</b> shows all shortcuts.';
      this.el.appendChild(div);
      return;
    }

    if (app.selection.items.length > 1 && app.mode === 'object') {
      note(this.el, `${app.selection.items.length} objects selected — showing active`);
    }

    this._objectSection(obj);
    this._transformSection(obj);
    if (obj.userData.kind === 'mesh') {
      this._geometrySection(obj);
      this._materialSection(obj);
    } else if (obj.userData.kind === 'light') {
      this._lightSection(obj);
    }
  }

  _objectSection(obj) {
    const app = this.app;
    const body = section(this.el, 'Object');
    this.track(
      textField(body, 'Name', {
        get: () => obj.name,
        set: (v) => {
          const before = obj.name;
          const after = app.makeNameUnique(v.trim() || before, obj);
          if (after !== before) {
            app.history.exec(new PropCmd(app, 'Rename', (x) => { obj.name = x; }, before, after));
          }
        },
      })
    );
    if (obj.userData.kind === 'mesh') {
      this.track(
        checkField(body, 'Cast Shadow', {
          get: () => obj.castShadow,
          set: (v) => app.history.exec(new PropCmd(app, 'Cast Shadow', (x) => { obj.castShadow = x; }, obj.castShadow, v)),
        })
      );
      this.track(
        checkField(body, 'Receive Shadow', {
          get: () => obj.receiveShadow,
          set: (v) => app.history.exec(new PropCmd(app, 'Receive Shadow', (x) => { obj.receiveShadow = x; }, obj.receiveShadow, v)),
        })
      );
    }
  }

  _transformSection(obj) {
    const app = this.app;
    const body = section(this.el, 'Transform');
    let pending = null;
    const beginPending = () => {
      if (!pending) {
        pending = {
          p: obj.position.clone(),
          q: obj.quaternion.clone(),
          s: obj.scale.clone(),
        };
      }
    };
    const commitPending = () => {
      if (!pending) return;
      const entries = [{
        o: obj,
        before: pending,
        after: { p: obj.position.clone(), q: obj.quaternion.clone(), s: obj.scale.clone() },
      }];
      app.history.push(new TransformCmd(app, entries, 'Transform'));
      pending = null;
    };

    this.track(
      vec3Field(body, 'Location', {
        step: 0.02,
        get: (a) => obj.position[a],
        set: (a, v) => {
          beginPending();
          obj.position[a] = v;
          app.events.emit('transform-changed');
        },
        commit: () => commitPending(),
      })
    );
    this.track(
      vec3Field(body, 'Rotation', {
        step: 0.5,
        unit: '°',
        get: (a) => THREE.MathUtils.radToDeg(obj.rotation[a]),
        set: (a, v) => {
          beginPending();
          obj.rotation[a] = THREE.MathUtils.degToRad(v);
          app.events.emit('transform-changed');
        },
        commit: () => commitPending(),
      })
    );
    this.track(
      vec3Field(body, 'Scale', {
        step: 0.01,
        get: (a) => obj.scale[a],
        set: (a, v) => {
          beginPending();
          obj.scale[a] = v;
          app.events.emit('transform-changed');
        },
        commit: () => commitPending(),
      })
    );
  }

  _geometrySection(mesh) {
    const app = this.app;
    const body = section(this.el, 'Geometry');
    const geo = mesh.geometry;
    const tris = geo.index ? geo.index.count / 3 : geo.attributes.position.count / 3;
    note(body, `${primitiveLabel(mesh.userData.primitive)} · ${geo.attributes.position.count.toLocaleString()} verts · ${Math.round(tris).toLocaleString()} tris`);

    if (app.mode === 'edit') {
      note(body, 'Editing vertices — Tab to finish');
      return;
    }
    if (mesh.userData.topo || mesh.userData.primitive === 'imported') {
      note(body, 'Custom topology — parameters unavailable');
      return;
    }

    const defs = paramDefs(mesh.userData.primitive);
    if (!defs.length) return;
    if (mesh.userData.edited) {
      note(body, 'Mesh was edited — changing parameters resets edits');
    }

    let pending = null;
    let lastTemp = null;
    for (const def of defs) {
      this.track(
        numberField(row(body, def.label), {
          step: def.step,
          min: def.min,
          max: def.max,
          int: def.int,
          get: () => mesh.userData.params[def.key],
          set: (v) => {
            if (!pending) pending = geometryState(mesh);
            mesh.userData.params[def.key] = def.int ? Math.round(v) : v;
            const next = buildGeometry(mesh.userData.primitive, mesh.userData.params);
            if (lastTemp && lastTemp !== pending.geo) lastTemp.dispose();
            mesh.geometry = next;
            lastTemp = next;
            mesh.userData.edited = false;
            if (app.editMode.active && app.editMode.mesh === mesh) app.editMode.rebuild();
            app.events.emit('transform-changed');
          },
          commit: () => {
            if (!pending) return;
            lastTemp = null;
            app.history.push(new ReplaceGeometryCmd(app, mesh, pending, geometryState(mesh), 'Geometry'));
            pending = null;
            app.events.emit('objects-changed');
          },
        })
      );
    }
  }

  _materialSection(mesh) {
    const app = this.app;
    const m = mesh.material;
    const body = section(this.el, 'Material');

    const pushProp = (label, apply, before, after) => {
      if (before === after) return;
      app.history.push(new PropCmd(app, label, apply, before, after));
    };

    this.track(
      colorField(body, 'Base Color', {
        get: () => '#' + m.color.getHexString(),
        set: (v) => m.color.set(v),
        commit: (b, v) => pushProp('Color', (x) => m.color.set(x), b, v),
      })
    );
    this.track(
      numberField(row(body, 'Metallic'), {
        step: 0.004, min: 0, max: 1, slider: true,
        get: () => m.metalness,
        set: (v) => { m.metalness = v; },
        commit: (b, v) => pushProp('Metallic', (x) => { m.metalness = x; }, b, v),
      })
    );
    this.track(
      numberField(row(body, 'Roughness'), {
        step: 0.004, min: 0, max: 1, slider: true,
        get: () => m.roughness,
        set: (v) => { m.roughness = v; },
        commit: (b, v) => pushProp('Roughness', (x) => { m.roughness = x; }, b, v),
      })
    );
    this.track(
      colorField(body, 'Emission', {
        get: () => '#' + m.emissive.getHexString(),
        set: (v) => m.emissive.set(v),
        commit: (b, v) => pushProp('Emission', (x) => m.emissive.set(x), b, v),
      })
    );
    this.track(
      numberField(row(body, 'Emission Strength'), {
        step: 0.02, min: 0, max: 50,
        get: () => m.emissiveIntensity,
        set: (v) => { m.emissiveIntensity = v; },
        commit: (b, v) => pushProp('Emission Strength', (x) => { m.emissiveIntensity = x; }, b, v),
      })
    );
    const applyAlpha = (x) => {
      m.opacity = x;
      m.transparent = x < 1;
      m.needsUpdate = true;
    };
    this.track(
      numberField(row(body, 'Alpha'), {
        step: 0.004, min: 0, max: 1, slider: true,
        get: () => m.opacity,
        set: applyAlpha,
        commit: (b, v) => pushProp('Alpha', applyAlpha, b, v),
      })
    );
    this.track(
      checkField(body, 'Flat Shading', {
        get: () => m.flatShading,
        set: (v) =>
          app.history.exec(
            new PropCmd(app, 'Flat Shading', (x) => {
              m.flatShading = x;
              m.needsUpdate = true;
            }, m.flatShading, v)
          ),
      })
    );
    this.track(
      checkField(body, 'Wireframe', {
        get: () => m.userData.wire,
        set: (v) =>
          app.history.exec(
            new PropCmd(app, 'Wireframe', (x) => {
              m.userData.wire = x;
              app.sceneM.syncMeshWireframe(mesh);
            }, m.userData.wire, v)
          ),
      })
    );
  }

  _lightSection(group) {
    const app = this.app;
    const l = group.userData.light;
    const body = section(this.el, 'Light');
    note(body, `${group.userData.lightType[0].toUpperCase()}${group.userData.lightType.slice(1)} light`);

    this.track(
      colorField(body, 'Color', {
        get: () => '#' + l.color.getHexString(),
        set: (v) => l.color.set(v),
        commit: (b, v) => app.history.push(new PropCmd(app, 'Light Color', (x) => l.color.set(x), b, v)),
      })
    );
    this.track(
      numberField(row(body, 'Power'), {
        step: l.isDirectionalLight ? 0.02 : 2,
        min: 0,
        max: l.isDirectionalLight ? 50 : 20000,
        get: () => l.intensity,
        set: (v) => { l.intensity = v; },
        commit: (b, v) => app.history.push(new PropCmd(app, 'Light Power', (x) => { l.intensity = x; }, b, v)),
      })
    );
    if (l.isSpotLight) {
      this.track(
        numberField(row(body, 'Spot Size'), {
          step: 0.25, min: 1, max: 89, unit: '°',
          get: () => THREE.MathUtils.radToDeg(l.angle),
          set: (v) => {
            l.angle = THREE.MathUtils.degToRad(v);
            refreshLightGizmo(group);
          },
          commit: (b, v) =>
            app.history.push(
              new PropCmd(app, 'Spot Size', (x) => {
                l.angle = THREE.MathUtils.degToRad(x);
                refreshLightGizmo(group);
              }, b, v)
            ),
        })
      );
      this.track(
        numberField(row(body, 'Blend'), {
          step: 0.004, min: 0, max: 1, slider: true,
          get: () => l.penumbra,
          set: (v) => { l.penumbra = v; },
          commit: (b, v) => app.history.push(new PropCmd(app, 'Spot Blend', (x) => { l.penumbra = x; }, b, v)),
        })
      );
    }
    this.track(
      checkField(body, 'Shadows', {
        get: () => l.castShadow,
        set: (v) =>
          app.history.exec(new PropCmd(app, 'Light Shadows', (x) => { l.castShadow = x; }, l.castShadow, v)),
      })
    );
    note(body, 'Scene lights are visible in Material and Rendered shading (Z to cycle).');
  }
}
