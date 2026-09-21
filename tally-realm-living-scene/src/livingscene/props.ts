import { RGB, hex } from './util';
type V2 = [number, number];
export interface Canvas { set(x: number, y: number, c: RGB | number): void; rect(x: number, y: number, w: number, h: number, c: RGB | number): void; line(x0: number, y0: number, x1: number, y1: number, c: RGB | number, thick?: number): void; }
export type PropFn = (b: Canvas, x: number, y: number, a: number, v: number, t: number, far: { x: number; y: number }) => void;
const H = (s: string) => hex(s);
const WOOD = H('#8a5a34'), WOODL = H('#b57a48'), STEEL = H('#b6c0cc'), STEELD = H('#7a8794'), CREAM = H('#f6ead2'), PAPER = H('#e8d9b8'), STRAW = H('#d8b45a'), REDC = H('#c4503e'), BLUEC = H('#5b7fa8'), GREENC = H('#5fa04c'), GOLD = H('#e9b44c'), CLAY = H('#a4713f');
const dir = (a: number): V2 => [Math.cos((a * Math.PI) / 180), -Math.sin((a * Math.PI) / 180)];
function shaft(b: Canvas, x: number, y: number, a: number, back: number, len: number, c: RGB = WOOD): V2 { const d = dir(a); b.line(x - d[0] * back, y - d[1] * back, x + d[0] * len, y + d[1] * len, c); return [x + d[0] * len, y + d[1] * len]; }
function block(b: Canvas, tx: number, ty: number, a: number, along: number, across: number, c: RGB, c2: RGB = c): void { const d = dir(a), n: V2 = [-d[1], d[0]]; for (let i = -Math.floor(across / 2); i <= Math.floor(across / 2); i++) for (let j = 0; j < along; j++) b.set(tx + n[0] * i - d[0] * j, ty + n[1] * i - d[1] * j, j === 0 ? c2 : c); }
export const PROPS: Record<string, PropFn> = {
  axe: (b, x, y, a) => { const t = shaft(b, x, y, a, 2, 6); block(b, t[0], t[1], a, 2, 3, STEELD, STEEL); },
  pick: (b, x, y, a) => { const t = shaft(b, x, y, a, 2, 6); block(b, t[0], t[1], a + 90, 1, 5, STEEL); block(b, t[0], t[1], a, 2, 1, STEELD); },
  shovel: (b, x, y, a) => { const t = shaft(b, x, y, a, 2, 7); block(b, t[0], t[1], a, 3, 3, STEEL, STEELD); },
  rake: (b, x, y, a) => { const t = shaft(b, x, y, a, 2, 8); block(b, t[0], t[1], a + 90, 1, 5, WOOD); block(b, t[0] + dir(a)[0], t[1] + dir(a)[1], a + 90, 1, 5, STEELD); },
  hammer: (b, x, y, a) => { const t = shaft(b, x, y, a, 1, 4); block(b, t[0], t[1], a, 2, 3, STEELD, STEEL); },
  broom: (b, x, y, a) => { const t = shaft(b, x, y, a, 2, 8); block(b, t[0], t[1], a, 4, 3, STRAW, GOLD); },
  can: (b, x, y, a, v) => { b.rect(x, y - 1, 5, 4, BLUEC); b.rect(x, y - 1, 5, 1, H('#86a7cc')); b.set(x + 5, y - 2 + Math.round(v), STEEL); b.set(x + 6, y - 3 + Math.round(v * 2), STEEL); b.set(x - 1, y - 2, STEELD); },
  book: (b, x, y, a, v, t, f) => { b.rect(x, y - 1, 5, 4, H('#9a4a3a')); b.rect(x + 1, y - 1, 3, 3, CREAM); b.set(x + 2, y - 1, H('#c9b28a')); },
  journal: (b, x, y) => { b.rect(x, y - 1, 5, 4, H('#6b4f8a')); b.rect(x + 1, y, 3, 2, CREAM); },
  map: (b, x, y) => { b.rect(x, y - 3, 6, 5, PAPER); b.line(x + 1, y - 2, x + 4, y, REDC); b.set(x + 4, y - 3, GREENC); b.set(x + 1, y, H('#8a5a34')); },
  mug: (b, x, y) => { b.rect(x, y - 2, 3, 3, CREAM); b.set(x + 3, y - 1, CREAM); b.set(x + 1, y - 2, H('#7a4a2a')); },
  glass: (b, x, y) => { b.rect(x, y - 3, 3, 4, H('#cfe8f0')); b.rect(x, y - 2, 3, 2, H('#f2d05a')); },
  bowl: (b, x, y) => { b.rect(x, y - 1, 5, 2, CLAY); b.rect(x + 1, y + 1, 3, 1, CLAY); b.rect(x + 1, y - 2, 3, 1, H('#c9834a')); },
  ladle: (b, x, y, a) => { const t = shaft(b, x, y, a, 2, 6); block(b, t[0], t[1], a, 2, 3, STEELD, STEEL); },
  kettle: (b, x, y) => { b.rect(x, y - 3, 5, 4, STEELD); b.rect(x, y - 3, 5, 1, STEEL); b.set(x + 5, y - 2, STEELD); b.set(x + 6, y - 3, STEELD); b.line(x, y - 4, x + 4, y - 4, H('#3a2418')); },
  guitar: (b, x, y) => { b.rect(x - 1, y - 1, 5, 4, H('#c9834a')); b.rect(x + 0, y, 3, 2, H('#e0a060')); b.set(x + 1, y + 1, H('#3a2418')); b.line(x + 4, y, x + 11, y - 2, H('#6b4326')); b.rect(x + 11, y - 3, 2, 2, H('#6b4326')); },
  brush: (b, x, y, a) => { const t = shaft(b, x, y, a, 1, 5, WOODL); b.set(t[0], t[1], REDC); },
  basket: (b, x, y) => { b.rect(x, y, 6, 3, H('#c9a05a')); b.rect(x, y, 6, 1, H('#e0b878')); b.line(x, y, x + 5, y - 4, H('#8a6a3a')); b.set(x + 1, y - 1, REDC); b.set(x + 3, y - 1, REDC); },
  jar: (b, x, y, a, v, t) => { b.rect(x, y - 3, 4, 5, H('#cfe8f0')); b.rect(x + 1, y - 2, 2, 3, v > 0 ? H('#fff2a6') : H('#a8c0c8')); b.rect(x, y - 4, 4, 1, STEELD); },
  lantern: (b, x, y) => { b.set(x + 1, y - 1, STEELD); b.rect(x, y, 3, 4, H('#3a2418')); b.rect(x + 1, y + 1, 1, 2, H('#ffd98a')); },
  umbrella: (b, x, y, a, v) => { b.line(x, y + 3, x, y - 9, H('#4a2e1c')); const w = 5 + Math.round(v * 2); for (let i = -w; i <= w; i++) b.set(x + i, y - 9 + Math.floor(Math.abs(i) * 0.5), i % 3 ? REDC : H('#f6ead2')); b.set(x, y - 11, H('#3a2418')); },
  letter: (b, x, y) => { b.rect(x, y - 2, 5, 3, CREAM); b.set(x + 2, y - 1, REDC); },
  flower: (b, x, y) => { b.line(x, y, x - 1, y + 4, GREENC); b.rect(x - 1, y - 2, 3, 2, H('#f4a3c0')); b.set(x, y - 1, GOLD); b.set(x + 2, y + 1, H('#fff3f8')); },
  pumpkin: (b, x, y) => { b.rect(x, y - 3, 6, 5, H('#e8772e')); b.rect(x + 1, y - 4, 4, 1, H('#e8772e')); b.set(x + 3, y - 5, GREENC); b.line(x + 2, y - 3, x + 2, y + 1, H('#b9582f')); b.line(x + 4, y - 3, x + 4, y + 1, H('#b9582f')); },
  apple: (b, x, y) => { b.rect(x, y - 1, 3, 3, REDC); b.set(x + 1, y - 2, GREENC); },
  berries: (b, x, y) => { b.set(x, y, REDC); b.set(x + 1, y - 1, REDC); b.set(x + 2, y, H('#b23b5a')); b.set(x + 1, y + 1, REDC); b.set(x + 1, y - 2, GREENC); },
  fish: (b, x, y) => { b.rect(x, y - 1, 5, 3, H('#8fb6d0')); b.rect(x, y, 5, 1, H('#d8e6ee')); b.set(x + 5, y - 2, H('#6a96b4')); b.set(x + 5, y + 2, H('#6a96b4')); b.set(x + 1, y - 1, H('#2b1d18')); },
  stone: (b, x, y) => { b.rect(x, y - 1, 4, 3, H('#9a9088')); b.rect(x, y - 1, 2, 1, H('#c2b8ae')); },
  log: (b, x, y) => { b.rect(x - 1, y - 2, 8, 3, WOOD); b.rect(x - 1, y - 2, 8, 1, WOODL); b.rect(x + 6, y - 2, 1, 3, H('#e0b070')); },
  rod: (b, x, y, a, v, t) => { const e = shaft(b, x, y, a, 3, 13, H('#6b4326')); b.line(e[0], e[1], e[0] + 5, e[1] + 9 + Math.round(v * 4), H('#dfe8ee')); b.rect(e[0] + 5, e[1] + 9 + Math.round(v * 4) + Math.round(Math.sin(t * 3) * 0.6), 2, 2, REDC); },
  stick: (b, x, y, a) => { const e = shaft(b, x, y, a, 2, 10, H('#7a5230')); b.set(e[0], e[1], H('#ffb060')); b.set(e[0] - 1, e[1], H('#f6ead2')); },
  snowball: (b, x, y) => { b.rect(x, y - 1, 3, 3, H('#f4f8ff')); b.set(x, y + 1, H('#cfd9ee')); },
  net: (b, x, y, a) => { const t = shaft(b, x, y, a, 2, 8); for (let i = 0; i < 12; i++) { const an = (i / 12) * 6.283; b.set(t[0] + Math.cos(an) * 3 + dir(a)[0] * 3, t[1] + Math.sin(an) * 3 + dir(a)[1] * 3, H('#dfe8ee')); } },
  cloth: (b, x, y, a, v, t) => { b.rect(x - 1, y - 1, 4, 5, v > 0.5 ? H('#e2674f') : H('#f6ead2')); b.rect(x - 1, y - 1, 4, 1, H('#cfc0a0')); },
};
