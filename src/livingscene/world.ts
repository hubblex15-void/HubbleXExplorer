import { packHex, mulberry32, hash2, clamp } from './util';

export const W = 320, H = 144;
/** paint classes: colours that change with season / weather / light at render time */
export const CL = { NONE: 0, L1: 1, L2: 2, L3: 3, L4: 4, G1: 5, G2: 6, G3: 7, G4: 8, FA: 9, FB: 10, FC: 11, WIN: 12, LAMP: 13, WAT: 14, WATH: 15, ACT: 16, P1: 17, P2: 18, P3: 19, FRUIT: 20, SNOWROCK: 21 };
/** haze layers: 1 far mountains, 2 hills, 3 distant pines, 4 near ground, 0 none */
export const LAYOUT = {
  door: [127, 122], porchL: [111, 122], porchR: [146, 122], chair: [158, 122],
  bench: [52, 126], chop: [61, 131], block: [70, 130], wood: [73, 127], mail: [23, 132],
  garden: [176, 135], laundry: [203, 129], fireL: [206, 141], fireR: [246, 141], fire: [226, 138], fireCook: [214, 142],
  dock: [268, 131], easel: [136, 135], snow: [104, 137], leaves: [112, 138], herbs: [122, 139],
  rock: [12, 134], bush1: [18, 122], bush2: [176, 121], mush: [24, 128], tree: [33, 126],
} as const;
export type WP = keyof typeof LAYOUT;

export class Layer {
  w: number; h: number; col: Uint32Array; cls: Uint8Array; haze: Uint8Array; snow: Uint8Array; rnd: Uint8Array;
  constructor(w: number, h: number, seed: number) {
    this.w = w; this.h = h; const n = w * h;
    this.col = new Uint32Array(n); this.cls = new Uint8Array(n); this.haze = new Uint8Array(n); this.snow = new Uint8Array(n); this.rnd = new Uint8Array(n);
    for (let i = 0; i < n; i++) this.rnd[i] = (hash2(i % w, (i / w) | 0, seed) * 255) | 0;
  }
  put(x: number, y: number, c: number, cls = 0, haze = 0, snow = 0): void {
    x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = y * this.w + x; this.col[i] = c; this.cls[i] = cls; this.haze[i] = haze; this.snow[i] = snow;
  }
  has(x: number, y: number): boolean { return x >= 0 && y >= 0 && x < this.w && y < this.h && this.col[y * this.w + x] !== 0; }
  getCls(x: number, y: number): number { return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.cls[y * this.w + x]; }
}
const pc = (() => { const m = new Map<string, number>(); return (h: string): number => { let v = m.get(h); if (v === undefined) { v = packHex(h); m.set(h, v); } return v; }; })();

