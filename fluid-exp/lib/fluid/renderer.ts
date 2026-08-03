/**
 * WebGL2 metaball renderer. Pass 1 accumulates a weighted density/color field
 * from instanced particle quads into an offscreen half-float texture; pass 2
 * thresholds the field into a liquid surface and normalizes the color.
 */

import type { FluidSim } from "./sim";
import { MAX_PARTICLES } from "./sim";

const SPLAT_RADIUS = 25; // render radius per particle, CSS px
const THRESHOLD = 0.52; // density field iso level
const BACKGROUND: [number, number, number] = [0.039, 0.047, 0.071]; // #0a0c12
const FIELD_SCALE = 0.5; // accumulation texture resolution vs drawing buffer

const SPLAT_VS = `#version 300 es
layout(location = 0) in vec2 aPos;
layout(location = 1) in vec4 aCol;
uniform vec2 uView;
uniform float uRadius;
out vec2 vOff;
out vec4 vCol;
void main() {
  vec2 corner = vec2(float(gl_VertexID & 1), float((gl_VertexID >> 1) & 1)) * 2.0 - 1.0;
  vOff = corner;
  vCol = aCol;
  vec2 p = aPos + corner * uRadius;
  gl_Position = vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, 0.0, 1.0);
}`;

const SPLAT_FS = `#version 300 es
precision highp float;
in vec2 vOff;
in vec4 vCol;
uniform float uWeightScale;
out vec4 outColor;
void main() {
  float t = max(1.0 - dot(vOff, vOff), 0.0);
  float w = t * t * vCol.a * uWeightScale;
  outColor = vec4(vCol.rgb * w, w);
}`;

