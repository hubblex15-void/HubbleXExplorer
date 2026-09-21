const RAD = Math.PI / 180;
const DAY = 86400000;
export function sunPos(ms: number, lat: number, lon: number): { alt: number; dec: number; H: number } {
  const n = ms / DAY + 2440587.5 - 2451545.0;
  const L = (((280.46 + 0.9856474 * n) % 360) + 360) % 360;
  const g = (((357.528 + 0.9856003 * n) % 360) + 360) % 360 * RAD;
  const lam = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD;
  const eps = (23.439 - 4e-7 * n) * RAD;
  const dec = Math.asin(Math.sin(eps) * Math.sin(lam));
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam));
  const gmst = ((((18.697374558 + 24.06570982441908 * n) % 24) + 24) % 24);
  let H = (gmst + lon / 15) * 15 * RAD - ra; H = Math.atan2(Math.sin(H), Math.cos(H));
  const phi = lat * RAD;
  const alt = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
  return { alt, dec, H };
}
/** sunrise / sunset / solar-noon (epoch ms) for the solar day containing `ms`. */
export function sunTimes(ms: number, lat: number, lon: number): { rise: number; set: number; noon: number } {
  const off = (lon / 15) * 3600000;
  const dayStart = Math.floor((ms + off) / DAY) * DAY - off;
  let noon = dayStart + 12 * 3600000;
  for (let i = 0; i < 3; i++) { const p = sunPos(noon, lat, lon); noon -= (p.H / (2 * Math.PI)) * DAY; }
  const p = sunPos(noon, lat, lon);
  const c = (Math.sin(-0.833 * RAD) - Math.sin(lat * RAD) * Math.sin(p.dec)) / (Math.cos(lat * RAD) * Math.cos(p.dec));
  if (c <= -1) return { rise: noon - 12 * 3600000, set: noon + 12 * 3600000, noon };
  if (c >= 1) return { rise: noon, set: noon, noon };
  const half = (Math.acos(c) / (2 * Math.PI)) * DAY;
  return { rise: noon - half, set: noon + half, noon };
}
const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
/** 0 = new, 0.5 = full */
export const moonPhase = (ms: number): number => ((((ms - NEW_MOON) / DAY) / 29.530588853) % 1 + 1) % 1;
