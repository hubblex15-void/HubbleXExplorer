import { RGB, byte, pack, bayer, hex } from './util';

/** Software framebuffer. RGBA, little-endian packed writes. */
export class FB {
  w: number; h: number; data: Uint8ClampedArray; u32: Uint32Array;
  constructor(w: number, h: number) {
    this.w = w; this.h = h;
    const b = new ArrayBuffer(w * h * 4);
    this.data = new Uint8ClampedArray(b); this.u32 = new Uint32Array(b);
  }
  set(x: number, y: number, r: number, g: number, b: number): void {
    x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.u32[y * this.w + x] = pack(r, g, b);
  }
  get(x: number, y: number): RGB {
    const v = this.u32[y * this.w + x];
    return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255];
  }
  blend(x: number, y: number, r: number, g: number, b: number, a: number): void {
    x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h || a <= 0) return;
    const i = y * this.w + x, v = this.u32[i];
    const R = v & 255, G = (v >>> 8) & 255, B = (v >>> 16) & 255;
    this.u32[i] = pack(R + (r - R) * a, G + (g - G) * a, B + (b - B) * a);
  }
  /** additive "screen" light: never clips harshly */
  light(x: number, y: number, r: number, g: number, b: number, a: number): void {
    x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h || a <= 0) return;
    const i = y * this.w + x, v = this.u32[i];
    const R = v & 255, G = (v >>> 8) & 255, B = (v >>> 16) & 255;
    this.u32[i] = pack(R + (255 - R) * (r / 255) * a, G + (255 - G) * (g / 255) * a, B + (255 - B) * (b / 255) * a);
  }
  rect(x: number, y: number, w: number, h: number, r: number, g: number, b: number): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, r, g, b);
  }
}

/** Small palette-indexed sprite. Index 0 = transparent. */
export interface Sprite { w: number; h: number; px: Uint8Array; pal: RGB[]; }
export function makeSprite(rows: string[], pal: Record<string, string>): Sprite {
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const px = new Uint8Array(w * h); const list: RGB[] = [[0, 0, 0]]; const idx: Record<string, number> = {};
  for (let y = 0; y < h; y++) for (let x = 0; x < rows[y].length; x++) {
    const ch = rows[y][x]; if (ch === '.' || ch === ' ') continue;
    if (idx[ch] === undefined) { const c = pal[ch]; if (!c) throw new Error('sprite palette missing ' + ch); idx[ch] = list.length; list.push(hex(c)); }
    px[y * w + x] = idx[ch];
  }
  return { w, h, px, pal: list };
}
export interface BlitOpt { flip?: boolean; tint?: RGB; da?: number; add?: RGB; }
/** da = dithered alpha (pixel-art friendly fade). */
export function blit(fb: FB, s: Sprite, x: number, y: number, o: BlitOpt = {}): void {
  x |= 0; y |= 0;
  const t = o.tint, da = o.da === undefined ? 1 : o.da; if (da <= 0) return;
  for (let j = 0; j < s.h; j++) for (let i = 0; i < s.w; i++) {
    const p = s.px[j * s.w + (o.flip ? s.w - 1 - i : i)]; if (!p) continue;
    const dx = x + i, dy = y + j; if (dx < 0 || dy < 0 || dx >= fb.w || dy >= fb.h) continue;
    if (da < 1 && bayer(dx, dy) > da) continue;
    const c = s.pal[p]; let r = c[0], g = c[1], b = c[2];
    if (t) { r *= t[0]; g *= t[1]; b *= t[2]; }
    if (o.add) { r += o.add[0]; g += o.add[1]; b += o.add[2]; }
    fb.u32[dy * fb.w + dx] = pack(r, g, b);
  }
}

/** Tiny offscreen RGBA canvas (used for the character so it can be outlined). */
export class Buf {
  w: number; h: number; px: Uint32Array;
  constructor(w: number, h: number) { this.w = w; this.h = h; this.px = new Uint32Array(w * h); }
  clear(): void { this.px.fill(0); }
  set(x: number, y: number, c: RGB | number): void {
    x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.px[y * this.w + x] = typeof c === 'number' ? c : pack(c[0], c[1], c[2]);
  }
  get(x: number, y: number): number { return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.px[y * this.w + x]; }
  rect(x: number, y: number, w: number, h: number, c: RGB | number): void { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  line(x0: number, y0: number, x1: number, y1: number, c: RGB | number, thick = 1): void {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, c); if (thick > 1) this.set(x0 + 1, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  /** dark outline around opaque pixels (in a darker shade of the neighbour) */
  outline(col: RGB): void {
    const w = this.w, h = this.h, src = this.px.slice(), oc = pack(col[0], col[1], col[2]);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (src[y * w + x]) continue;
      if ((x > 0 && src[y * w + x - 1]) || (x < w - 1 && src[y * w + x + 1]) || (y > 0 && src[(y - 1) * w + x]) || (y < h - 1 && src[(y + 1) * w + x])) this.px[y * w + x] = oc;
    }
  }
  /** coloured "sel-out" outline: each outline pixel is a darkened copy of the neighbouring colour */
  outlineSel(k = 0.36, min: RGB = [24, 16, 12]): void {
    const w = this.w, h = this.h, src = this.px.slice();
    const dark = (v: number): number => { const r = Math.max(min[0], (v & 255) * k), g = Math.max(min[1], ((v >>> 8) & 255) * k), b = Math.max(min[2], ((v >>> 16) & 255) * k); return pack(r, g, b); };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (src[y * w + x]) continue;
      let best = 0, bl = 1e9;
      const nb = [x > 0 ? src[y * w + x - 1] : 0, x < w - 1 ? src[y * w + x + 1] : 0, y > 0 ? src[(y - 1) * w + x] : 0, y < h - 1 ? src[(y + 1) * w + x] : 0];
      for (const v of nb) if (v) { const l = (v & 255) + ((v >>> 8) & 255) + ((v >>> 16) & 255); if (l < bl) { bl = l; best = v; } }
      if (best) this.px[y * w + x] = dark(best);
    }
  }
  /** draw into framebuffer with origin (ox,oy) = buffer pixel that maps to fb (fx,fy) */
  drawTo(fb: FB, fx: number, fy: number, ox: number, oy: number, flip: boolean, tint: RGB, da = 1, fog?: [number, number, number, number]): void {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const v = this.px[y * this.w + x]; if (!v) continue;
      const rx = flip ? -(x - ox) : x - ox; const dx = Math.round(fx + rx), dy = Math.round(fy + (y - oy));
      if (dx < 0 || dy < 0 || dx >= fb.w || dy >= fb.h) continue;
      if (da < 1 && bayer(dx, dy) > da) continue;
      let r = (v & 255) * tint[0], g = ((v >>> 8) & 255) * tint[1], b = ((v >>> 16) & 255) * tint[2];
      if (fog) { r += (fog[0] - r) * fog[3]; g += (fog[1] - g) * fog[3]; b += (fog[2] - b) * fog[3]; }
      fb.u32[dy * fb.w + dx] = pack(r, g, b);
    }
  }
}
export { byte };
