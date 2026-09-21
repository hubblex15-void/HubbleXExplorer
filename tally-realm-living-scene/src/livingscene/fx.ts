import { FB, Sprite, makeSprite } from './fb';
import { RGB, hex, clamp, bayer, pack } from './util';

const GL: Record<string, string[]> = {
  heart: ['.x.x.', 'xxxxx', '.xxx.', '..x..'], note: ['...xx', '...x.', '...x.', '.xxx.', 'xxxx.', '.xx..'], zzz: ['xxxx', '..x.', '.x..', 'xxxx'], zz: ['xxx', '.x.', 'xxx'],
  star: ['..x..', '..x..', 'xxxxx', '..x..', '..x..'], sweat: ['.x.', 'xxx', 'xxx', '.x.'], leaf: ['xx.', 'xxx', '.xx'], petal: ['xx', 'xx'], flake: ['.x.', 'xxx', '.x.'],
};
const DIG: Record<string, string[]> = { '0': ['xxx', 'x.x', 'x.x', 'x.x', 'xxx'], '1': ['.x.', 'xx.', '.x.', '.x.', 'xxx'], '2': ['xxx', '..x', 'xxx', 'x..', 'xxx'], '3': ['xxx', '..x', 'xxx', '..x', 'xxx'], '4': ['x.x', 'x.x', 'xxx', '..x', '..x'], '5': ['xxx', 'x..', 'xxx', '..x', 'xxx'], '6': ['xxx', 'x..', 'xxx', 'x.x', 'xxx'], '7': ['xxx', '..x', '.x.', '.x.', '.x.'], '8': ['xxx', 'x.x', 'xxx', 'x.x', 'xxx'], '9': ['xxx', 'x.x', 'xxx', '..x', 'xxx'], '+': ['...', '.x.', 'xxx', '.x.', '...'] };
const P = { o: '#3a2418', B: '#b57a48', y: '#e9b44c', Y: '#fff2a6', g: '#6fb35a', G: '#3f7a4a', r: '#d24a3a', R: '#8e2f2f', w: '#ffffff', c: '#dcecf5', C: '#7cc4e0', D: '#3f8fb8', s: '#9a9088', S: '#6f665f', l: '#c2b8ae', b: '#7fb0d0', f: '#5a86a8', e: '#2b1d18', n: '#f6ead2', p: '#f4a3c0' };
/** 7x7 resource icons — used in the scene popups AND exported for the app's Bag / HUD. */
export const ICON_ROWS: Record<string, string[]> = {
  wood: ['.ooooo.', 'oBBBBBo', 'oByyyBo', 'oBBBBBo', '.ooooo.'], stone: ['..ooo..', '.olllo.', 'olssslo', 'osssSSo', '.oSSSo.'], berry: ['..g....', '.orrro.', 'orRrrRo', 'orrrrro', '.orrro.'],
  herb: ['...g...', '..ggg..', '.gGgGg.', '..gGg..', '...o...'], mushroom: ['.orrro.', 'orwrrwo', 'orrrrro', '..onno.', '..onno.'], fish: ['..oooo..', '.obbbbof', 'obwebbbof', '.obbbbof', '..oooo..'],
  gem: ['.occco.', 'oCwCCCo', '.oCCDo.', '..oDo..', '...o...'], star: ['...y...', '...y...', 'yyyYyyy', '.yyYyy.', '..yyy..', '.yy.yy.'],
};
export const ICON: Record<string, Sprite> = {}; for (const k of Object.keys(ICON_ROWS)) ICON[k] = makeSprite(ICON_ROWS[k], P as Record<string, string>);

