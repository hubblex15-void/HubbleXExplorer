import type { RGB } from './util';

export type SeasonName = 'spring' | 'summer' | 'autumn' | 'winter';
export type ResourceKind = 'wood' | 'stone' | 'berry' | 'herb' | 'mushroom' | 'fish' | 'gem' | 'star';
export type MotionMode = 'full' | 'calm' | 'off';

/** Everything the scene needs to know about the sky. All values 0..1 except tempC / wind (0..1 too). */
export interface WeatherTarget {
  cloud: number; rain: number; snow: number; fog: number; thunder: number; wind: number; tempC: number | null;
}
export interface Env {
  lat: number; lon: number;
  weather: WeatherTarget;
  season?: 'auto' | SeasonName;
}
export interface Progress {
  streak: number;          // consecutive days: campfire size, garden growth
  level: number;           // cosmetic only
  goalsMet: boolean;       // today's goals reached: cabin glows, shooting star
  cabinLevel: number;      // 1..3 unlocks string lights, lanterns, fence flowers
}
export interface Outfit { hat?: 'traveller' | 'straw' | 'beanie'; hatColor?: string; scarf?: string; coat?: string; }
export interface CollectEvent { kind: ResourceKind; amount: number; reason?: string; }
export interface SceneState {
  ms: number; alt: number; dayFrac: number; darkness: number; season: SeasonName; phase: string;
  weather: WeatherTarget; activity: string; inside: boolean; fire: number; snowCover: number;
}
export const CLEAR: WeatherTarget = { cloud: 0.15, rain: 0, snow: 0, fog: 0, thunder: 0, wind: 0.15, tempC: 22 };
export const DEFAULT_PROGRESS: Progress = { streak: 3, level: 1, goalsMet: false, cabinLevel: 1 };
export type { RGB };
