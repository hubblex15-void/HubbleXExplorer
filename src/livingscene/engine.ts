import { FB } from './fb';
import { buildWorld, World, W, H, LAYOUT } from './world';
import { renderHi } from './render';
import { WX, newWX, stepWeather } from './weather';
import { computeSky, Sky } from './sky';
import { seasonState, SeasonState } from './season';
import { Actor, Step } from './actor';
import { FX } from './fx';
import { Director, Ctx, ACTS, phaseOf } from './activities';
import { newRuntime } from './runtime';
import { makeOutfit, Outfit, OutfitOverride, SeasonKey } from './character';
import { drawObjects, Lantern } from './objects';
import { drawAmbient } from './ambient';
import { mulberry32, clamp, RGB } from './util';
import { CLEAR, DEFAULT_PROGRESS, WeatherTarget, Progress, CollectEvent, ResourceKind, SceneState, SeasonName } from './types';
import { Light } from './fire';

export interface EngineOpts { lat?: number; lon?: number; seed?: number; season?: 'auto' | SeasonName; tzOffsetMin?: number | null; }
/** The whole living scene. Feed it the current time (step), the real weather (setWeather) and your app's progress; read pixels out of render(). */
export class LivingScene {
  lo = new FB(W, H); hi = new FB(W * 2, H * 2); world: World; wx: WX; target: WeatherTarget = { ...CLEAR };
  lat: number; lon: number; seed: number; seasonOv: 'auto' | SeasonName; tz: number | null;
  R = newRuntime(); fx = new FX(); actor: Actor; rnd: () => number; director: Director; progress: Progress = { ...DEFAULT_PROGRESS }; outfitOv: OutfitOverride = {};
  fireNow = 0; sleepDim = 0; simT = 0; last = 0; started = false; sky!: Sky; season!: SeasonState; skyAge = 99; ctx!: Ctx;
  lanterns: Lantern[] = []; shootAt = -1; smokeT = 0; breathT = 0; zT = 0; steamT = 0; leafT = 0; private outfitCache = new Map<string, Outfit>();
  onCollect: (e: CollectEvent) => void = () => {}; onActivity: (id: string) => void = () => {};
  constructor(o: EngineOpts = {}) {
    this.lat = o.lat ?? 35; this.lon = o.lon ?? 0; this.seed = o.seed ?? 7; this.seasonOv = o.season ?? 'auto'; this.tz = o.tzOffsetMin ?? null;
    this.world = buildWorld(this.seed, this.progress.cabinLevel); this.wx = newWX(this.target); this.rnd = mulberry32(this.seed * 7919 + 13);
    this.actor = new Actor(this.fx, this.R); this.director = new Director(this.actor, this.R, this.rnd);
    this.actor.onCollect = (kind, n) => this.onCollect({ kind: kind as ResourceKind, amount: n });
  }
  setLocation(lat: number, lon: number): void { this.lat = lat; this.lon = lon; this.skyAge = 99; }
  setWeather(t: WeatherTarget): void { this.target = { ...t }; }
  setSeason(s: 'auto' | SeasonName): void { this.seasonOv = s; this.skyAge = 99; }
  setOutfit(o: OutfitOverride): void { this.outfitOv = { ...o }; this.outfitCache.clear(); }
  setProgress(p: Partial<Progress>): void { const old = this.progress.cabinLevel; this.progress = { ...this.progress, ...p }; if (this.progress.cabinLevel !== old) this.world = buildWorld(this.seed, this.progress.cabinLevel); }
  /** reward: the traveller goes and physically collects it (or it pops up at the window if he is asleep) */
  grant(kind: ResourceKind, n = 1): void {
    if (this.R.sleeping) { this.fx.popup(127, 96, kind, n); this.onCollect({ kind, amount: n }); return; }
    this.director.grant(kind, n);
    const a = this.actor; if (!a.inside && !a.label.startsWith('gather') && !a.label.startsWith('celebrate')) { a.clear(); this.fx.glyph('star', a.x - 2, a.y - 24, [255, 240, 170], { max: 0.7, vy: -4 }); }
  }
  celebrate(kind: 'levelUp' | 'streak' | 'goal' | 'quest'): void {
    const a = this.actor, f = this.fx;
    if (kind === 'streak') { this.R.fire = 1; f.sparks(226, 132, 14); f.glyph('star', 224, 104, [255, 240, 170], { max: 1.4 }); return; }
    if (kind === 'goal') { this.shootAt = this.simT; f.glyph('star', 128, 60, [255, 240, 170], { max: 1.6 }); }
    if (kind === 'levelUp') for (let i = 0; i < 7; i++) this.lanterns.push({ x: 100 + i * 20 + this.rnd() * 8, y: 122 + this.rnd() * 10, ph: this.rnd() * 6, c: [[255, 150, 70], [255, 200, 90], [255, 120, 110]][i % 3] as RGB, sp: 5 + this.rnd() * 4 });
    if (a.inside && !this.R.sleeping) return;
    if (!this.R.sleeping) { a.clear(); const st: Step[] = [{ k: 'go', to: [150 + this.rnd() * 40, 136], run: true }, { k: 'do', m: kind === 'goal' ? 'wave' : 'cheer', t: 3, dir: 1 }, { k: 'fx', name: kind === 'quest' ? 'heart' : 'confetti' }, { k: 'wait', t: 0.6 }]; a.queue(st, 'celebrate:' + kind); }
    if (kind !== 'goal') f.confetti(a.x, a.y - 8, 26);
  }
  /** force an activity (debug / preview) */
  play(id: string): boolean {
    const act = ACTS.find(x => x.id === id); if (!act || !this.ctx) return false;
    const steps = act.build(this.ctx, this.R, this.rnd); this.actor.clear(); if (this.actor.inside && !this.R.sleeping) steps.unshift({ k: 'out' }); this.actor.queue(steps, id); return true;
  }
  private hourOf(ms: number): number { if (this.tz !== null) return ((ms / 3600000 + this.tz / 60) % 24 + 24) % 24; const d = new Date(ms); return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600; }
  private refresh(ms: number): void { this.sky = computeSky(ms, this.lat, this.lon, this.wx); this.season = seasonState(ms, this.lat, this.lon, this.seasonOv); this.skyAge = 0; }
  private buildCtx(ms: number): Ctx {
    const hour = this.hourOf(ms), w = this.wx;
    return { phase: phaseOf(this.sky.alt, hour), hour, season: this.season.id, sw: this.season.weights, rain: w.rain, snow: w.snow, fog: w.fog, thunder: w.thunder, wind: w.wind, cloud: w.cloud, temp: this.target.tempC, snowCover: w.snowCover, wet: w.wet, dark: this.sky.dark, fire: this.fireNow, streak: this.progress.streak };
  }
  private warm(ms: number): void {
    this.wx = newWX(this.target); this.refresh(ms); this.ctx = this.buildCtx(ms);
    if ((this.ctx.phase === 'evening' || this.ctx.phase === 'dusk') && this.sky.dark > 0.5) { this.R.fire = 1; this.fireNow = this.fireScale(); }
    this.director.init(this.ctx);
  }
  private fireScale(): number { return (0.6 + 0.4 * clamp(this.progress.streak / 14)); }
  step(nowMs: number): void {
    if (!this.started) { this.started = true; this.last = nowMs; this.warm(nowMs); return; }
    let dt = (nowMs - this.last) / 1000; this.last = nowMs; if (dt <= 0) return;
    if (dt > 4) { const t = this.target, w = this.wx; w.cloud = t.cloud; w.rain = t.rain; w.snow = t.snow; w.fog = t.fog; w.thunder = t.thunder; w.wind = t.wind; this.skyAge = 99; dt = 0.25; }
    const n = Math.max(1, Math.ceil(dt / 0.25)), h = dt / n; for (let i = 0; i < n; i++) { this.simT += h; this.tick(nowMs - (n - 1 - i) * h * 1000, h); }
  }
  private tick(ms: number, dt: number): void {
    const R = this.R, A = this.actor, w = this.wx; this.skyAge += dt; if (this.skyAge > 0.4) this.refresh(ms);
    stepWeather(w, this.target, dt, this.simT, this.rnd);
    this.fireNow += (R.fire * this.fireScale() - this.fireNow) * (1 - Math.exp(-dt / 6));
    this.ctx = this.buildCtx(ms); const prev = this.director.last; this.director.update(dt, this.ctx); if (this.director.last !== prev) this.onActivity(this.director.last);
    A.update(dt, w.wind); this.fx.update(dt, w.wind);
    this.sleepDim += ((R.sleeping ? 1 : 0) - this.sleepDim) * (1 - Math.exp(-dt / 14));
    if (w.snowCover < 0.1) R.snowman = 0; if (this.ctx.season !== 'winter' && w.snowCover < 0.1) R.lights = R.lights && this.progress.cabinLevel >= 2;
    this.leafT += dt; if (this.leafT > 120) { this.leafT = 0; R.leafPile = Math.max(0, R.leafPile - 1); }
    for (const l of this.lanterns) l.y -= l.sp * dt; this.lanterns = this.lanterns.filter(l => l.y > -12);
    const cold = clamp((10 - (this.target.tempC ?? 15)) / 12);
    if ((this.smokeT -= dt) <= 0) { this.fx.smoke(156, 41); this.smokeT = 1.4 - 0.9 * clamp((R.occupied ? 0.6 : 0) + cold + this.sky.dark * 0.3) + this.rnd() * 0.5; }
    if ((this.zT -= dt) <= 0) { if (R.sleeping && this.sleepDim > 0.5) this.fx.glyph('zzz', 152, 98, [225, 235, 255], { max: 2.6, vx: 3 }); this.zT = 4; }
    if ((this.breathT -= dt) <= 0) { if (cold > 0.35 && !A.inside) this.fx.add('puff', A.x + A.dir * 3, A.y - 13, { max: 0.9, c: [245, 248, 255], vy: -3, vx: A.dir * 3, s: 1 }); this.breathT = 2.6; }
    const cooking = A.label === 'cookStew' && this.fireNow > 0.3; if (cooking && (this.steamT -= dt) <= 0) { this.fx.steam(225 + this.rnd() * 5, 127); this.steamT = 0.35; }
  }
  private outfit(): Outfit {
    const s = (this.season?.id || 'summer') as SeasonKey, cool = this.sky.dark > 0.3 || (this.target.tempC ?? 20) < 16 || this.ctx.phase === 'dawn', key = s + cool + JSON.stringify(this.outfitOv);
    let o = this.outfitCache.get(key); if (!o) { o = makeOutfit(s, this.outfitOv, cool); this.outfitCache.set(key, o); } return o;
  }
  render(): FB {
    if (!this.started) return this.hi;
    const ms = this.last, t = ms / 1000, R = this.R, sky = this.sky, ss = this.season, dk = 0.15 + 0.85 * sky.dark, lightsOn = R.lights || this.progress.cabinLevel >= 2;
    const ex: Light[] = [{ x: 127, y: 124, r: 16, col: [255, 200, 120], s: this.actor.doorOpen * 0.5 * dk }];
    for (const l of this.lanterns) ex.push({ x: l.x, y: l.y, r: 16, col: [255, 170, 90], s: 0.3 + 0.35 * sky.dark });
    if (lightsOn) for (const x of [95, 118, 141, 164]) ex.push({ x, y: 96, r: 12, col: [255, 214, 150], s: 0.3 * sky.dark });
    if (R.pumpkin) ex.push({ x: 140, y: 120, r: 9, col: [255, 170, 80], s: 0.4 * sky.dark });
    renderHi(this.hi, this.lo, this.world, {
      ms, lat: this.lat, lon: this.lon, wx: this.wx, season: this.seasonOv, fire: this.fireNow, extraLights: ex, windowDim: this.sleepDim * 0.92,
      mid: (fb, s2) => {
        drawObjects(fb, { t, amb: s2.amb, dark: sky.dark, wind: this.wx.wind, R, snowCover: this.wx.snowCover, season: ss.id, doorOpen: this.actor.doorOpen, occupied: this.actor.inside, sleeping: R.sleeping, streak: this.progress.streak, lanterns: this.lanterns, cooking: this.actor.label === 'cookStew' && this.fireNow > 0.3, fruit: ss.params.fruit, flowerA: ss.params.flowerA, lights: lightsOn });
        drawAmbient(fb, { t, dark: sky.dark, cloud: this.wx.cloud, rain: this.wx.rain, snow: this.wx.snow, wind: this.wx.wind, sw: ss.weights, amb: s2.amb, accent: ss.params.accentTree, leaf: ss.params.leaf[2], petal: ss.params.accentTree, shootAt: this.shootAt > 0 ? this.shootAt : -1, phaseDay: sky.alt > 6 });
      },
      hiMid: (hi, _s, tintAt, fog) => { this.actor.draw(hi, this.outfit(), tintAt, t, this.wx.wind, fog); this.fx.draw(hi, tintAt); },
    });
    return this.hi;
  }
  state(): SceneState { const s = this.sky; return { ms: this.last, alt: s ? s.alt : 0, dayFrac: s ? s.dayFrac : 0, darkness: s ? s.dark : 0, season: this.season ? this.season.id : 'summer', phase: this.ctx ? this.ctx.phase : 'day', weather: { ...this.target }, activity: this.actor.label, inside: this.actor.inside, fire: this.fireNow, snowCover: this.wx.snowCover }; }
}
