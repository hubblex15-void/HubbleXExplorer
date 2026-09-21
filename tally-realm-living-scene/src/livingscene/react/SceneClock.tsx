import React, { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { WeatherTarget } from '../types';
import { phaseLabel } from '../phase';

const ICONS: Record<string, string[]> = {
  sun: ['....y....', '.y..y..y.', '..yyyyy..', '.yyyyyyy.', 'yyyyyyyyy', '.yyyyyyy.', '..yyyyy..', '.y..y..y.', '....y....'],
  moon: ['..bbbb...', '.bbbb....', 'bbbb.....', 'bbbb.....', 'bbbb.....', 'bbbb.....', '.bbbb....', '..bbbb.b.', '....bbb..'],
  cloud: ['.........', '..ggg....', '.ggggg.gg', 'ggggggggg', 'ggggggggg', '.ggggggg.', '.........', '.........', '.........'],
  part: ['.y.......', 'yy.ggg...', '.y.ggggg.', '..ggggggg', '..ggggggg', '...ggggg.', '.........', '.........', '.........'],
  rain: ['..ggg....', '.ggggg.gg', 'ggggggggg', '.ggggggg.', '.........', '.u..u..u.', '..u..u...', '.u..u..u.', '.........'],
  storm: ['..ddd....', '.ddddd.dd', 'ddddddddd', '.ddddddd.', '....y....', '...yy....', '..yyyy...', '....yy...', '.....y...'],
  snow: ['..ggg....', '.ggggg.gg', 'ggggggggg', '.ggggggg.', '.........', '.w..w..w.', '..w..w...', '.w..w..w.', '.........'],
  fog: ['.........', 'ggggggggg', '.........', '.ggggggg.', '.........', 'ggggggggg', '.........', '.ggggggg.', '.........'],
};
const COL: Record<string, string> = { y: '#f2c94c', b: '#f6ead2', g: '#d9e2ec', d: '#8f9bb0', u: '#7fb6e6', w: '#ffffff' };
export function WeatherIcon({ weather, night, size = 26 }: { weather?: WeatherTarget; night?: boolean; size?: number }) {
  const w = weather; let k = night ? 'moon' : 'sun';
  if (w) { if (w.thunder > 0.4) k = 'storm'; else if (w.snow > 0.2) k = 'snow'; else if (w.rain > 0.2) k = 'rain'; else if (w.fog > 0.4) k = 'fog'; else if (w.cloud > 0.65) k = 'cloud'; else if (w.cloud > 0.3 && !night) k = 'part'; }
  const rows = ICONS[k], s = size / 9;
  return <svg width={size} height={size} viewBox="0 0 9 9" shapeRendering="crispEdges" role="img" aria-label={k}>{rows.map((r, y) => r.split('').map((c, x) => (c === '.' ? null : <rect key={x + '-' + y} x={x} y={y} width={1} height={1} fill={COL[c]} />)))}</svg>;
}
export { phaseLabel };
export interface SceneClockProps { weather?: WeatherTarget; phase?: string; compact?: boolean; use24h?: boolean; className?: string; style?: CSSProperties; locale?: string }
/** live date + time (+ weather, temperature and time-of-day) as a little wooden sign. Style it with your own CSS variables. */
export function SceneClock({ weather, phase, compact, use24h, className, style, locale }: SceneClockProps) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  const time = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', hour12: use24h === undefined ? undefined : !use24h }).format(now);
  const date = new Intl.DateTimeFormat(locale, compact ? { weekday: 'short', day: 'numeric', month: 'short' } : { weekday: 'long', day: 'numeric', month: 'long' }).format(now);
  const night = phase === 'sleep' || phase === 'evening', temp = weather && weather.tempC !== null && weather.tempC !== undefined ? Math.round(weather.tempC) + '°' : '';
  const box: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 10, padding: compact ? '4px 8px' : '8px 12px', background: 'var(--clock-bg, rgba(59,42,32,.82))', color: 'var(--clock-fg, #f6e9d2)', border: '3px solid var(--clock-border, #b87b4b)', boxShadow: '0 3px 0 rgba(0,0,0,.35)', fontFamily: "var(--font-heading, 'Pixelify Sans', ui-monospace, monospace)", lineHeight: 1.1, ...style };
  return (
    <div className={className} style={box} role="timer" aria-live="off" aria-label={`${date}, ${time}`}>
      <WeatherIcon weather={weather} night={night} size={compact ? 20 : 28} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: compact ? 15 : 22, fontWeight: 700, letterSpacing: 0.5 }}>{time}</span>
        <span style={{ fontSize: compact ? 11 : 13, opacity: 0.85 }}>{date}</span>
        {!compact && <span style={{ fontSize: 11, opacity: 0.7 }}>{phaseLabel(phase, now.getHours())}{temp ? ' · ' + temp : ''}</span>}
      </div>
    </div>
  );
}
