import { Buf, FB } from './fb';
import { Pose, BASE, drawChar, Outfit, OX, OY, BW, BH } from './character';
import { MOTIONS, samplePose, blendPose, total } from './motions';
import { LAYOUT, WP } from './world';
import { FX } from './fx';
import { Runtime } from './runtime';
import { RGB, smooth, clamp } from './util';

export type Target = WP | [number, number];
export type Step =
  | { k: 'go'; to: Target; run?: boolean; m?: string; prop?: string }
  | { k: 'do'; m: string; t: number; dir?: 1 | -1; prop?: string }
  | { k: 'wait'; t: number; m?: string; dir?: 1 | -1; prop?: string }
  | { k: 'in' } | { k: 'out' } | { k: 'stay'; t: number; until?: () => boolean }
  | { k: 'set'; fn: (r: Runtime) => void }
  | { k: 'fx'; name: string; dx?: number; dy?: number }
  | { k: 'collect'; kind: string; n: number };
const TIP: Record<string, number> = { axe: 8, pick: 8, shovel: 9, broom: 10, rake: 10, hammer: 5, can: 6, ladle: 8, rod: 15, stick: 12, net: 11, brush: 6 };
export class Actor {
  x = 127; y = 122; dir: 1 | -1 = 1; alpha = 1; inside = false; doorOpen = 0; mv = 0;
  steps: Step[] = []; cur: Step | null = null; st = 0; stage = 0; motion = 'idle'; mt = 0; phase = 0; propOv = ''; keyIdx = -1;
  pose: Pose = { ...BASE }; prev: Pose = { ...BASE }; bt = 1; hand = { x: 127, y: 110 }; tip = { x: 127, y: 110 }; label = 'idle'; sipT = 0;
  buf = new Buf(BW, BH);
  onCollect: (kind: string, n: number) => void = () => {};
  constructor(public fx: FX, public R: Runtime) {}
  busy(): boolean { return this.cur !== null || this.steps.length > 0; }
  queue(s: Step[], label = ''): void { this.steps.push(...s); if (label) this.label = label; }
  clear(): void { this.steps = []; this.cur = null; }
  private blend(): void { this.prev = { ...this.pose }; this.bt = 0; }
  private begin(s: Step): void {
    this.st = 0; this.stage = 0; this.keyIdx = -1;
    if (s.k === 'go') { this.motion = s.m || (s.run ? 'run' : 'walk'); this.propOv = s.prop || ''; this.blend(); }
    else if (s.k === 'do') { this.motion = s.m; this.mt = 0; if (s.dir) this.dir = s.dir; this.propOv = s.prop || ''; this.blend(); }
    else if (s.k === 'wait') { this.motion = s.m || 'idle'; this.mt = 0; if (s.dir) this.dir = s.dir; this.propOv = s.prop || ''; this.blend(); }
    else if (s.k === 'in') { this.motion = 'walk'; this.blend(); }
    else if (s.k === 'out') { this.inside = false; this.alpha = 0; this.x = LAYOUT.door[0]; this.y = LAYOUT.door[1]; this.R.doorTarget = 1; this.motion = 'idle'; this.propOv = ''; this.blend(); }
  }
  private end(): void { this.cur = null; }
  update(dt: number, wind: number): void {
    this.doorOpen += (this.R.doorTarget - this.doorOpen) * (1 - Math.exp(-dt * 6));
    this.R.occupied = this.inside;
    if (!this.cur) { this.cur = this.steps.shift() || null; if (this.cur) this.begin(this.cur); }
    const s = this.cur; this.mv = 0;
    if (!s) { this.motion = 'idle'; this.propOv = ''; this.mt += dt; this.applyPose(dt); return; }
    this.st += dt;
    switch (s.k) {
      case 'go': {
        const [tx, ty] = typeof s.to === 'string' ? LAYOUT[s.to] : s.to, sp = s.run ? 50 : s.m === 'umbrellaWalk' || s.m === 'lanternWalk' ? 18 : 24, dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy), stp = Math.min(d, sp * dt);
        if (Math.abs(dx) > 0.3) this.dir = dx > 0 ? 1 : -1;
        if (d > 0.01) { this.x += (dx / d) * stp; this.y += (dy / d) * stp; }
        this.phase += stp / (s.run ? 15 : 11); this.mv = s.run ? 1 : 0.6; this.applyPose(dt, true);
        if (d <= sp * dt + 0.01) { this.x = tx; this.y = ty; this.end(); } break;
      }
      case 'do': case 'wait': {
        this.mt += dt; this.applyPose(dt);
        if (this.st >= s.t) this.end(); break;
      }
      case 'in': {
        const [tx, ty] = LAYOUT.door, dx = tx - this.x, dy = ty - this.y;
        if (this.stage === 0) { const d = Math.hypot(dx, dy), stp = Math.min(d, 24 * dt); if (d > 0.01) { this.x += (dx / d) * stp; this.y += (dy / d) * stp; this.dir = dx >= 0 ? 1 : -1; this.phase += stp / 11; this.mv = 0.6; } this.applyPose(dt, true); if (d < 0.3) { this.stage = 1; this.st = 0; this.R.doorTarget = 1; this.motion = 'doorOpen'; this.mt = 0; this.blend(); } }
        else if (this.stage === 1) { this.mt += dt; this.applyPose(dt); if (this.st > 0.55) { this.stage = 2; this.st = 0; this.dir = 1; this.motion = 'walk'; this.blend(); } }
        else { this.y -= 4 * dt; this.phase += 4 * dt / 11; this.alpha = 1 - clamp(this.st / 0.6); this.applyPose(dt, true); if (this.st > 0.6) { this.inside = true; this.alpha = 0; this.y = ty; this.end(); setTimeoutish(this.R, 0.5); } } break;
      }
      case 'out': { this.mt += dt; this.alpha = clamp(this.st / 0.5); this.applyPose(dt); if (this.st > 0.9) { this.alpha = 1; this.R.doorTarget = 0; this.end(); } break; }
      case 'stay': { this.inside = true; if (this.st >= s.t || (s.until && s.until())) this.end(); break; }
      case 'set': s.fn(this.R); this.end(); break;
      case 'fx': this.spawn(s.name, this.x + (s.dx || 0), this.y - 12 + (s.dy || 0)); this.end(); break;
      case 'collect': this.fx.popup(this.x, this.y - 24, s.kind, s.n); this.fx.glyph('star', this.x - 2, this.y - 22, [255, 240, 170], { max: 0.8, vy: -6 }); this.onCollect(s.kind, s.n); this.end(); break;
    }
  }
  /** OUT is a step of its own so the fade-in can be animated. */
  private applyPose(dt: number, byPhase = false): void {
    const m = MOTIONS[this.motion] || MOTIONS.idle; let r;
    if (byPhase) r = samplePose(m, (this.phase % 1) * total(m)); else r = samplePose(m, this.mt);
    const p = r.pose; if (this.propOv) p.prop = this.propOv;
    if (r.key !== this.keyIdx && !byPhase) { const first = this.keyIdx === -1; this.keyIdx = r.key; if (!first || true) { const ev = MOTIONS[this.motion].keys[r.key].on; if (ev) this.event(ev); } }
    this.bt = Math.min(1, this.bt + dt / 0.22); this.pose = this.bt < 1 ? blendPose(this.prev, p, smooth(this.bt)) : p;
    if (this.motion === 'sitDrink' || this.motion === 'hug') { this.sipT -= dt; if (this.sipT <= 0) { this.sipT = 0.5; this.fx.steam(this.x + this.dir * 5, this.y - 12); } }
  }
  private world(hx: number, hy: number): { x: number; y: number } { return { x: this.x + ((hx - OX) * this.dir) / 2, y: this.y + (hy - OY) / 2 }; }
  private event(ev: string): void {
    const pr = this.pose.prop, tp = this.tip, hd = this.hand;
    switch (ev) {
      case 'hit': if (pr === 'axe') this.fx.chips(tp.x, tp.y, 5); else if (pr === 'pick') this.fx.sparks(tp.x, tp.y, 5); else if (pr === 'shovel') this.fx.dust(tp.x, tp.y, [120, 90, 60]); else this.fx.sparks(tp.x, tp.y, 3); break;
      case 'dust': case 'drag': this.fx.dust(tp.x, tp.y); if (ev === 'drag') this.fx.leaves(tp.x, tp.y, 2, [200, 110, 50]); break;
      case 'pour': for (let i = 0; i < 4; i++) this.fx.drop(tp.x + i, tp.y + i); break;
      case 'strike': this.fx.sparks(hd.x, hd.y, 4); break;
      case 'note': this.fx.glyph('note', this.x + this.dir * 8, this.y - 16, [255, 236, 190], { vx: this.dir * 6 }); break;
      case 'zzz': this.fx.glyph('zzz', this.x + this.dir * 4, this.y - 20, [225, 235, 255], { max: 2.4, vx: this.dir * 5 }); break;
      case 'taste': this.fx.glyph('heart', this.x + this.dir * 3, this.y - 22, [244, 130, 160]); break;
      case 'bite': this.fx.dust(hd.x, hd.y, [255, 235, 200]); break;
      case 'splash': this.fx.splash(tp.x, tp.y, 5); break;
      case 'toss': this.fx.dust(tp.x, tp.y, [246, 250, 255]); break;
      case 'poke': this.fx.sparks(this.dir > 0 ? 224 : 228, 136, 5); break;
      case 'throw': this.fx.dust(hd.x + this.dir * 6, hd.y, [246, 250, 255]); break;
    }
  }
  private spawn(name: string, x: number, y: number): void {
    const f = this.fx;
    if (name === 'heart') f.glyph('heart', x, y, [244, 130, 160]); else if (name === 'note') f.glyph('note', x, y, [255, 236, 190]); else if (name === 'zzz') f.glyph('zzz', x, y, [225, 235, 255], { max: 2.4 });
    else if (name === 'star') f.glyph('star', x, y, [255, 240, 170], { max: 1.2 }); else if (name === 'sweat') f.glyph('sweat', x + 4, y - 4, [150, 200, 240], { max: 0.9, vy: 6, g: 20 });
    else if (name === 'confetti') f.confetti(x, y - 4, 26); else if (name === 'splash') f.splash(x, y + 12, 6); else if (name === 'dust') f.dust(x, y + 12); else if (name === 'leaves') f.leaves(x, y + 8, 10, [220, 120, 50]);
    else if (name === 'sparks') f.sparks(x, y + 8, 8); else if (name === 'flake') f.glyph('flake', x, y, [255, 255, 255], { vy: 8, max: 1.2 });
  }
  /** draws into the 2x hi-res frame; (x,y) are scene pixels */
  draw(hi: FB, o: Outfit, tint: (x: number, y: number) => RGB, t: number, wind: number, fog?: [number, number, number, number]): void {
    if (this.inside || this.alpha <= 0.02) return;
    const h = drawChar(this.buf, this.pose, o, t, wind, this.mv), w = this.world(h.hx, h.hy); this.hand = w;
    const len = TIP[this.pose.prop] || 0, a = (this.pose.pa * Math.PI) / 180; this.tip = { x: w.x + Math.cos(a) * len * this.dir, y: w.y - Math.sin(a) * len };
    this.buf.drawTo(hi, this.x * 2, this.y * 2, OX, OY, this.dir < 0, tint(this.x, this.y), this.alpha, fog);
  }
}
function setTimeoutish(R: Runtime, _s: number): void { R.doorTarget = 0; }
