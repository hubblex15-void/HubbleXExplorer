import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { LivingScene } from '../engine';
import type { CollectEvent, MotionMode, Progress, ResourceKind, SceneState, SeasonName, WeatherTarget } from '../types';
import type { OutfitOverride } from '../character';
import { SceneClock } from './SceneClock';
import type { LiveEnv } from './useLiveEnvironment';

export interface SceneHandle { grant(kind: ResourceKind, n?: number): void; celebrate(kind: 'levelUp' | 'streak' | 'goal' | 'quest'): void; play(activityId: string): boolean; engine(): LivingScene }
export interface LivingSceneViewProps {
  env?: Pick<LiveEnv, 'lat' | 'lon' | 'weather'> | null; progress?: Partial<Progress>; season?: 'auto' | SeasonName; outfit?: OutfitOverride; motion?: MotionMode; seed?: number;
  onCollect?: (e: CollectEvent) => void; onActivity?: (id: string) => void; onState?: (s: SceneState) => void; showClock?: boolean; use24h?: boolean; aspect?: string;
  timeSource?: () => number; className?: string; style?: CSSProperties; children?: ReactNode;
}
/** Drop-in canvas for Base Camp. Pixel-perfect, pauses when the tab is hidden, adapts its frame rate on slow phones. */
export const LivingSceneView = forwardRef<SceneHandle, LivingSceneViewProps>(function LivingSceneView(props, ref) {
  const { env, progress, season = 'auto', outfit, motion = 'full', seed = 7, showClock = true, use24h, aspect = '20 / 9', timeSource, className, style, children } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null), engRef = useRef<LivingScene | null>(null), cb = useRef(props); cb.current = props;
  const [state, setState] = useState<SceneState | null>(null);
  if (!engRef.current) engRef.current = new LivingScene({ lat: env ? env.lat : undefined, lon: env ? env.lon : undefined, seed, season });
  const eng = engRef.current;
  useImperativeHandle(ref, (): SceneHandle => ({ grant: (k: ResourceKind, n = 1) => eng.grant(k, n), celebrate: (k: 'levelUp' | 'streak' | 'goal' | 'quest') => eng.celebrate(k), play: (id: string) => eng.play(id), engine: () => eng }), [eng]);
  useEffect(() => { eng.onCollect = (e: CollectEvent) => { if (cb.current.onCollect) cb.current.onCollect(e); }; eng.onActivity = (id: string) => { if (cb.current.onActivity) cb.current.onActivity(id); }; }, [eng]);
  useEffect(() => { if (env) { eng.setLocation(env.lat, env.lon); eng.setWeather(env.weather as WeatherTarget); } }, [eng, env && env.lat, env && env.lon, env && env.weather]);
  useEffect(() => { eng.setSeason(season); }, [eng, season]);
  useEffect(() => { if (progress) eng.setProgress(progress); }, [eng, JSON.stringify(progress || {})]);
  useEffect(() => { eng.setOutfit(outfit || {}); }, [eng, JSON.stringify(outfit || {})]);
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return; const g = cv.getContext('2d'); if (!g) return;
    const img = new ImageData(eng.hi.data as any, eng.hi.w, eng.hi.h), reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let fps = motion === 'off' || (reduce && motion !== 'full') ? 0.05 : motion === 'calm' ? 8 : reduce ? 0.05 : 12, last = 0, avg = 16, raf = 0, stop = false;
    const frame = (ts: number) => {
      if (stop) return; raf = requestAnimationFrame(frame); if (document.hidden || ts - last < 1000 / fps) return; last = ts;
      const t0 = performance.now(); eng.step(timeSource ? timeSource() : Date.now()); eng.render(); g.putImageData(img, 0, 0);
      avg = avg * 0.92 + (performance.now() - t0) * 0.08; if (motion === 'full' && avg > 45 && fps > 6) fps -= 1;
    };
    raf = requestAnimationFrame(frame);
    const id = setInterval(() => { const s = eng.state(); setState(s); cb.current.onState && cb.current.onState(s); }, 1000);
    return () => { stop = true; cancelAnimationFrame(raf); clearInterval(id); };
  }, [eng, motion, timeSource]);
  return (
    <div className={className} style={{ position: 'relative', width: '100%', aspectRatio: aspect, overflow: 'hidden', background: '#1b1f3b', ...style }}>
      <canvas ref={canvasRef} width={eng.hi.w} height={eng.hi.h} aria-label="Cozy cabin scene that follows the real time and weather" role="img" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 100%', imageRendering: 'pixelated' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {showClock && <SceneClock weather={env ? (env.weather as WeatherTarget) : undefined} phase={state ? state.phase : undefined} use24h={use24h} style={{ position: 'absolute', top: 8, left: 8, pointerEvents: 'auto' }} />}
        {children}
      </div>
    </div>
  );
});
