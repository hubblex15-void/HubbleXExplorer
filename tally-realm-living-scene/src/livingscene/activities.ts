import { Actor, Step, Target } from './actor';
import { Runtime } from './runtime';
import { LAYOUT } from './world';
import { clamp } from './util';
import type { SeasonName } from './types';

export type Phase = 'sleep' | 'dawn' | 'day' | 'dusk' | 'evening';
export interface Ctx { phase: Phase; hour: number; season: SeasonName; sw: Record<SeasonName, number>; rain: number; snow: number; fog: number; thunder: number; wind: number; cloud: number; temp: number | null; snowCover: number; wet: number; dark: number; fire: number; streak: number; }
/** time-of-day phase from real sun altitude (deg) + local clock hour. Bedtime is 23:00. */
export const phaseOf = (alt: number, hour: number, bed = 23): Phase => { if (hour >= bed) return 'sleep'; if (hour < 12) return alt < -4 ? 'sleep' : alt < 8 ? 'dawn' : 'day'; return alt >= 8 ? 'day' : alt >= -6 ? 'dusk' : 'evening'; };
export interface Act { id: string; cat: string; w: number; cd?: number; when: (c: Ctx, R: Runtime) => number; build: (c: Ctx, R: Runtime, r: () => number) => Step[]; }
type Dir = 1 | -1;
const go = (to: Target, o: { run?: boolean; m?: string; prop?: string } = {}): Step => ({ k: 'go', to, ...o });
const dm = (m: string, t: number, o: { dir?: Dir; prop?: string } = {}): Step => ({ k: 'do', m, t, ...o });
const wt = (t: number, o: { m?: string; dir?: Dir; prop?: string } = {}): Step => ({ k: 'wait', t, ...o });
const fx = (name: string, dx = 0, dy = 0): Step => ({ k: 'fx', name, dx, dy });
const st = (fn: (r: Runtime) => void): Step => ({ k: 'set', fn });
const col = (kind: string, n: number): Step => ({ k: 'collect', kind, n });
const IN: Step = { k: 'in' }, OUT: Step = { k: 'out' };
const stay = (t: number, until?: () => boolean): Step => ({ k: 'stay', t, until });
const rr = (r: () => number, a: number, b: number) => a + (b - a) * r();
const pt = (r: () => number, x0: number, x1: number, y0 = 128, y1 = 141): Target => [x0 + (x1 - x0) * r(), y0 + (y1 - y0) * r()];
const dry = (c: Ctx) => clamp(1 - c.rain * 2.6 - c.thunder), dayish = (c: Ctx) => (c.phase === 'dawn' || c.phase === 'day' ? 1 : 0), day = (c: Ctx) => (c.phase === 'day' ? 1 : 0), dawn = (c: Ctx) => (c.phase === 'dawn' ? 1 : 0), dusk = (c: Ctx) => (c.phase === 'dusk' ? 1 : 0);
const nightish = (c: Ctx) => (c.phase === 'dusk' || c.phase === 'evening' ? 1 : 0), eve = (c: Ctx) => (c.phase === 'evening' ? 1 : 0), clearSky = (c: Ctx) => clamp(1 - c.cloud * 1.2);
const seat = (r: () => number): [Target, Dir] => (r() < 0.5 ? ['fireL', 1] : ['fireR', -1]);
const fireOn = (c: Ctx, R: Runtime) => (R.fire > 0.3 && c.fire > 0.3 ? 1 : 0);
const cold = (c: Ctx) => (c.temp !== null && c.temp < 8 ? 1 : c.sw.winter);

