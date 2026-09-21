import { FB } from './fb';
import { W, H, World } from './world';
import { computeSky, drawSky, Sky } from './sky';
import { seasonState } from './season';
import { classTable, drawLayer, Look } from './compose';
import { WX, drawClouds, drawPrecip, drawFog, drawLightning } from './weather';
import { drawFire, drawLights, Light, FIRE } from './fire';
import { sstep, clamp, mix, RGB } from './util';

export interface RenderOpts { ms: number; lat: number; lon: number; wx: WX; season?: 'auto' | 'spring' | 'summer' | 'autumn' | 'winter'; fire: number; extraLights?: Light[]; windowDim?: number; mid?: (fb: FB, sky: Sky, tintAt: (x: number, y: number) => RGB) => void; hiMid?: (hi: FB, sky: Sky, tintAt: (x: number, y: number) => RGB, fog: [number, number, number, number]) => void; }
let lastTint: (x: number, y: number) => RGB = () => [1, 1, 1];
export function renderScene(fb: FB, world: World, o: RenderOpts): Sky {
  const t = o.ms / 1000, w = o.wx, sky = computeSky(o.ms, o.lat, o.lon, w), ss = seasonState(o.ms, o.lat, o.lon, o.season ?? 'auto');
  const look: Look = { sky, season: ss.params, snow: w.snowCover, wet: w.wet, fog: w.fog, windowLit: clamp(sky.dark * 1.15 + w.cloud * 0.15 + w.rain * 0.2) * (1 - (o.windowDim || 0)), lampLit: clamp(sky.dark * 1.3 + w.rain * 0.2) };
  drawSky(fb, sky, t); drawClouds(fb, sky, w);
  const tab = classTable(look); drawLayer(fb, world.back, look, tab, t); drawLayer(fb, world.trees, look, tab, t);
  drawFire(fb, o.fire, t, w.wind, sky.amb);
  const flick = 0.85 + 0.15 * Math.sin(t * 9) * Math.sin(t * 5.3), dk = 0.15 + 0.85 * sky.dark;
  const ls: Light[] = [
    { x: FIRE.x, y: FIRE.y - 5, r: 46, col: [255, 150, 70], s: o.fire * 0.8 * flick * (0.3 + 0.7 * sky.dark) },
    { x: 103, y: 105, r: 20, col: [255, 200, 120], s: look.windowLit * 0.4 * dk }, { x: 154, y: 105, r: 20, col: [255, 200, 120], s: look.windowLit * 0.4 * dk },
    { x: 141, y: 108, r: 18, col: [255, 205, 130], s: look.lampLit * 0.5 * dk }, { x: 127, y: 72, r: 12, col: [255, 200, 120], s: look.windowLit * 0.25 * dk },
    { x: 127, y: 124, r: 16, col: [255, 200, 120], s: look.windowLit * 0.22 * dk },
  ];
  if (o.extraLights) ls.push(...o.extraLights);
  drawLights(fb, ls);
  const tintAt = (x: number, y: number): RGB => { const kf = clamp(1 - Math.hypot(x - FIRE.x, (y - 6 - (FIRE.y - 4)) * 1.2) / 52) * o.fire * (0.35 + 0.65 * sky.dark), kw = clamp(1 - Math.hypot(x - 127, y - 112) / 34) * look.windowLit * dk * 0.6; const a = sky.amb; const f = (c: RGB, k: number, w: RGB): RGB => [c[0] + (w[0] - c[0]) * k, c[1] + (w[1] - c[1]) * k, c[2] + (w[2] - c[2]) * k]; return f(f(a, kw, [1, 0.9, 0.72]), kf * 0.9, [1.08, 0.84, 0.62]); };
  if (o.mid) o.mid(fb, sky, tintAt);
  lastTint = tintAt;
  drawPrecip(fb, w, t); drawFog(fb, sky, w, t); drawLightning(fb, w);
  return sky;
}

/** EPX / Scale2x: doubles resolution while keeping hard pixel edges. */
export function scale2x(src: FB, dst: FB): void {
  const w = src.w, h = src.h, S = src.u32, D = dst.u32, dw = dst.w;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const P = S[y * w + x], A = y > 0 ? S[(y - 1) * w + x] : P, B = x < w - 1 ? S[y * w + x + 1] : P, C = x > 0 ? S[y * w + x - 1] : P, Dd = y < h - 1 ? S[(y + 1) * w + x] : P;
    let e1 = P, e2 = P, e3 = P, e4 = P;
    if (C === A && C !== Dd && A !== B) e1 = A; if (A === B && A !== C && B !== Dd) e2 = B; if (Dd === C && Dd !== B && C !== A) e3 = C; if (B === Dd && B !== A && Dd !== C) e4 = Dd;
    const o = y * 2 * dw + x * 2; D[o] = e1; D[o + 1] = e2; D[o + dw] = e3; D[o + dw + 1] = e4;
  }
}
/** full-quality frame: world & weather at 320x144, upscaled 2x, then actors (character, props, effects) drawn at native 640x288 detail. */
export function renderHi(hi: FB, lo: FB, world: World, o: RenderOpts): Sky {
  const sky = renderScene(lo, world, o); scale2x(lo, hi);
  const w = o.wx, fc = mix(mix(sky.h, [236, 238, 242], 0.55), [30, 36, 62], sky.dark * 0.8);
  if (o.hiMid) o.hiMid(hi, sky, lastTint, [fc[0], fc[1], fc[2], clamp(w.fog * 0.55)]);
  return sky;
}
