import { getTodayKey, getPreviousDayKey } from './dates.ts';
import { LogEntry } from '../types/index.ts';
import { XP_RULES } from '../xpRules.ts';

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  hasLoggedToday: boolean;
  tier: {
    title: string;
    color: string;
    minDays: number;
  };
}

export function calculateStreaks(logs: LogEntry[], todayKey: string = getTodayKey()): StreakInfo {
  // Get unique day keys with at least one valid log entry
  const loggedDays = new Set<string>();
  logs.forEach(log => {
    if (log.dayKey && log.value > 0) {
      loggedDays.add(log.dayKey);
    }
  });

  const hasLoggedToday = loggedDays.has(todayKey);
  const yesterdayKey = getPreviousDayKey(todayKey);

  // Compute current streak:
  let currentStreak = 0;
  let checkKey = hasLoggedToday ? todayKey : yesterdayKey;

  while (loggedDays.has(checkKey)) {
    currentStreak++;
    checkKey = getPreviousDayKey(checkKey);
  }

  // Compute longest streak across all recorded history
  let longestStreak = 0;
  if (loggedDays.size > 0) {
    const sortedDays = Array.from(loggedDays).sort(); // YYYY-MM-DD sort works alphabetically
    let run = 0;
    let prevKey: string | null = null;

    for (const day of sortedDays) {
      if (!prevKey) {
        run = 1;
      } else {
        const expectedNext = getPreviousDayKey(day);
        if (expectedNext === prevKey) {
          run++;
        } else {
          run = 1;
        }
      }
      if (run > longestStreak) {
        longestStreak = run;
      }
      prevKey = day;
    }
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  // Determine streak flame tier
  let tier: (typeof XP_RULES.STREAK_TIERS)[number] = XP_RULES.STREAK_TIERS[0];
  for (const t of XP_RULES.STREAK_TIERS) {
    if (currentStreak >= t.minDays) {
      tier = t;
    }
  }

  return {
    currentStreak,
    longestStreak,
    hasLoggedToday,
    tier,
  };
}