export const ACTS: Act[] = [
  // ---------- daytime chores & hobbies (any season) ----------
  { id: 'sweepPorch', cat: 'chore', w: 4, when: c => dayish(c) * dry(c), build: (c, R, r) => [go('porchL'), dm('sweep', rr(r, 6, 9), { dir: 1 }), go('porchR'), dm('sweep', rr(r, 5, 7), { dir: -1 })] },
  { id: 'chopWood', cat: 'wood', w: 4.5, when: c => dayish(c) * dry(c), build: (c, R, r) => [go('chop'), dm('chop', rr(r, 8, 13), { dir: 1 }), st(R => { R.logs += 2; }), go('wood', { m: 'carry' }), dm('pick', 1.2, { dir: 1, prop: 'log' })] },
  { id: 'stackLogs', cat: 'wood', w: 2, when: c => dayish(c) * dry(c), build: () => [go('block'), dm('pick', 1.2, { dir: 1, prop: 'log' }), go('wood', { m: 'carry' }), dm('pick', 1.2, { dir: 1, prop: 'log' }), go('block'), dm('pick', 1.2, { dir: 1, prop: 'log' }), go('wood', { m: 'carry' })] },
  { id: 'waterGarden', cat: 'garden', w: 3, when: c => dayish(c) * dry(c) * (1 - 0.9 * c.sw.winter), build: (c, R, r) => [go('garden'), dm('water', rr(r, 6, 9), { dir: 1 })] },
  { id: 'readBench', cat: 'rest', w: 3, when: c => dayish(c) * dry(c), build: (c, R, r) => [go('bench'), dm('sitRead', rr(r, 14, 26), { dir: 1 })] },
  { id: 'stretchYawn', cat: 'idle', w: 2, when: c => dayish(c) * (1 + dawn(c)), build: () => [wt(0.8, { m: 'idleFront' }), dm('stretch', 3.2, { dir: 1 })] },
  { id: 'waveHello', cat: 'idle', w: 2, when: c => dayish(c), build: () => [dm('wave', 2.6, { dir: 1 })] },
  { id: 'skyGaze', cat: 'idle', w: 2.2, when: c => dayish(c) * clearSky(c) * dry(c), build: (c, R, r) => [dm(r() < 0.5 ? 'lookUp' : 'shade', 5, { dir: 1 })] },
  { id: 'sketchScene', cat: 'art', w: 2, when: c => dayish(c) * dry(c), build: (c, R, r) => [go('easel'), st(R => { R.easel = true; }), dm('sketch', rr(r, 14, 22), { dir: 1 }), st(R => { R.easel = false; })] },
  { id: 'guitarPorch', cat: 'music', w: 2, when: c => (dayish(c) + dusk(c)) * dry(c), build: (c, R, r) => [go('chair'), dm('sitStrum', rr(r, 16, 26), { dir: 1 })] },
  { id: 'sharpenAxe', cat: 'wood', w: 1, when: c => dayish(c) * dry(c), build: () => [go('chop'), dm('sharpen', 8, { dir: 1 })] },
  { id: 'fixFence', cat: 'chore', w: 1.5, when: c => dayish(c) * dry(c), build: () => [go('garden'), dm('hammer', 8, { dir: 1 })] },
  { id: 'hangLaundry', cat: 'chore', w: 2, when: (c, R) => dayish(c) * dry(c) * (R.laundry ? 0 : 1) * (1 - c.wind * 0.6), build: (c, R, r) => [go('laundry'), dm('hang', rr(r, 5, 8), { dir: 1 }), st(R => { R.laundry = true; })] },
  { id: 'takeLaundry', cat: 'chore', w: 3, cd: 300, when: (c, R) => (R.laundry ? (dayish(c) + dusk(c)) * (1 + c.rain * 4) : 0), build: () => [go('laundry'), dm('hang', 5, { dir: 1 }), st(R => { R.laundry = false; })] },
  { id: 'feedBirds', cat: 'nature', w: 1.5, when: c => dayish(c) * dry(c), build: (c, R, r) => [go(pt(r, 100, 150, 133, 140)), dm('feed', 1.2, { dir: 1 }), dm('feed', 1.2, { dir: 1 }), dm('feed', 1.2, { dir: 1 })] },
  { id: 'teaPorch', cat: 'rest', w: 3, when: c => (dayish(c) + dusk(c)) * dry(c), build: (c, R, r) => [go('chair'), dm('sitDrink', rr(r, 16, 26), { dir: 1 })] },
  { id: 'checkMap', cat: 'idle', w: 1.5, when: c => dayish(c) * dry(c), build: (c, R, r) => [wt(0.4), dm('readMap', 8, { dir: r() < 0.5 ? 1 : -1 })] },
  { id: 'journalPorch', cat: 'rest', w: 2, when: c => (dayish(c) + dusk(c)) * dry(c), build: (c, R, r) => [go('chair'), dm('sitWrite', rr(r, 14, 22), { dir: 1 })] },
  { id: 'checkMail', cat: 'chore', w: 1.5, when: c => dayish(c) * dry(c), build: () => [go('mail'), dm('doorOpen', 0.9, { dir: 1 }), dm('readMap', 4, { dir: 1, prop: 'letter' }), fx('heart')] },
  { id: 'goInside', cat: 'inside', w: 1.1, cd: 420, when: c => dayish(c) + dusk(c) * 0.6, build: (c, R, r) => [IN, stay(rr(r, 30, 90)), OUT] },
  { id: 'cozyInside', cat: 'inside', w: 5, cd: 240, when: (c, R) => (c.phase === 'evening' || c.phase === 'dusk') && R.fire < 0.3 ? 1 : 0, build: (c, R, r) => [IN, stay(rr(r, 60, 180)), OUT] },
  { id: 'patrol', cat: 'walk', w: 3, when: c => dayish(c) * dry(c), build: (c, R, r) => [go(pt(r, 30, 250)), wt(1.5), go(pt(r, 30, 250)), wt(1.2, { m: 'idleFront' }), go(pt(r, 30, 250))] },
  { id: 'jog', cat: 'walk', w: 1, when: c => dayish(c) * dry(c), build: (c, R, r) => [go(pt(r, 20, 120), { run: true }), go(pt(r, 150, 250), { run: true }), go(pt(r, 20, 120), { run: true }), wt(1.4, { m: 'shade' })] },
  { id: 'exercise', cat: 'fit', w: 1.5, when: c => dayish(c) * dry(c) * (1 - c.sw.summer * 0.3), build: (c, R, r) => [go(pt(r, 120, 200, 134, 140)), dm('cheer', 5, { dir: 1 })] },
  // ---------- spring ----------
  { id: 'plantSeeds', cat: 'garden', w: 3, when: c => dayish(c) * dry(c) * c.sw.spring, build: () => [go('garden'), dm('kneel', 6, { dir: 1 }), dm('water', 4, { dir: 1 })] },
  { id: 'pickFlowers', cat: 'nature', w: 3, when: c => dayish(c) * dry(c) * (c.sw.spring + c.sw.summer * 0.6), build: () => [go('herbs'), dm('pick', 1.6, { dir: 1, prop: 'flower' }), dm('pick', 1.6, { dir: 1, prop: 'flower' }), dm('hug', 3, { dir: 1, prop: 'flower' }), fx('heart')] },
  { id: 'chaseButterfly', cat: 'fun', w: 2, when: c => day(c) * dry(c) * (c.sw.spring + c.sw.summer * 0.7), build: (c, R, r) => [go(pt(r, 60, 240), { run: true }), go(pt(r, 60, 240), { run: true }), go(pt(r, 60, 240), { run: true }), wt(1.6, { m: 'idleFront' }), fx('heart')] },
  // ---------- summer ----------
  { id: 'coolOff', cat: 'rest', w: 3, when: c => dayish(c) * dry(c) * (c.sw.summer + (c.temp !== null && c.temp > 28 ? 1 : 0)), build: (c, R, r) => [dm('shade', 3, { dir: 1 }), fx('sweat'), go('chair'), dm('sitDrink', rr(r, 12, 18), { dir: 1, prop: 'glass' })] },
  { id: 'napTree', cat: 'rest', w: 2, when: c => day(c) * dry(c) * c.sw.summer, build: (c, R, r) => [go('bench'), dm('sitSleep', rr(r, 18, 26), { dir: 1 })] },
  { id: 'catchFireflies', cat: 'nature', w: 3, when: c => dusk(c) * dry(c) * (c.sw.summer + c.sw.spring * 0.5 + c.sw.autumn * 0.3), build: (c, R, r) => [go(pt(r, 90, 200)), dm('sweep', 5, { dir: 1, prop: 'net' }), dm('hug', 4, { dir: 1, prop: 'jar' }), fx('star')] },
  // ---------- autumn ----------
  { id: 'rakeLeaves', cat: 'garden', w: 4, when: c => dayish(c) * dry(c) * c.sw.autumn, build: (c, R, r) => [go('leaves'), dm('rake', 10, { dir: 1 }), st(R => { R.leafPile = Math.min(3, R.leafPile + 1); })] },
  { id: 'jumpInLeaves', cat: 'fun', w: 2, when: (c, R) => dayish(c) * dry(c) * c.sw.autumn * (R.leafPile > 0 ? 1 : 0.3), build: () => [go([104, 138], { run: true }), go('leaves', { run: true }), dm('cheer', 1.6, { dir: 1 }), fx('leaves')] },
  { id: 'harvestPumpkin', cat: 'garden', w: 3, when: c => dayish(c) * dry(c) * c.sw.autumn, build: () => [go('garden'), dm('pick', 1.6, { dir: 1, prop: 'pumpkin' }), go('porchR', { m: 'carry', prop: 'pumpkin' }), dm('pick', 1, { dir: 1, prop: 'pumpkin' }), st(R => { R.pumpkin = true; })] },
  { id: 'pickApples', cat: 'nature', w: 2, when: c => dayish(c) * dry(c) * c.sw.autumn, build: () => [go('tree'), dm('lookUp', 1.5, { dir: 1 }), dm('pick', 1.6, { dir: 1, prop: 'apple' }), dm('hug', 3, { dir: 1, prop: 'apple' })] },
  { id: 'carveLantern', cat: 'art', w: 1.5, when: c => (dayish(c) + dusk(c)) * dry(c) * c.sw.autumn, build: (c, R, r) => [go('chair'), dm('sitWrite', 12, { dir: 1, prop: 'pumpkin' }), st(R => { R.pumpkin = true; })] },
  // ---------- winter ----------
  { id: 'shovelSnow', cat: 'chore', w: 4, when: c => dayish(c) * (c.snowCover > 0.25 ? 1 : 0), build: () => [go([110, 133]), dm('shovelSnow', 10, { dir: 1 })] },
  { id: 'buildSnowman', cat: 'fun', w: 3, when: (c, R) => dayish(c) * (c.snowCover > 0.35 ? 1 : 0) * (R.snowman >= 2 ? 0.2 : 1), build: () => [go('snow'), dm('kneel', 6, { dir: 1 }), st(R => { R.snowman = Math.min(3, R.snowman + 1); }), fx('heart')] },
  { id: 'snowballs', cat: 'fun', w: 2, when: c => dayish(c) * (c.snowCover > 0.3 ? 1 : 0), build: () => [go('snow'), dm('throw', 1, { dir: -1 }), dm('throw', 1, { dir: -1 }), dm('throw', 1, { dir: -1 })] },
  { id: 'warmUp', cat: 'idle', w: 3, when: c => dayish(c) * cold(c), build: (c, R, r) => [dm('shiver', 3, { dir: 1 }), dm('warmRub', 4, { dir: 1 }), IN, stay(rr(r, 15, 30)), OUT] },
  { id: 'hangLights', cat: 'chore', w: 2, when: (c, R) => dusk(c) * c.sw.winter * (R.lights ? 0 : 1), build: () => [go('porchL'), dm('hang', 4, { dir: 1 }), st(R => { R.lights = true; })] },
  { id: 'firewoodIn', cat: 'wood', w: 2, when: c => dayish(c) * c.sw.winter, build: () => [go('wood'), dm('pick', 1.2, { dir: 1, prop: 'log' }), go('door', { m: 'carry' }), IN, stay(6), OUT] },
  { id: 'catchSnowflakes', cat: 'fun', w: 4, when: c => (c.snow > 0.2 ? dayish(c) + dusk(c) : 0), build: () => [dm('snowCatch', 8, { dir: 1 })] },
  // ---------- weather ----------
  { id: 'umbrellaWalk', cat: 'walk', w: 4, cd: 90, when: c => (c.rain > 0.2 && c.rain < 0.85 && c.thunder < 0.3 ? dayish(c) + nightish(c) * 0.5 : 0), build: (c, R, r) => [go(pt(r, 40, 240), { m: 'umbrellaWalk' }), wt(1.8, { m: 'umbrellaHold' }), go(pt(r, 40, 240), { m: 'umbrellaWalk' }), wt(1.5, { m: 'umbrellaHold' }), go('door', { m: 'umbrellaWalk' })] },
  { id: 'shelterPorch', cat: 'rest', w: 6, cd: 60, when: c => (c.rain > 0.4 ? dayish(c) + nightish(c) : 0), build: (c, R, r) => [go('door'), dm('hug', rr(r, 14, 22), { dir: 1 }), dm('lookUp', 3, { dir: 1 })] },
  { id: 'puddleSplash', cat: 'fun', w: 3, when: c => ((c.rain > 0.1 && c.rain < 0.55) || (c.wet > 0.4 && c.rain < 0.2) ? dayish(c) : 0), build: (c, R, r) => [go(pt(r, 60, 240, 130, 141)), dm('puddle', 4)] },
  { id: 'catchRain', cat: 'fun', w: 2, when: c => (c.rain > 0.1 && c.rain < 0.4 ? dayish(c) : 0), build: () => [dm('snowCatch', 6, { dir: 1 })] },
  { id: 'stormInside', cat: 'inside', w: 7, cd: 60, when: c => (c.thunder > 0.3 || c.rain > 0.8 ? 1 : 0), build: (c, R, r) => [IN, stay(rr(r, 40, 90)), OUT] },
  { id: 'fogLantern', cat: 'walk', w: 3, when: c => (c.fog > 0.4 ? dayish(c) + nightish(c) : 0), build: (c, R, r) => [go(pt(r, 40, 240), { m: 'lanternWalk' }), wt(1.2, { m: 'lanternHold' }), go(pt(r, 40, 240), { m: 'lanternWalk' }), wt(1.2, { m: 'lanternHold' })] },
  // ---------- dawn ----------
  { id: 'sunriseTea', cat: 'rest', w: 3, when: c => dawn(c) * dry(c), build: () => [go('chair'), dm('sitDrink', 20, { dir: 1 })] },
  { id: 'morningWash', cat: 'chore', w: 2, when: c => dawn(c) * dry(c), build: () => [go('porchR'), dm('pick', 1.6, { dir: 1 }), fx('splash'), dm('wave', 2, { dir: 1 })] },
  // ---------- dusk / evening / night ----------
  { id: 'lightFire', cat: 'fire', w: 12, when: (c, R) => ((c.phase === 'dusk' && c.dark > 0.35) || c.phase === 'evening') && R.fire < 0.15 && c.fire < 0.15 && dry(c) > 0.3 ? 1 : 0, build: (c, R, r) => [go('wood'), dm('pick', 1.2, { dir: -1, prop: 'log' }), go('fireCook', { m: 'carry' }), dm('kneel', rr(r, 4, 6), { dir: 1 }), fx('sparks'), st(R => { R.fire = 1; }), wt(1.2, { m: 'idleFront' })] },
  { id: 'sitByFire', cat: 'fire', w: 6, when: (c, R) => fireOn(c, R) * nightish(c), build: (c, R, r) => { const [s, d] = seat(r); return [go(s), dm('sitWarm', rr(r, 14, 28), { dir: d })]; } },
  { id: 'cookStew', cat: 'cook', w: 3, when: (c, R) => fireOn(c, R) * nightish(c), build: (c, R, r) => { const [s, d] = seat(r); return [go('fireCook'), dm('stir', rr(r, 8, 11), { dir: 1 }), dm('taste', 2.2, { dir: 1 }), go(s), dm('sitEat', 10, { dir: d })]; } },
  { id: 'roastSkewer', cat: 'cook', w: 3, when: (c, R) => fireOn(c, R) * nightish(c), build: (c, R, r) => { const [s, d] = seat(r); return [go(s), dm('sitRoast', rr(r, 12, 16), { dir: d }), dm('sitEat', 5, { dir: d, prop: 'fish' })]; } },
  { id: 'brewTea', cat: 'cook', w: 2.5, when: (c, R) => fireOn(c, R) * nightish(c), build: (c, R, r) => { const [s, d] = seat(r); return [go(s), dm('sitDrink', rr(r, 16, 24), { dir: d })]; } },
  { id: 'strumByFire', cat: 'music', w: 2.5, when: (c, R) => fireOn(c, R) * nightish(c), build: (c, R, r) => { const [s, d] = seat(r); return [go(s), dm('sitStrum', rr(r, 18, 30), { dir: d })]; } },
  { id: 'stargaze', cat: 'rest', w: 3, when: (c, R) => fireOn(c, R) * eve(c) * clearSky(c), build: (c, R, r) => { const [s, d] = seat(r); return [go(s), dm('lookUp', rr(r, 10, 16), { dir: d }), fx('star', 0, -8)]; } },
  { id: 'readByFire', cat: 'rest', w: 2.5, when: (c, R) => fireOn(c, R) * nightish(c), build: (c, R, r) => { const [s, d] = seat(r); return [go(s), dm('sitRead', rr(r, 18, 30), { dir: d })]; } },
  { id: 'journalByFire', cat: 'rest', w: 2, when: (c, R) => fireOn(c, R) * nightish(c), build: (c, R, r) => { const [s, d] = seat(r); return [go(s), dm('sitWrite', rr(r, 14, 24), { dir: d })]; } },
  { id: 'stokeFire', cat: 'fire', w: 3, when: (c, R) => fireOn(c, R) * nightish(c), build: (c, R, r) => { const [s, d] = seat(r); return [go('wood'), dm('pick', 1.2, { dir: -1, prop: 'log' }), go('fireCook', { m: 'carry' }), dm('throw', 0.9, { dir: 1, prop: 'log' }), fx('sparks'), go(s), dm('sitPoke', 5, { dir: d })]; } },
  { id: 'dozeByFire', cat: 'rest', w: 2, when: (c, R) => fireOn(c, R) * eve(c) * (c.hour > 21 ? 1 : 0.2), build: (c, R, r) => { const [s, d] = seat(r); return [go(s), dm('sitSleep', rr(r, 16, 24), { dir: d }), dm('stretch', 3, { dir: 1 })]; } },
];
const ID: Record<string, Act> = {}; for (const a of ACTS) ID[a.id] = a;

