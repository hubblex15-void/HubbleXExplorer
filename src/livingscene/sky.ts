import { RGB, hex, mix, lerp, clamp, sstep, smooth, lum, bayer, hash2, wrap } from './util';
import { sunPos, sunTimes, moonPhase } from './astro';
import { FB } from './fb';
import { W } from './world';

interface SK { a: number; z: RGB; m: RGB; h: RGB }
const K: SK[] = ([
  [-18, '#070b22', '#0d1338', '#16204d'], [-12, '#10194a', '#22336f', '#3d4b8f'], [-6, '#26397c', '#5d62a6', '#c98da4'],
  [-1, '#3f5fa6', '#a4759f', '#f2a684'], [3, '#5f86c4', '#e39c8c', '#ffcb8e'], [10, '#72a2da', '#b9c9dc', '#fbdaa8'],
  [25, '#62a1e1', '#96c4ec', '#dcecf8'], [60, '#529add', '#86bcee', '#cfe8f8'],
] as [number, string, string, string][]).map(k => ({ a: k[0], z: hex(k[1]), m: hex(k[2]), h: hex(k[3]) }));
const AMB: [number, RGB][] = [[-18, [0.3, 0.37, 0.64]], [-9, [0.4, 0.46, 0.74]], [-3, [0.64, 0.6, 0.8]], [0, [1, 0.74, 0.64]], [6, [1, 0.87, 0.74]], [16, [1, 0.95, 0.87]], [35, [1, 0.99, 0.96]]];
const pick = <T>(alt: number, arr: { a: number; v: T }[], f: (a: T, b: T, t: number) => T): T => {
  if (alt <= arr[0].a) return arr[0].v; if (alt >= arr[arr.length - 1].a) return arr[arr.length - 1].v;
  let i = 0; while (arr[i + 1].a < alt) i++; return f(arr[i].v, arr[i + 1].v, smooth((alt - arr[i].a) / (arr[i + 1].a - arr[i].a)));
};
export interface Sky {
  alt: number; dayFrac: number; evening: boolean; z: RGB; m: RGB; h: RGB; amb: RGB; dark: number; starVis: number;
  sun: { x: number; y: number; vis: number }; moon: { x: number; y: number; vis: number; phase: number }; hazeCol: RGB; glow: number; sunX: number;
}
export function computeSky(ms: number, lat: number, lon: number, wx: { cloud: number; rain: number; fog: number; thunder: number }): Sky {
  const alt = (sunPos(ms, lat, lon).alt * 180) / Math.PI, st = sunTimes(ms, lat, lon);
  const dayFrac = (ms - st.rise) / Math.max(1, st.set - st.rise), evening = ms > st.noon;
  const kf = <T>(g: (k: SK) => T) => K.map(k => ({ a: k.a, v: g(k) }));
  let z = pick(alt, kf(k => k.z), mix), m = pick(alt, kf(k => k.m), mix), h = pick(alt, kf(k => k.h), mix);
  if (evening) { const k = 0.4 * (1 - sstep(-6, 12, Math.abs(alt - 1) + 0) ) ; h = mix(h, [255, 150, 92], k); m = mix(m, [196, 112, 150], k * 0.8); }
  let amb = pick(alt, AMB.map(a => ({ a: a[0], v: a[1] })), mix);
  const oc = clamp(wx.cloud * 0.7 + wx.rain * 0.4), dim = 1 - 0.22 * wx.rain - 0.12 * wx.thunder - 0.12 * wx.cloud;
  const gray = (c: RGB): RGB => { const g = lum(c); return [g * 0.96, g * 1.0, g * 1.06]; };
  const wxc = (c: RGB): RGB => { const o = mix(c, gray(c), oc * 0.78); return [o[0] * dim, o[1] * dim, o[2] * dim]; };
  z = wxc(z); m = wxc(m); h = wxc(h);
  const fogC: RGB = mix([196, 200, 208], [40, 46, 70], 1 - sstep(-10, 8, alt));
  z = mix(z, fogC, wx.fog * 0.75); m = mix(m, fogC, wx.fog * 0.85); h = mix(h, fogC, wx.fog * 0.9);
  amb = mix(amb, gray(amb), oc * 0.5).map((v, i) => v * (1 - 0.15 * wx.rain - 0.1 * wx.cloud) + (i === 2 ? 0.02 : 0)) as RGB;
  const dark = 1 - sstep(-9, 2, alt);
  // sun & moon arcs
  const sf = clamp(dayFrac, -0.05, 1.05), sun = { x: lerp(-10, W + 10, sf), y: 88 - Math.sin(clamp(sf, 0, 1) * Math.PI) * 60, vis: dayFrac > -0.06 && dayFrac < 1.06 ? 1 : 0 };
  const phase = moonPhase(ms), transit = st.noon + phase * 86400000;
  const u = wrap((ms - transit) / 86400000 + 0.5, 1) - 0.5, mf = 0.5 + u * 2;
  const moon = { x: lerp(-10, W + 10, mf), y: 86 - Math.sin(clamp(mf, 0, 1) * Math.PI) * 56, vis: mf > -0.04 && mf < 1.04 ? 1 : 0, phase };
  const glow = clamp(1 - Math.abs(alt - 1) / 9) * (1 - oc * 0.6);
  return { alt, dayFrac, evening, z, m, h, amb, dark, starVis: (1 - sstep(-12, -3, alt)) * (1 - oc * 0.9), sun, moon, hazeCol: mix(h, m, 0.25), glow, sunX: sun.x };
}
const SKY_H = 98, NB = 16;
const colAt = (s: Sky, f: number): RGB => f < 0.5 ? mix(s.z, s.m, sstep(0, 0.5, f) * 0.9 + 0.05 * f) : mix(s.m, s.h, sstep(0.42, 1, f));
export function drawSky(fb: FB, s: Sky, t: number): void {
  const bands: RGB[] = []; for (let i = 0; i <= NB; i++) bands.push(colAt(s, Math.min(1, (i + 0.5) / NB)));
  for (let y = 0; y < SKY_H; y++) {
    const f = (y / SKY_H) * NB, i = Math.floor(f), fr = f - i;
    for (let x = 0; x < fb.w; x++) {
      const up = fr > 0.34 + (bayer(x, y) - 0.5) * 0.66 ? 1 : 0; let c = bands[Math.min(NB, i + up)];
      if (s.glow > 0.02) { // horizon glow around the sun/moon side
        const dx = (x - s.sunX) / 120, gy = clamp(1 - Math.abs(y - 84) / 46), g = s.glow * gy * Math.exp(-dx * dx);
        const q = Math.floor(g * 4 + bayer(x + 1, y) * 0.999) / 4; if (q > 0) c = mix(c, [255, 190, 120], q * 0.55);
      }
      fb.set(x, y, c[0], c[1], c[2]);
    }
  }
  for (let y = SKY_H; y < 110; y++) for (let x = 0; x < fb.w; x++) fb.set(x, y, s.h[0], s.h[1], s.h[2]);
  // stars
  if (s.starVis > 0.02) for (let i = 0; i < 90; i++) {
    const x = Math.floor(hash2(i, 1, 5) * fb.w), y = Math.floor(hash2(i, 2, 5) * 66), tw = 0.55 + 0.45 * Math.sin(t * (1.5 + hash2(i, 3, 5) * 2) + i * 7);
    const a = s.starVis * tw * (0.5 + hash2(i, 4, 5) * 0.5) * (1 - y / 120); if (a > 0.12 && bayer(x, y) < a * 1.4) { const v = 200 + 55 * a; fb.set(x, y, v, v, v * 0.94 + 12); if (i % 9 === 0 && a > 0.45) { fb.blend(x + 1, y, 255, 255, 235, 0.5); fb.blend(x - 1, y, 255, 255, 235, 0.5); fb.blend(x, y + 1, 255, 255, 235, 0.5); fb.blend(x, y - 1, 255, 255, 235, 0.5); } }
  }
  // sun
  if (s.sun.vis && s.alt > -6) {
    const warm = 1 - sstep(4, 26, s.alt), col: RGB = mix([255, 244, 205], [255, 170, 96], warm), vis = clamp((s.alt + 5) / 6);
    for (let y = -16; y <= 16; y++) for (let x = -16; x <= 16; x++) { const d = Math.sqrt(x * x + y * y); if (d > 5.5 && d < 16) { const al = (1 - (d - 5.5) / 10.5) * 0.55 * vis * (1 - s.dark * 0.5); if (bayer(s.sun.x + x, s.sun.y + y) < al) fb.blend(s.sun.x + x, s.sun.y + y, col[0], col[1], col[2], 0.5); } }
    for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++) if (x * x + y * y <= 22) fb.set(s.sun.x + x, s.sun.y + y, col[0], col[1], col[2] * (x * x + y * y > 15 ? 0.92 : 1));
  }
  // moon with real phase
  if (s.moon.vis && s.dark > 0.15) {
    const p = s.moon.phase, th = p * Math.PI * 2, cs = Math.cos(th), R = 5, a = s.dark;
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
      if (x * x + y * y > R * R + 1) continue; const w = Math.sqrt(Math.max(0, R * R - y * y));
      const lit = p < 0.5 ? x > cs * w : x < -cs * w;
      fb.blend(s.moon.x + x, s.moon.y + y, lit ? 244 : 60, lit ? 240 : 70, lit ? 214 : 110, lit ? a : a * 0.55);
    }
    for (let y = -10; y <= 10; y++) for (let x = -10; x <= 10; x++) { const d = x * x + y * y; if (d > 30 && d < 100 && bayer(s.moon.x + x, s.moon.y + y) < 0.08 * (1 - d / 100) * a) fb.blend(s.moon.x + x, s.moon.y + y, 235, 235, 255, 0.45); }
  }
}
