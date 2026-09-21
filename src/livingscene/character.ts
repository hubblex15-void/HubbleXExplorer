import { Buf } from './fb';
import { RGB, hex, mix, clamp, pack } from './util';
import { PROPS, Canvas } from './props';

export type V2 = [number, number];
/** Pose values are in "scene pixels" (1 unit = 2 character pixels). Arms/legs are solved with 2-bone IK, so any pose tweens smoothly. */
export interface Pose { hip: V2; lean: number; torso: number; head: V2; aN: V2; aF: V2; fN: V2; fF: V2; face: number; eyes: number; mouth: number; prop: string; pa: number; pv: number; }
export const BASE: Pose = { hip: [0, -7], lean: 0, torso: 4, head: [0, 0], aN: [1, 5], aF: [-1, 5], fN: [1, 0], fF: [-1, 0], face: 0, eyes: 0, mouth: 0, prop: '', pa: 0, pv: 0 };
/** "The Traveller" */
export interface Outfit {
  skin: RGB; skinShade: RGB; hair: RGB; hat: RGB; hatLight: RGB; hatDark: RGB; band: RGB; feather: RGB; featherLight: RGB; eyeDark: RGB; eye: RGB;
  shirt: RGB; shirtShade: RGB; strap: RGB; belt: RGB; buckle: RGB; pouch: RGB; glove: RGB; gloveDark: RGB; bracer: RGB;
  cloak: boolean; cloakC: RGB; cloakLight: RGB; cloakDark: RGB; trim: RGB; scarf: RGB; scarfLight: RGB; scarfDark: RGB; scarfLen: number;
  pants: RGB; pantsDark: RGB; boots: RGB; bootsDark: RGB; cuff: RGB; sole: RGB; pack: RGB; packDark: RGB; bareArms: boolean; flower: boolean;
}
export type SeasonKey = 'spring' | 'summer' | 'autumn' | 'winter';
export interface OutfitOverride { cloak?: string; scarf?: string; hat?: string; }
export function makeOutfit(season: SeasonKey = 'autumn', over: OutfitOverride = {}, cool = false): Outfit {
  const H = hex, c = H(over.cloak || '#4a6a46'), s = H(over.scarf || '#b1382e'), h = H(over.hat || '#7b4a2a');
  return {
    skin: H('#f2c7a0'), skinShade: H('#d9a67c'), hair: H('#2a1c17'), hat: h, hatLight: mix(h, [255, 220, 170], 0.25), hatDark: mix(h, [20, 10, 0], 0.4), band: H('#2e2620'), feather: H('#5f8f4a'), featherLight: H('#a9cf7a'), eyeDark: H('#1c2430'), eye: H('#3f86c0'),
    shirt: H('#e2d2b6'), shirtShade: H('#b9a78a'), strap: H('#8a5a34'), belt: H('#6b4429'), buckle: H('#dcb45a'), pouch: H('#8a5a34'), glove: H('#3a271d'), gloveDark: H('#26180f'), bracer: H('#7a4d2a'),
    cloak: season !== 'summer' || cool, cloakC: c, cloakLight: mix(c, [255, 255, 255], 0.16), cloakDark: mix(c, [10, 20, 10], 0.38), trim: H('#cfa95e'), scarf: s, scarfLight: mix(s, [255, 200, 180], 0.25), scarfDark: mix(s, [30, 0, 0], 0.4), scarfLen: season === 'winter' ? 1.6 : season === 'summer' ? 0.8 : 1,
    pants: H('#34353f'), pantsDark: H('#25262d'), boots: H('#6b4630'), bootsDark: H('#4a2f20'), cuff: H('#9a6a45'), sole: H('#2b1f1a'), pack: H('#8a5a34'), packDark: H('#63401f'), bareArms: season === 'summer' && !cool, flower: season === 'spring',
  };
}
export const OX = 64, OY = 100, BW = 128, BH = 112;
const pk = (c: RGB): number => pack(c[0], c[1], c[2]);
const lit = (c: RGB, k: number): RGB => mix(c, [255, 255, 255], k), drk = (c: RGB, k: number): RGB => mix(c, [12, 8, 6], k);
function ik(sx: number, sy: number, tx: number, ty: number, mode: 'arm' | 'leg', L: number): { mid: V2; end: V2 } {
  const dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy) || 0.001, dd = Math.min(d, 2 * L - 0.2), a = dd / 2, h = Math.sqrt(Math.max(0, L * L - a * a));
  const ux = dx / d, uy = dy / d, mx = sx + ux * a, my = sy + uy * a, c1: V2 = [mx - uy * h, my + ux * h], c2: V2 = [mx + uy * h, my - ux * h];
  return { mid: mode === 'leg' ? (c1[0] >= c2[0] ? c1 : c2) : (c1[1] >= c2[1] ? c1 : c2), end: [sx + ux * dd, sy + uy * dd] };
}
function walk(x0: number, y0: number, x1: number, y1: number, f: (x: number, y: number, i: number) => void): void {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy, i = 0;
  for (;;) { f(x0, y0, i++); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}
function brush(b: Buf, x0: number, y0: number, x1: number, y1: number, w: number, c: RGB): void { const o = Math.floor(w / 2); walk(x0, y0, x1, y1, (x, y) => b.rect(x - o, y - o, w, w, c)); }
function shade(b: Buf, x0: number, y0: number, x1: number, y1: number, c: RGB, over: number): void { walk(x0, y0, x1, y1, (x, y) => { if (b.get(x, y) === over) b.set(x, y, c); }); }
function limb(b: Buf, a: V2, m: V2, e: V2, w: number, c: RGB, hi: RGB, lo: RGB, w2 = w): void {
  brush(b, a[0], a[1], m[0], m[1], w, c); brush(b, m[0], m[1], e[0], e[1], w2, c); const k = pk(c), o = Math.floor(w / 2) - 1;
  shade(b, a[0] - o, a[1] - o, m[0] - o, m[1] - o, hi, k); shade(b, m[0] - o, m[1] - o, e[0] - o, e[1] - o, hi, k); shade(b, a[0] + o, a[1] + o, m[0] + o, m[1] + o, lo, k); shade(b, m[0] + o, m[1] + o, e[0] + o, e[1] + o, lo, k);
}
const disc = (b: Buf, cx: number, cy: number, r: number, c: RGB) => { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) b.set(cx + x, cy + y, c); };
class Lo implements Canvas { // draws lo-res prop art as 2x2 blocks anchored at the hand
  constructor(private b: Buf, private hx: number, private hy: number) {}
  set(x: number, y: number, c: RGB | number): void { this.b.rect(this.hx + Math.round(x) * 2, this.hy + Math.round(y) * 2, 2, 2, c); }
  rect(x: number, y: number, w: number, h: number, c: RGB | number): void { this.b.rect(this.hx + Math.round(x) * 2, this.hy + Math.round(y) * 2, w * 2, h * 2, c); }
  line(x0: number, y0: number, x1: number, y1: number, c: RGB | number): void { walk(x0, y0, x1, y1, (x, y) => this.set(x, y, c)); }
}
/** w: how much cloth streams (wind + movement), mv: movement 0..1 */
export function drawChar(b: Buf, p: Pose, o: Outfit, t: number, wind: number, mv = 0): { hx: number; hy: number } {
  b.clear();
  const S = 2, hx = OX + Math.round(p.hip[0] * S), hy = OY + Math.round(p.hip[1] * S) - 3, T = Math.max(6, Math.round(p.torso * 2)), sx = hx + Math.round(p.lean * S), sy = hy - T, front = p.face !== 0, w = clamp(0.2 + wind * 0.9 + mv * 0.9);
  const cxr = (r: number) => (r < T ? Math.round(sx + (hx - sx) * ((r + 0.5) / T)) : hx);
  const shN: V2 = front ? [sx + 8, sy + 2] : [sx - 1, sy + 2], shF: V2 = front ? [sx - 8, sy + 2] : [sx - 1, sy + 2];
  const aN = ik(shN[0], shN[1], shN[0] + p.aN[0] * S, shN[1] + p.aN[1] * S, 'arm', 5.2), aF = ik(shF[0], shF[1], shF[0] + p.aF[0] * S, shF[1] + p.aF[1] * S, 'arm', 5.2);
  const rootN: V2 = [hx + (front ? 2 : 0), hy + 1], rootF: V2 = [hx - (front ? 3 : 0), hy + 1];
  const fNx = Math.round(OX + p.fN[0] * S), fNy = OY + Math.round(p.fN[1] * S), fFx = Math.round(OX + p.fF[0] * S) - (front ? 2 : 0), fFy = OY + Math.round(p.fF[1] * S);
  const lN = ik(rootN[0], rootN[1], fNx, fNy - 5, 'leg', 4.3), lF = ik(rootF[0], rootF[1], fFx, fFy - 5, 'leg', 4.3);
  const R = (x: number, y: number, ww: number, h: number, c: RGB) => b.rect(Math.round(x), Math.round(y), ww, h, c);
  const arm = (sh: V2, a: { mid: V2; end: V2 }, near: boolean) => {
    const sl = near ? o.shirt : o.shirtShade; limb(b, sh, a.mid, a.mid, 3, sl, lit(sl, 0.25), drk(sl, 0.25));
    const br = o.bareArms ? (near ? o.skin : o.skinShade) : near ? o.bracer : drk(o.bracer, 0.25); limb(b, a.mid, a.end, a.end, 3, br, lit(br, 0.2), drk(br, 0.3));
    if (!o.bareArms) { const mx = (a.mid[0] + a.end[0]) / 2, my = (a.mid[1] + a.end[1]) / 2; b.set(mx, my, o.buckle); }
    const g = near ? o.glove : o.gloveDark, ex = Math.round(a.end[0]), ey = Math.round(a.end[1]); R(ex - 1, ey - 1, 3, 3, g); b.set(ex - 1, ey - 1, lit(g, 0.3));
  };
  const boot = (fx: number, fy: number, near: boolean) => {
    const bc = near ? o.boots : o.bootsDark, cf = near ? o.cuff : drk(o.cuff, 0.25), x0 = front ? fx - 3 : fx - 4, ww = front ? 7 : 8;
    R(x0, fy - 5, ww, 2, cf); R(x0, fy - 5, ww, 1, lit(cf, 0.2)); R(x0, fy - 3, ww, 3, bc); R(x0, fy - 3, ww, 1, lit(bc, 0.18)); R(x0 + ww - 2, fy - 2, 2, 2, drk(bc, 0.2));
    if (!front) { R(fx + 4, fy - 2, 3, 2, bc); b.set(fx + 4, fy - 3, bc); R(fx + 4, fy - 2, 2, 1, lit(bc, 0.15)); }
    R(x0, fy, ww + (front ? 0 : 3), 1, o.sole); if (near) { b.set(x0 + 2, fy - 5, o.buckle); b.set(x0 + 3, fy - 5, o.buckle); }
  };
  const leg = (root: V2, l: { mid: V2; end: V2 }, near: boolean, fx: number, fy: number) => { const c = near ? o.pants : o.pantsDark; limb(b, root, l.mid, l.end, 5, c, lit(c, 0.16), drk(c, 0.3)); boot(fx, fy, near); };
  const hcx = sx + Math.round(p.head[0] * S), chin = sy - 3 + Math.round(p.head[1] * S), brimY = chin - 9;
  const head = () => {
    const H = o.hair, HL = lit(o.hair, 0.16), sk = o.skin, ss = o.skinShade;
    if (p.face === 0) {
      R(hcx - 7, chin - 11, 9, 10, H); R(hcx - 8, chin - 7, 2, 7, H); R(hcx - 7, chin - 1, 3, 2, H); R(hcx - 6, chin - 13, 13, 3, H); R(hcx - 5, chin - 10, 3, 1, HL); R(hcx - 6, chin - 8, 1, 3, HL);
      R(hcx - 1, chin - 9, 8, 9, sk); R(hcx, chin, 5, 1, ss); R(hcx - 1, chin - 3, 2, 3, ss); R(hcx + 7, chin - 4, 1, 2, lit(sk, 0.2)); b.set(hcx + 6, chin - 3, ss);
      R(hcx - 2, chin - 6, 2, 3, sk); b.set(hcx - 2, chin - 5, ss); R(hcx - 1, chin - 10, 8, 2, H); R(hcx + 3, chin - 8, 3, 1, H); R(hcx + 5, chin - 7, 2, 1, H); R(hcx + 4, chin - 7, 3, 1, H);
      if (p.eyes === 1) { R(hcx + 3, chin - 4, 4, 1, drk(ss, 0.3)); } else if (p.eyes === 2) { R(hcx + 3, chin - 4, 3, 1, o.eyeDark); b.set(hcx + 6, chin - 3, o.eyeDark); } else { R(hcx + 3, chin - 5, 3, 1, o.eyeDark); R(hcx + 4, chin - 4, 2, 2, o.eye); b.set(hcx + 5, chin - 4, [255, 255, 255]); if (p.eyes === 3) { R(hcx + 4, chin - 6, 2, 1, o.eyeDark); b.set(hcx + 4, chin - 3, o.eye); } }
      R(hcx + 2, chin - 2, 2, 1, hex('#eea08e')); if (p.mouth === 1) R(hcx + 4, chin - 1, 3, 1, hex('#b5604a')); if (p.mouth === 2) { R(hcx + 4, chin - 2, 3, 2, hex('#8a3a2e')); b.set(hcx + 5, chin - 1, hex('#e07a72')); }
    } else if (p.face === 1) {
      R(hcx - 7, chin - 13, 14, 9, H); R(hcx - 7, chin - 6, 3, 6, H); R(hcx + 4, chin - 6, 3, 6, H); R(hcx - 4, chin - 8, 8, 8, sk); R(hcx - 3, chin, 6, 1, ss); R(hcx - 5, chin - 5, 1, 3, ss); R(hcx + 4, chin - 5, 1, 3, ss);
      R(hcx - 5, chin - 10, 10, 3, H); R(hcx - 3, chin - 7, 2, 1, H); R(hcx + 1, chin - 7, 2, 1, H); R(hcx - 4, chin - 12, 3, 1, HL);
      const eye = (ex: number, hl: number) => { if (p.eyes === 1) R(ex, chin - 4, 2, 1, drk(ss, 0.3)); else { R(ex, chin - 5, 2, 1, o.eyeDark); R(ex, chin - 4, 2, 2, o.eye); b.set(ex + hl, chin - 4, [255, 255, 255]); if (p.eyes === 3) b.set(ex, chin - 6, o.eyeDark); } };
      eye(hcx - 3, 0); eye(hcx + 1, 0); R(hcx - 1, chin - 2, 2, 1, ss); R(hcx - 4, chin - 2, 2, 1, hex('#eea08e')); R(hcx + 2, chin - 2, 2, 1, hex('#eea08e'));
      if (p.mouth === 1) R(hcx - 1, chin - 1, 2, 1, hex('#b5604a')); if (p.mouth === 2) { R(hcx - 1, chin - 2, 2, 2, hex('#8a3a2e')); }
    } else { R(hcx - 7, chin - 13, 14, 13, H); R(hcx - 5, chin - 9, 3, 1, HL); R(hcx + 1, chin - 6, 3, 1, HL); R(hcx - 2, chin + 1, 4, 2, ss); }
    // wide-brim hat: curved brim, dented crown, dark band with buckle, green feather
    for (let x = hcx - 14; x <= hcx + 15; x++) {
      const dn = (x - (hcx + 1)) / 14.5; if (Math.abs(dn) > 1) continue; const yc = brimY + Math.round(dn * dn * 2.6), hh = Math.max(1, Math.round(2.4 * Math.sqrt(1 - dn * dn)));
      for (let y = yc - hh; y <= yc + hh; y++) { const top = y <= yc; R(x, y, 1, 1, top ? (y === yc - hh ? lit(o.hat, 0.25) : Math.abs(dn) > 0.8 ? o.hatDark : o.hat) : (y === yc + hh ? drk(o.hat, 0.55) : drk(o.hat, 0.38))); }
    }
    const hw = [7, 7, 6, 6, 5, 4];
    for (let i = 0; i < hw.length; i++) { const y = brimY - 2 - i, cx0 = hcx + (i > 3 ? 1 : 0); for (let x = cx0 - hw[i]; x <= cx0 + hw[i]; x++) { const dx = x - cx0; R(x, y, 1, 1, dx < -hw[i] + 3 ? o.hatLight : dx > hw[i] - 3 ? o.hatDark : o.hat); } if (i === hw.length - 1) R(cx0 - 3, y, 6, 1, lit(o.hat, 0.3)); }
    R(hcx - 1, brimY - 7, 2, 1, drk(o.hat, 0.3)); R(hcx - 7, brimY - 3, 15, 2, o.band); R(hcx - 7, brimY - 3, 15, 1, lit(o.band, 0.18)); R(hcx + 4, brimY - 4, 3, 4, o.buckle); R(hcx + 5, brimY - 3, 1, 2, o.band);
    walk(hcx - 7, brimY - 3, hcx - 14, brimY - 10, (x, y, i) => { R(x, y, 2, 2, o.feather); if (i % 2) b.set(x - 1, y + 1, o.featherLight); }); walk(hcx - 8, brimY - 3, hcx - 13, brimY - 8, (x, y) => b.set(x + 1, y, o.featherLight)); R(hcx - 15, brimY - 11, 2, 2, o.featherLight);
    if (o.flower) { disc(b, hcx + 9, brimY - 3, 1, hex('#f4a3c0')); b.set(hcx + 9, brimY - 3, hex('#fff3f8')); }
  };
  const scarf = () => {
    const sc = sx, ny = sy - 2, base = o.scarf, hi = o.scarfLight, lo = o.scarfDark;
    R(sc - 6, ny, 12, 6, base); R(sc - 6, ny, 12, 1, hi); R(sc - 5, ny + 1, 4, 1, hi); R(sc - 6, ny + 5, 12, 1, lo); R(sc + 2, ny + 3, 4, 3, lo); for (let i = 0; i < 4; i++) b.set(sc - 5 + i * 3, ny + 3 + (i % 2), lo);
    if (front) { R(sc + 1, ny + 5, 4, 9, base); R(sc + 1, ny + 5, 1, 9, hi); R(sc + 4, ny + 5, 1, 9, lo); R(sc + 1, ny + 13, 4, 1, lo); b.set(sc + 2, ny + 13, base); return; }
    const len = Math.round((7 + w * 13) * o.scarfLen), a = 1.2 - 1.05 * w, x0 = sc - 6, y0 = ny + 2;
    for (let k = 1; k <= len; k++) { const x = x0 - k * Math.cos(a), y = y0 + k * Math.sin(a) + Math.sin(t * 6 + k * 0.5) * (0.6 + 1.6 * w), th = k > len - 3 ? 3 : 4, c = (k >> 2) % 2 ? base : hi; R(x, y, 1, th, c); R(x, y + th - 1, 1, 1, lo); if (k === len) R(x, y + 1, 1, 1, base); }
  };
  const cloakColor = (x: number, r: number, left: number, right: number): RGB => x === left ? o.cloakDark : (x - left) % 4 === 2 && r > 3 ? o.cloakDark : x >= right - 1 ? o.cloakLight : (x - left) % 4 === 0 ? o.cloakLight : o.cloakC;
  const panel = (x0: number, x1: number, rows: number, flare: number, dirn: number) => { // front/back cloak panels
    for (let r = 0; r < rows; r++) { const fl = r >= T - 2 ? Math.round((r - (T - 2)) * flare) : 0, a = dirn < 0 ? x0 - fl : x0, e = dirn < 0 ? x1 : x1 + fl; for (let x = a; x <= e; x++) { b.set(x, sy + r, cloakColor(x, r, a, e)); } b.set(dirn < 0 ? a : e, sy + r, r % 3 === 1 ? o.trim : o.cloakDark); if (r === rows - 1) R(a, sy + r, e - a + 1, 1, o.trim); if (r === rows - 2 && (r & 1)) R(a, sy + r, e - a + 1, 1, o.trim); }
  };
  if (front) {
    leg(rootF, lF, false, fFx, fFy); leg(rootN, lN, true, fNx + 2, fNy);
    if (p.face === 2) { if (o.cloak) { panel(sx - 8, sx + 7, T + 8, 0.5, -1); } else R(sx - 6, sy, 12, T, o.shirt); R(sx - 5, sy + 1, 10, 12, o.pack); R(sx - 5, sy + 1, 10, 5, o.packDark); R(sx - 3, sy + 4, 2, 2, o.buckle); R(sx + 1, sy + 4, 2, 2, o.buckle); R(sx - 5, sy + 8, 1, 5, o.packDark); R(sx + 4, sy + 8, 1, 5, o.packDark); R(sx - 6, sy - 1, 12, 3, o.cloak ? o.cloakC : lit(o.pack, 0.2)); }
    else {
      R(sx - 4, sy, 8, T, o.shirt); R(sx - 4, sy, 1, T, o.shirtShade); R(sx + 3, sy, 1, T, lit(o.shirt, 0.2)); for (let i = 0; i < 4; i++) { b.set(sx - 1, sy + 1 + i, drk(o.shirt, 0.4)); }
      if (o.cloak) { panel(sx - 9, sx - 5, T + 8, 0.6, -1); panel(sx + 4, sx + 8, T + 8, 0.6, 1); } else { R(sx - 6, sy, 12, T, o.shirt); }
      for (let r = 0; r < T; r++) { b.rect(sx - 4 + Math.round((r * 8) / T), sy + r, 2, 1, o.strap); b.rect(sx + 3 - Math.round((r * 8) / T), sy + r, 2, 1, o.strap); }
      R(sx - 4, sy + T - 2, 8, 2, o.belt); R(sx - 1, sy + T - 2, 3, 2, o.buckle); disc(b, sx - 5, sy + T + 3, 2, o.buckle); b.set(sx - 5, sy + T + 3, drk(o.buckle, 0.5)); R(sx + 3, sy + T - 1, 4, 5, o.pouch); R(sx + 3, sy + T - 1, 4, 2, drk(o.pouch, 0.25)); b.set(sx + 5, sy + T + 1, o.buckle);
    }
    arm(shF, aF, false); head(); scarf(); arm(shN, aN, true);
  } else {
    arm(shF, aF, false); leg(rootF, lF, false, fFx, fFy);
    const trail = Math.round(2 + w * 9), rows = T + 8;
    if (o.cloak) { for (let r = 0; r < rows; r++) { const c = cxr(r), left = c - 6 - Math.round((trail * (r + 1)) / rows), right = c - 1, hem = r > rows - 3; for (let x = left; x <= right; x++) { const cut = ((x * 5) % 3) * (hem ? 1 : 0); if (hem && r > rows - 2 - (cut ? 0 : 0) && cut === 2) continue; b.set(x, sy + r, cloakColor(x, r, left, right)); } b.set(left, sy + r, r % 3 === 1 ? o.trim : o.cloakDark); if (r === rows - 1) R(left, sy + r, right - left + 1, 1, o.trim); } }
    else { R(sx - 15, sy - 4, 12, 5, o.cloakC); R(sx - 15, sy - 4, 12, 1, o.cloakLight); R(sx - 15, sy + 1, 12, 1, o.cloakDark); R(sx - 10, sy - 4, 1, 6, o.trim); }
    const px = sx - 13 + Math.round(p.lean * S * 0.3); R(px, sy + 1, 8, 13, o.pack); R(px, sy + 1, 1, 13, o.packDark); R(px, sy + 1, 8, 5, o.packDark); R(px + 2, sy + 4, 2, 2, o.buckle); R(px + 5, sy + 4, 2, 2, o.buckle); R(px + 1, sy + 9, 2, 4, o.packDark); R(px, sy + 13, 8, 1, drk(o.pack, 0.5)); R(px + 2, sy + 7, 5, 1, lit(o.pack, 0.15)); R(px, sy - 2, 8, 3, o.shirt); R(px + 2, sy - 2, 1, 3, o.shirtShade); R(px + 5, sy - 2, 1, 3, o.shirtShade);
    for (let r = 0; r < T; r++) { const c = cxr(r); for (let x = c - 4; x <= c + 3; x++) { let col: RGB = o.cloak ? (x <= c ? (x === c - 4 ? o.cloakDark : (x - c) % 3 === 0 && r > 2 ? o.cloakDark : o.cloakC) : x === c + 1 ? o.shirtShade : o.shirt) : (x === c - 4 ? o.shirtShade : o.shirt); if (o.cloak && x === c) col = r % 3 === 2 ? o.cloakLight : o.trim; b.set(x, sy + r, col); } if (r >= 1 && r < T - 1) { R(c - 3 + Math.round((r * 6) / T), sy + r, 2, 1, o.strap); } if (r >= T - 2) R(c - 4, sy + r, 8, 1, o.belt); }
    R(hx - 4, hy - 1, 8, 2, o.belt); R(hx + 2, hy - 1, 3, 2, o.buckle);
    leg(rootN, lN, true, fNx, fNy);
    R(hx + 1, hy + 1, 5, 6, o.pouch); R(hx + 1, hy + 1, 5, 2, drk(o.pouch, 0.28)); b.set(hx + 3, hy + 3, o.buckle); R(hx + 1, hy + 6, 5, 1, drk(o.pouch, 0.4)); disc(b, hx - 3, hy + 5, 2, o.buckle); b.set(hx - 3, hy + 5, drk(o.buckle, 0.5)); b.set(hx - 3, hy + 2, o.strap); b.set(hx - 3, hy + 3, o.strap);
    if (o.cloak) { R(sx - 6, sy - 1, 9, 4, o.cloakC); R(sx - 6, sy - 1, 9, 1, o.cloakLight); R(sx - 6, sy + 2, 9, 1, o.cloakDark); R(sx + 2, sy + 1, 2, 2, o.buckle); R(sx + 3, sy + 3, 1, 4, o.trim); }
    head(); scarf(); arm(shN, aN, true);
  }
  const pf = p.prop && PROPS[p.prop]; if (pf) pf(new Lo(b, Math.round(aN.end[0]), Math.round(aN.end[1])), 0, 0, p.pa, p.pv, t, { x: (aF.end[0] - aN.end[0]) / 2, y: (aF.end[1] - aN.end[1]) / 2 });
  b.outlineSel();
  return { hx: Math.round(aN.end[0]), hy: Math.round(aN.end[1]) };
}
