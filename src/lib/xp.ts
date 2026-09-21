import { LogEntry, Tracker, Quest } from '../types/index.ts';
import { XP_RULES, calculateLevelFromTotalXp } from '../xpRules.ts';

export interface XpCalculationResult {
  xpEarned: number;
  hitDailyGoalBonus: boolean;
}

/**
 * Calculates XP for a new log entry based on tracker type, daily caps, and goal bonuses.
 */
export function calculateXpForTrackerLog(
  tracker: Tracker,
  value: number,
  dayKey: string,
  existingLogs: LogEntry[]
): XpCalculationResult {
  const existingTodayLogs = existingLogs.filter(
    l => l.trackerId === tracker.id && l.dayKey === dayKey
  );

  const prevValueSum = existingTodayLogs.reduce((acc, l) => acc + (l.value || 0), 0);
  const newValueSum = prevValueSum + value;
  let hitDailyGoalBonus = false;

  let xpEarned = 0;

  if (tracker.type === 'tally') {
    const prevXp = Math.min(XP_RULES.TALLY_MAX_DAILY_XP, prevValueSum * XP_RULES.TALLY_XP_PER_COUNT);
    const newXp = Math.min(XP_RULES.TALLY_MAX_DAILY_XP, newValueSum * XP_RULES.TALLY_XP_PER_COUNT);
    xpEarned = Math.max(0, newXp - prevXp);
  } else if (tracker.type === 'timer') {
    const prevXp = Math.min(
      XP_RULES.TIMER_MAX_DAILY_XP,
      Math.floor(prevValueSum / XP_RULES.TIMER_MINUTES_PER_XP)
    );
    const newXp = Math.min(
      XP_RULES.TIMER_MAX_DAILY_XP,
      Math.floor(newValueSum / XP_RULES.TIMER_MINUTES_PER_XP)
    );
    xpEarned = Math.max(0, newXp - prevXp);
  } else if (tracker.type === 'habit') {
    xpEarned = XP_RULES.HABIT_XP;
  }

  // Check daily goal bonus (only on the first crossing of the threshold)
  if (tracker.goal && tracker.goal.period === 'day' && tracker.goal.amount > 0) {
    if (prevValueSum < tracker.goal.amount && newValueSum >= tracker.goal.amount) {
      hitDailyGoalBonus = true;
      xpEarned += XP_RULES.DAILY_GOAL_BONUS_XP;
    }
  }

  return {
    xpEarned,
    hitDailyGoalBonus,
  };
}

/**
 * Recomputes XP deterministically across all log entries for a specific tracker on a specific day.
 * Ensures daily caps and goal bonuses are strictly respected in chronological order.
 */
export function recomputeTrackerDayLogs(
  tracker: Tracker,
  dayKey: string,
  dayLogsForTracker: LogEntry[]
): LogEntry[] {
  // Sort chronologically
  const sorted = [...dayLogsForTracker].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
  );

  let runningValue = 0;
  let goalBonusAwarded = false;

  return sorted.map(log => {
    let baseXp = 0;
    const logVal = log.value || 0;
    const newVal = runningValue + logVal;

    if (tracker.type === 'tally') {
      const prevXp = Math.min(XP_RULES.TALLY_MAX_DAILY_XP, runningValue * XP_RULES.TALLY_XP_PER_COUNT);
      const newXp = Math.min(XP_RULES.TALLY_MAX_DAILY_XP, newVal * XP_RULES.TALLY_XP_PER_COUNT);
      baseXp = Math.max(0, newXp - prevXp);
    } else if (tracker.type === 'timer') {
      const prevXp = Math.min(
        XP_RULES.TIMER_MAX_DAILY_XP,
        Math.floor(runningValue / XP_RULES.TIMER_MINUTES_PER_XP)
      );
      const newXp = Math.min(
        XP_RULES.TIMER_MAX_DAILY_XP,
        Math.floor(newVal / XP_RULES.TIMER_MINUTES_PER_XP)
      );
      baseXp = Math.max(0, newXp - prevXp);
    } else if (tracker.type === 'habit') {
      baseXp = XP_RULES.HABIT_XP;
    }

    if (tracker.goal && tracker.goal.period === 'day' && tracker.goal.amount > 0) {
      if (!goalBonusAwarded && runningValue < tracker.goal.amount && newVal >= tracker.goal.amount) {
        goalBonusAwarded = true;
        baseXp += XP_RULES.DAILY_GOAL_BONUS_XP;
      }
    }

    runningValue = newVal;
    return {
      ...log,
      xp: baseXp,
    };
  });
}

/**
 * Recomputes XP across all logs for all trackers.
 * Used during data import, tracker updates, or bulk log changes.
 */
export function recomputeAllLogsXp(trackers: Tracker[], logs: LogEntry[]): LogEntry[] {
  const trackerMap = new Map<string, Tracker>();
  trackers.forEach(t => trackerMap.set(t.id, t));

  // Group tracker logs by trackerId:dayKey
  const grouped = new Map<string, LogEntry[]>();
  const questLogs: LogEntry[] = [];

  for (const log of logs) {
    if (log.source === 'tracker' && log.trackerId) {
      const key = `${log.trackerId}:${log.dayKey}`;
      const group = grouped.get(key) || [];
      group.push(log);
      grouped.set(key, group);
    } else {
      questLogs.push(log);
    }
  }

  const recomputedTrackerLogs: LogEntry[] = [];
  for (const [key, groupLogs] of grouped.entries()) {
    const trackerId = key.split(':')[0];
    const dayKey = key.split(':')[1];
    const tracker = trackerMap.get(trackerId);

    if (tracker) {
      const recomputed = recomputeTrackerDayLogs(tracker, dayKey, groupLogs);
      recomputedTrackerLogs.push(...recomputed);
    } else {
      // Tracker deleted/not found: retain existing xp
      recomputedTrackerLogs.push(...groupLogs);
    }
  }

  // Preserve original order by re-mapping from original logs list
  const recomputedMap = new Map<string, LogEntry>();
  recomputedTrackerLogs.forEach(l => recomputedMap.set(l.id, l));

  return logs.map(l => recomputedMap.get(l.id) || l);
}

/**
 * Calculates XP for completing a quest.
 */
export function calculateXpForQuest(quest: Quest): number {
  const diffXp = XP_RULES.QUEST_DIFFICULTY_XP[quest.difficulty] || XP_RULES.QUEST_DIFFICULTY_XP[1];
  const mainBonus = quest.kind === 'main' ? XP_RULES.QUEST_MAIN_BONUS_XP : 0;
  return diffXp + mainBonus;
}

/**
 * Sum up total XP across all logs.
 */
export function getTotalXpFromLogs(logs: LogEntry[]): number {
  return logs.reduce((sum, entry) => sum + (entry.xp || 0), 0);
}

export { calculateLevelFromTotalXp };
