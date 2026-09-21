import { Tracker, LogEntry } from '../types/index.ts';
import { getDayOfWeekNumber, isSameWeek } from './dates.ts';

/**
 * Determines whether a tracker is due on the given dayKey.
 */
export function isTrackerDueOnDay(tracker: Tracker, dayKey: string, logs: LogEntry[] = []): boolean {
  if (tracker.archived) return false;

  const schedule = tracker.schedule;
  if (!schedule || schedule.type === 'daily') {
    return true;
  }

  if (schedule.type === 'weekdays') {
    const dayOfWeek = getDayOfWeekNumber(dayKey);
    return schedule.days.includes(dayOfWeek);
  }

  if (schedule.type === 'times_per_week') {
    // Count how many times completed in the same week as dayKey
    const completionsThisWeek = logs.filter(
      l => l.trackerId === tracker.id && isSameWeek(l.dayKey, dayKey) && l.value > 0
    ).length;

    // Check if logged on this exact day
    const loggedThisDay = logs.some(
      l => l.trackerId === tracker.id && l.dayKey === dayKey && l.value > 0
    );

    // If already logged today, it stays visible so user can see completion/undo
    if (loggedThisDay) return true;

    // Otherwise, it's due if weekly target hasn't been met yet
    return completionsThisWeek < schedule.times;
  }

  return true;
}

/**
 * Calculate weekly completions for a tracker
 */
export function getWeeklyCompletionsCount(trackerId: string, dayKey: string, logs: LogEntry[]): number {
  return logs.filter(
    l => l.trackerId === trackerId && isSameWeek(l.dayKey, dayKey) && l.value > 0
  ).length;
}
