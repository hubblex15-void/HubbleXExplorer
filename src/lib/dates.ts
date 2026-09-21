/**
 * Date utility functions using local time.
 * Weeks start on Monday as per specifications.
 */

export function getTodayKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDayKey(dayKey: string): Date {
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0); // midday to avoid DST shifts
}

export function formatFriendlyDate(dayKey: string): string {
  const today = getTodayKey();
  if (dayKey === today) return 'Today';
  
  const yesterday = getPreviousDayKey(today);
  if (dayKey === yesterday) return 'Yesterday';

  const date = parseDayKey(dayKey);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function getPreviousDayKey(dayKey: string): string {
  const date = parseDayKey(dayKey);
  date.setDate(date.getDate() - 1);
  return getTodayKey(date);
}

export function getNextDayKey(dayKey: string): string {
  const date = parseDayKey(dayKey);
  date.setDate(date.getDate() + 1);
  return getTodayKey(date);
}

/**
 * Returns Monday of the week for given dayKey (weeks start Monday).
 */
export function getMondayOfWeek(dayKey: string): string {
  const date = parseDayKey(dayKey);
  const day = date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  // In Monday-first system:
  // Mon(1) -> 0 days back
  // Tue(2) -> 1 day back
  // Sun(0) -> 6 days back
  const diffToMonday = (day + 6) % 7;
  date.setDate(date.getDate() - diffToMonday);
  return getTodayKey(date);
}

/**
 * Get all 7 dayKeys for the week starting from the Monday of dayKey.
 */
export function getWeekDayKeys(dayKey: string): string[] {
  const mondayKey = getMondayOfWeek(dayKey);
  const result: string[] = [];
  let curr = mondayKey;
  for (let i = 0; i < 7; i++) {
    result.push(curr);
    curr = getNextDayKey(curr);
  }
  return result;
}

/**
 * Returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday.
 */
export function getDayOfWeekNumber(dayKey: string): number {
  return parseDayKey(dayKey).getDay();
}

/**
 * Checks if two dayKeys are in the same Monday-starting week.
 */
export function isSameWeek(dayKeyA: string, dayKeyB: string): boolean {
  return getMondayOfWeek(dayKeyA) === getMondayOfWeek(dayKeyB);
}
