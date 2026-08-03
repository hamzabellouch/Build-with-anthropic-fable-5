import * as THREE from 'three';
import { createMesh, createLight, defaultMaterial, refreshLightGizmo } from '../core/factory.js';

export const FILE_VERSION = 1;

// ---- base64 <-> typed arrays ----------------------------------------------

export function b64FromTyped(arr) {
  const u8 = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
  let s = '';
  const CH = 0x8000;
  for (let i = 0; i < u8.length; i += CH) {
    s += String.fromCharCode.apply(null, u8.subarray(i, Math.min(i + CH, u8.length)));
  }
  return btoa(s);
}

function bytesFromB64(b64) {
  const s = atob(b64);
  const u8 = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
  return u8;
}

export function f32FromB64(b64) {
  return new Float32Array(bytesFromB64(b64).buffer);
}

export function u32FromB64(b64) {
  return new Uint32Array(bytesFromB64(b64).buffer);
}

export function u16FromB64(b64) {
  return new Uint16Array(bytesFromB64(b64).buffer);
}

// ---- serialize -------------------------------------------------------------

function serializeMaterial(m) {
  return {
    color: '#' + m.color.getHexString(),
    roughness: m.roughness,
    metalness: m.metalness,
    emissive: '#' + m.emissive.getHexString(),
    emissiveIntensity: m.emissiveIntensity,
    opacity: m.opacity,
    flatShading: m.flatShading,
    wire: m.userData?.wire || false,
  };
}

function serializeFullGeometry(geo) {
  const out = {
    positions: b64FromTyped(geo.attributes.position.array),
  };
  if (geo.attributes.normal) out.normals = b64FromTyped(geo.attributes.normal.array);
  if (geo.attributes.uv) out.uvs = b64FromTyped(geo.attributes.uv.array);
  if (geo.index) {
    out.index = b64FromTyped(geo.index.array);
    out.indexBits = geo.index.array instanceof Uint16Array ? 16 : 32;
  }
  return out;
}

function serializeObject(o) {
  const rec = {
    kind: o.userData.kind,
    name: o.name,
    visible: o.visible,
    position: o.position.toArray(),
    rotation: [o.rotation.x, o.rotation.y, o.rotation.z],
    scale: o.scale.toArray(),
  };
  if (o.userData.kind === 'mesh') {
    rec.primitive = o.userData.primitive;
    rec.params = { ...o.userData.params };
    rec.edited = !!o.userData.edited;
    rec.topo = !!o.userData.topo;
    rec.castShadow = o.castShadow;
    rec.receiveShadow = o.receiveShadow;
    rec.material = serializeMaterial(o.material);
    if (rec.topo || rec.primitive === 'imported') {
      rec.geometry = serializeFullGeometry(o.geometry);
    } else if (rec.edited) {
      rec.positions = b64FromTyped(o.geometry.attributes.position.array);
    }
  } else if (o.userData.kind === 'light') {
    const l = o.userData.light;
    rec.lightType = o.userData.lightType;
    rec.color = '#' + l.color.getHexString();
    rec.intensity = l.intensity;
    rec.castShadow = l.castShadow;
    if (l.isSpotLight) {
      rec.angle = l.angle;
      rec.penumbra = l.penumbra;
    }
  }
  return rec;
}

export function serializeScene(app) {
  return {
    app: 'blender-web',
    version: FILE_VERSION,
    shading: app.shading,
    camera: app.viewport.getCameraState(),
    objects: app.sceneM.objects.map(serializeObject),
  };
}

// ---- deserialize ------------------------------------------------------------

function applyMaterial(m, rec) {
  if (!rec) return;
  m.color.set(rec.color ?? '#cccccc');
  m.roughness = rec.roughness ?? 0.5;
  m.metalness = rec.metalness ?? 0;
  m.emissive.set(rec.emissive ?? '#000000');
  m.emissiveIntensity = rec.emissiveIntensity ?? 1;
  m.opacity = rec.opacity ?? 1;
  m.transparent = m.opacity < 1;
  m.flatShading = !!rec.flatShading;
  m.userData.wire = !!rec.wire;
  m.needsUpdate = true;
}

function geometryFromFull(data) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(f32FromB64(data.positions), 3));
  if (data.normals) {
    geo.setAttribute('normal', new THREE.BufferAttribute(f32FromB64(data.normals), 3));
  }
  if (data.uvs) {
    geo.setAttribute('uv', new THREE.BufferAttribute(f32FromB64(data.uvs), 2));
  }
  if (data.index) {
    const arr = data.indexBits === 16 ? u16FromB64(data.index) : u32FromB64(data.index);
    geo.setIndex(new THREE.BufferAttribute(arr, 1));
  }
  if (!data.normals) geo.computeVertexNormals();
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

function deserializeObject(rec) {
  let obj;
  if (rec.kind === 'light') {
    obj = createLight(rec.lightType || 'point');
    const l = obj.userData.light;
    l.color.set(rec.color ?? '#ffffff');
    l.intensity = rec.intensity ?? l.intensity;
    l.castShadow = rec.castShadow !== false;
    if (l.isSpotLight) {
      l.angle = rec.angle ?? l.angle;
      l.penumbra = rec.penumbra ?? l.penumbra;
      refreshLightGizmo(obj);
    }
  } else {
    if (rec.geometry) {
      obj = new THREE.Mesh(geometryFromFull(rec.geometry), defaultMaterial());
      obj.userData.kind = 'mesh';
      obj.userData.primitive = rec.primitive || 'imported';
      obj.userData.params = rec.params || {};
      obj.userData.edited = !!rec.edited;
      obj.userData.topo = true;
    } else {
      obj = createMesh(rec.primitive || 'cube', rec.params);
      if (rec.positions) {
        const attr = obj.geometry.attributes.position;
        const arr = f32FromB64(rec.positions);
        if (arr.length === attr.array.length) {
          attr.array.set(arr);
          attr.needsUpdate = true;
          obj.geometry.computeVertexNormals();
          obj.geometry.computeBoundingBox();
          obj.geometry.computeBoundingSphere();
          obj.userData.edited = true;
        }
      }
    }
    obj.castShadow = rec.castShadow !== false;
    obj.receiveShadow = rec.receiveShadow !== false;
    applyMaterial(obj.material, rec.material);
  }
  obj.name = rec.name || 'Object';
  obj.visible = rec.visible !== false;
  obj.position.fromArray(rec.position || [0, 0, 0]);
  if (rec.rotation) obj.rotation.set(rec.rotation[0], rec.rotation[1], rec.rotation[2]);
  obj.scale.fromArray(rec.scale || [1, 1, 1]);
  return obj;
}

export function deserializeScene(app, data) {
  if (!data || !Array.isArray(data.objects)) throw new Error('Not a valid scene file');
  app.clearScene();
  for (const rec of data.objects) {
    try {
      app.sceneM.objectsGroup.add(deserializeObject(rec));
    } catch (err) {
      console.error('Failed to restore object', rec, err);
    }
  }
  app.setShading(data.shading || 'solid');
  if (data.camera) app.viewport.setCameraState(data.camera);
  app.afterSceneMutation();
  app.events.emit('history-changed');
}