const COMP_VS = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const COMP_FS = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uField;
uniform vec3 uBg;
uniform float uThresh;
out vec4 outColor;
void main() {
  vec4 f = texture(uField, vUv);
  float field = f.a;
  float edge = smoothstep(uThresh, uThresh * 1.4, field);
  vec3 col = uBg;
  if (edge > 0.0) {
    vec3 fluid = f.rgb / max(field, 1e-6);
    float depth = smoothstep(uThresh, uThresh * 7.0, field);
    vec3 shade = fluid * mix(1.08, 0.72, depth);
    float rim = smoothstep(uThresh, uThresh * 1.9, field) * (1.0 - smoothstep(uThresh * 1.9, uThresh * 3.2, field));
    shade += fluid * rim * 0.25;
    shade = pow(max(shade, vec3(0.0)), vec3(1.0 / 2.2));
    col = mix(uBg, shade, edge);
  }
  outColor = vec4(col, 1.0);
}`;

export class FluidRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly gl: WebGL2RenderingContext;
  private readonly splatProg: WebGLProgram;
  private readonly compProg: WebGLProgram;
  private readonly splatVao: WebGLVertexArrayObject;
  private readonly compVao: WebGLVertexArrayObject;
  private readonly instBuf: WebGLBuffer;
  private readonly instData = new Float32Array(MAX_PARTICLES * 6);

  private readonly uView: WebGLUniformLocation | null;
  private readonly uRadius: WebGLUniformLocation | null;
  private readonly uWeightScale: WebGLUniformLocation | null;
  private readonly uField: WebGLUniformLocation | null;
  private readonly uBg: WebGLUniformLocation | null;
  private readonly uThresh: WebGLUniformLocation | null;

  private floatOK: boolean;
  private fieldTex: WebGLTexture | null = null;
  private fbo: WebGLFramebuffer | null = null;
  private fieldW = 1;
  private fieldH = 1;
  private cssW = 1;
  private cssH = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("WebGL2 not supported");
    this.gl = gl;
    this.floatOK = !!gl.getExtension("EXT_color_buffer_float");

    this.splatProg = buildProgram(gl, SPLAT_VS, SPLAT_FS);
    this.compProg = buildProgram(gl, COMP_VS, COMP_FS);
    this.uView = gl.getUniformLocation(this.splatProg, "uView");
    this.uRadius = gl.getUniformLocation(this.splatProg, "uRadius");
    this.uWeightScale = gl.getUniformLocation(this.splatProg, "uWeightScale");
    this.uField = gl.getUniformLocation(this.compProg, "uField");
    this.uBg = gl.getUniformLocation(this.compProg, "uBg");
    this.uThresh = gl.getUniformLocation(this.compProg, "uThresh");

    const instBuf = gl.createBuffer();
    const splatVao = gl.createVertexArray();
    const compVao = gl.createVertexArray();
    if (!instBuf || !splatVao || !compVao) throw new Error("WebGL allocation failed");
    this.instBuf = instBuf;
    this.splatVao = splatVao;
    this.compVao = compVao;

    gl.bindVertexArray(splatVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, instBuf);
    gl.bufferData(gl.ARRAY_BUFFER, this.instData.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 24, 0);
    gl.vertexAttribDivisor(0, 1);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 24, 8);
    gl.vertexAttribDivisor(1, 1);
    gl.bindVertexArray(null);
  }

  resize(cssW: number, cssH: number, dpr: number) {
    const gl = this.gl;
    this.cssW = cssW;
    this.cssH = cssH;
    this.canvas.width = Math.max(1, Math.round(cssW * dpr));
    this.canvas.height = Math.max(1, Math.round(cssH * dpr));
    this.fieldW = Math.max(1, Math.round(this.canvas.width * FIELD_SCALE));
    this.fieldH = Math.max(1, Math.round(this.canvas.height * FIELD_SCALE));
    this.allocField();
    if (this.floatOK && gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      // Some drivers reject blending into RGBA16F; fall back to RGBA8.
      this.floatOK = false;
      this.allocField();
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  private allocField() {
    const gl = this.gl;
    if (this.fieldTex) gl.deleteTexture(this.fieldTex);
    if (this.fbo) gl.deleteFramebuffer(this.fbo);
    this.fieldTex = gl.createTexture();
    this.fbo = gl.createFramebuffer();
    gl.bindTexture(gl.TEXTURE_2D, this.fieldTex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, this.floatOK ? gl.RGBA16F : gl.RGBA8, this.fieldW, this.fieldH);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.fieldTex, 0);
  }

  render(sim: FluidSim) {
    const gl = this.gl;
    const n = sim.count;
    const weightScale = this.floatOK ? 1 : 1 / 24;

    const d = this.instData;
    for (let i = 0, o = 0; i < n; i++, o += 6) {
      d[o] = sim.x[i];
      d[o + 1] = sim.y[i];
      d[o + 2] = sim.colR[i];
      d[o + 3] = sim.colG[i];
      d[o + 4] = sim.colB[i];
      const l = sim.life[i];
      d[o + 5] = l < 0 ? 0 : l > 1 ? 1 : l;
    }

    // Pass 1: accumulate the density field.
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, this.fieldW, this.fieldH);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (n > 0) {
      gl.useProgram(this.splatProg);
      gl.uniform2f(this.uView, this.cssW, this.cssH);
      gl.uniform1f(this.uRadius, SPLAT_RADIUS);
      gl.uniform1f(this.uWeightScale, weightScale);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, d, 0, n * 6);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.bindVertexArray(this.splatVao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, n);
      gl.bindVertexArray(null);
      gl.disable(gl.BLEND);
    }

    // Pass 2: threshold into a surface.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.compProg);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fieldTex);
    gl.uniform1i(this.uField, 0);
    gl.uniform3f(this.uBg, BACKGROUND[0], BACKGROUND[1], BACKGROUND[2]);
    gl.uniform1f(this.uThresh, THRESHOLD * weightScale);
    gl.bindVertexArray(this.compVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }

  dispose() {
    const gl = this.gl;
    gl.deleteProgram(this.splatProg);
    gl.deleteProgram(this.compProg);
    gl.deleteBuffer(this.instBuf);
    gl.deleteVertexArray(this.splatVao);
    gl.deleteVertexArray(this.compVao);
    if (this.fieldTex) gl.deleteTexture(this.fieldTex);
    if (this.fbo) gl.deleteFramebuffer(this.fbo);
  }
}

function buildProgram(gl: WebGL2RenderingContext, vsSrc: string, fsSrc: string): WebGLProgram {
  const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
  const prog = gl.createProgram();
  if (!prog) throw new Error("createProgram failed");
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(prog);
    gl.deleteProgram(prog);
    throw new Error(`Program link failed: ${info}`);
  }
  return prog;
}

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type);
  if (!sh) throw new Error("createShader failed");
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`Shader compile failed: ${info}`);
  }
  return sh;
}
