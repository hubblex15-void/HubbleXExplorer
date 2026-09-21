import { RGB, hex, mix, clamp, bayer, pack } from './util';
import { FB } from './fb';
import { Layer, CL } from './world';
import type { SeasonParams } from './season';
import type { Sky } from './sky';

export interface Look { sky: Sky; season: SeasonParams; snow: number; wet: number; fog: number; windowLit: number; lampLit: number; }
const PATH: RGB[] = [hex('#c39a68'), hex('#ad8654'), hex('#d3ad7a')];
const HAZE = [0, 0.5, 0.32, 0.15, 0];
export function classTable(k: Look): Float32Array {
  const t = new Float32Array(64 * 3), set = (i: number, c: RGB) => { t[i * 3] = c[0]; t[i * 3 + 1] = c[1]; t[i * 3 + 2] = c[2]; };
  const s = k.season, w = 1 - 0.22 * k.wet;
  for (let i = 0; i < 4; i++) { set(CL.L1 + i, s.leaf[i]); set(CL.G1 + i, [s.grass[i][0] * w, s.grass[i][1] * w, s.grass[i][2] * w]); }
  set(CL.FA, s.flowerA); set(CL.FB, s.flowerB); set(CL.FC, [255, 243, 200]); set(CL.ACT, s.accentTree); set(CL.FRUIT, s.fruit);
  for (let i = 0; i < 3; i++) set(CL.P1 + i, [PATH[i][0] * w, PATH[i][1] * w, PATH[i][2] * w]);
  const water = mix(k.sky.m, [48, 118, 168], 0.68); set(CL.WAT, water); set(CL.WATH, mix(water, [255, 255, 255], 0.5));
  return t;
}
/** composite one static layer over the sky. Lighting, haze, seasons, snow & window glow all happen here so nothing ever "pops". */
export function drawLayer(fb: FB, L: Layer, k: Look, tab: Float32Array, t: number): void {
  const a = k.sky.amb, hz = k.sky.hazeCol, hs = 0.6 + 0.4 * k.fog + 0.25 * k.sky.dark, sc = k.snow * 255, ld = k.season.leafDensity * 255, fl = k.season.flowerAmt * 255;
  const n = L.w * L.h, W = L.w;
  const glass: RGB = [40, 52, 82], warm: RGB = [255, 214, 138];
  for (let i = 0; i < n; i++) {
    const c = L.col[i]; if (!c) continue;
    const cl = L.cls[i]; let r: number, g: number, b: number;
    if (cl === 0) { r = c & 255; g = (c >>> 8) & 255; b = (c >>> 16) & 255; } else {
      if (((cl >= 1 && cl <= 4) || cl === CL.ACT) && L.rnd[i] > ld) continue;
      let q = cl; if ((cl === CL.FA || cl === CL.FB) && L.rnd[i] > fl) q = CL.G2;
      r = tab[q * 3]; g = tab[q * 3 + 1]; b = tab[q * 3 + 2];
    }
    const x = i % W, y = (i / W) | 0;
    const thr = L.snow[i];
    if (thr && sc > 1 && sc > Math.max(1, thr + (bayer(x, y) - 0.5) * 30) && cl !== CL.WAT) { const sh = L.rnd[i] < 46; r = sh ? 214 : 248; g = sh ? 224 : 251; b = sh ? 244 : 255; }
    const hy = L.haze[i]; if (hy) { const m = HAZE[hy] * hs; r += (hz[0] - r) * m; g += (hz[1] - g) * m; b += (hz[2] - b) * m; }
    r *= a[0]; g *= a[1]; b *= a[2];
    if (cl === CL.WIN || cl === CL.LAMP) { const lit = cl === CL.WIN ? k.windowLit : k.lampLit; const gl: RGB = [glass[0] * a[0], glass[1] * a[1], glass[2] * a[2]]; r = gl[0] + (warm[0] - gl[0]) * lit; g = gl[1] + (warm[1] - gl[1]) * lit; b = gl[2] + (warm[2] - gl[2]) * lit; }
    if (cl === CL.WAT || cl === CL.WATH) { const sp = Math.sin(x * 0.9 + t * 1.6 + y * 0.6) + Math.sin(x * 0.37 - t * 1.1); if (sp > 1.55) { r += 40; g += 44; b += 46; } }
    fb.u32[i] = pack(r, g, b);
  }
}
