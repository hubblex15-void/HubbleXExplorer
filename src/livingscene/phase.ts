const PHASE: Record<string, string> = { dawn: 'Sunrise', day: 'Daytime', dusk: 'Golden hour', evening: 'Evening', sleep: 'Night' };
/** friendly time-of-day name for the HUD */
export function phaseLabel(phase?: string, hour?: number): string {
  if (phase && PHASE[phase]) return PHASE[phase]; const h = hour ?? new Date().getHours(); return h < 5 ? 'Night' : h < 8 ? 'Sunrise' : h < 17 ? 'Daytime' : h < 19 ? 'Golden hour' : h < 22 ? 'Evening' : 'Night';
}
