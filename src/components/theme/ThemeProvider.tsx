import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useTallyStore } from '../../store/useTallyStore.tsx';

export interface ThemeColors {
  id: string;
  name: string;
  cream: string;
  creamDeep: string;
  oak: string;
  oakDark: string;
  cocoa: string;
  cocoaSoft: string;
  moss: string;
  mossDark: string;
  honey: string;
  honeyDark: string;
  ember: string;
  berry: string;
  sky: string;
  dusk: string;
  sky1: string;
  sky2: string;
  sky3: string;
  sky4: string;
  sky5: string;
}

export const THEMES: Record<string, ThemeColors> = {
  golden: {
    id: 'golden',
    name: 'Golden Hour (Cozy Cabin)',
    cream: '#F6E9D2',
    creamDeep: '#EAD7B5',
    oak: '#B87B4B',
    oakDark: '#8E5A34',
    cocoa: '#3B2A20',
    cocoaSoft: '#6B5344',
    moss: '#7FA35B',
    mossDark: '#5F8043',
    honey: '#E9B44C',
    honeyDark: '#C0912F',
    ember: '#E27D4F',
    berry: '#B84A5A',
    sky: '#8CC0D6',
    dusk: '#7C6DA0',
    sky1: '#5B4372',
    sky2: '#7F587E',
    sky3: '#AB6873',
    sky4: '#D6865E',
    sky5: '#F1B27B',
  },
  dusk: {
    id: 'dusk',
    name: 'Stardew Twilight',
    cream: '#F3E8DC',
    creamDeep: '#E3D2BF',
    oak: '#A66D44',
    oakDark: '#754B2F',
    cocoa: '#35242A',
    cocoaSoft: '#634D56',
    moss: '#6E9452',
    mossDark: '#4E7335',
    honey: '#E8A73D',
    honeyDark: '#B87E28',
    ember: '#D96843',
    berry: '#A83B4B',
    sky: '#7FB3C9',
    dusk: '#6D5C91',
    sky1: '#432E59',
    sky2: '#624163',
    sky3: '#8E4E5D',
    sky4: '#B86B4D',
    sky5: '#DA966B',
  },
};

export type MotionMode = 'full' | 'calm' | 'off';

interface ThemeContextType {
  currentTheme: ThemeColors;
  themeId: string;
  setThemeId: (id: string) => void;
  availableThemes: ThemeColors[];
  motionMode: MotionMode;
  setMotionMode: (mode: MotionMode) => void;
  motion: MotionMode;
  setMotion: (mode: MotionMode) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, updateSettings } = useTallyStore();
  const themeId = state.profile.settings.theme || 'golden';
  const currentTheme = THEMES[themeId] || THEMES.golden;

  // Determine initial motion preference
  const motionSetting = state.profile.settings.motion;
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const motionMode: MotionMode = motionSetting || (prefersReduced ? 'off' : 'full');

  const setThemeId = useCallback(
    (newThemeId: string) => {
      updateSettings({ theme: newThemeId });
    },
    [updateSettings]
  );

  const setMotionMode = useCallback(
    (newMotion: MotionMode) => {
      updateSettings({ motion: newMotion });
    },
    [updateSettings]
  );

  // Sync CSS variables to root and data-phase
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-phase', 'golden');

    root.style.setProperty('--cream', currentTheme.cream);
    root.style.setProperty('--cream-deep', currentTheme.creamDeep);
    root.style.setProperty('--oak', currentTheme.oak);
    root.style.setProperty('--oak-dark', currentTheme.oakDark);
    root.style.setProperty('--cocoa', currentTheme.cocoa);
    root.style.setProperty('--cocoa-soft', currentTheme.cocoaSoft);
    root.style.setProperty('--moss', currentTheme.moss);
    root.style.setProperty('--moss-dark', currentTheme.mossDark);
    root.style.setProperty('--honey', currentTheme.honey);
    root.style.setProperty('--honey-dark', currentTheme.honeyDark);
    root.style.setProperty('--ember', currentTheme.ember);
    root.style.setProperty('--berry', currentTheme.berry);
    root.style.setProperty('--sky', currentTheme.sky);
    root.style.setProperty('--dusk', currentTheme.dusk);

    root.style.setProperty('--sky-1', currentTheme.sky1);
    root.style.setProperty('--sky-2', currentTheme.sky2);
    root.style.setProperty('--sky-3', currentTheme.sky3);
    root.style.setProperty('--sky-4', currentTheme.sky4);
    root.style.setProperty('--sky-5', currentTheme.sky5);

    // Map SceneClock CSS variables to theme tokens
    root.style.setProperty('--clock-bg', 'rgba(59, 42, 32, 0.85)');
    root.style.setProperty('--clock-fg', currentTheme.cream);
    root.style.setProperty('--clock-border', currentTheme.oak);
    root.style.setProperty('--font-heading', "'Pixelify Sans', sans-serif");
  }, [currentTheme]);

  // Sync Motion Mode & tab visibility
  useEffect(() => {
    const root = document.documentElement;

    const applyMotion = () => {
      if (document.hidden) {
        root.setAttribute('data-motion', 'off');
      } else {
        root.setAttribute('data-motion', motionMode);
      }
    };

    applyMotion();

    const handleVisibilityChange = () => {
      applyMotion();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [motionMode]);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        themeId,
        setThemeId,
        availableThemes: Object.values(THEMES),
        motionMode,
        setMotionMode,
        motion: motionMode,
        setMotion: setMotionMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