/** rewards → the traveller physically goes and collects the resource */
export function gatherSteps(kind: string, n: number, r: () => number, night: boolean): Step[] {
  const bush: Target = r() < 0.5 ? [28, 127] : [166, 127];
  switch (kind) {
    case 'wood': return [go('chop'), dm('chop', rr(r, 5, 7), { dir: 1 }), col('wood', n)];
    case 'stone': return [go([20, 134]), dm('mine', rr(r, 5, 7), { dir: -1 }), col('stone', n)];
    case 'berry': return [go(bush), dm('pick', 1.6, { dir: bush[0] < 100 ? -1 : 1, prop: 'berries' }), dm('pick', 1.6, { dir: bush[0] < 100 ? -1 : 1, prop: 'berries' }), col('berry', n)];
    case 'herb': return [go('herbs'), dm('pick', 1.6, { dir: 1, prop: 'flower' }), dm('pick', 1.6, { dir: 1, prop: 'flower' }), col('herb', n)];
    case 'mushroom': return [go([32, 130]), dm('pick', 1.8, { dir: -1 }), col('mushroom', n)];
    case 'fish': return [go('dock'), dm('fishWait', rr(r, 4, 7), { dir: 1 }), dm('fishReel', 2, { dir: 1 }), col('fish', n)];
    case 'gem': return [go(night ? [150, 139] : [112, 140]), dm('dig', 5.5, { dir: 1 }), fx('sparks'), col('gem', n)];
    default: { const [s, d] = seat(r); return [go(s), dm('lookUp', 5, { dir: d }), fx('star', 0, -8), col('star', n)]; }
  }
}
export class Director {
  recent: string[] = []; cool: Record<string, number> = {}; pending: { kind: string; n: number }[] = []; now = 0; phase: Phase = 'day'; last = ''; counts: Record<string, number> = {};
  constructor(public A: Actor, public R: Runtime, public rnd: () => number) {}
  grant(kind: string, n = 1): void { this.pending.push({ kind, n }); }
  /** call once at start so a late-night open shows the traveller asleep indoors */
  init(c: Ctx): void { this.phase = c.phase; if (c.phase === 'sleep') { this.A.inside = true; this.A.alpha = 0; this.R.sleeping = true; this.A.queue([stay(1e9, () => this.phase !== 'sleep')], 'sleeping'); } }
  update(dt: number, c: Ctx): void {
    this.now += dt; this.phase = c.phase; if (this.A.busy()) return;
    const p = this.choose(c); this.A.queue(p.steps, p.id); this.last = p.id; this.recent.push(p.id); if (this.recent.length > 8) this.recent.shift(); this.counts[p.id] = (this.counts[p.id] || 0) + 1;
  }
  private choose(c: Ctx): { id: string; steps: Step[] } {
    const R = this.R, r = this.rnd;
    if (c.phase === 'sleep' && !R.sleeping) { const bed: Step[] = R.occupied ? [] : [go('fireCook'), dm('kneel', 4, { dir: 1 }), st(R => { R.fire = 0.12; }), fx('sparks'), go('door'), IN]; return { id: 'bedtime', steps: [...bed, st(R => { R.sleeping = true; }), stay(1e9, () => this.phase !== 'sleep')] }; }
    if (R.sleeping && c.phase !== 'sleep') return { id: 'wakeUp', steps: [OUT, st(R => { R.sleeping = false; R.fire = 0; }), dm('stretch', 3.2, { dir: 1 }), dm('shade', 4, { dir: 1 }), dm('wave', 2, { dir: 1 })] };
    if (this.pending.length && !R.sleeping) { const q = this.pending.shift()!; return { id: 'gather:' + q.kind, steps: gatherSteps(q.kind, q.n, r, c.dark > 0.5) }; }
    let tot = 0; const ws = ACTS.map(a => { let w = a.w * a.when(c, R); if (w <= 0) return 0; if ((this.cool[a.id] || 0) > this.now) return 0; const i = this.recent.lastIndexOf(a.id); if (i >= 0) w *= 0.12; if (this.recent.length && ID[this.recent[this.recent.length - 1]]?.cat === a.cat) w *= 0.45; tot += w; return w; });
    if (tot <= 0) return { id: 'idleWait', steps: c.rain > 0.3 || c.thunder > 0.2 ? [go('door'), wt(rr(r, 3, 6), { m: 'hug' })] : [wt(rr(r, 2, 4), { m: 'idleFront' })] };
    let x = r() * tot, k = 0; while (k < ws.length - 1 && (x -= ws[k]) > 0) k++;
    const a = ACTS[k]; this.cool[a.id] = this.now + (a.cd ?? 150); const steps = a.build(c, R, r); if (a.cat !== 'inside' && r() < 0.7) steps.push(wt(rr(r, 1.5, 6), { m: r() < 0.6 ? 'idle' : 'idleFront' })); return { id: a.id, steps };
  }
}
