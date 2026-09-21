export type TrackerType = 'tally' | 'timer' | 'habit';

export type GoalPeriod = 'day' | 'week';

export interface TrackerGoal {
  amount: number;
  period: GoalPeriod;
}

export type ScheduleType = 
  | { type: 'daily' }
  | { type: 'weekdays'; days: number[] } // 0 = Sun, 1 = Mon, ..., 6 = Sat
  | { type: 'times_per_week'; times: number };

export interface Category {
  id: string;
  name: string;
  elementColor: string; // Hex or theme color key
  icon: string; // Identifier for PixelIcon
}

export interface Tracker {
  id: string;
  categoryId: string;
  name: string;
  icon: string;
  type: TrackerType;
  unit?: string; // e.g. "times", "reps", "min", "pages"
  goal?: TrackerGoal;
  schedule: ScheduleType;
  difficulty: 1 | 2 | 3;
  archived: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export type QuestKind = 'main' | 'side';
export type QuestStatus = 'active' | 'completed' | 'abandoned';

export interface Quest {
  id: string;
  title: string;
  categoryId?: string;
  kind: QuestKind;
  difficulty: 1 | 2 | 3;
  dueDate?: string; // YYYY-MM-DD
  subtasks: Subtask[];
  status: QuestStatus;
  createdAt: string; // ISO string
  completedAt?: string; // ISO string
}

export type LogSource = 'tracker' | 'quest';

export interface LogEntry {
  id: string;
  source: LogSource;
  trackerId?: string;
  questId?: string;
  type: TrackerType | 'quest';
  at: string; // ISO string
  dayKey: string; // Local YYYY-MM-DD
  value: number; // count, minutes, or 1
  note?: string;
  xp: number; // Stored at the time of logging
}

export interface ActiveTimer {
  trackerId: string;
  startedAt: string; // ISO string
  elapsedBeforeStart: number; // seconds accumulated before current pause/resume
}

export type SceneMotion = 'full' | 'calm' | 'off';
export type SceneSeason = 'auto' | 'spring' | 'summer' | 'autumn' | 'winter';

export interface ProfileSettings {
  location: string | null; // Extension point for future weather
  soundEnabled: boolean;
  pixelScale: 'compact' | 'standard' | 'large';
  theme: string;
  motion?: SceneMotion;
  season?: SceneSeason;
  sceneDebug?: boolean;
}

export interface AppState {
  version: number;
  categories: Category[];
  trackers: Tracker[];
  quests: Quest[];
  logs: LogEntry[];
  activeTimers: Record<string, ActiveTimer>; // trackerId -> ActiveTimer
  profile: {
    name: string;
    avatar: string;
    settings: ProfileSettings;
  };
}

export type HotbarSlotId = 'base_camp' | 'tally_log' | 'quest_board' | 'chronicle' | 'inventory' | 'character';

export interface HotbarItem {
  id: HotbarSlotId;
  name: string;
  icon: string;
  locked?: boolean;
  badgeCount?: number;
}
