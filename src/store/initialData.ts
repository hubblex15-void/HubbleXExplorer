import { AppState } from '../types/index.ts';

/**
 * Clean initial state with zero seed or demo data.
 * All arrays start completely empty for a true clean start.
 */
export function createInitialState(): AppState {
  return {
    version: 2,
    categories: [],
    trackers: [],
    quests: [],
    logs: [],
    activeTimers: {},
    profile: {
      name: '',
      avatar: 'steve',
      settings: {
        location: null,
        soundEnabled: false,
        pixelScale: 'standard',
        theme: 'overworld',
        motion: 'full',
        season: 'auto',
        sceneDebug: false,
      },
    },
  };
}
