// Canvas renderer: world is Y-up in meters, screen is Y-down in CSS pixels.

import { V } from './math.js';
import { SpringJoint, MouseJoint, RevoluteJoint } from './joints.js';

const PALETTE = ['#4cc9f0', '#f72585', '#b5e48c', '#ffd166', '#c77dff', '#ff9770', '#80ffdb', '#a0c4ff'];

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camera = { x: 0, y: 4, zoom: 40 }; // zoom = pixels per meter
    this.options = {
      grid: true, trails: true, vectors: false,
      contacts: false, aabbs: false, labels: true,
    };
    this.width = 0;
    this.height = 0;
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.dpr = dpr;
  }

  toScreen(p) {
    return {
      x: (p.x - this.camera.x) * this.camera.zoom + this.width / 2,
      y: this.height / 2 - (p.y - this.camera.y) * this.camera.zoom,
    };
  }

  toWorld(s) {
    return {
      x: (s.x - this.width / 2) / this.camera.zoom + this.camera.x,
      y: (this.height / 2 - s.y) / this.camera.zoom + this.camera.y,
    };
  }

  bodyColor(body) {
    return body.color ?? PALETTE[body.id % PALETTE.length];
  }

  render(world, overlay = {}) {
    const { ctx } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#0b0e14';
    ctx.fillRect(0, 0, this.width, this.height);

    if (this.options.grid) this.drawGrid();
    if (this.options.trails) this.drawTrails(world);
    this.drawJoints(world);
    for (const b of world.bodies) this.drawBody(b);
    if (this.options.vectors) this.drawVectors(world);
    if (this.options.contacts) this.drawContacts(world);
    if (this.options.aabbs) this.drawAABBs(world);
    if (this.options.labels) this.drawAnnotations(world);
    if (overlay.aim) this.drawAim(overlay.aim);
  }

  drawGrid() {
    const { ctx, camera } = this;
    const step = camera.zoom > 28 ? 1 : camera.zoom > 9 ? 5 : 20;
    const left = camera.x - this.width / 2 / camera.zoom;
    const right = camera.x + this.width / 2 / camera.zoom;
    const bottom = camera.y - this.height / 2 / camera.zoom;
    const top = camera.y + this.height / 2 / camera.zoom;

    ctx.lineWidth = 1;
    for (let x = Math.floor(left / step) * step; x <= right; x += step) {
      const s = this.toScreen({ x, y: 0 });
      ctx.strokeStyle = Math.abs(x) < step / 2 ? '#2a3550' : '#151a26';
      ctx.beginPath();
      ctx.moveTo(s.x, 0); ctx.lineTo(s.x, this.height);
      ctx.stroke();
    }
    for (let y = Math.floor(bottom / step) * step; y <= top; y += step) {
      const s = this.toScreen({ x: 0, y });
      ctx.strokeStyle = Math.abs(y) < step / 2 ? '#2a3550' : '#151a26';
      ctx.beginPath();
      ctx.moveTo(0, s.y); ctx.lineTo(this.width, s.y);
      ctx.stroke();
    }
  }

  drawBody(b) {
    const { ctx } = this;
    const color = this.bodyColor(b);
    const s = this.toScreen(b.position);

    if (b.isStatic) {
      ctx.fillStyle = 'rgba(70, 80, 110, 0.35)';
      ctx.strokeStyle = '#566180';
    } else {
      ctx.fillStyle = color + '2e';
      ctx.strokeStyle = color;
    }
    ctx.lineWidth = 1.6;

    if (b.shape.type === 'circle') {
      const r = b.shape.radius * this.camera.zoom;
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      // rotation indicator
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + r * Math.cos(-b.angle), s.y + r * Math.sin(-b.angle));
      ctx.globalAlpha = 0.55;
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else {
      const verts = b.worldVerts;
      ctx.beginPath();
      const p0 = this.toScreen(verts[0]);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < verts.length; i++) {
        const p = this.toScreen(verts[i]);
        ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }

    if (this.options.labels && b.label) {
      ctx.fillStyle = '#cdd6f4';
      ctx.font = '11px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(b.label, s.x, s.y - (b.shape.type === 'circle'
        ? b.shape.radius * this.camera.zoom + 6
        : (b.aabb.maxY - b.position.y) * this.camera.zoom + 6));
    }
  }

  drawTrails(world) {
    const { ctx } = this;
    ctx.lineWidth = 1.2;
    for (const b of world.bodies) {
      if (!b.trail || b.trail.length < 2) continue;
      ctx.strokeStyle = this.bodyColor(b);
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      const p0 = this.toScreen(b.trail[0]);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < b.trail.length; i++) {
        const p = this.toScreen(b.trail[i]);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  drawJoints(world) {
    const { ctx } = this;
    for (const j of world.joints) {
      if (!j.anchors) continue;
      const [pA, pB] = j.anchors();
      const sA = this.toScreen(pA), sB = this.toScreen(pB);
      if (j instanceof SpringJoint) {
        this.drawSpring(sA, sB);
      } else if (j instanceof MouseJoint) {
        ctx.strokeStyle = '#f72585';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(sA.x, sA.y); ctx.lineTo(sB.x, sB.y); ctx.stroke();
        ctx.setLineDash([]);
      } else if (j instanceof RevoluteJoint) {
        ctx.fillStyle = '#8b96b5';
        ctx.beginPath(); ctx.arc(sA.x, sA.y, 2.5, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.strokeStyle = '#8b96b5';
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(sA.x, sA.y); ctx.lineTo(sB.x, sB.y); ctx.stroke();
      }
    }
  }

  drawSpring(sA, sB) {
    const { ctx } = this;
    const segments = 10;
    const dx = sB.x - sA.x, dy = sB.y - sA.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len; // perpendicular
    const amp = 5;
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(sA.x, sA.y);
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const side = (i % 2 === 0 ? 1 : -1) * (i === 0 || i === segments ? 0 : 1);
      ctx.lineTo(sA.x + dx * t + nx * amp * side, sA.y + dy * t + ny * amp * side);
    }
    ctx.lineTo(sB.x, sB.y);
    ctx.stroke();
  }

  drawVectors(world) {
    const { ctx } = this;
    for (const b of world.bodies) {
      if (b.isStatic) continue;
      const speed = V.len(b.velocity);
      if (speed < 0.05) continue;
      const from = this.toScreen(b.position);
      const to = this.toScreen(V.add(b.position, V.scale(b.velocity, 0.15)));
      this.drawArrow(from, to, '#5ef38c');
    }
  }

  drawArrow(from, to, color) {
    const { ctx } = this;
    const dx = to.x - from.x, dy = to.y - from.y;
    const len = Math.hypot(dx, dy);
    if (len < 3) return;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
    const a = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - 7 * Math.cos(a - 0.4), to.y - 7 * Math.sin(a - 0.4));
    ctx.lineTo(to.x - 7 * Math.cos(a + 0.4), to.y - 7 * Math.sin(a + 0.4));
    ctx.closePath(); ctx.fill();
  }

  drawContacts(world) {
    const { ctx } = this;
    for (const m of world.manifolds) {
      for (const pt of m.points) {
        const s = this.toScreen(pt.p);
        ctx.fillStyle = '#ff4d6d';
        ctx.beginPath(); ctx.arc(s.x, s.y, 3, 0, Math.PI * 2); ctx.fill();
        const tip = this.toScreen(V.add(pt.p, V.scale(m.normal, 0.4)));
        ctx.strokeStyle = '#ff4d6d';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
      }
    }
  }

  drawAABBs(world) {
    const { ctx } = this;
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.4)';
    ctx.lineWidth = 1;
    for (const b of world.bodies) {
      const lo = this.toScreen({ x: b.aabb.minX, y: b.aabb.maxY });
      const hi = this.toScreen({ x: b.aabb.maxX, y: b.aabb.minY });
      ctx.strokeRect(lo.x, lo.y, hi.x - lo.x, hi.y - lo.y);
    }
  }

  drawAnnotations(world) {
    const { ctx } = this;
    ctx.fillStyle = '#8b96b5';
    ctx.font = '12px ui-monospace, monospace';
    ctx.textAlign = 'center';
    for (const a of world.annotations) {
      const s = this.toScreen(a);
      ctx.fillText(a.text, s.x, s.y);
    }
  }

  drawAim(aim) {
    const { ctx } = this;
    const from = this.toScreen(aim.from);
    const cur = this.toScreen(aim.to);
    ctx.strokeStyle = '#4cc9f0';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(cur.x, cur.y); ctx.stroke();
    ctx.setLineDash([]);
    // launch velocity arrow (opposite the pull, slingshot style)
    const v = { x: from.x - (cur.x - from.x), y: from.y - (cur.y - from.y) };
    this.drawArrow(from, v, '#5ef38c');
    ctx.fillStyle = '#4cc9f0';
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(`${aim.speed.toFixed(1)} m/s`, from.x + 10, from.y - 10);
  }
}
