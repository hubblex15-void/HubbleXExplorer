/**
 * Tally Realm - Tunable Game Rules & XP Mechanics
 */

export const XP_RULES = {
  // Tracker XP rates
  TALLY_XP_PER_COUNT: 1,
  TALLY_MAX_DAILY_XP: 30,

  TIMER_MINUTES_PER_XP: 2, // 1 XP per 2 minutes
  TIMER_MAX_DAILY_XP: 60,

  HABIT_XP: 10,

  // Quest XP by difficulty (1, 2, 3 stars)
  QUEST_DIFFICULTY_XP: {
    1: 10,
    2: 20,
    3: 35,
  } as const,

  // Bonus for completing a main quest
  QUEST_MAIN_BONUS_XP: 50,

  // Goal hit bonus: +20 XP the first time a tracker hits its daily goal each day
  DAILY_GOAL_BONUS_XP: 20,

  // Level Progression Formula:
  // XP needed to go from Level L to L+1 = BASE_LEVEL_XP + LEVEL_SCALE_XP * (L - 1)
  BASE_LEVEL_XP: 100,
  LEVEL_SCALE_XP: 50,

  // Streak flame tiers
  STREAK_TIERS: [
    { minDays: 0, title: 'Spark', color: '#B0BEC5' },
    { minDays: 3, title: 'Kindling Flame', color: '#F2C94C' },
    { minDays: 7, title: 'Campfire', color: '#F2994A' },
    { minDays: 14, title: 'Blazing Torch', color: '#EB5757' },
    { minDays: 30, title: 'Dragon Flame', color: '#9B51E0' },
    { minDays: 100, title: 'Celestial Astral Fire', color: '#4AEDD9' },
  ],
} as const;

/**
 * Calculate XP required to advance from level L to L+1
 */
export function getXpForLevel(level: number): number {
  if (level < 1) return XP_RULES.BASE_LEVEL_XP;
  return XP_RULES.BASE_LEVEL_XP + XP_RULES.LEVEL_SCALE_XP * (level - 1);
}

/**
 * Given a cumulative XP total, compute current level, XP into current level,
 * and XP needed for next level.
 */
export function calculateLevelFromTotalXp(totalXp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXpRequired: number;
  progressPercent: number;
} {
  let safeTotal = Math.max(0, Math.floor(totalXp));
  let level = 1;

  while (true) {
    const needed = getXpForLevel(level);
    if (safeTotal < needed) {
      const progressPercent = Math.min(100, Math.max(0, Math.round((safeTotal / needed) * 100)));
      return {
        level,
        currentLevelXp: safeTotal,
        nextLevelXpRequired: needed,
        progressPercent,
      };
    }
    safeTotal -= needed;
    level += 1;
  }
}