export interface Part { k: string; x: number; y: number; vx: number; vy: number; g: number; life: number; max: number; c: RGB; s: number; txt?: string; icon?: string; ph: number }
const rnd = (a = 0, b = 1) => a + (b - a) * Math.random();
export class FX {
  list: Part[] = [];
  add(k: string, x: number, y: number, o: Partial<Part> = {}): void {
    if (this.list.length > 400) return;
    this.list.push({ k, x, y, vx: 0, vy: 0, g: 0, life: 1, max: 1, c: [255, 255, 255], s: 1, ph: Math.random() * 6.28, ...o });
  }
  chips(x: number, y: number, n = 4, c: RGB = [181, 122, 72]): void { for (let i = 0; i < n; i++) this.add('px', x, y, { vx: rnd(-22, 22), vy: rnd(-34, -12), g: 90, max: rnd(0.4, 0.7), life: 1, c }); }
  sparks(x: number, y: number, n = 4): void { for (let i = 0; i < n; i++) this.add('px', x, y, { vx: rnd(-20, 20), vy: rnd(-30, -8), g: 30, max: rnd(0.3, 0.6), c: [255, rnd(150, 220) | 0, 70] }); }
  dust(x: number, y: number, c: RGB = [214, 200, 178]): void { this.add('puff', x, y, { max: 0.5, c, vy: -4 }); }
  splash(x: number, y: number, n = 5): void { for (let i = 0; i < n; i++) this.add('px', x, y, { vx: rnd(-18, 18), vy: rnd(-40, -16), g: 110, max: 0.6, c: [170, 210, 240] }); }
  drop(x: number, y: number): void { this.add('px', x, y, { vx: rnd(2, 8), vy: rnd(0, 10), g: 120, max: 0.5, c: [150, 200, 240] }); }
  glyph(k: string, x: number, y: number, c: RGB, o: Partial<Part> = {}): void { this.add(k, x, y, { c, max: 1.6, vy: -9, ...o }); }
  steam(x: number, y: number): void { this.add('steam', x, y, { max: 1.1, vy: -7, vx: rnd(-1, 2), c: [240, 244, 250] }); }
  smoke(x: number, y: number): void { this.add('puff', x, y, { max: 1.6, vy: -8, vx: rnd(2, 6), c: [170, 172, 184], s: 1.6 }); }
  confetti(x: number, y: number, n = 24): void { const cs: RGB[] = [[233, 180, 76], [226, 103, 79], [111, 179, 90], [124, 196, 224], [244, 163, 192]]; for (let i = 0; i < n; i++) this.add('px', x, y, { vx: rnd(-46, 46), vy: rnd(-60, -20), g: 70, max: rnd(0.9, 1.5), c: cs[i % 5] }); }
  leaves(x: number, y: number, n: number, c: RGB): void { for (let i = 0; i < n; i++) this.add('leaf', x, y, { vx: rnd(-26, 26), vy: rnd(-34, -10), g: 40, max: rnd(0.8, 1.4), c }); }
  popup(x: number, y: number, icon: string, n: number): void { this.add('popup', x, y, { icon, txt: '+' + n, max: 2.2, vy: -10 }); }
  update(dt: number, wind: number): void {
    for (const p of this.list) { p.life -= dt / p.max; p.vy += p.g * dt; p.x += (p.vx + (p.k === 'puff' || p.k === 'steam' || p.k === 'leaf' ? wind * 14 : 0)) * dt; p.y += p.vy * dt; p.ph += dt * 5; if (p.k === 'popup') p.vy *= Math.pow(0.5, dt * 2); }
    this.list = this.list.filter(p => p.life > 0);
  }
  /** scene-pixel block (2x2 hi-res pixels) with alpha */
  private blk(hi: FB, x: number, y: number, r: number, g: number, b: number, a: number): void { const X = Math.round(x) * 2, Y = Math.round(y) * 2; hi.blend(X, Y, r, g, b, a); hi.blend(X + 1, Y, r, g, b, a); hi.blend(X, Y + 1, r, g, b, a); hi.blend(X + 1, Y + 1, r, g, b, a); }
  private g(hi: FB, k: string, x: number, y: number, c: RGB, a: number): void {
    const gl = GL[k]; if (!gl) return; for (let j = 0; j < gl.length; j++) for (let i = 0; i < gl[j].length; i++) if (gl[j][i] === 'x') { const dx = Math.round(x + i), dy = Math.round(y + j); if (a >= 1 || bayer(dx, dy) < a) this.blk(hi, dx, dy, c[0], c[1], c[2], 1); }
  }
  draw(hi: FB, tint: (x: number, y: number) => RGB): void {
    for (const p of this.list) {
      const a = clamp(p.life * 2.2), t = tint(p.x, p.y);
      switch (p.k) {
        case 'px': this.blk(hi, p.x, p.y, p.c[0], p.c[1], p.c[2], a); break;
        case 'puff': { const r = Math.round(p.s * (1 + (1 - p.life) * 2.4)); for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r + 1 && bayer(p.x + i, p.y + j) < a * 0.55) this.blk(hi, p.x + i, p.y + j, p.c[0] * t[0], p.c[1] * t[1], p.c[2] * t[2], 0.7); break; }
        case 'steam': this.blk(hi, p.x + Math.round(Math.sin(p.ph) * 1), p.y, p.c[0], p.c[1], p.c[2], a * 0.6); break;
        case 'leaf': case 'petal': case 'flake': case 'heart': case 'note': case 'zzz': case 'zz': case 'star': case 'sweat': this.g(hi, p.k, p.x + (p.k === 'note' || p.k === 'zzz' || p.k === 'zz' ? Math.sin(p.ph) * 1.4 : 0), p.y, p.k === 'star' ? [255, 240, 170] : p.c, a); break;
        case 'popup': {
          const ic = ICON[p.icon || 'wood'], txt = p.txt || '', w = ic.w + 2 + txt.length * 4, x0 = Math.round(p.x - w / 2), y0 = Math.round(p.y), da = clamp(p.life * 3);
          const text = (ox: number, oy: number, c: RGB) => { for (let ci = 0; ci < txt.length; ci++) { const gl = DIG[txt[ci]]; if (!gl) continue; for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (gl[j][i] === 'x' && da > bayer(x0 + ic.w + 2 + ci * 4 + i, y0 + j)) this.blk(hi, x0 + ic.w + 2 + ci * 4 + i + ox, y0 + 1 + j + oy, c[0], c[1], c[2], 1); } };
          for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) text(ox, oy, [58, 36, 24]);
          for (let j = 0; j < ic.h; j++) for (let i = 0; i < ic.w; i++) { const v = ic.px[j * ic.w + i]; if (v && da > bayer(x0 + i, y0 + j)) { const c = ic.pal[v]; this.blk(hi, x0 + i, y0 + j, c[0], c[1], c[2], 1); } }
          text(0, 0, [255, 244, 200]);
          break;
        }
      }
    }
  }
}
