import { BASE, Pose, V2 } from './character';
export interface Key { d: number; p: Partial<Pose>; on?: string }
export interface Motion { loop: boolean; base?: Partial<Pose>; keys: Key[] }
const K = (d: number, p: Partial<Pose> = {}, on?: string): Key => ({ d, p, on });
const l2 = (a: V2, b: V2, t: number): V2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const ln = (a: number, b: number, t: number) => a + (b - a) * t;
export function blendPose(a: Pose, b: Pose, t: number): Pose {
  const n = t < 0.5 ? a : b;
  return { hip: l2(a.hip, b.hip, t), lean: ln(a.lean, b.lean, t), torso: ln(a.torso, b.torso, t), head: l2(a.head, b.head, t), aN: l2(a.aN, b.aN, t), aF: l2(a.aF, b.aF, t), fN: l2(a.fN, b.fN, t), fF: l2(a.fF, b.fF, t), face: n.face, eyes: n.eyes, mouth: n.mouth, prop: n.prop, pa: ln(a.pa, b.pa, t), pv: ln(a.pv, b.pv, t) };
}
export const total = (m: Motion): number => m.keys.reduce((s, k) => s + k.d, 0);
const pose = (m: Motion, i: number): Pose => Object.assign({}, BASE, m.base, m.keys[i].p) as Pose;
/** t in seconds since start. Returns the pose and the key index (for events). */
export function samplePose(m: Motion, t: number): { pose: Pose; key: number } {
  const T = total(m); let tt = m.loop ? ((t % T) + T) % T : Math.min(t, T - 0.0001), i = 0;
  while (i < m.keys.length - 1 && tt >= m.keys[i].d) { tt -= m.keys[i].d; i++; }
  const last = i === m.keys.length - 1, a = pose(m, i), b = last ? (m.loop ? pose(m, 0) : a) : pose(m, i + 1);
  return { pose: blendPose(a, b, last && !m.loop ? 0 : Math.min(1, tt / m.keys[i].d)), key: i };
}
const sit: Partial<Pose> = { hip: [0, -4], fN: [3, 0], fF: [2, 0], aN: [3, 3], aF: [2, 3] };
const breathe = (extra: Partial<Pose> = {}): Key[] => [K(2, extra), K(0.12, { ...extra, eyes: 1 }), K(1.4, { ...extra, head: [0, 1] }), K(0.9, extra)];
const WALK: Key[] = [K(0.13, { hip: [0, -7], fN: [3, 0], fF: [-3, 0], aN: [-2, 4], aF: [2, 4] }), K(0.13, { hip: [0, -8], fN: [0, -2], fF: [0, 0], aN: [0, 5], aF: [0, 5] }), K(0.13, { hip: [0, -7], fN: [-3, 0], fF: [3, 0], aN: [2, 4], aF: [-2, 4] }), K(0.13, { hip: [0, -8], fN: [0, 0], fF: [0, -2], aN: [0, 5], aF: [0, 5] })];
const legsOnly = (ks: Key[]): Key[] => ks.map(k => ({ d: k.d, p: { hip: k.p.hip, fN: k.p.fN, fF: k.p.fF } }));
export const MOTIONS: Record<string, Motion> = {
  idle: { loop: true, keys: breathe() },
  idleFront: { loop: true, base: { face: 1, aN: [2, 5], aF: [-2, 5] }, keys: breathe() },
  walk: { loop: true, keys: WALK },
  run: { loop: true, base: { lean: 2 }, keys: [K(0.1, { hip: [0, -7], fN: [4, -1], fF: [-4, -3], aN: [-3, 3], aF: [3, 2] }), K(0.1, { hip: [0, -9], fN: [0, -4], fF: [-1, -1], aN: [-1, 3], aF: [1, 2] }), K(0.1, { hip: [0, -7], fN: [-4, -3], fF: [4, -1], aN: [3, 2], aF: [-3, 3] }), K(0.1, { hip: [0, -9], fN: [-1, -1], fF: [0, -4], aN: [1, 2], aF: [-1, 3] })] },
  carry: { loop: true, base: { lean: -1, aN: [4, 3], aF: [4, 2], prop: 'log' }, keys: legsOnly(WALK) },
  carryBasket: { loop: true, base: { aN: [3, 4], aF: [-1, 5], prop: 'basket' }, keys: legsOnly(WALK) },
  umbrellaWalk: { loop: true, base: { prop: 'umbrella', aN: [3, -2], pv: 1, pa: 90, eyes: 0 }, keys: legsOnly(WALK) },
  umbrellaHold: { loop: true, base: { prop: 'umbrella', aN: [3, -2], pv: 1, pa: 90, face: 0 }, keys: breathe({ prop: 'umbrella', aN: [3, -2], pv: 1, pa: 90 }) },
  lanternHold: { loop: true, base: { prop: 'lantern', aN: [4, 1] }, keys: breathe({ prop: 'lantern', aN: [4, 1] }) },
  lanternWalk: { loop: true, base: { prop: 'lantern', aN: [4, 1] }, keys: legsOnly(WALK) },
  wave: { loop: true, base: { face: 1, eyes: 2, mouth: 1, aF: [-2, 5] }, keys: [K(0.22, { aN: [2, -8] }), K(0.22, { aN: [5, -8] }), K(0.22, { aN: [2, -8] }), K(0.22, { aN: [5, -9] })] },
  stretch: { loop: false, base: { face: 1, aN: [2, 5], aF: [-2, 5] }, keys: [K(0.6), K(0.6, { aN: [3, -9], aF: [-3, -9], head: [0, -1], eyes: 1, mouth: 2 }), K(1.2, { aN: [3, -9], aF: [-3, -9], head: [0, -1], eyes: 1, mouth: 2 }), K(0.5, { aN: [2, 3], aF: [-2, 3], eyes: 2, mouth: 1 })] },
  cheer: { loop: true, base: { face: 1, eyes: 2, mouth: 2 }, keys: [K(0.14, { aN: [3, -4], aF: [-3, -4] }), K(0.2, { hip: [0, -12], fN: [2, -6], fF: [-2, -5], aN: [4, -9], aF: [-4, -9] }), K(0.2, { hip: [0, -12], fN: [2, -6], fF: [-2, -5], aN: [4, -9], aF: [-4, -9] }), K(0.14, { hip: [0, -6], aN: [3, -3], aF: [-3, -3] })] },
  lookUp: { loop: true, base: {}, keys: [K(1.6, { head: [0, -1], eyes: 3 }), K(1.6, { head: [0, -1], eyes: 3, aN: [1, 4] })] },
  shade: { loop: true, base: { aN: [3, -6], head: [0, -1], eyes: 3 }, keys: [K(1.5), K(0.12, { eyes: 1 }), K(1.2)] },
  shiver: { loop: true, base: { aN: [3, 2], aF: [2, 2], eyes: 1 }, keys: [K(0.07, { hip: [-1, -7] }), K(0.07, { hip: [1, -7] })] },
  warmRub: { loop: true, base: { aN: [5, -1], aF: [5, -1], mouth: 1 }, keys: [K(0.2), K(0.2, { aN: [6, 0], aF: [5, -2] })] },
  chop: { loop: true, base: { prop: 'axe' }, keys: [K(0.28, { lean: -1, aN: [2, -6], aF: [1, -5], pa: 110, fN: [3, 0], fF: [-2, 0] }), K(0.1, { lean: 2, aN: [5, -2], aF: [4, -2], pa: 35 }), K(0.16, { lean: 3, aN: [6, 3], aF: [5, 3], pa: -40, head: [1, 1] }, 'hit'), K(0.24, { lean: 1, aN: [3, -2], aF: [2, -2], pa: 70 })] },
  mine: { loop: true, base: { prop: 'pick' }, keys: [K(0.4, { lean: -1, aN: [2, -6], aF: [1, -5], pa: 115, fN: [3, 0], fF: [-2, 0] }), K(0.1, { lean: 2, aN: [5, -2], aF: [4, -2], pa: 30 }), K(0.2, { lean: 3, aN: [6, 3], aF: [5, 3], pa: -45, head: [1, 1] }, 'hit'), K(0.3, { lean: 1, aN: [3, -2], aF: [2, -2], pa: 75 })] },
  sweep: { loop: true, base: { prop: 'broom', fN: [2, 0], fF: [-2, 0] }, keys: [K(0.35, { lean: 1, aN: [3, 3], aF: [2, 1], pa: -62 }), K(0.35, { lean: 2, aN: [5, 4], aF: [3, 2], pa: -50 }, 'dust')] },
  rake: { loop: true, base: { prop: 'rake', fN: [2, 0], fF: [-2, 0] }, keys: [K(0.4, { lean: 2, aN: [5, 3], aF: [3, 2], pa: -50 }), K(0.4, { lean: 0, aN: [3, 3], aF: [2, 2], pa: -62 }, 'drag')] },
  water: { loop: true, base: { prop: 'can', fN: [2, 0], fF: [-1, 0] }, keys: [K(0.5, { aN: [5, 2], aF: [3, 2], pv: 0 }), K(0.8, { aN: [5, 1], aF: [3, 2], pv: 1 }, 'pour')] },
  hammer: { loop: true, base: { prop: 'hammer', aF: [6, 0], fN: [2, 0] }, keys: [K(0.22, { aN: [5, -3], pa: 80 }), K(0.12, { lean: 1, aN: [6, 1], pa: -20 }, 'hit'), K(0.2, { aN: [5, -2], pa: 60 })] },
  dig: { loop: true, base: { prop: 'shovel' }, keys: [K(0.3, { aN: [4, -1], aF: [3, 1], pa: 75, fN: [2, 0], fF: [-2, 0] }), K(0.14, { lean: 2, aN: [5, 4], aF: [4, 3], pa: -72, fN: [3, 0] }, 'hit'), K(0.3, { lean: -1, aN: [3, 1], aF: [2, 3], pa: 60 }, 'toss')] },
  shovelSnow: { loop: true, base: { prop: 'shovel', fN: [2, 0], fF: [-2, 0] }, keys: [K(0.35, { lean: 2, aN: [5, 4], aF: [3, 3], pa: -30 }), K(0.35, { lean: -1, aN: [3, 1], aF: [2, 2], pa: 25 }, 'toss')] },
  pick: { loop: false, keys: [K(0.4, { hip: [0, -6], lean: 3, head: [1, 1], aN: [3, 5], aF: [2, 4], fN: [3, 0], fF: [-2, 0] }), K(0.35, { hip: [0, -6], lean: 3, head: [1, 1], aN: [4, 6], aF: [3, 5], fN: [3, 0], fF: [-2, 0] }, 'grab'), K(0.4, { lean: 1, aN: [2, 2], aF: [2, 4] })] },
  kneel: { loop: true, base: { hip: [0, -4], lean: 2, head: [1, 1], fN: [3, 0], fF: [-3, 0], aN: [5, 3], aF: [4, 3] }, keys: [K(0.25), K(0.25, { aN: [6, 4] }, 'strike')] },
  sitLog: { loop: true, base: sit, keys: breathe() },
  sitWarm: { loop: true, base: { ...sit, aN: [6, 1], aF: [5, 2], mouth: 1 }, keys: [K(0.9), K(0.9, { aN: [6, 2], aF: [5, 1] })] },
  sitRead: { loop: true, base: { ...sit, prop: 'book', aN: [3, 0], aF: [3, 1], head: [1, 1] }, keys: [K(3), K(0.25, { aN: [4, -1] }, 'page'), K(0.25)] },
  sitDrink: { loop: true, base: { ...sit, prop: 'mug' }, keys: [K(1.4, { aN: [3, 2], aF: [2, 3] }), K(0.4, { aN: [3, -4], head: [1, 0] }, 'sip'), K(0.9, { aN: [3, -4], head: [1, 0] }), K(0.4, { aN: [3, 2] })] },
  sitStrum: { loop: true, base: { ...sit, prop: 'guitar', aN: [4, 3], aF: [6, 1], mouth: 1 }, keys: [K(0.14), K(0.14, { aN: [4, 4] }, 'note')] },
  sitSleep: { loop: true, base: { ...sit, eyes: 1, head: [1, 2], lean: -1 }, keys: [K(1.4, {}, 'zzz'), K(1.4, { head: [1, 3], lean: 0 })] },
  sitEat: { loop: true, base: { ...sit, prop: 'bowl' }, keys: [K(1, { aN: [3, 2] }), K(0.35, { aN: [3, -3], head: [1, 0] }, 'bite'), K(0.3, { aN: [3, 2] })] },
  sitRoast: { loop: true, base: { ...sit, prop: 'stick', aN: [5, 0], aF: [3, 1], pa: 8 }, keys: [K(1.2), K(1.2, { pa: 14, aN: [5, -1] })] },
  sitPoke: { loop: true, base: { ...sit, prop: 'stick', aN: [6, 3], aF: [3, 3], pa: -15 }, keys: [K(0.7, { pa: -20 }), K(0.15, { aN: [7, 3], pa: -10 }, 'poke'), K(0.3)] },
  sitWrite: { loop: true, base: { ...sit, prop: 'journal', aN: [3, 2], aF: [3, 3], head: [1, 1] }, keys: [K(0.4), K(0.4, { aN: [4, 3] })] },
  fishWait: { loop: true, base: { ...sit, prop: 'rod', aN: [5, -1], aF: [3, 1], pa: 40 }, keys: [K(1.4), K(1.4, { pa: 42 })] },
  fishReel: { loop: true, base: { ...sit, prop: 'rod', aN: [4, -3], aF: [3, -1], pa: 62, mouth: 2, eyes: 3 }, keys: [K(0.15, { pa: 62 }, 'splash'), K(0.3, { pa: 30, aN: [3, -1] })] },
  stir: { loop: true, base: { prop: 'ladle', aF: [1, 3], fN: [2, 0] }, keys: [K(0.3, { aN: [5, 1], pa: -70 }), K(0.3, { aN: [6, 2], pa: -80 }), K(0.3, { aN: [5, 3], pa: -70 }), K(0.3, { aN: [4, 2], pa: -60 })] },
  taste: { loop: false, base: { prop: 'ladle', aF: [1, 3] }, keys: [K(0.5, { aN: [4, 1], pa: -50 }), K(0.6, { aN: [3, -3], pa: 60, head: [1, 0], mouth: 1 }, 'taste'), K(0.8, { aN: [3, -3], pa: 60, eyes: 2, mouth: 1 })] },
  hang: { loop: true, base: { face: 2, prop: 'cloth' }, keys: [K(0.4, { aN: [2, -8], aF: [1, -8] }), K(0.4, { aN: [3, -7], aF: [2, -8] }, 'clip')] },
  sharpen: { loop: true, base: { prop: 'axe', aN: [4, 2], aF: [2, 3], pa: 8, head: [1, 1] }, keys: [K(0.3), K(0.3, { aF: [5, 2] })] },
  throw: { loop: false, base: { prop: 'snowball' }, keys: [K(0.35, { lean: -2, aN: [-2, -4] }), K(0.12, { lean: 3, aN: [6, -3] }, 'throw'), K(0.3, { lean: 1, aN: [4, 0], prop: '' })] },
  sketch: { loop: true, base: { prop: 'brush', aF: [3, 2], pa: 40 }, keys: [K(0.5, { aN: [6, -3] }), K(0.5, { aN: [7, -4] }), K(0.5, { aN: [6, -2] })] },
  feed: { loop: false, keys: [K(0.5, { aN: [3, 3] }), K(0.25, { aN: [6, -1] }, 'toss'), K(0.4, { aN: [3, 3] })] },
  hug: { loop: true, base: { face: 1, prop: 'mug', aN: [2, 1], aF: [-1, 2], eyes: 2, mouth: 1 }, keys: breathe({ prop: 'mug', aN: [2, 1], aF: [-1, 2], eyes: 2, mouth: 1 }) },
  readMap: { loop: true, base: { prop: 'map', aN: [4, 0], aF: [3, 1], head: [1, 0] }, keys: [K(2), K(0.6, { head: [0, -1], aN: [4, -1] })] },
  doorOpen: { loop: false, keys: [K(0.3, { aN: [4, 1] }), K(0.4, { aN: [5, 0], lean: 1 })] },
  snowCatch: { loop: true, base: { aN: [4, -2], aF: [3, -2], head: [0, -1], eyes: 3, mouth: 2 }, keys: [K(1.2), K(1.2, { aN: [4, -3] })] },
  puddle: { loop: true, base: { face: 1, eyes: 2, mouth: 1 }, keys: [K(0.16, { aN: [3, 2], aF: [-3, 2] }), K(0.16, { hip: [0, -10], fN: [2, -4], fF: [-2, -3], aN: [4, -3], aF: [-4, -3] }, 'splash')] },
};
export const MOTION_NAMES = Object.keys(MOTIONS);
