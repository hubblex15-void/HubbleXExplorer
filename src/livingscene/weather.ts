import { RGB, clamp, mix, hash2, bayer, mulberry32, wrap, lum, sstep } from './util';
import { FB } from './fb';
import { W, H } from './world';
import type { Sky } from './sky';
import type { WeatherTarget } from './types';

/** Eased weather state: every channel glides toward its target, so nothing ever snaps. */
export interface WX { cloud: number; rain: number; snow: number; fog: number; thunder: number; wind: number; snowCover: number; wet: number; flash: number; nextFlash: number; boltSeed: number; cloudOff: number[]; }
export const newWX = (t?: WeatherTarget): WX => ({ cloud: t?.cloud ?? 0.15, rain: t?.rain ?? 0, snow: t?.snow ?? 0, fog: t?.fog ?? 0, thunder: t?.thunder ?? 0, wind: t?.wind ?? 0.15, snowCover: 0, wet: 0, flash: 0, nextFlash: 3, boltSeed: 1, cloudOff: [0, 0, 0] });
export function stepWeather(w: WX, t: WeatherTarget, dt: number, now: number, rnd: () => number): void {
  const k = (tau: number) => 1 - Math.exp(-dt / tau);
  w.cloud += (t.cloud - w.cloud) * k(40); w.rain += (t.rain - w.rain) * k(25); w.snow += (t.snow - w.snow) * k(40);
  w.fog += (t.fog - w.fog) * k(50); w.thunder += (t.thunder - w.thunder) * k(15); w.wind += (t.wind - w.wind) * k(20);
  const cold = t.tempC === null || t.tempC <= 1.5;
  w.snowCover = clamp(w.snowCover + (w.snow * dt) / 240 * (cold ? 1 : 0.25) - (w.snow < 0.05 ? dt / (cold ? 6000 : 900) : 0));
  w.wet = clamp(w.wet + (w.rain * dt) / 30 - ((1 - w.rain) * dt) / 400);
  for (let l = 0; l < 3; l++) w.cloudOff[l] += dt * (0.5 + w.wind * 3.2) * [0.6, 1, 1.7][l];
  if (w.thunder > 0.25 && now >= w.nextFlash) { w.flash = 1; w.boltSeed = Math.floor(rnd() * 1e6); w.nextFlash = now + (4 + rnd() * 10) / w.thunder; }
  w.flash = Math.max(0, w.flash - dt * 2.4);
}
// ---------- clouds ----------
interface CT { w: number; h: number; px: Uint8Array }
function cloudTemplate(seed: number, cw: number, ch: number): CT {
  const r = mulberry32(seed), px = new Uint8Array(cw * ch), base = ch - 2, n = 4 + Math.floor(r() * 3);
  const blobs: number[][] = []; for (let i = 0; i < n; i++) { const rx = cw * (0.16 + r() * 0.14), ry = ch * (0.3 + r() * 0.3); blobs.push([cw * (0.18 + (0.64 * i) / (n - 1)) + (r() - 0.5) * 3, base - ry * (0.55 + r() * 0.4), rx, ry]); }
  for (let y = 0; y < base + 1; y++) for (let x = 0; x < cw; x++) {
    let best = 9, nx = 0, ny = 0; for (const b of blobs) { const dx = (x - b[0]) / b[2], dy = (y - b[1]) / b[3], d = dx * dx + dy * dy; if (d < best) { best = d; nx = dx; ny = dy; } }
    if (best > 1) continue; const l = -(ny * 0.9 + nx * 0.3);
    px[y * cw + x] = y >= base - 1 ? 1 : l > 0.32 ? 3 : l > -0.22 ? 2 : 1;
  }
  return { w: cw, h: ch, px };
}
const TPL: CT[] = [[18, 8], [24, 9], [30, 10], [38, 12], [46, 14], [56, 16], [70, 20], [86, 24]].map(([a, b], i) => cloudTemplate(100 + i * 17, a, b));
const INST = (() => { const r = mulberry32(21), a: { x: number; y: number; t: number; l: number; sp: number }[] = []; const spec = [[0, 0, 3], [0, 1, 3], [1, 2, 2], [1, 3, 3], [1, 4, 3], [2, 5, 2], [1, 3, 3], [0, 2, 3], [2, 6, 2], [1, 4, 3], [2, 7, 2], [2, 6, 2], [1, 5, 3], [2, 7, 2]];
  spec.forEach(([l, t], i) => a.push({ x: r() * 420, y: [6, 20, 34][l] + r() * 16, t, l, sp: 0.8 + r() * 0.5 })); return a; })();
