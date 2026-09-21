import { FB } from './fb';
import { RGB, hex, clamp, hash2, mix } from './util';
import { Runtime } from './runtime';
import type { SeasonName } from './types';

export interface Lantern { x: number; y: number; ph: number; c: RGB; sp: number }
export interface ObjIn { t: number; amb: RGB; dark: number; wind: number; R: Runtime; snowCover: number; season: SeasonName; doorOpen: number; occupied: boolean; sleeping: boolean; streak: number; lanterns: Lantern[]; cooking: boolean; fruit: RGB; flowerA: RGB; lights: boolean }
const H = hex;
/** things the traveller changes in the world — easel, laundry, snowman, pumpkin, string lights, crops, pot, open door, lantern release */
export function drawObjects(fb: FB, o: ObjIn): void {
  const a = o.amb, t = o.t;
  const P = (x: number, y: number, c: RGB, emit = false) => fb.set(Math.round(x), Math.round(y), emit ? c[0] : c[0] * a[0], emit ? c[1] : c[1] * a[1], emit ? c[2] : c[2] * a[2]);
  const R = (x: number, y: number, w: number, h: number, c: RGB, emit = false) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P(x + i, y + j, c, emit); };
  const disc = (cx: number, cy: number, r: number, c: RGB, hi: RGB, lo: RGB) => { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const d2 = x * x + y * y; if (d2 <= r * r + r * 0.4) P(cx + x, cy + y, d2 >= r * r - r * 0.3 ? [150, 168, 204] : x + y < -r * 0.6 ? hi : x + y > r * 0.7 ? lo : c); } };
  // ---- crops in the garden (grow with the streak) ----
  const stage = Math.min(3, Math.floor(o.streak / 4));
  if (o.season !== 'winter' || o.snowCover < 0.3) for (let i = 0; i < 3; i++) {
    const x = 183 + i * 8, y = 133, s = Math.max(0, stage - (i === 2 ? 1 : 0));
    if (s >= 1) { P(x, y - 1, H('#5fa04c')); P(x + 1, y - 1, H('#7cc45c')); }
    if (s >= 2) { R(x - 1, y - 3, 4, 2, H('#4f9a4b')); P(x, y - 4, H('#7cc45c')); P(x + 2, y - 4, H('#7cc45c')); }
    if (s >= 3) { const f = o.season === 'spring' ? o.flowerA : o.fruit; P(x, y - 3, f); P(x + 2, y - 2, f); P(x + 1, y - 5, f); }
  }
  // ---- campfire pot + chain ----
  for (let y = 121; y < 127; y++) P(226, y, H('#3a2f2a'));
  R(222, 127, 9, 1, H('#77716f')); R(222, 128, 9, 4, H('#3f3b40')); R(223, 132, 7, 1, H('#2f2b30')); R(222, 128, 1, 4, H('#5a555b'));
  if (o.cooking) { R(223, 128, 7, 1, H('#b0652f')); if (Math.floor(t * 4) % 2) P(225 + (Math.floor(t * 3) % 4), 128, H('#ffd08a')); }
  // ---- laundry line ----
  if (o.R.laundry) {
    for (let x = 175; x < 199; x++) P(x, Math.round(104 - ((x - 174) * 3) / 25), H('#d8ccb0'));
    [[180, '#f2ead6'], [187, '#5b7fa8'], [193, '#d2604a']].forEach(([x, c], i) => { const sw = Math.sin(t * 2.2 + i * 1.7) * (0.4 + o.wind * 2.4); for (let j = 0; j < 6; j++) { const off = Math.round(sw * (j / 5)); R((x as number) + off, 104 - Math.round(((x as number) - 174) * 3 / 25) + j + 1, 4, 1, H(c as string)); } });
  }
  // ---- easel with a little painting ----
  if (o.R.easel) {
    for (const [x0, x1] of [[141, 145], [151, 147], [146, 146]]) for (let k = 0; k <= 12; k++) P(x0 + ((x1 - x0) * k) / 12, 134 - k, H('#8a5a34'));
    R(140, 118, 12, 10, H('#efe6d0')); R(141, 119, 10, 4, H('#8fc0e8')); R(141, 123, 10, 4, H('#78b45c')); R(142, 122, 3, 2, H('#c4503e')); P(148, 120, H('#ffd25a')); R(146, 124, 3, 1, H('#5b7fa8'));
  }
  // ---- snowman ----
  if (o.R.snowman > 0 && o.snowCover > 0.12) {
    const s = o.R.snowman, W1: RGB = [246, 250, 255], W2: RGB = [255, 255, 255], W3: RGB = [200, 212, 232];
    const X = 114; disc(X, 135, 4, W1, W2, W3); if (s >= 2) disc(X, 130, 3, W1, W2, W3);
    if (s >= 3) { disc(X, 126, 2, W1, W2, W3); P(X - 1, 125, H('#2b2b2b')); P(X + 1, 125, H('#2b2b2b')); P(X, 126, H('#f08a3c')); P(X + 1, 126, H('#f08a3c')); R(X - 2, 122, 5, 1, H('#3a2f2a')); R(X - 1, 120, 3, 2, H('#3a2f2a')); R(X - 2, 128, 5, 1, H('#c4503e')); }
  }
  // ---- leaf pile ----
  if (o.R.leafPile > 0 && o.season === 'autumn') { const s = o.R.leafPile; for (let y = -3; y <= 0; y++) for (let x = -3 - s * 2; x <= 3 + s * 2; x++) { if (x * x / ((3 + s * 2) ** 2) + (y * y) / 10 > 1) continue; const h = hash2(x + 112, y + 138, 4); P(124 + x, 138 + y, h < 0.3 ? H('#c73c2c') : h < 0.65 ? H('#e8772e') : H('#f2b04a')); } }
  // ---- pumpkin on the porch (carved face glows at night) ----
  if (o.R.pumpkin) { R(137, 118, 7, 5, H('#e8772e')); R(138, 117, 5, 1, H('#e8772e')); R(137, 118, 1, 5, H('#b9582f')); R(143, 118, 1, 5, H('#b9582f')); P(140, 116, H('#5fa04c')); const g = o.dark > 0.3; P(138, 119, g ? H('#fff2a6') : H('#7a3a1a'), g); P(142, 119, g ? H('#fff2a6') : H('#7a3a1a'), g); R(139, 121, 3, 1, g ? H('#ffd25a') : H('#7a3a1a'), g); }
  // ---- string lights along the eaves ----
  if (o.lights) {
    const cs = [H('#ff7a6a'), H('#ffe07a'), H('#7ae0a0'), H('#86aaff')];
    for (let x = 83; x <= 177; x += 5) { const y = 94 + Math.round(2 * Math.sin(((x - 83) / 94) * Math.PI * 2 * 2)), c = cs[Math.floor(x / 5) % 4], on = 0.55 + 0.45 * Math.sin(t * 2 + x); const k = 0.35 + 0.65 * o.dark * on; P(x, y, mix(mix(c, [40, 30, 30], 0.6), c, k), k > 0.6); }
  }
  // ---- open door + silhouette ----
  if (o.doorOpen > 0.04) {
    const d = clamp(o.doorOpen), lit = 0.25 + 0.6 * o.dark;
    for (let y = 102; y < 119; y++) for (let x = 122; x < 134; x++) { const c = mix([44, 28, 22], [255, 178, 96], lit * (0.25 + 0.75 * (y - 102) / 16)); P(x, y, c, o.dark > 0.4); }
    const w = Math.round(12 * (1 - d)); for (let y = 102; y < 119; y++) for (let x = 122; x < 122 + w; x++) P(x, y, (x - 122) % 5 === 4 ? H('#5b3a24') : H('#7a4a2a'));
  }
  if (o.occupied && !o.sleeping) { const x = 151 + (Math.floor(t / 7) % 2) * 2; R(x, 105, 2, 4, [34, 22, 18], false); P(x, 104, [34, 22, 18]); }
  // ---- release lanterns (level-up) ----
  for (const l of o.lanterns) { const x = l.x + Math.sin(t * 0.9 + l.ph) * 3, y = l.y; R(x - 2, y - 3, 5, 5, mix(l.c, [255, 240, 200], 0.15), true); R(x - 1, y + 2, 3, 1, [120, 60, 30], true); P(x, y - 1, [255, 246, 200], true); }
}