export interface World { back: Layer; trees: Layer; }
export function buildWorld(seed = 7, cabinLevel = 1): World {
  const R = mulberry32(seed);
  const back = new Layer(W, H, seed), trees = new Layer(W, H, seed + 99);
  const rect = (L: Layer, x: number, y: number, w: number, h: number, c: string, cls = 0, haze = 0, snow = 0) => { const p = pc(c); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) L.put(x + i, y + j, p, cls, haze, snow); };
  const px = (L: Layer, x: number, y: number, c: string, cls = 0, haze = 0, snow = 0) => L.put(x, y, pc(c), cls, haze, snow);
  const ell = (cx: number, cy: number, rx: number, ry: number, fn: (x: number, y: number, nx: number, ny: number) => void) => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const nx = (x - cx) / rx, ny = (y - cy) / ry; if (nx * nx + ny * ny <= 1) fn(x, y, nx, ny);
    }
  };
  const line = (L: Layer, x0: number, y0: number, x1: number, y1: number, c: string, cls = 0, snow = 0) => {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
    for (;;) { px(L, x0, y0, c, cls, 0, snow); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  };

  // ---------- far mountains ----------
  const far = (x: number) => 64 - 12 * Math.sin(x * 0.021 + 0.7) - 8 * Math.sin(x * 0.047 + 2.1) - 4 * Math.sin(x * 0.13 + 1);
  for (let x = 0; x < W; x++) {
    const top = Math.round(far(x)), face = far(x - 1) - far(x + 1);
    for (let y = top; y < 96; y++) {
      const d = y - top; let c = face > 0.35 ? '#8f9cc4' : face < -0.35 ? '#6d7aa3' : '#7f8db6';
      if (d > 14 && hash2(x, y, 3) < 0.35) c = '#7583ad';
      if (top < 56 && d < 4 + (face > 0 ? 1 : 0)) c = face > 0.2 ? '#f2f5ff' : '#d3dcf0';
      px(back, x, y, c, 0, 1, 0);
    }
  }
  // ---------- rolling hills + pines ----------
  const top2 = (x: number) => 90 - 5 * Math.sin(x * 0.03 + 0.4) - 3 * Math.sin(x * 0.083 + 1.7);
  for (let x = 0; x < W; x++) for (let y = Math.round(top2(x)); y < 108; y++) {
    const d = y - Math.round(top2(x)); const k = d < 2 ? CL.G3 : d < 9 ? CL.G2 : CL.G1; px(back, x, y, '#5f8f55', k, 2, 0);
  }
  const pine = (L: Layer, cx: number, by: number, hgt: number, haze: number) => {
    for (let r = 0; r < hgt; r++) {
      const hw = Math.round(1 + (r / hgt) * (hgt * 0.32) + (r % 4 === 3 ? 1 : 0)), y = by - hgt + r;
      for (let x = cx - hw; x <= cx + hw; x++) px(L, x, y, x < cx - hw / 3 ? '#3f7a62' : x > cx + hw / 2 ? '#26493c' : '#33634f', 0, haze, r % 4 === 0 ? 70 + ((x * 7) % 40) : 0);
    }
    rect(L, cx, by, 1, 2, '#4a3426', 0, haze);
  };
  for (const [x, hgt] of [[8, 16], [20, 12], [46, 14], [64, 10], [196, 12], [214, 16], [232, 11], [250, 14], [268, 10], [290, 15], [310, 18], [4, 12]] as number[][]) pine(back, x, Math.round(top2(x)) + 5, hgt, 3);

  // ---------- ground ----------
  const g0 = (x: number) => Math.round(100 + 2 * Math.sin(x * 0.05) + Math.sin(x * 0.13));
  for (let x = 0; x < W; x++) for (let y = g0(x); y < H; y++) {
    const n = hash2(x >> 2, y >> 1, 5), row = (y - 100) / 44; let k = CL.G2;
    if (n < 0.16 + row * 0.1) k = CL.G1; else if (n > 0.84 - (1 - row) * 0.1) k = CL.G3;
    px(back, x, y, '#6cae52', k, 4, 40 + Math.floor(hash2(x, y, 9) * 150));
  }
  for (let i = 0; i < 130; i++) { // grass tufts
    const x = Math.floor(R() * W), y = 104 + Math.floor(R() * 38); if (back.getCls(x, y) < CL.G1 || back.getCls(x, y) > CL.G4) continue;
    px(back, x, y, '#a6d878', CL.G4, 4, 60); px(back, x - 1, y - 1, '#a6d878', CL.G3, 4, 60); px(back, x + 1, y - 1, '#a6d878', CL.G3, 4, 60);
  }
  for (let i = 0; i < 70; i++) { // flowers
    const x = 4 + Math.floor(R() * (W - 8)), y = 108 + Math.floor(R() * 34); if (back.getCls(x, y) < CL.G1 || back.getCls(x, y) > CL.G4) continue;
    const a = R() < 0.5; px(back, x, y, '#fff', a ? CL.FA : CL.FB, 4, 0); if (R() < 0.35) px(back, x, y - 1, '#5fa04c', CL.G3, 4, 0);
  }
  // shadow blobs (dither) under big things
  const shadow = (cx: number, cy: number, rx: number, ry: number) => ell(cx, cy, rx, ry, (x, y, nx, ny) => { if ((x + y) % 2 === 0 || nx * nx + ny * ny < 0.45) { const c = back.getCls(x, y); if (c >= CL.G2 && c <= CL.G4) back.cls[y * W + x] = CL.G1; } });
  shadow(35, 127, 26, 4); shadow(130, 125, 46, 3); shadow(300, 112, 14, 3);

  // ---------- dirt path ----------
  const pcy = (x: number) => 133 + 3 * Math.sin(x * 0.028 + 0.5), phw = (x: number) => 4.2 + 1.1 * Math.sin(x * 0.11);
  for (let x = 14; x < 274; x++) {
    const taper = clamp(Math.min(x - 14, 273 - x) / 14), hw = phw(x) * taper;
    for (let y = Math.ceil(pcy(x) - hw); y <= Math.floor(pcy(x) + hw); y++) {
      const n = hash2(x, y, 11); const k = n < 0.2 ? CL.P3 : n > 0.75 ? CL.P2 : CL.P1; px(back, x, y, '#c39a68', k, 4, 200 + Math.floor(n * 50));
    }
  }
  for (let y = 124; y < 132; y++) for (let x = 116; x < 138; x++) px(back, x, y, '#c39a68', hash2(x, y, 4) < 0.25 ? CL.P3 : CL.P1, 4, 210);
  for (let i = 0; i < 26; i++) { const x = 20 + Math.floor(R() * 250), y = Math.round(pcy(x) + (R() - 0.5) * 6); if (back.getCls(x, y) >= CL.P1 && back.getCls(x, y) <= CL.P3) px(back, x, y, '#9a9088', 0, 4, 230); }

  // ---------- cabin ----------
  const cx = 130;
  // chimney (behind roof)
  for (let y = 44; y < 80; y++) for (let x = 152; x < 162; x++) {
    const br = (Math.floor((y - 44) / 3) % 2) * 2, seam = (y - 44) % 3 === 2 || (x + br) % 5 === 0;
    px(back, x, y, seam ? '#6f665f' : x < 155 ? '#a39990' : x > 159 ? '#7c736b' : '#8f857c', 0, 0, 0);
  }
  rect(back, 150, 42, 14, 3, '#5a504a', 0, 0, 30); rect(back, 151, 44, 12, 1, '#463e39');
  // roof
  for (let r = 0; r < 37; r++) {
    const y = 56 + r, hw = Math.round(1.36 * r) + 2, band = Math.floor(r / 3), sh = (band & 1) * 4;
    for (let x = cx - hw; x <= cx + hw; x++) {
      let c = '#b5503f'; const ph = (x + sh) % 8; const ry = r % 3;
      if (x === cx - hw || x === cx + hw) c = '#5e2a26'; else if (ry === 2) c = '#8f3b31'; else if (ph === 0) c = '#9e4335'; else if (ry === 0) c = '#cf6a52';
      if (r >= 35) c = '#5e2a26';
      px(back, x, y, c, 0, 0, r < 30 ? 6 + r : 0);
    }
  }
  for (let x = cx - 3; x <= cx + 3; x++) px(back, x, 56, '#5e2a26'); // ridge cap
  // attic window
  ell(cx, 71, 5, 5, (x, y, nx, ny) => px(back, x, y, nx * nx + ny * ny > 0.55 ? '#5b3a24' : '#ffd98a', nx * nx + ny * ny > 0.55 ? 0 : CL.WIN));
  rect(back, cx, 66, 1, 10, '#5b3a24'); rect(back, cx - 5, 71, 11, 1, '#5b3a24');
  // walls
  for (let c = 0; c < 7; c++) {
    const y0 = 90 + c * 4, ex = (c & 1) ? 0 : 2;
    for (let x = 90 - ex; x < 170 + ex; x++) for (let j = 0; j < 4; j++) {
      const y = y0 + j; let col = '#b87b45';
      if (j === 0) col = '#d19556'; else if (j === 3) col = '#7d4f2c'; else if (hash2(x, y, 21) < 0.05) col = '#9a6438';
      if ((x - 90 + c * 13) % 23 === 0 && j > 0 && j < 3) col = '#946035';
      if (x < 92 - ex + 1 || x > 168 + ex - 1) col = j === 0 || j === 3 ? '#8a5a33' : '#dfae6c';
      px(back, x, y, col);
    }
  }
  // foundation stones
  for (let x = 88; x < 172; x++) for (let y = 118; y < 123; y++) { const n = hash2(Math.floor(x / 5), y, 8); px(back, x, y, (x % 5 === 0 || y === 122) ? '#5f5750' : n < 0.4 ? '#a39990' : '#8c837a'); }
  // porch deck + steps
  for (let y = 119; y < 124; y++) for (let x = 106; x < 168; x++) px(back, x, y, y === 123 ? '#5b3a24' : (y === 121 && x % 9 === 0) ? '#8a5a33' : y % 2 ? '#b98552' : '#a4713f');
  for (let y = 124; y < 126; y++) for (let x = 116; x < 138; x++) px(back, x, y, y === 125 ? '#7d4f2c' : '#c99a62');
  // porch awning + posts
  for (let r = 0; r < 8; r++) for (let x = 114 - r; x <= 141 + r; x++) { const y = 91 + r; px(back, x, y, r === 7 ? '#5e2a26' : (x + r) % 6 === 0 ? '#8f3b31' : r % 3 === 2 ? '#9e4335' : '#c45c47', 0, 0, r < 4 ? 12 + r * 5 : 0); }
  rect(back, 106, 99, 44, 2, '#5b3a24');
  for (const x of [108, 146]) { rect(back, x, 101, 3, 18, '#946035'); rect(back, x, 101, 1, 18, '#b98552'); rect(back, x + 2, 101, 1, 18, '#6b4326'); }
  // door
  rect(back, 120, 100, 16, 19, '#4a2e1c'); rect(back, 121, 101, 14, 18, '#7a4a2a');
  for (let y = 101; y < 119; y++) for (let x = 121; x < 135; x++) { if ((x - 121) % 5 === 4) px(back, x, y, '#5b3a24'); else if (y % 6 === 0) px(back, x, y, '#8c5a35'); }
  rect(back, 125, 104, 6, 5, '#4a2e1c'); rect(back, 126, 105, 4, 3, '#ffd98a', CL.WIN); rect(back, 121, 106, 14, 1, '#3a2418'); rect(back, 121, 113, 14, 1, '#3a2418');
  px(back, 132, 111, '#f2c94c'); px(back, 132, 112, '#c0912f'); rect(back, 122, 122, 10, 1, '#b5503f'); rect(back, 123, 123, 8, 1, '#8f3b31');
  // windows
  const win = (x0: number) => {
    rect(back, x0 - 1, 99, 14, 13, '#4a2e1c'); rect(back, x0, 100, 12, 11, '#946035');
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { rect(back, x0 + 1 + i * 5, 101 + j * 5, 4, 4, '#ffd98a', CL.WIN); px(back, x0 + 1 + i * 5, 101 + j * 5, '#fff3c8', CL.WIN); }
    rect(back, x0 + 5, 100, 1, 11, '#5b3a24'); rect(back, x0, 105, 12, 1, '#5b3a24');
    rect(back, x0 - 4, 99, 3, 13, '#4c8a8a'); rect(back, x0 - 4, 99, 1, 13, '#6bb0aa'); rect(back, x0 + 13, 99, 3, 13, '#4c8a8a'); rect(back, x0 + 15, 99, 1, 13, '#3a6c6c');
    rect(back, x0 - 2, 112, 16, 3, '#6b4326'); rect(back, x0 - 2, 112, 16, 1, '#8a5a33');
    for (let i = 0; i < 8; i++) { px(back, x0 - 1 + i * 2, 111, '#fff', hash2(x0 + i, 1, 2) < 0.5 ? CL.FA : CL.FB); px(back, x0 + i * 2, 110, '#4f9a4b', CL.L2); px(back, x0 + i * 2, 111, '#3f7a3f', CL.L1); }
  };
  win(97); win(148);
  // lantern by door
  rect(back, 141, 102, 1, 3, '#3a2418'); rect(back, 139, 105, 5, 1, '#3a2418'); rect(back, 140, 106, 3, 4, '#ffd98a', CL.LAMP); rect(back, 139, 110, 5, 1, '#3a2418');
  // rocking chair
  for (let y = 105; y < 119; y++) px(back, 152, y, '#6b4326'); rect(back, 153, 105, 1, 13, '#8a5a33');
  for (let i = 0; i < 4; i++) rect(back, 151, 106 + i * 3, 3, 1, '#5b3a24');
  rect(back, 152, 114, 9, 2, '#8a5a33'); rect(back, 153, 113, 8, 1, '#e9b44c'); rect(back, 158, 116, 1, 3, '#5b3a24'); rect(back, 152, 116, 1, 3, '#5b3a24');
  for (let x = 150; x < 163; x++) px(back, x, 119 + (Math.abs(x - 156) > 4 ? -1 : 0), '#4a2e1c');
  // cabin upgrades: flower posts / lamp post / garden lights
  if (cabinLevel >= 2) { rect(back, 172, 106, 1, 16, '#5b3a24'); rect(back, 170, 104, 5, 1, '#3a2418'); rect(back, 171, 100, 3, 4, '#ffd98a', CL.LAMP); rect(back, 170, 99, 5, 1, '#3a2418'); }
  if (cabinLevel >= 3) { rect(back, 82, 108, 1, 14, '#5b3a24'); rect(back, 80, 106, 5, 1, '#3a2418'); rect(back, 81, 102, 3, 4, '#ffd98a', CL.LAMP); rect(back, 80, 101, 5, 1, '#3a2418'); }

  // ---------- props on ground ----------
  // woodpile
  for (let r = 0; r < 4; r++) for (let i = 0; i < 6 - (r === 3 ? 2 : 0); i++) { const x = 66 + i * 3 + (r === 3 ? 3 : 0), y = 114 + r * 3 + 3; ell(x + 1, y, 1.6, 1.6, (xx, yy, nx, ny) => px(back, xx, yy, nx * nx + ny * ny < 0.25 ? '#e0b070' : '#9a6438')); }
  rect(back, 65, 112, 1, 12, '#5b3a24'); rect(back, 84, 112, 1, 12, '#5b3a24');
  // chop block
  ell(70, 130, 5, 2.6, (x, y, nx, ny) => px(back, x, y, ny > 0.3 ? '#7d4f2c' : ny < -0.4 ? '#e0b070' : '#c48a55')); rect(back, 65, 130, 11, 3, '#8a5a33'); rect(back, 65, 130, 11, 1, '#6b4326');
  // bench
  rect(back, 42, 114, 18, 3, '#946035'); rect(back, 42, 114, 18, 1, '#b98552'); rect(back, 42, 119, 18, 2, '#b98552'); rect(back, 42, 121, 18, 1, '#6b4326');
  for (const x of [43, 57]) rect(back, x, 121, 2, 6, '#6b4326'); rect(back, 43, 114, 1, 6, '#6b4326'); rect(back, 58, 114, 1, 6, '#6b4326');
  // mailbox
  rect(back, 29, 121, 2, 8, '#6b4326'); rect(back, 25, 116, 10, 5, '#5b7fa8'); rect(back, 25, 116, 10, 1, '#86a7cc'); rect(back, 25, 120, 10, 1, '#3f5f86'); rect(back, 34, 112, 1, 5, '#b5503f'); rect(back, 34, 112, 3, 2, '#e2674f');
  // garden bed + fence
  for (let y = 129; y < 137; y++) for (let x = 178; x < 200; x++) px(back, x, y, hash2(x, y, 3) < 0.25 ? '#5b3a24' : '#7a4f2e', 0, 0, 160);
  for (let x = 176; x < 202; x += 5) { rect(back, x, 124, 2, 14, '#b98552'); rect(back, x, 124, 2, 1, '#e0b070'); } rect(back, 176, 128, 26, 1, '#946035'); rect(back, 176, 133, 26, 1, '#946035');
  // laundry poles
  rect(back, 199, 100, 2, 27, '#6b4326'); rect(back, 199, 100, 1, 27, '#946035'); rect(back, 174, 103, 1, 16, '#6b4326');
  // fire pit: stones + charred ground + tripod
  ell(226, 140, 12, 3.6, (x, y, nx, ny) => px(back, x, y, nx * nx + ny * ny > 0.7 ? '#8c837a' : '#3a2f2a'));
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, x = Math.round(226 + Math.cos(a) * 12), y = Math.round(140 + Math.sin(a) * 3.8); rect(back, x - 1, y - 1, 3, 2, i % 2 ? '#a39990' : '#7c736b'); px(back, x - 1, y - 1, '#c2b8ae'); }
  line(back, 216, 141, 226, 119, '#6b4326'); line(back, 217, 141, 227, 119, '#946035'); line(back, 238, 141, 227, 119, '#6b4326'); line(back, 237, 141, 226, 119, '#946035');
  rect(back, 225, 117, 4, 3, '#3a2418');
  // seating logs
  const log = (x0: number, y: number, len: number) => { rect(back, x0, y - 5, len, 6, '#946035'); rect(back, x0, y - 5, len, 1, '#c48a55'); rect(back, x0, y, len, 1, '#5b3a24'); ell(x0 + len - 1, y - 2, 2, 3, (x, yy, nx, ny) => px(back, x, yy, nx * nx + ny * ny < 0.3 ? '#e0b070' : '#c48a55')); };
  log(197, 142, 15); log(240, 142, 15);
  // rocks (mining)
  for (const [x, y, r] of [[10, 134, 5], [17, 137, 3], [5, 138, 3]] as number[][]) ell(x, y, r, r * 0.7, (xx, yy, nx, ny) => px(back, xx, yy, ny < -0.2 && nx < 0.2 ? '#bfb6ad' : ny > 0.4 ? '#6f665f' : '#9a9088', 0, 0, ny < -0.3 ? 40 : 0));
  // ---------- pond + dock ----------
  ell(290, 133, 29, 7.2, (x, y, nx, ny) => { const edge = nx * nx + ny * ny; if (edge > 0.82) px(back, x, y, hash2(x, y, 2) < 0.5 ? '#a39990' : '#7c736b'); else px(back, x, y, '#6aa6d8', CL.WAT, 0, 0); });
  for (let i = 0; i < 5; i++) { const lx = 272 + i * 10 + (i % 2) * 3, ly = 131 + (i % 3) * 3; ell(lx, ly, 3, 1.4, (x, y) => px(back, x, y, '#4f9a4b', CL.L2)); px(back, lx + 1, ly - 1, '#f4a3c0', CL.FA); }
  for (let x = 254; x < 275; x++) for (let y = 129; y < 134; y++) px(back, x, y, y === 133 ? '#5b3a24' : (x % 4 === 0 ? '#7d4f2c' : y % 2 ? '#b98552' : '#a4713f'));
  for (const x of [255, 263, 272]) rect(back, x, 134, 2, 5, '#5b3a24');
  for (const [x, y] of [[262, 127], [303, 128], [313, 132], [268, 138], [306, 139]] as number[][]) for (let k = 0; k < 3; k++) { rect(back, x + k, y - 7 + k, 1, 8 - k, '#4f8a3f'); if (k === 1) rect(back, x + k - 0, y - 9, 2, 3, '#7a4f2e'); }

  // ---------- TREES layer ----------
  const bump = (L: Layer, cxx: number, cyy: number, rx: number, ry: number, base: number) => ell(cxx, cyy, rx, ry, (x, y, nx, ny) => {
    let l = -(nx * 0.55 + ny * 0.85) + (hash2(x, y, base) - 0.5) * 0.38 + (hash2(x >> 1, y >> 1, base + 3) - 0.5) * 0.25;
    const k = l > 0.62 ? CL.L4 : l > 0.2 ? CL.L3 : l > -0.28 ? CL.L2 : CL.L1;
    px(L, x, y, '#6fb35a', hash2(x, y, 77) < 0.045 ? CL.ACT : k, 0, 0);
  });
  const bigTree = (cxx: number, baseY: number, trunkH: number, R0: number, sd: number) => {
    const T = trees, B = back, tw = 3;
    for (let y = baseY - trunkH; y <= baseY; y++) {
      const flare = y > baseY - 5 ? Math.floor((y - (baseY - 5)) / 2) : 0;
      for (let x = cxx - tw - flare; x <= cxx + tw + flare - 1; x++) {
        const rel = (x - (cxx - tw - flare)) / (2 * (tw + flare)); let c = rel < 0.28 ? '#a8794a' : rel > 0.72 ? '#5f3d22' : '#80562f';
        if (hash2(x, y, sd) < 0.09) c = '#5f3d22'; if (x === cxx - tw - flare || x === cxx + tw + flare - 1) c = '#3f2818'; px(B, x, y, c, 0, 0, y < baseY - trunkH + 2 ? 80 : 0);
      }
    }
    const cy = baseY - trunkH - R0 * 0.55;
    for (const [dx, dy, ar, br] of [[0, 0, 1, 0.85], [-0.62, 0.28, 0.62, 0.52], [0.62, 0.28, 0.62, 0.52], [-0.3, -0.52, 0.55, 0.45], [0.36, -0.46, 0.5, 0.42]]) bump(T, Math.round(cxx + dx * R0), Math.round(cy + dy * R0), Math.max(3, Math.round(ar * R0)), Math.max(3, Math.round(br * R0)), sd);
    // shaded underside rim
    for (let y = 0; y < H - 1; y++) for (let x = cxx - R0 - 4; x < cxx + R0 + 4; x++) { const c = T.getCls(x, y); if (c >= 1 && c <= 4 && !T.has(x, y + 1)) T.cls[y * W + x] = CL.L1; }
    // branches (bare-tree skeleton)
    line(B, cxx, baseY - trunkH + 2, cxx - R0 * 0.5, cy + R0 * 0.1, '#5f3d22', 0, 90); line(B, cxx, baseY - trunkH + 2, cxx + R0 * 0.55, cy + 2, '#5f3d22', 0, 90); line(B, cxx, baseY - trunkH, cxx + 1, cy - R0 * 0.55, '#5f3d22', 0, 90);
    line(B, cxx - R0 * 0.5, cy + R0 * 0.1, cxx - R0 * 0.75, cy - R0 * 0.3, '#5f3d22', 0, 90); line(B, cxx + R0 * 0.55, cy + 2, cxx + R0 * 0.8, cy - R0 * 0.35, '#5f3d22', 0, 90);
    // snow on canopy tops
    for (let y = 1; y < H; y++) for (let x = cxx - R0 - 4; x < cxx + R0 + 4; x++) if (T.has(x, y) && !T.has(x, y - 1) && T.cls[y * W + x] >= 1 && T.cls[y * W + x] <= 4) T.snow[y * W + x] = 100 + ((x * 13) % 60);
  };
  bigTree(33, 126, 46, 24, 4);
  bigTree(300, 112, 22, 13, 8);
  bigTree(214, 104, 12, 8, 12);
  // bushes with fruit
  const bush = (bx: number, by: number, rr: number, sd: number) => {
    for (const [dx, dy, ar] of [[-0.5, 0.1, 0.7], [0.5, 0.1, 0.7], [0, -0.3, 0.8]]) bump(trees, Math.round(bx + dx * rr), Math.round(by + dy * rr), Math.round(ar * rr), Math.round(ar * rr * 0.75), sd);
    for (let i = 0; i < 6; i++) { const x = bx + Math.round((hash2(i, sd, 1) - 0.5) * rr * 1.6), y = by + Math.round((hash2(i, sd, 2) - 0.5) * rr * 0.7); if (trees.has(x, y)) px(trees, x, y, '#e2513f', CL.FRUIT); }
    for (let y = 1; y < H; y++) for (let x = bx - rr - 2; x < bx + rr + 2; x++) if (trees.has(x, y) && !trees.has(x, y - 1)) trees.snow[y * W + x] = 90;
  };
  bush(16, 124, 8, 31); bush(178, 124, 7, 33); bush(38, 128, 6, 35);
  // mushrooms
  for (const [x, y] of [[24, 129], [27, 130], [21, 131]]) { rect(trees, x, y, 1, 2, '#f6ead2'); rect(trees, x - 1, y - 2, 3, 2, '#c4503e'); px(trees, x, y - 2, '#fff', 0); }
  return { back, trees };
}