export function drawClouds(fb: FB, sky: Sky, w: WX): void {
  const storm = clamp(w.rain * 0.55 + w.thunder * 0.35 + (w.cloud > 0.85 ? 0.12 : 0));
  const base: RGB = mix([255, 255, 255], sky.h, 0.26 + 0.55 * sky.glow); const amb = mix(sky.amb, [1, 1, 1], 0.3);
  const shade = mix(sky.m, base, 0.35), pal: RGB[] = [[0, 0, 0], shade, [base[0] * 0.94, base[1] * 0.94, base[2] * 0.99], base];
  const tint = pal.map((c, i) => { if (!i) return c; const g = lum(c); const d = mix(c, [g * 0.7, g * 0.74, g * 0.82], storm * 0.85); return [d[0] * amb[0] * (1 - 0.2 * storm), d[1] * amb[1] * (1 - 0.2 * storm), d[2] * amb[2] * (1 - 0.15 * storm)] as RGB; });
  INST.forEach((c, i) => {
    const alpha = clamp((w.cloud * 1.12 - (i / INST.length) * 0.92) * 11); if (alpha < 0.04) return;
    const tp = TPL[c.t], span = W + tp.w + 24, x0 = wrap(c.x + w.cloudOff[c.l] * c.sp, span) - tp.w - 8, y0 = Math.round(c.y + w.rain * 10 + (c.l === 2 ? w.cloud * 6 : 0));
    for (let y = 0; y < tp.h; y++) for (let x = 0; x < tp.w; x++) {
      const v = tp.px[y * tp.w + x]; if (!v) continue; const dx = Math.round(x0 + x), dy = y0 + y; if (dx < 0 || dx >= W || dy < 0 || dy >= H) continue;
      if (bayer(dx, dy) > alpha) continue; const t = tint[v]; fb.set(dx, dy, t[0], t[1], t[2]);
    }
  });
}
// ---------- rain / snow ----------
export function drawPrecip(fb: FB, w: WX, t: number): void {
  const tq = Math.floor(t * 15) / 15, slant = (w.wind - 0.1) * 0.55;
  if (w.rain > 0.02) for (let i = 0; i < 280; i++) {
    if (i / 280 >= w.rain) continue;
    const sp = 95 + hash2(i, 1, 7) * 70, ly = 106 + hash2(i, 2, 7) * 36, x0 = hash2(i, 3, 7) * (W + 40) - 20, fall = (ly + 8) / sp, per = fall + 0.3 + hash2(i, 4, 7) * 0.5;
    const u = wrap(tq + hash2(i, 5, 7) * per, per);
    if (u < fall) { const y = -8 + u * sp, x = x0 + y * slant, len = 2 + Math.floor(w.rain * 2 + hash2(i, 6, 7)); for (let k = 0; k < len; k++) fb.blend(Math.round(x - slant * k), Math.round(y - k), 214, 226, 244, 0.6 - 0.13 * k); }
    else if (u < fall + 0.24) { const x = Math.round(x0 + ly * slant), y = Math.round(ly), f = (u - fall) / 0.24; if (f < 0.4) fb.blend(x, y, 232, 240, 252, 0.7); else if (f < 0.75) { fb.blend(x - 1, y, 232, 240, 252, 0.55); fb.blend(x + 1, y, 232, 240, 252, 0.55); fb.blend(x, y - 1, 232, 240, 252, 0.45); } else { fb.blend(x - 2, y, 232, 240, 252, 0.3); fb.blend(x + 2, y, 232, 240, 252, 0.3); } }
  }
  if (w.snow > 0.02) for (let i = 0; i < 230; i++) {
    if (i / 230 >= w.snow) continue;
    const near = i % 5 === 0, sp = near ? 22 + hash2(i, 1, 9) * 8 : 11 + hash2(i, 1, 9) * 8, ly = 104 + hash2(i, 2, 9) * 38, per = (ly + 6) / sp + 0.4;
    const u = wrap(t + hash2(i, 3, 9) * per, per), y = -4 + u * sp; if (y > ly) continue;
    const x = Math.round(wrap(hash2(i, 4, 9) * W + Math.sin(t * (0.8 + hash2(i, 5, 9)) + i) * (2 + hash2(i, 6, 9) * 3) + w.wind * y * 0.6, W)), yy = Math.round(y);
    fb.blend(x, yy, 255, 255, 255, near ? 0.95 : 0.75); if (near) { fb.blend(x + 1, yy, 255, 255, 255, 0.6); fb.blend(x, yy + 1, 255, 255, 255, 0.6); }
  }
}
export function drawFog(fb: FB, sky: Sky, w: WX, t: number): void {
  if (w.fog < 0.02) return;
  const c = mix(mix(sky.h, [236, 238, 242], 0.55), [30, 36, 62], sky.dark * 0.8);
  for (let y = 34; y < H; y++) { const base = clamp(0.22 + ((y - 34) / (H - 34)) * 0.95); for (let x = 0; x < W; x++) {
    const n = 0.5 + 0.5 * Math.sin(x * 0.045 + t * 0.12 + y * 0.02) * (0.6 + 0.4 * Math.sin(x * 0.013 - t * 0.05 + y * 0.09));
    const a = w.fog * base * (0.5 + 0.5 * n), q = Math.floor(a * 5 + bayer(x, y) * 0.999) / 5; if (q > 0) fb.blend(x, y, c[0], c[1], c[2], Math.min(0.9, q * 0.9));
  } }
}
export function drawLightning(fb: FB, w: WX): void {
  if (w.flash < 0.02) return;
  const a = w.flash * (0.75 + 0.25 * Math.sin(w.flash * 30)) * 0.3;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) fb.light(x, y, 226, 232, 255, a);
  if (w.flash > 0.55) { const r = mulberry32(w.boltSeed); let x = 50 + r() * 220, y = 0; while (y < 100) { const nx = x + (r() - 0.5) * 16, ny = y + 5 + r() * 5; for (let k = 0; k < 8; k++) { const px = x + ((nx - x) * k) / 8, py = y + ((ny - y) * k) / 8; fb.set(px, py, 255, 255, 255); fb.blend(px - 1, py, 190, 205, 255, 0.6); fb.blend(px + 1, py, 190, 205, 255, 0.6); } x = nx; y = ny; } }
}
