import { RGB, clamp, mix, hash2, bayer } from './util';
import { FB } from './fb';

export const FIRE = { x: 226, y: 139 };
/** pixel campfire: flame height, colour bands, sparks and smoke all scale with `f` (0..1 = the streak / how big a fire tonight). */
export function drawFire(fb: FB, f: number, t: number, wind: number, tint: RGB): void {
  const { x: FX, y: FY } = FIRE, tq = Math.floor(t * 12);
  const T = (c: RGB): RGB => [c[0] * tint[0], c[1] * tint[1], c[2] * tint[2]];
  for (const [dx, sl] of [[-1, 1], [1, -1]]) for (let k = 0; k < 9; k++) { const c = T(k % 2 ? [74, 46, 28] : [96, 60, 36]); fb.set(FX + dx * (7 - k), FY - 1 - Math.floor(k * 0.45 * sl * -1 * -1) * 0 - Math.floor(k / 3), c[0], c[1], c[2]); fb.set(FX + dx * (7 - k), FY - Math.floor(k / 3), c[0] * 0.8, c[1] * 0.8, c[2] * 0.8); }
  const coal = mix([58, 36, 28], [255, 106, 42], clamp(f * 1.5));
  for (let x = -6; x <= 6; x++) if (Math.abs(x) < 6 && hash2(x, tq, 4) < 0.7 + f * 0.25) fb.set(FX + x, FY - 1, coal[0], coal[1], coal[2]);
  if (f > 0.03) {
    const Hf = 4 + f * 19;
    for (let dx = -6; dx <= 6; dx++) {
      const hh = Math.round(Hf * (1 - Math.pow(Math.abs(dx) / 6.6, 1.5)) * (0.7 + 0.3 * hash2(dx, tq, 3)));
      for (let k = 0; k < hh; k++) {
        const ratio = k / Math.max(1, hh); if (ratio > 0.82 && hash2(dx, k + tq * 3, 5) > 0.55) continue;
        const bend = Math.round(ratio * ratio * (wind - 0.1) * 4);
        let c: RGB = Math.abs(dx) <= 1 && ratio < 0.5 ? [255, 246, 176] : ratio < 0.3 ? [255, 212, 90] : ratio < 0.6 ? [255, 165, 58] : ratio < 0.85 ? [238, 106, 44] : [196, 68, 42];
        fb.set(FX + dx + bend, FY - 2 - k, c[0], c[1], c[2]);
      }
    }
    for (let i = 0; i < 9; i++) { // sparks
      const ph = (t * 0.7 + hash2(i, 1, 2)) % 1, y = FY - 6 - ph * (24 + f * 14), x = FX + Math.sin(i * 4.1 + ph * 7) * 4 + wind * ph * 12, a = (1 - ph) * f;
      if (a > 0.12) fb.blend(x, y, 255, i % 2 ? 190 : 120, 60, a * 1.1);
    }
    for (let i = 0; i < 5; i++) { // smoke
      const ph = (t * 0.16 + i / 5) % 1, x = FX + Math.sin(i * 3 + ph * 4) * 3 + ph * (6 + wind * 24), y = FY - 16 - ph * 42, a = (1 - ph) * 0.26 * f;
      for (let j = 0; j < 4; j++) if (bayer(x + (j & 1), y + (j >> 1)) < a * 3) fb.blend(x + (j & 1), y + (j >> 1), 150, 152, 165, 0.55);
    }
  }
}
export interface Light { x: number; y: number; r: number; col: RGB; s: number }
/** stepped, dithered light pools – they read as pixel art, not as a blur */
export function drawLights(fb: FB, ls: Light[]): void {
  for (const L of ls) {
    if (L.s < 0.02) continue;
    for (let y = Math.floor(L.y - L.r); y <= L.y + L.r; y++) for (let x = Math.floor(L.x - L.r); x <= L.x + L.r; x++) {
      const d = Math.hypot(x - L.x, (y - L.y) * 1.25) / L.r; if (d >= 1) continue;
      const q = Math.floor((1 - d) * 4 + bayer(x, y) * 0.999) / 4; if (q > 0) fb.light(x, y, L.col[0], L.col[1], L.col[2], q * L.s * 0.9);
    }
  }
}
