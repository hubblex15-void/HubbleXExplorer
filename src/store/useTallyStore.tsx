import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { AppState, LogEntry, Tracker, Quest, Category, ActiveTimer } from '../types/index.ts';
import { createInitialState } from './initialData.ts';
import { getTodayKey } from '../lib/dates.ts';
import {
  calculateXpForQuest,
  getTotalXpFromLogs,
  calculateLevelFromTotalXp,
  recomputeTrackerDayLogs,
  recomputeAllLogsXp,
} from '../lib/xp.ts';
import { calculateStreaks } from '../lib/streaks.ts';
import { XP_RULES } from '../xpRules.ts';

const STORAGE_KEY = 'tallyrealm:v2';
const CURRENT_VERSION = 2;

export interface CelebrationEvent {
  id: string;
  type: 'level_up' | 'quest_complete' | 'goal_hit';
  title: string;
  subtitle?: string;
  xpAwarded?: number;
  newLevel?: number;
}

interface TallyContextType {
  state: AppState;
  todayKey: string;
  totalXp: number;
  levelInfo: ReturnType<typeof calculateLevelFromTotalXp>;
  streaks: ReturnType<typeof calculateStreaks>;
  activeCelebration: CelebrationEvent | null;
  dismissCelebration: () => void;

  // Category Modal
  isCategoryModalOpen: boolean;
  openCategoryModal: () => void;
  closeCategoryModal: () => void;

  // Tracker Actions
  logTally: (trackerId: string, amount: number, note?: string, customDayKey?: string) => void;
  toggleHabit: (trackerId: string, customDayKey?: string) => void;
  startTimer: (trackerId: string) => void;
  stopTimer: (trackerId: string, note?: string) => void;
  cancelTimer: (trackerId: string) => void;
  logManualTimer: (trackerId: string, minutes: number, note?: string, customDayKey?: string) => void;

  // Generic Log Entry Management
  addLogEntry: (entry: Omit<LogEntry, 'id' | 'xp'> & { xp?: number }) => void;
  editLogEntry: (id: string, updates: Partial<Pick<LogEntry, 'value' | 'note' | 'dayKey'>>) => void;
  deleteLogEntry: (id: string) => void;

  // Tracker CRUD
  createTracker: (tracker: Omit<Tracker, 'id'>) => void;
  updateTracker: (id: string, updates: Partial<Tracker>) => void;
  archiveTracker: (id: string) => void;
  deleteTracker: (id: string) => void;

  // Quest Actions
  createQuest: (quest: Omit<Quest, 'id' | 'createdAt' | 'status'>) => void;
  updateQuest: (id: string, updates: Partial<Quest>) => void;
  toggleSubtask: (questId: string, subtaskId: string) => void;
  completeQuest: (questId: string) => void;
  reopenQuest: (questId: string) => void;
  deleteQuest: (questId: string) => void;

  // Category Actions
  createCategory: (cat: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string, options?: { reassignToCategoryId?: string; archiveTrackers?: boolean }) => void;

  // Storage & Export
  exportDataJson: () => string;
  importDataJson: (jsonStr: string) => { success: boolean; error?: string };
  eraseAllData: () => void;
  resetToDemoData: () => void;
  updateSettings: (settings: Partial<AppState['profile']['settings']>) => void;
  updateProfileName: (name: string) => void;
}

const TallyContext = createContext<TallyContextType | null>(null);

