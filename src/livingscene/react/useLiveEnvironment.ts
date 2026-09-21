import { useCallback, useEffect, useRef, useState } from 'react';
import { CLEAR, WeatherTarget } from '../types';

export interface Place { lat: number; lon: number; label?: string }
export interface LiveEnv { lat: number; lon: number; weather: WeatherTarget; source: 'live' | 'cached' | 'fallback'; updatedAt: number | null; loading: boolean; error: string | null; place?: string; refresh: () => void }
const CACHE = 'livingscene:weather:v1', PLACE = 'livingscene:place:v1';
const c01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** WMO weather code (Open-Meteo) + cloud cover / wind → the 0..1 channels the scene eases toward. */
export function mapWeather(code: number, cloudPct: number, windKmh: number, tempC: number | null): WeatherTarget {
  let cloud = c01(cloudPct / 100), rain = 0, snow = 0, fog = 0, thunder = 0;
  const R: Record<number, number> = { 51: 0.2, 53: 0.35, 55: 0.5, 56: 0.4, 57: 0.55, 61: 0.4, 63: 0.65, 65: 0.9, 66: 0.6, 67: 0.85, 80: 0.4, 81: 0.65, 82: 0.9 };
  const S: Record<number, number> = { 71: 0.35, 73: 0.6, 75: 0.9, 77: 0.3, 85: 0.5, 86: 0.85 };
  if (code === 0) cloud = Math.min(cloud, 0.12); else if (code === 1) cloud = Math.min(cloud, 0.3); else if (code === 2) cloud = Math.min(Math.max(cloud, 0.35), 0.65); else if (code === 3) cloud = Math.max(cloud, 0.85);
  if (code === 45 || code === 48) { fog = 0.85; cloud = Math.max(cloud, 0.6); }
  if (R[code] !== undefined) rain = R[code]; if (S[code] !== undefined) snow = S[code];
  if (code === 95) { rain = 0.7; thunder = 1; } if (code === 96 || code === 99) { rain = 0.9; thunder = 1; }
  if (rain > 0 || snow > 0) cloud = Math.max(cloud, 0.75 + Math.max(rain, snow) * 0.2);
  return { cloud: c01(cloud), rain, snow, fog, thunder, wind: c01(windKmh / 45), tempC };
}
export function parseOpenMeteo(j: any): WeatherTarget { const c = j.current; return mapWeather(c.weather_code, c.cloud_cover ?? 30, c.wind_speed_10m ?? 5, c.temperature_2m ?? null); }
export async function fetchWeather(p: Place, signal?: AbortSignal): Promise<WeatherTarget> {
  const u = `https://api.open-meteo.com/v1/forecast?latitude=${p.lat.toFixed(3)}&longitude=${p.lon.toFixed(3)}&current=temperature_2m,weather_code,cloud_cover,wind_speed_10m,is_day&timezone=auto`;
  const r = await fetch(u, { signal }); if (!r.ok) throw new Error('weather ' + r.status); return parseOpenMeteo(await r.json());
}
/** city search (free geocoding) — use this as the fallback when the browser blocks geolocation */
export async function searchPlace(q: string): Promise<{ name: string; lat: number; lon: number; country?: string; region?: string }[]> {
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`); if (!r.ok) throw new Error('search ' + r.status);
  const j = await r.json(); return (j.results || []).map((x: any) => ({ name: x.name, lat: x.latitude, lon: x.longitude, country: x.country, region: x.admin1 }));
}
export function browserLocation(): Promise<Place> {
  return new Promise((res, rej) => { if (!navigator.geolocation) return rej(new Error('Geolocation is not available')); navigator.geolocation.getCurrentPosition(p => res({ lat: p.coords.latitude, lon: p.coords.longitude, label: 'My location' }), e => rej(new Error(e.message || 'Location blocked')), { timeout: 8000, maximumAge: 600000 }); });
}
export function loadPlace(): Place | null { try { const v = localStorage.getItem(PLACE); return v ? (JSON.parse(v) as Place) : null; } catch { return null; } }
export function savePlace(p: Place | null): void { try { if (p) localStorage.setItem(PLACE, JSON.stringify(p)); else localStorage.removeItem(PLACE); } catch { /* storage may be unavailable */ } }
/** a sensible default when nothing is known: derive longitude from the device time zone, mid latitude */
export function guessPlace(): Place { return { lat: 30, lon: -new Date().getTimezoneOffset() / 4, label: 'Approximate' }; }

/** Live weather for a place. Refreshes every N minutes and when the tab becomes visible; never throws — falls back to cache, then to clear skies. */
export function useLiveEnvironment(place: Place | null, refreshMinutes = 20): LiveEnv {
  const p = place || guessPlace();
  const [s, setS] = useState<{ weather: WeatherTarget; source: LiveEnv['source']; updatedAt: number | null; loading: boolean; error: string | null }>({ weather: CLEAR, source: 'fallback', updatedAt: null, loading: true, error: null });
  const key = p.lat.toFixed(2) + ',' + p.lon.toFixed(2), tick = useRef(0);
  const load = useCallback(async (force = false) => {
    let cached: { k: string; t: number; w: WeatherTarget } | null = null;
    try { const v = localStorage.getItem(CACHE); cached = v ? JSON.parse(v) : null; } catch { cached = null; }
    const fresh = cached && cached.k === key && Date.now() - cached.t < refreshMinutes * 60000;
    if (cached && cached.k === key && !s.updatedAt) setS(o => ({ ...o, weather: cached!.w, source: 'cached', updatedAt: cached!.t, loading: !fresh }));
    if (fresh && !force) return;
    const ac = new AbortController(), to = setTimeout(() => ac.abort(), 9000);
    try { const w = await fetchWeather(p, ac.signal); try { localStorage.setItem(CACHE, JSON.stringify({ k: key, t: Date.now(), w })); } catch { /* ignore */ } setS({ weather: w, source: 'live', updatedAt: Date.now(), loading: false, error: null }); }
    catch (e: any) { setS(o => ({ ...o, loading: false, error: e && e.message ? String(e.message) : 'weather unavailable', source: o.updatedAt ? 'cached' : 'fallback' })); }
    finally { clearTimeout(to); }
  }, [key, refreshMinutes]);
  useEffect(() => { load(); const id = setInterval(() => load(), refreshMinutes * 60000); const vis = () => { if (!document.hidden) load(); }; document.addEventListener('visibilitychange', vis); return () => { clearInterval(id); document.removeEventListener('visibilitychange', vis); }; }, [load, refreshMinutes]);
  return { lat: p.lat, lon: p.lon, place: p.label, refresh: () => { tick.current++; load(true); }, ...s };
}
