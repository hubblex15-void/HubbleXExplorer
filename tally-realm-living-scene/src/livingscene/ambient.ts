import { FB } from './fb';
import { RGB, hex, clamp, hash2, mix } from './util';
import type { SeasonName } from './types';
export interface AmbIn { t: number; dark: number; cloud: number; rain: number; snow: number; wind: number; sw: Record<SeasonName, number>; amb: RGB; accent: RGB; leaf: RGB; petal: RGB; shootAt: number; phaseDay: boolean }
/** everything here is a pure function of time — nothing to store, nothing can drift or leak */
export function drawAmbient(fb: FB, o: AmbIn): void {
  const t = o.t, a = o.amb, dry = clamp(1 - o.rain * 3 - o.snow);
  const P = (x: number, y: number, c: RGB, emit = false) => fb.set(Math.round(x), Math.round(y), emit ? c[0] : c[0] * a[0], emit ? c[1] : c[1] * a[1], emit ? c[2] : c[2] * a[2]);
  // birds: a small flock crosses the sky in fair weather
  const per = 95, cyc = Math.floor(t / per), u = (t % per) / per;
  if (o.phaseDay && dry > 0.5 && o.cloud < 0.9 && u < 0.28) { const dir = cyc % 2 ? -1 : 1, x0 = dir > 0 ? -16 : 336, y0 = 16 + hash2(cyc, 1, 3) * 34; for (let i = 0; i < 4; i++) { const x = x0 + dir * (u / 0.28) * 370 - dir * i * 7, y = y0 + Math.sin(t * 0.9 + i) * 2 + i * 2, f = Math.floor(t * 5 + i) % 2; P(x, y, [50, 58, 80]); P(x - 1, y - (f ? 1 : 0), [50, 58, 80]); P(x + 1, y - (f ? 1 : 0), [50, 58, 80]); P(x - 2, y + (f ? 0 : 1), [50, 58, 80]); P(x + 2, y + (f ? 0 : 1), [50, 58, 80]); } }
  // butterflies (spring / summer)
  const bf = (o.sw.spring + o.sw.summer * 0.8) * (o.phaseDay ? 1 : 0) * dry;
  if (bf > 0.3) for (let i = 0; i < 4; i++) { const x = 60 + i * 60 + Math.sin(t * 0.5 + i * 2) * 28 + Math.sin(t * 1.3 + i) * 8, y = 122 + Math.sin(t * 0.7 + i * 3) * 9 + Math.sin(t * 2.1 + i) * 2, f = Math.floor(t * 8 + i) % 2, c = [hex('#ffd25a'), hex('#f4f0e6'), hex('#8fb8f0'), hex('#f4a3c0')][i]; P(x, y, [60, 40, 40]); P(x - 1, y - f, c); P(x + 1, y - f, c); P(x - 1, y + 1 - f, mix(c, [0, 0, 0], 0.2)); P(x + 1, y + 1 - f, mix(c, [0, 0, 0], 0.2)); }
  // fireflies at dusk (warm seasons)
  const ff = (o.sw.spring + o.sw.summer + o.sw.autumn * 0.4) * clamp((o.dark - 0.3) * 2) * dry;
  if (ff > 0.25) for (let i = 0; i < 18; i++) { const x = hash2(i, 1, 9) * 320 + Math.sin(t * 0.3 + i) * 10, y = 106 + hash2(i, 2, 9) * 34 + Math.cos(t * 0.4 + i * 3) * 5, on = Math.sin(t * 1.6 + i * 5.3); if (on > 0.15) { P(x, y, [225, 255, 150], true); fb.light(Math.round(x) + 1, Math.round(y), 200, 255, 120, 0.25 * on); fb.light(Math.round(x) - 1, Math.round(y), 200, 255, 120, 0.25 * on); fb.light(Math.round(x), Math.round(y) + 1, 200, 255, 120, 0.2 * on); } }
  // bats at dusk
  const bt = clamp(1 - Math.abs(o.dark - 0.5) * 3) * dry * (o.sw.summer + o.sw.autumn * 0.6 + o.sw.spring * 0.4);
  if (bt > 0.3) for (let i = 0; i < 3; i++) { const x = wrapX(t * 22 * (1 + i * 0.2) + i * 110), y = 34 + Math.sin(t * 1.7 + i * 2) * 14 + i * 8, f = Math.floor(t * 9 + i) % 2; P(x, y, [30, 30, 44]); P(x - 1, y - f, [30, 30, 44]); P(x + 1, y - f, [30, 30, 44]); P(x - 2, y + 1 - f, [30, 30, 44]); P(x + 2, y + 1 - f, [30, 30, 44]); }
  // falling leaves (autumn) & petals (spring)
  const lf = o.sw.autumn, pt = o.sw.spring;
  for (let i = 0; i < 30; i++) {
    const w = i < 15 ? lf : pt; if (w * 30 < i % 15 * 2 + 1) continue;
    const src = i % 2 ? 300 : 33, sp = 7 + hash2(i, 1, 4) * 6, y = 42 + ((t * sp + hash2(i, 2, 4) * 90) % 90), x = src + (hash2(i, 3, 4) - 0.5) * 44 + Math.sin(t * (0.8 + hash2(i, 5, 4)) + i) * 4 + o.wind * (y - 42) * 0.7;
    const c = i < 15 ? (hash2(i, 6, 4) < 0.5 ? o.accent : o.leaf) : o.petal; P(x, y, c); if (i < 15) P(x + 1, y, mix(c, [0, 0, 0], 0.2));
  }
  // shooting stars (night, clear) — also triggered as a reward
  const sc = 43, su = (t % sc) / sc, cyc2 = Math.floor(t / sc), auto = o.dark > 0.75 && o.cloud < 0.6 && su < 0.05, forced = o.shootAt > 0 && t - o.shootAt < 1.2;
  if (auto || forced) { const k = forced ? (t - o.shootAt) / 1.2 : su / 0.05, sx = forced ? 240 : 30 + hash2(cyc2, 1, 7) * 200, sy = forced ? 8 : 6 + hash2(cyc2, 2, 7) * 26; for (let j = 0; j < 9; j++) { const f = Math.max(0, k * 70 - j * 1.5); P(sx + f, sy + f * 0.5, mix([255, 255, 255], [120, 150, 255], j / 9), true); } }
}
const wrapX = (x: number) => (((x % 380) + 380) % 380) - 30;