function migrateState(oldState: any): AppState {
  return {
    version: CURRENT_VERSION,
    categories: Array.isArray(oldState.categories) ? oldState.categories : [],
    trackers: Array.isArray(oldState.trackers) ? oldState.trackers : [],
    quests: Array.isArray(oldState.quests) ? oldState.quests : [],
    logs: Array.isArray(oldState.logs) ? oldState.logs : [],
    activeTimers:
      oldState.activeTimers && typeof oldState.activeTimers === 'object'
        ? oldState.activeTimers
        : {},
    profile: {
      name: typeof oldState.profile?.name === 'string' ? oldState.profile.name : '',
      avatar: typeof oldState.profile?.avatar === 'string' ? oldState.profile.avatar : 'steve',
      settings: {
        location: oldState.profile?.settings?.location ?? null,
        soundEnabled: Boolean(oldState.profile?.settings?.soundEnabled),
        pixelScale: oldState.profile?.settings?.pixelScale || 'standard',
        theme:
          typeof oldState.profile?.settings?.theme === 'string'
            ? oldState.profile.settings.theme
            : 'overworld',
        motion: oldState.profile?.settings?.motion || 'full',
        season: oldState.profile?.settings?.season || 'auto',
        sceneDebug: Boolean(oldState.profile?.settings?.sceneDebug),
      },
    },
  };
}

function loadPersistedState(): AppState {
  try {
    // Delete legacy v1 storage key on load so old demo data disappears
    try {
      localStorage.removeItem('tallyrealm:v1');
    } catch (e) {
      // Ignore storage errors in restricted contexts
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);

    return migrateState(parsed);
  } catch (err) {
    console.error('[TallyRealm] Failed to parse stored state, starting fresh:', err);
    return createInitialState();
  }
}

