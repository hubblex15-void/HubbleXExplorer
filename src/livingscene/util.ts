export type RGB = [number, number, number];
export const clamp = (v: number, a = 0, b = 1): number => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const smooth = (t: number): number => { t = clamp(t); return t * t * (3 - 2 * t); };
export const sstep = (a: number, b: number, v: number): number => smooth((v - a) / (b - a));
export const hex = (h: string): RGB => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
export const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const scaleRGB = (c: RGB, k: number): RGB => [c[0] * k, c[1] * k, c[2] * k];
export const lum = (c: RGB): number => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const hash2 = (x: number, y: number, s = 0): number => {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const bayer = (x: number, y: number): number => (B4[((y & 3) << 2) | (x & 3)] + 0.5) / 16;
export const choice = <T>(r: () => number, a: T[]): T => a[Math.floor(r() * a.length) % a.length];
export const range = (r: () => number, a: number, b: number): number => a + (b - a) * r();
export const irange = (r: () => number, a: number, b: number): number => Math.floor(a + (b - a + 1) * r());
export const wrap = (v: number, m: number): number => ((v % m) + m) % m;
export const byte = (v: number): number => (v < 0 ? 0 : v > 255 ? 255 : v | 0);
export const pack = (r: number, g: number, b: number): number => (0xff000000 | (byte(b) << 16) | (byte(g) << 8) | byte(r)) >>> 0;
export const packHex = (h: string): number => { const c = hex(h); return pack(c[0], c[1], c[2]); };
