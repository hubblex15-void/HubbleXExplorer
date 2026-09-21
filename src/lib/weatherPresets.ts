import type { WeatherTarget } from '../livingscene/index.ts';

export type WeatherPresetName = 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog';

export const WEATHER_PRESETS: Record<WeatherPresetName, WeatherTarget> = {
  clear: { cloud: 0.1, rain: 0, snow: 0, fog: 0, thunder: 0, wind: 0.15, tempC: 22 },
  cloudy: { cloud: 0.85, rain: 0, snow: 0, fog: 0, thunder: 0, wind: 0.35, tempC: 16 },
  rain: { cloud: 0.9, rain: 0.7, snow: 0, fog: 0, thunder: 0, wind: 0.45, tempC: 13 },
  storm: { cloud: 1.0, rain: 0.95, snow: 0, fog: 0.1, thunder: 1.0, wind: 0.8, tempC: 12 },
  snow: { cloud: 0.9, rain: 0, snow: 0.85, fog: 0, thunder: 0, wind: 0.25, tempC: -2 },
  fog: { cloud: 0.8, rain: 0, snow: 0, fog: 0.9, thunder: 0, wind: 0.05, tempC: 8 },
};
