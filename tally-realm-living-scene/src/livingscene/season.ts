import { RGB, hex, mix, clamp, smooth, wrap } from './util';
import type { SeasonName } from './types';

export interface SeasonParams {
  leaf: [RGB, RGB, RGB, RGB]; grass: [RGB, RGB, RGB, RGB];
  accentTree: RGB; fruit: RGB; flowerA: RGB; flowerB: RGB;
  leafDensity: number; flowerAmt: number;
}
const h4 = (a: string, b: string, c: string, d: string): [RGB, RGB, RGB, RGB] => [hex(a), hex(b), hex(c), hex(d)];
export const SEASONS: Record<SeasonName, SeasonParams> = {
  spring: { leaf: h4('#4d8c4b', '#72b45c', '#9bd071', '#c5ea94'), grass: h4('#5f9e4d', '#7dc05c', '#9bd873', '#bdec94'), accentTree: hex('#f6b8cb'), fruit: hex('#fff0f5'), flowerA: hex('#f4a3c0'), flowerB: hex('#fff3f8'), leafDensity: 0.9, flowerAmt: 0.7 },
  summer: { leaf: h4('#2f6b41', '#4c9a4b', '#79bf5d', '#a6dc78'), grass: h4('#4d8f46', '#69b052', '#87cc66', '#a5e181'), accentTree: hex('#8fd070'), fruit: hex('#e2513f'), flowerA: hex('#ffd25a'), flowerB: hex('#f07a5a'), leafDensity: 1, flowerAmt: 0.85 },
  autumn: { leaf: h4('#8f3f24', '#c8672a', '#e8993a', '#f6c85a'), grass: h4('#85853d', '#a5a247', '#c2b95a', '#dccf72'), accentTree: hex('#c73c2c'), fruit: hex('#e8772e'), flowerA: hex('#f08a3c'), flowerB: hex('#b483d0'), leafDensity: 0.62, flowerAmt: 0.3 },
  winter: { leaf: h4('#5f6a64', '#7b857d', '#9aa39a', '#b9c1b6'), grass: h4('#7c9080', '#95a98f', '#adc0a4', '#c6d6bb'), accentTree: hex('#d3dbd6'), fruit: hex('#b23b3b'), flowerA: hex('#dfe8ef'), flowerB: hex('#dfe8ef'), leafDensity: 0.07, flowerAmt: 0 },
};
const ORDER: SeasonName[] = ['winter', 'spring', 'summer', 'autumn'];
const CENTER: Record<SeasonName, number> = { winter: 15, spring: 105, summer: 196, autumn: 288 };

export interface SeasonState { params: SeasonParams; id: SeasonName; weights: Record<SeasonName, number>; }

function blendParams(a: SeasonParams, b: SeasonParams, t: number): SeasonParams {
  const m4 = (x: [RGB, RGB, RGB, RGB], y: [RGB, RGB, RGB, RGB]): [RGB, RGB, RGB, RGB] => [mix(x[0], y[0], t), mix(x[1], y[1], t), mix(x[2], y[2], t), mix(x[3], y[3], t)];
  return { leaf: m4(a.leaf, b.leaf), grass: m4(a.grass, b.grass), accentTree: mix(a.accentTree, b.accentTree, t), fruit: mix(a.fruit, b.fruit, t), flowerA: mix(a.flowerA, b.flowerA, t), flowerB: mix(a.flowerB, b.flowerB, t), leafDensity: a.leafDensity + (b.leafDensity - a.leafDensity) * t, flowerAmt: a.flowerAmt + (b.flowerAmt - a.flowerAmt) * t };
}
/** Continuous seasonal blend by date: palettes drift slowly all year, never jump. */
export function seasonState(ms: number, lat: number, lon: number, override: 'auto' | SeasonName = 'auto'): SeasonState {
  const w: Record<SeasonName, number> = { winter: 0, spring: 0, summer: 0, autumn: 0 };
  if (override !== 'auto') { w[override] = 1; return { params: SEASONS[override], id: override, weights: w }; }
  const d = new Date(ms + (lon / 15) * 3600000);
  let doy = (Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 0)) / 86400000 + d.getUTCHours() / 24;
  if (lat < 0) doy += 182.5;
  doy = wrap(doy, 365);
  let i = 3; // find previous center
  const cs = ORDER.map(s => CENTER[s]);
  for (let k = 0; k < 4; k++) if (doy >= cs[k]) i = k;
  const a = ORDER[i], b = ORDER[(i + 1) % 4];
  const ca = CENTER[a], cb = CENTER[b] + (i === 3 ? 365 : 0), dd = i === 3 && doy < ca ? doy + 365 : doy;
  const t = smooth((dd - ca) / (cb - ca));
  for (const s of ORDER) { const dist = Math.min(Math.abs(doy - CENTER[s]), 365 - Math.abs(doy - CENTER[s])); w[s] = clamp(1 - dist / 62); }
  const id = t < 0.5 ? a : b;
  return { params: blendParams(SEASONS[a], SEASONS[b], t), id, weights: w };
}