export const TallyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(loadPersistedState);
  const [todayKey, setTodayKey] = useState<string>(getTodayKey());
  const [activeCelebration, setActiveCelebration] = useState<CelebrationEvent | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Persist state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('[TallyRealm] Failed to save state to localStorage:', err);
    }
  }, [state]);

  // Track midnight & focus changes to refresh todayKey
  useEffect(() => {
    const checkDate = () => {
      const nowKey = getTodayKey();
      if (nowKey !== todayKey) {
        setTodayKey(nowKey);
      }
    };

    window.addEventListener('focus', checkDate);
    document.addEventListener('visibilitychange', checkDate);
    const interval = setInterval(checkDate, 15000);

    return () => {
      window.removeEventListener('focus', checkDate);
      document.removeEventListener('visibilitychange', checkDate);
      clearInterval(interval);
    };
  }, [todayKey]);

  // Derived calculations: XP, level, streaks
  const totalXp = useMemo(() => getTotalXpFromLogs(state.logs), [state.logs]);
  const levelInfo = useMemo(() => calculateLevelFromTotalXp(totalXp), [totalXp]);
  const streaks = useMemo(() => calculateStreaks(state.logs, todayKey), [state.logs, todayKey]);

  // Check for level-up celebration when level changes (skip on initial load)
  const prevLevelRef = useRef(levelInfo.level);
  const isFirstMountRef = useRef(true);

  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      prevLevelRef.current = levelInfo.level;
      return;
    }

    if (levelInfo.level > prevLevelRef.current) {
      setActiveCelebration({
        id: `lvl-${Date.now()}`,
        type: 'level_up',
        title: `LEVEL UP! REACHED LVL ${levelInfo.level}`,
        subtitle: `Max HP, stamina, and tracker prowess increased!`,
        newLevel: levelInfo.level,
      });
    }
    prevLevelRef.current = levelInfo.level;
  }, [levelInfo.level]);

  const dismissCelebration = useCallback(() => {
    setActiveCelebration(null);
  }, []);

  const openCategoryModal = useCallback(() => {
    setIsCategoryModalOpen(true);
  }, []);

  const closeCategoryModal = useCallback(() => {
    setIsCategoryModalOpen(false);
  }, []);

  // --- ACTIONS ---

  const logTally = useCallback(
    (trackerId: string, amount: number, note?: string, customDayKey?: string) => {
      const tracker = state.trackers.find(t => t.id === trackerId);
      if (!tracker) return;

      const targetDay = customDayKey || todayKey;
      const existingTrackerDayLogs = state.logs.filter(
        l => l.trackerId === trackerId && l.dayKey === targetDay
      );
      const prevSum = existingTrackerDayLogs.reduce((s, l) => s + (l.value || 0), 0);
      const newSum = prevSum + amount;

      const newEntry: LogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        source: 'tracker',
        trackerId,
        type: 'tally',
        at: new Date().toISOString(),
        dayKey: targetDay,
        value: amount,
        note,
        xp: 0,
      };

      // Recompute all day logs for this tracker to maintain caps & goal bonuses
      const updatedDayLogs = recomputeTrackerDayLogs(tracker, targetDay, [
        ...existingTrackerDayLogs,
        newEntry,
      ]);

      // Check if daily goal bonus triggered
      let goalHit = false;
      if (tracker.goal && tracker.goal.period === 'day' && tracker.goal.amount > 0) {
        if (prevSum < tracker.goal.amount && newSum >= tracker.goal.amount) {
          goalHit = true;
        }
      }

      setState(prev => {
        const otherLogs = prev.logs.filter(
          l => !(l.trackerId === trackerId && l.dayKey === targetDay)
        );
        return {
          ...prev,
          logs: [...updatedDayLogs.reverse(), ...otherLogs],
        };
      });

      // Fire celebration safely from action handler
      if (goalHit) {
        setActiveCelebration({
          id: `goal-${Date.now()}`,
          type: 'goal_hit',
          title: `DAILY GOAL ACHIEVED!`,
          subtitle: `Hit target for "${tracker.name}" (+20 Goal Bonus XP!)`,
          xpAwarded: XP_RULES.DAILY_GOAL_BONUS_XP,
        });
      }
    },
    [todayKey, state.trackers, state.logs]
  );

  const toggleHabit = useCallback(
    (trackerId: string, customDayKey?: string) => {
      const tracker = state.trackers.find(t => t.id === trackerId);
      if (!tracker) return;

      const targetDay = customDayKey || todayKey;
      const existingLog = state.logs.find(
        l => l.trackerId === trackerId && l.dayKey === targetDay && l.value > 0
      );

      if (existingLog) {
        // Undo habit check
        setState(prev => {
          const remainingLogs = prev.logs.filter(l => l.id !== existingLog.id);
          return {
            ...prev,
            logs: remainingLogs,
          };
        });
      } else {
        // Check off habit
        const newEntry: LogEntry = {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          source: 'tracker',
          trackerId,
          type: 'habit',
          at: new Date().toISOString(),
          dayKey: targetDay,
          value: 1,
          xp: XP_RULES.HABIT_XP,
        };

        setState(prev => ({
          ...prev,
          logs: [newEntry, ...prev.logs],
        }));
      }
    },
    [todayKey, state.trackers, state.logs]
  );

  const startTimer = useCallback((trackerId: string) => {
    setState(prev => ({
      ...prev,
      activeTimers: {
        ...prev.activeTimers,
        [trackerId]: {
          trackerId,
          startedAt: new Date().toISOString(),
          elapsedBeforeStart: 0,
        },
      },
    }));
  }, []);

  const stopTimer = useCallback(
    (trackerId: string, note?: string) => {
      const active = state.activeTimers[trackerId];
      const tracker = state.trackers.find(t => t.id === trackerId);
      if (!active || !tracker) return;

      const startMs = new Date(active.startedAt).getTime();
      const nowMs = Date.now();
      const elapsedSeconds =
        active.elapsedBeforeStart + Math.max(0, Math.round((nowMs - startMs) / 1000));

      // Discard timers < 30s as required
      if (elapsedSeconds < 30) {
        setState(prev => {
          const nextTimers = { ...prev.activeTimers };
          delete nextTimers[trackerId];
          return {
            ...prev,
            activeTimers: nextTimers,
          };
        });
        return;
      }

      const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
      const existingTrackerDayLogs = state.logs.filter(
        l => l.trackerId === trackerId && l.dayKey === todayKey
      );
      const prevSum = existingTrackerDayLogs.reduce((s, l) => s + (l.value || 0), 0);
      const newSum = prevSum + elapsedMinutes;

      const newEntry: LogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        source: 'tracker',
        trackerId,
        type: 'timer',
        at: new Date().toISOString(),
        dayKey: todayKey,
        value: elapsedMinutes,
        note: note || `Logged ${elapsedMinutes}m timer session`,
        xp: 0,
      };

      const updatedDayLogs = recomputeTrackerDayLogs(tracker, todayKey, [
        ...existingTrackerDayLogs,
        newEntry,
      ]);

      let goalHit = false;
      if (tracker.goal && tracker.goal.period === 'day' && tracker.goal.amount > 0) {
        if (prevSum < tracker.goal.amount && newSum >= tracker.goal.amount) {
          goalHit = true;
        }
      }

      setState(prev => {
        const nextTimers = { ...prev.activeTimers };
        delete nextTimers[trackerId];
        const otherLogs = prev.logs.filter(
          l => !(l.trackerId === trackerId && l.dayKey === todayKey)
        );

        return {
          ...prev,
          activeTimers: nextTimers,
          logs: [...updatedDayLogs.reverse(), ...otherLogs],
        };
      });

      if (goalHit) {
        setActiveCelebration({
          id: `goal-${Date.now()}`,
          type: 'goal_hit',
          title: `DAILY GOAL REACHED!`,
          subtitle: `Hit time goal for "${tracker.name}" (+20 Goal Bonus XP!)`,
          xpAwarded: XP_RULES.DAILY_GOAL_BONUS_XP,
        });
      }
    },
    [todayKey, state.activeTimers, state.trackers, state.logs]
  );

  const cancelTimer = useCallback((trackerId: string) => {
    setState(prev => {
      const nextTimers = { ...prev.activeTimers };
      delete nextTimers[trackerId];
      return {
        ...prev,
        activeTimers: nextTimers,
      };
    });
  }, []);

  const logManualTimer = useCallback(
    (trackerId: string, minutes: number, note?: string, customDayKey?: string) => {
      const tracker = state.trackers.find(t => t.id === trackerId);
      if (!tracker) return;

      const targetDay = customDayKey || todayKey;
      const existingTrackerDayLogs = state.logs.filter(
        l => l.trackerId === trackerId && l.dayKey === targetDay
      );
      const prevSum = existingTrackerDayLogs.reduce((s, l) => s + (l.value || 0), 0);
      const newSum = prevSum + minutes;

      const newEntry: LogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        source: 'tracker',
        trackerId,
        type: 'timer',
        at: new Date().toISOString(),
        dayKey: targetDay,
        value: minutes,
        note,
        xp: 0,
      };

      const updatedDayLogs = recomputeTrackerDayLogs(tracker, targetDay, [
        ...existingTrackerDayLogs,
        newEntry,
      ]);

      let goalHit = false;
      if (tracker.goal && tracker.goal.period === 'day' && tracker.goal.amount > 0) {
        if (prevSum < tracker.goal.amount && newSum >= tracker.goal.amount) {
          goalHit = true;
        }
      }

      setState(prev => {
        const otherLogs = prev.logs.filter(
          l => !(l.trackerId === trackerId && l.dayKey === targetDay)
        );
        return {
          ...prev,
          logs: [...updatedDayLogs.reverse(), ...otherLogs],
        };
      });

      if (goalHit) {
        setActiveCelebration({
          id: `goal-${Date.now()}`,
          type: 'goal_hit',
          title: `DAILY GOAL ACHIEVED!`,
          subtitle: `Hit target for "${tracker.name}" (+20 Goal Bonus XP!)`,
          xpAwarded: XP_RULES.DAILY_GOAL_BONUS_XP,
        });
      }
    },
    [todayKey, state.trackers, state.logs]
  );

  const addLogEntry = useCallback((entry: Omit<LogEntry, 'id' | 'xp'> & { xp?: number }) => {
    setState(prev => {
      const newEntry: LogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ...entry,
        xp: entry.xp ?? 5,
      };
      return {
        ...prev,
        logs: [newEntry, ...prev.logs],
      };
    });
  }, []);

  const editLogEntry = useCallback(
    (id: string, updates: Partial<Pick<LogEntry, 'value' | 'note' | 'dayKey'>>) => {
      setState(prev => {
        const targetLog = prev.logs.find(l => l.id === id);
        if (!targetLog) return prev;

        const updatedLogs = prev.logs.map(log => {
          if (log.id !== id) return log;
          return { ...log, ...updates };
        });

        if (targetLog.trackerId) {
          const tracker = prev.trackers.find(t => t.id === targetLog.trackerId);
          if (tracker) {
            // Recompute XP for affected day(s)
            const daysToRecompute = new Set<string>([targetLog.dayKey]);
            if (updates.dayKey && updates.dayKey !== targetLog.dayKey) {
              daysToRecompute.add(updates.dayKey);
            }

            let resultLogs = updatedLogs;
            for (const dKey of daysToRecompute) {
              const dayLogs = resultLogs.filter(
                l => l.trackerId === tracker.id && l.dayKey === dKey
              );
              const recomputed = recomputeTrackerDayLogs(tracker, dKey, dayLogs);
              const recomputedMap = new Map(recomputed.map(l => [l.id, l]));
              resultLogs = resultLogs.map(l => recomputedMap.get(l.id) || l);
            }
            return {
              ...prev,
              logs: resultLogs,
            };
          }
        }

        return {
          ...prev,
          logs: updatedLogs,
        };
      });
    },
    []
  );

  const deleteLogEntry = useCallback((id: string) => {
    setState(prev => {
      const targetLog = prev.logs.find(l => l.id === id);
      const remainingLogs = prev.logs.filter(l => l.id !== id);

      if (targetLog && targetLog.trackerId) {
        const tracker = prev.trackers.find(t => t.id === targetLog.trackerId);
        if (tracker) {
          const dayLogs = remainingLogs.filter(
            l => l.trackerId === tracker.id && l.dayKey === targetLog.dayKey
          );
          const recomputed = recomputeTrackerDayLogs(tracker, targetLog.dayKey, dayLogs);
          const recomputedMap = new Map(recomputed.map(l => [l.id, l]));
          return {
            ...prev,
            logs: remainingLogs.map(l => recomputedMap.get(l.id) || l),
          };
        }
      }

      return {
        ...prev,
        logs: remainingLogs,
      };
    });
  }, []);

  // Trackers
  const createTracker = useCallback((trackerData: Omit<Tracker, 'id'>) => {
    const id = `trk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setState(prev => ({
      ...prev,
      trackers: [...prev.trackers, { ...trackerData, id }],
    }));
  }, []);

  const updateTracker = useCallback((id: string, updates: Partial<Tracker>) => {
    setState(prev => {
      const updatedTrackers = prev.trackers.map(t => (t.id === id ? { ...t, ...updates } : t));
      const updatedTracker = updatedTrackers.find(t => t.id === id);
      if (updatedTracker && updates.goal !== undefined) {
        // If goal changed, recompute XP on all logs for this tracker
        const trackerLogs = prev.logs.filter(l => l.trackerId === id);
        const dayKeys = Array.from(new Set(trackerLogs.map(l => l.dayKey)));
        let resultLogs = prev.logs;
        for (const dKey of dayKeys) {
          const dayLogs = resultLogs.filter(l => l.trackerId === id && l.dayKey === dKey);
          const recomputed = recomputeTrackerDayLogs(updatedTracker, dKey, dayLogs);
          const recomputedMap = new Map(recomputed.map(l => [l.id, l]));
          resultLogs = resultLogs.map(l => recomputedMap.get(l.id) || l);
        }
        return {
          ...prev,
          trackers: updatedTrackers,
          logs: resultLogs,
        };
      }

      return {
        ...prev,
        trackers: updatedTrackers,
      };
    });
  }, []);

  const archiveTracker = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      trackers: prev.trackers.map(t => (t.id === id ? { ...t, archived: !t.archived } : t)),
    }));
  }, []);

  const deleteTracker = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      trackers: prev.trackers.filter(t => t.id !== id),
      logs: prev.logs.filter(l => l.trackerId !== id),
    }));
  }, []);

  // Quests
  const createQuest = useCallback((questData: Omit<Quest, 'id' | 'createdAt' | 'status'>) => {
    const id = `qst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setState(prev => ({
      ...prev,
      quests: [
        {
          ...questData,
          id,
          status: 'active',
          createdAt: new Date().toISOString(),
        },
        ...prev.quests,
      ],
    }));
  }, []);

  const updateQuest = useCallback((id: string, updates: Partial<Quest>) => {
    setState(prev => ({
      ...prev,
      quests: prev.quests.map(q => (q.id === id ? { ...q, ...updates } : q)),
    }));
  }, []);

  const toggleSubtask = useCallback((questId: string, subtaskId: string) => {
    setState(prev => ({
      ...prev,
      quests: prev.quests.map(q => {
        if (q.id !== questId) return q;
        return {
          ...q,
          subtasks: q.subtasks.map(st => (st.id === subtaskId ? { ...st, done: !st.done } : st)),
        };
      }),
    }));
  }, []);

  const completeQuest = useCallback(
    (questId: string) => {
      const quest = state.quests.find(q => q.id === questId);
      if (!quest || quest.status === 'completed') return;

      const xp = calculateXpForQuest(quest);
      const logEntry: LogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        source: 'quest',
        questId,
        type: 'quest',
        at: new Date().toISOString(),
        dayKey: todayKey,
        value: 1,
        note: `Completed ${quest.kind === 'main' ? 'Main Quest' : 'Side Quest'}: "${quest.title}"`,
        xp,
      };

      setState(prev => ({
        ...prev,
        quests: prev.quests.map(q =>
          q.id === questId
            ? { ...q, status: 'completed', completedAt: new Date().toISOString() }
            : q
        ),
        logs: [logEntry, ...prev.logs],
      }));

      // Fire celebration safely outside state updater
      setActiveCelebration({
        id: `qst-done-${Date.now()}`,
        type: 'quest_complete',
        title: 'QUEST COMPLETED!',
        subtitle: `"${quest.title}" +${xp} XP awarded!`,
        xpAwarded: xp,
      });
    },
    [todayKey, state.quests]
  );

  const reopenQuest = useCallback((questId: string) => {
    setState(prev => ({
      ...prev,
      quests: prev.quests.map(q =>
        q.id === questId ? { ...q, status: 'active', completedAt: undefined } : q
      ),
      logs: prev.logs.filter(l => !(l.source === 'quest' && l.questId === questId)),
    }));
  }, []);

  const deleteQuest = useCallback((questId: string) => {
    setState(prev => ({
      ...prev,
      quests: prev.quests.filter(q => q.id !== questId),
      logs: prev.logs.filter(l => !(l.source === 'quest' && l.questId === questId)),
    }));
  }, []);

  // Categories
  const createCategory = useCallback((cat: Omit<Category, 'id'>) => {
    const id = `cat-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setState(prev => ({
      ...prev,
      categories: [...prev.categories, { ...cat, id }],
    }));
  }, []);

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(c => (c.id === id ? { ...c, ...updates } : c)),
    }));
  }, []);

  const deleteCategory = useCallback(
    (id: string, options?: { reassignToCategoryId?: string; archiveTrackers?: boolean }) => {
      setState(prev => {
        const remainingCategories = prev.categories.filter(c => c.id !== id);
        const targetCatId = options?.reassignToCategoryId || remainingCategories[0]?.id || '';
        const shouldArchive = Boolean(options?.archiveTrackers);

        const updatedTrackers = prev.trackers.map(t => {
          if (t.categoryId === id) {
            return {
              ...t,
              categoryId: targetCatId,
              archived: shouldArchive ? true : t.archived,
            };
          }
          return t;
        });

        const updatedQuests = prev.quests.map(q => {
          if (q.categoryId === id) {
            return {
              ...q,
              categoryId: targetCatId || undefined,
            };
          }
          return q;
        });

        return {
          ...prev,
          categories: remainingCategories,
          trackers: updatedTrackers,
          quests: updatedQuests,
        };
      });
    },
    []
  );

  // Settings & Storage
  const exportDataJson = useCallback(() => {
    return JSON.stringify(state, null, 2);
  }, [state]);

  const importDataJson = useCallback((jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { success: false, error: 'Imported data must be a valid JSON object.' };
      }

      if (!Array.isArray(parsed.categories)) {
        return { success: false, error: 'Invalid JSON shape: "categories" must be an array.' };
      }
      for (const c of parsed.categories) {
        if (!c || typeof c.id !== 'string' || typeof c.name !== 'string') {
          return { success: false, error: 'Category items must contain valid id and name strings.' };
        }
      }

      if (!Array.isArray(parsed.trackers)) {
        return { success: false, error: 'Invalid JSON shape: "trackers" must be an array.' };
      }
      for (const t of parsed.trackers) {
        if (
          !t ||
          typeof t.id !== 'string' ||
          typeof t.name !== 'string' ||
          !['tally', 'timer', 'habit'].includes(t.type)
        ) {
          return {
            success: false,
            error: 'Tracker items must contain valid id, name, and type ("tally", "timer", "habit").',
          };
        }
      }

      if (parsed.quests && !Array.isArray(parsed.quests)) {
        return { success: false, error: 'Invalid JSON shape: "quests" must be an array.' };
      }

      if (parsed.logs && !Array.isArray(parsed.logs)) {
        return { success: false, error: 'Invalid JSON shape: "logs" must be an array.' };
      }

      const migrated = migrateState(parsed);
      // Recompute all logs to guarantee XP integrity
      migrated.logs = recomputeAllLogsXp(migrated.trackers, migrated.logs);

      setState(migrated);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Could not parse JSON file.' };
    }
  }, []);

  const eraseAllData = useCallback(() => {
    const emptyState = createInitialState();
    setState(emptyState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyState));
    } catch (e) {}
  }, []);

  const updateSettings = useCallback((settings: Partial<AppState['profile']['settings']>) => {
    setState(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        settings: {
          ...prev.profile.settings,
          ...settings,
        },
      },
    }));
  }, []);

  const updateProfileName = useCallback((name: string) => {
    setState(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        name: name.trim(),
      },
    }));
  }, []);

  const contextValue: TallyContextType = {
    state,
    todayKey,
    totalXp,
    levelInfo,
    streaks,
    activeCelebration,
    dismissCelebration,
    isCategoryModalOpen,
    openCategoryModal,
    closeCategoryModal,
    logTally,
    toggleHabit,
    startTimer,
    stopTimer,
    cancelTimer,
    logManualTimer,
    addLogEntry,
    editLogEntry,
    deleteLogEntry,
    createTracker,
    updateTracker,
    archiveTracker,
    deleteTracker,
    createQuest,
    updateQuest,
    toggleSubtask,
    completeQuest,
    reopenQuest,
    deleteQuest,
    createCategory,
    updateCategory,
    deleteCategory,
    exportDataJson,
    importDataJson,
    eraseAllData,
    resetToDemoData: eraseAllData,
    updateSettings,
    updateProfileName,
  };

  return <TallyContext.Provider value={contextValue}>{children}</TallyContext.Provider>;
};

export function useTallyStore(): TallyContextType {
  const ctx = useContext(TallyContext);
  if (!ctx) {
    throw new Error('useTallyStore must be used within a TallyProvider');
  }
  return ctx;
}
