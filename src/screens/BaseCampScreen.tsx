import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTallyStore } from '../store/useTallyStore.tsx';
import { PixelPanel } from '../components/ui/PixelPanel.tsx';
import { PixelButton } from '../components/ui/PixelButton.tsx';
import { PixelIcon } from '../components/ui/PixelIcon.tsx';
import { SegmentedBar } from '../components/ui/SegmentedBar.tsx';
import { QuickAddBar } from '../components/ui/QuickAddBar.tsx';
import { PetSlot } from '../components/ui/PetSlot.tsx';
import { DialogueBox } from '../components/ui/DialogueBox.tsx';
import { isTrackerDueOnDay } from '../lib/schedule.ts';
import { TallyMarks } from '../components/ui/TallyMarks.tsx';
import {
  LivingSceneView,
  SceneClock,
  useLiveEnvironment,
  loadPlace,
  ACTS,
  type SceneHandle,
  type Place,
  type WeatherTarget,
} from '../livingscene/index.ts';
import { WEATHER_PRESETS } from '../lib/weatherPresets.ts';
import { useParticleSpawner } from '../components/ui/ParticleLayer.tsx';

export interface BaseCampScreenProps {
  onNavigateToTallyLog: () => void;
  onNavigateToQuests: () => void;
  onWeatherChange?: (weather: WeatherTarget) => void;
}

export const BaseCampScreen: React.FC<BaseCampScreenProps> = ({
  onNavigateToTallyLog,
  onNavigateToQuests,
  onWeatherChange,
}) => {
  const {
    state,
    todayKey,
    streaks,
    levelInfo,
    activeCelebration,
    toggleHabit,
    logTally,
    startTimer,
    stopTimer,
    completeQuest,
    updateProfileName,
    openCategoryModal,
  } = useTallyStore();

  const sceneRef = useRef<SceneHandle>(null);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 640 : false));

  // Real-world location & live environment
  const [place, setPlace] = useState<Place | null>(() => loadPlace());
  const env = useLiveEnvironment(place, 20);

  // Sync place when saved in settings
  useEffect(() => {
    const handlePlaceChange = () => {
      setPlace(loadPlace());
    };
    window.addEventListener('livingscene:place-changed', handlePlaceChange);
    window.addEventListener('storage', handlePlaceChange);
    return () => {
      window.removeEventListener('livingscene:place-changed', handlePlaceChange);
      window.removeEventListener('storage', handlePlaceChange);
    };
  }, []);

  // Pass live weather to TopHUD clock
  useEffect(() => {
    if (env.weather && onWeatherChange) {
      onWeatherChange(env.weather);
    }
  }, [env.weather, onWeatherChange]);

  // Developer Scene Debug controls
  const [debugHour, setDebugHour] = useState<number | null>(null);

  const timeSource = useMemo(() => {
    if (debugHour === null) return undefined;
    return () => {
      const d = new Date();
      d.setHours(Math.floor(debugHour), Math.round((debugHour % 1) * 60), 0, 0);
      return d.getTime();
    };
  }, [debugHour]);

  useEffect(() => {
    const handleDebugWeather = (e: any) => {
      if (e.detail) {
        sceneRef.current?.engine().setWeather(e.detail);
      }
    };
    const handleDebugActivity = (e: any) => {
      if (e.detail) {
        sceneRef.current?.play(e.detail);
      }
    };
    const handleDebugTime = (e: any) => {
      setDebugHour(e.detail);
    };
    window.addEventListener('livingscene:debug-weather', handleDebugWeather);
    window.addEventListener('livingscene:debug-activity', handleDebugActivity);
    window.addEventListener('livingscene:debug-time', handleDebugTime);
    return () => {
      window.removeEventListener('livingscene:debug-weather', handleDebugWeather);
      window.removeEventListener('livingscene:debug-activity', handleDebugActivity);
      window.removeEventListener('livingscene:debug-time', handleDebugTime);
    };
  }, []);

  const getStatusChipText = () => {
    if (env.source === 'live') {
      if (!env.updatedAt) return 'Live weather';
      const mins = Math.max(0, Math.floor((Date.now() - env.updatedAt) / 60000));
      return `Live weather · updated ${mins === 0 ? 'just now' : `${mins} min ago`}`;
    }
    if (env.source === 'cached') {
      return 'Cached';
    }
    return 'Offline · showing clear skies';
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { spawnXpOrbs, spawnPlusOne } = useParticleSpawner();

  // First-run Getting Started state
  const [heroNameInput, setHeroNameInput] = useState('');
  const isGettingStarted =
    !state.profile.name || state.categories.length === 0 || state.trackers.length === 0;

  const handleSaveHeroName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroNameInput.trim()) return;
    updateProfileName(heroNameInput.trim());
    setHeroNameInput('');
  };

  // Due habits today
  const habitsDueToday = state.trackers.filter(
    t => t.type === 'habit' && !t.archived && isTrackerDueOnDay(t, todayKey, state.logs)
  );
  const totalHabits = state.trackers.filter(t => t.type === 'habit' && !t.archived).length;

  // Goal-based tally & timer trackers
  const goalTrackers = state.trackers.filter(
    t => (t.type === 'tally' || t.type === 'timer') && !t.archived && t.goal
  );

  // Quests due today or active
  const urgentQuests = state.quests.filter(q => {
    if (q.status !== 'active') return false;
    if (!q.dueDate) return true;
    return q.dueDate <= todayKey;
  });
  const totalActiveQuests = state.quests.filter(q => q.status === 'active').length;

  // Helper to get today's value for a tracker
  const getTodayValueForTracker = (trackerId: string) => {
    return state.logs
      .filter(l => l.trackerId === trackerId && l.dayKey === todayKey)
      .reduce((sum, l) => sum + (l.value || 0), 0);
  };

  // Helper to check if a habit is logged today
  const isHabitDoneToday = (trackerId: string) => {
    return state.logs.some(
      l => l.trackerId === trackerId && l.dayKey === todayKey && l.value > 0
    );
  };

  // Calculate LivingScene progress
  let cabinLevel = 1;
  if (levelInfo.level >= 5) cabinLevel += 1;
  if (levelInfo.level >= 10) cabinLevel += 1;

  const habitsComplete = habitsDueToday.length > 0 ? habitsDueToday.every(h => isHabitDoneToday(h.id)) : true;
  const dailyGoals = goalTrackers.filter(t => !t.goal || t.goal.period === 'day');
  const dailyGoalsComplete = dailyGoals.length > 0 ? dailyGoals.every(t => getTodayValueForTracker(t.id) >= (t.goal?.amount || 1)) : true;
  const hasGoalsToday = habitsDueToday.length > 0 || dailyGoals.length > 0;
  const goalsMet = hasGoalsToday && habitsComplete && dailyGoalsComplete;

  const sceneProgress = useMemo(() => ({
    streak: streaks.currentStreak,
    level: levelInfo.level,
    goalsMet,
    cabinLevel,
  }), [streaks.currentStreak, levelInfo.level, goalsMet, cabinLevel]);

  // Hook celebration events into the scene
  useEffect(() => {
    if (!activeCelebration || !sceneRef.current) return;
    if (activeCelebration.type === 'level_up') {
      sceneRef.current.celebrate('levelUp');
    } else if (activeCelebration.type === 'goal_hit') {
      sceneRef.current.celebrate('goal');
    } else if (activeCelebration.type === 'quest_complete') {
      sceneRef.current.celebrate('quest');
    }
  }, [activeCelebration]);

  const handleHabitClick = (e: React.MouseEvent, habitId: string) => {
    const isDone = isHabitDoneToday(habitId);
    toggleHabit(habitId);
    if (!isDone) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      spawnPlusOne(rect.left + 24, rect.top - 12, '✓ +10 XP');
      spawnXpOrbs(rect.left + 24, rect.top);
    }
  };

  const handleTallyClick = (e: React.MouseEvent, trackerId: string, amount: number) => {
    logTally(trackerId, amount);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    spawnPlusOne(rect.left + 20, rect.top - 10, `+${amount}`);
    spawnXpOrbs(rect.left + 20, rect.top);
  };

  return (
    <div className="space-y-6 pb-20 animate-pixel-slide-in">
      {/* 1. Cozy Cabin LivingScene at top of Base Camp */}
      <div className="space-y-2">
        <LivingSceneView
          ref={sceneRef}
          env={env}
          timeSource={timeSource}
          progress={sceneProgress}
          motion={state.profile.settings.motion || 'full'}
          season={state.profile.settings.season || 'auto'}
          aspect={isMobile ? '16 / 9' : '20 / 9'}
          className="w-full border-4 border-oak-dark shadow-[4px_4px_0_var(--cocoa)] overflow-hidden"
        />

        {/* Real-World Weather Status Chip */}
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-cream-deep border-2 border-oak-dark text-cocoa text-xs font-pixel-body shadow-[2px_2px_0_var(--cocoa)]">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 inline-block border border-cocoa ${
                env.source === 'live'
                  ? 'bg-moss'
                  : env.source === 'cached'
                  ? 'bg-honey'
                  : 'bg-berry'
              }`}
            />
            <span className="font-pixel-heading text-xs">{getStatusChipText()}</span>
            {place?.label && (
              <span className="text-cocoa-soft hidden sm:inline">({place.label})</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => env.refresh()}
            disabled={env.loading}
            title="Refresh live weather"
            className="px-2 py-0.5 bg-cream hover:bg-cream-deep border border-oak-dark font-pixel-heading text-xs text-cocoa cursor-pointer select-none active:translate-y-0.5 flex items-center gap-1 pixel-btn-block"
          >
            <span className={`inline-block text-sm leading-none ${env.loading ? 'animate-spin' : ''}`}>↻</span>
            <span>Refresh</span>
          </button>
        </div>

        {/* Scene Debug Panel (when Developer -> Scene debug is enabled) */}
        {state.profile.settings.sceneDebug && (
          <div className="p-3 bg-cream-deep border-2 border-oak-dark space-y-2.5 shadow-[2px_2px_0_var(--cocoa)]">
            <div className="flex items-center justify-between">
              <span className="font-pixel-heading text-xs text-moss font-bold">
                Scene Debug Mode Active
              </span>
              {debugHour !== null && (
                <button
                  type="button"
                  onClick={() => {
                    setDebugHour(null);
                    window.dispatchEvent(new CustomEvent('livingscene:debug-time', { detail: null }));
                  }}
                  className="text-xs font-pixel-heading text-cocoa-soft hover:text-cocoa underline cursor-pointer"
                >
                  Reset to real clock
                </button>
              )}
            </div>

            {/* Time of day slider (0-24h) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-pixel-heading text-cocoa">
                <span>Time of day (0–24h)</span>
                <span className="text-moss font-bold">
                  {debugHour !== null
                    ? `${String(Math.floor(debugHour)).padStart(2, '0')}:${String(Math.round((debugHour % 1) * 60)).padStart(2, '0')}`
                    : 'Real Time'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="24"
                step="0.25"
                value={debugHour ?? 12}
                onChange={e => {
                  const h = parseFloat(e.target.value);
                  setDebugHour(h);
                  window.dispatchEvent(new CustomEvent('livingscene:debug-time', { detail: h }));
                }}
                className="w-full accent-moss cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-pixel-body text-cocoa-soft">
                <span>0h (Night)</span>
                <span>6h (Dawn)</span>
                <span>12h (Noon)</span>
                <span>19h (Dusk)</span>
                <span>24h</span>
              </div>
            </div>

            {/* Weather buttons */}
            <div className="space-y-1">
              <span className="text-xs font-pixel-heading text-cocoa block">Weather</span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {(['clear', 'cloudy', 'rain', 'storm', 'snow', 'fog'] as const).map(wName => (
                  <button
                    key={wName}
                    type="button"
                    onClick={() => {
                      const target = WEATHER_PRESETS[wName];
                      sceneRef.current?.engine().setWeather(target);
                      window.dispatchEvent(new CustomEvent('livingscene:debug-weather', { detail: target }));
                    }}
                    className="py-1 px-1.5 text-center border-2 font-pixel-heading text-xs capitalize bg-cream text-cocoa border-oak-dark hover:bg-cream-deep cursor-pointer select-none pixel-btn-block"
                  >
                    {wName}
                  </button>
                ))}
              </div>
            </div>

            {/* Activity dropdown */}
            <div className="space-y-1">
              <label className="text-xs font-pixel-heading text-cocoa block">Force Character Activity</label>
              <select
                onChange={e => {
                  if (e.target.value) {
                    sceneRef.current?.play(e.target.value);
                    window.dispatchEvent(new CustomEvent('livingscene:debug-activity', { detail: e.target.value }));
                  }
                }}
                defaultValue=""
                className="w-full bg-cream border-2 border-oak-dark p-1.5 font-pixel-body text-sm text-cocoa outline-none shadow-[inset_1px_1px_0_var(--cocoa-soft)]"
              >
                <option value="" disabled>
                  Choose an activity to trigger...
                </option>
                {ACTS.map(act => (
                  <option key={act.id} value={act.id}>
                    {act.id} ({act.cat})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* First-Run Experience: Getting Started Card (disappears once complete) */}
      {isGettingStarted && (
        <div className="p-4 bg-cream border-4 border-oak-dark pixel-notched shadow-[4px_4px_0_var(--cocoa)]">
          <div className="flex items-center gap-2 mb-3">
            <PixelIcon name="star" size={18} />
            <h3 className="font-pixel-heading text-sm text-cocoa font-bold">
              Getting started • Realm embarkation
            </h3>
          </div>

          <div className="space-y-3">
            {/* Step 1: Adventurer Name */}
            <div className="p-3 bg-cream-deep border-2 border-oak-dark">
              {state.profile.name ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-moss-dark font-pixel-heading text-xs">
                    <PixelIcon name="check" size={14} />
                    <span>Adventurer name: <strong>{state.profile.name}</strong></span>
                  </div>
                  <span className="font-pixel-body text-sm text-cocoa-soft">
                    (Editable in settings)
                  </span>
                </div>
              ) : (
                <form onSubmit={handleSaveHeroName} className="space-y-2">
                  <label className="font-pixel-heading text-xs text-cocoa block">
                    Step 1: Choose your adventurer name
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={heroNameInput}
                      onChange={e => setHeroNameInput(e.target.value)}
                      placeholder="e.g. Steve, Robin, Lumine, Kael..."
                      className="flex-1 bg-cream border-2 border-oak-dark px-3 py-1 font-pixel-body text-base text-cocoa outline-none shadow-[inset_1px_1px_0_var(--cocoa-soft)]"
                    />
                    <PixelButton type="submit" size="sm" variant="moss">
                      Save name
                    </PixelButton>
                  </div>
                </form>
              )}
            </div>

            {/* Step 2: First Category */}
            <div className="p-3 bg-cream-deep border-2 border-oak-dark flex items-center justify-between gap-3">
              {state.categories.length > 0 ? (
                <div className="flex items-center gap-2 text-moss-dark font-pixel-heading text-xs">
                  <PixelIcon name="check" size={14} />
                  <span>First category created: <strong>{state.categories[0].name}</strong></span>
                </div>
              ) : (
                <>
                  <div>
                    <span className="font-pixel-heading text-xs text-cocoa block mb-0.5 font-semibold">
                      Step 2: Create your first category
                    </span>
                    <span className="font-pixel-body text-base text-cocoa-soft">
                      Define a realm domain (e.g. Training, Work, Creative, Health).
                    </span>
                  </div>
                  <PixelButton size="sm" variant="moss" onClick={openCategoryModal}>
                    + New category
                  </PixelButton>
                </>
              )}
            </div>

            {/* Step 3: First Tracker */}
            <div className="p-3 bg-cream-deep border-2 border-oak-dark flex items-center justify-between gap-3">
              {state.trackers.length > 0 ? (
                <div className="flex items-center gap-2 text-moss-dark font-pixel-heading text-xs">
                  <PixelIcon name="check" size={14} />
                  <span>First tracker created: <strong>{state.trackers[0].name}</strong></span>
                </div>
              ) : (
                <>
                  <div>
                    <span className="font-pixel-heading text-xs text-cocoa block mb-0.5 font-semibold">
                      Step 3: Add your first tracker
                    </span>
                    <span className="font-pixel-body text-base text-cocoa-soft">
                      Track counts, timers, or daily habits to begin earning XP.
                    </span>
                  </div>
                  <PixelButton
                    size="sm"
                    variant="honey"
                    onClick={onNavigateToTallyLog}
                  >
                    + New tracker
                  </PixelButton>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero Welcome & Quick-Add HUD */}
      <PixelPanel
        variant="parchment"
        showNails={true}
        title={
          <span className="text-cocoa flex items-center gap-2">
            <PixelIcon name="camp" size={18} />
            <span>Cabin overworld</span>
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <span className="font-pixel-heading text-xs bg-cream-deep px-2.5 py-1 text-cocoa border border-oak-dark">
              Streak: {streaks.currentStreak} days
            </span>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="font-pixel-body text-base sm:text-lg text-cocoa">
            {state.profile.name ? `Welcome back to camp, ${state.profile.name}!` : 'Welcome back to camp!'}{' '}
            Every activity logged earns XP, unlocks ranks, and fuels the cabin fire.
          </p>

          <QuickAddBar onQuestCreated={onNavigateToQuests} />
        </div>
      </PixelPanel>

      {/* Grid: Due Habits Today & Pet Mystery Slot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Habits Due */}
        <PixelPanel
          variant="parchment"
          showNails={true}
          title={
            <span className="flex items-center gap-2 text-cocoa">
              <PixelIcon name="shield" size={16} />
              <span>Today's habits</span>
            </span>
          }
          action={
            <span className="font-pixel-heading text-[10px] bg-cream-deep px-2 py-0.5 border border-oak-dark text-cocoa">
              1-tap check
            </span>
          }
        >
          {totalHabits === 0 ? (
            <div className="p-4 bg-cream-deep border-2 border-dashed border-oak-dark text-center space-y-3">
              <p className="font-pixel-body text-base text-cocoa-soft">
                No habits forged in your realm yet. Build daily habits for steady XP gains!
              </p>
              <PixelButton size="sm" variant="moss" onClick={onNavigateToTallyLog}>
                Forge first habit &rarr;
              </PixelButton>
            </div>
          ) : habitsDueToday.length === 0 ? (
            <DialogueBox
              speaker="Tally Sprite"
              text="No scheduled habits due today, traveler! Feel free to rest or embark on a new quest."
              instant={true}
            />
          ) : (
            <div className="space-y-2.5">
              {habitsDueToday.map(habit => {
                const done = isHabitDoneToday(habit.id);
                return (
                  <div
                    key={habit.id}
                    onClick={e => handleHabitClick(e, habit.id)}
                    className={`
                      p-3 flex items-center justify-between gap-3 border-3 cursor-pointer select-none
                      transition-transform duration-75 pixel-btn-block
                      ${
                        done
                          ? 'bg-cream-deep border-t-cream border-l-cream border-r-moss-dark border-b-moss-dark shadow-[0_3px_0_var(--moss-dark)]'
                          : 'bg-cream border-t-cream-deep border-l-cream-deep border-r-oak-dark border-b-oak-dark shadow-[0_3px_0_var(--oak-dark)] hover:bg-cream-deep'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Checkbox box */}
                      <div
                        className={`
                          w-8 h-8 flex-shrink-0 flex items-center justify-center border-2
                          ${
                            done
                              ? 'bg-moss border-moss-dark text-cocoa'
                              : 'bg-cream-deep border-oak-dark text-transparent'
                          }
                        `}
                      >
                        {done ? (
                          <div className="animate-pixel-tick">
                            <PixelIcon name="check" size={16} />
                          </div>
                        ) : (
                          <div className="w-2 h-2 bg-transparent" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4
                          className={`font-pixel-heading text-sm truncate font-semibold ${
                            done ? 'line-through text-moss-dark' : 'text-cocoa'
                          }`}
                        >
                          {habit.name}
                        </h4>
                        <span className="font-pixel-body text-sm text-cocoa-soft">
                          {done ? 'Completed (+10 XP) • Tap to undo' : 'Due today • +10 XP'}
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <span
                        className={`font-pixel-heading text-[10px] px-2 py-1 border ${
                          done
                            ? 'bg-moss text-cocoa border-moss-dark font-bold'
                            : 'bg-cream-deep text-cocoa border-oak-dark'
                        }`}
                      >
                        {done ? 'Done' : 'Check'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </PixelPanel>

        {/* Future Pet Slot Extension Point */}
        <div id="pet-sanctuary-panel">
          <PetSlot />
        </div>
      </div>

      {/* Goal Progress Bars (Tally & Timer Trackers) */}
      <PixelPanel
        variant="parchment"
        showNails={true}
        title={
          <span className="flex items-center gap-2 text-cocoa">
            <PixelIcon name="star" size={16} />
            <span>Daily & weekly goals</span>
          </span>
        }
        action={
          <PixelButton size="sm" variant="oak" onClick={onNavigateToTallyLog}>
            View all logs &rarr;
          </PixelButton>
        }
      >
        {goalTrackers.length === 0 ? (
          <div className="p-4 bg-cream-deep border-2 border-dashed border-oak-dark text-center space-y-3">
            <p className="font-pixel-body text-base text-cocoa-soft">
              No active trackers with daily or weekly targets set yet.
            </p>
            <PixelButton size="sm" variant="moss" onClick={onNavigateToTallyLog}>
              Create a goal tracker &rarr;
            </PixelButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goalTrackers.map(tracker => {
              const currentVal = getTodayValueForTracker(tracker.id);
              const goalVal = tracker.goal?.amount || 1;
              const unit = tracker.unit || (tracker.type === 'timer' ? 'min' : 'reps');
              const isTimer = tracker.type === 'timer';
              const activeTimer = state.activeTimers[tracker.id];

              return (
                <div
                  key={tracker.id}
                  className="p-3 bg-cream border-3 border-oak-dark shadow-[3px_3px_0_var(--cocoa)] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PixelIcon name={tracker.icon || 'star'} size={16} />
                      <h4 className="font-pixel-heading text-sm text-cocoa font-bold">
                        {tracker.name}
                      </h4>
                    </div>

                    <span className="font-pixel-heading text-[10px] text-cocoa bg-cream-deep px-2 py-0.5 border border-oak-dark">
                      {tracker.goal?.period === 'day' ? 'Daily' : 'Weekly'}
                    </span>
                  </div>

                  {/* Segmented Goal Bar */}
                  <SegmentedBar
                    current={currentVal}
                    max={goalVal}
                    segments={8}
                    variant={currentVal >= goalVal ? 'moss' : 'honey'}
                    height={12}
                    showNumbers={true}
                    label={`${currentVal} / ${goalVal} ${unit}`}
                  />

                  {/* Show Tally Marks visual for tallies */}
                  {tracker.type === 'tally' && currentVal > 0 && (
                    <div className="pt-1">
                      <TallyMarks count={currentVal} size="sm" maxDisplayBundles={5} />
                    </div>
                  )}

                  {/* Quick action buttons */}
                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-cream-deep">
                    {tracker.type === 'tally' ? (
                      <div className="flex items-center gap-2 w-full">
                        <PixelButton
                          size="sm"
                          variant="moss"
                          className="flex-1"
                          onClick={e => handleTallyClick(e, tracker.id, 1)}
                        >
                          +1
                        </PixelButton>
                        <PixelButton
                          size="sm"
                          variant="moss"
                          className="flex-1"
                          onClick={e => handleTallyClick(e, tracker.id, 5)}
                        >
                          +5
                        </PixelButton>
                        <PixelButton
                          size="sm"
                          variant="moss"
                          className="flex-1"
                          onClick={e => handleTallyClick(e, tracker.id, 10)}
                        >
                          +10
                        </PixelButton>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        {activeTimer ? (
                          <PixelButton
                            size="sm"
                            variant="berry"
                            className="w-full"
                            onClick={() => stopTimer(tracker.id)}
                          >
                            Stop timer (Log)
                          </PixelButton>
                        ) : (
                          <PixelButton
                            size="sm"
                            variant="honey"
                            className="w-full"
                            onClick={() => startTimer(tracker.id)}
                          >
                            Start timer ▶
                          </PixelButton>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PixelPanel>

      {/* Quests Due / Urgent */}
      <PixelPanel
        variant="parchment"
        showNails={true}
        title={
          <span className="flex items-center gap-2 text-cocoa">
            <PixelIcon name="swords" size={16} />
            <span>Active & due quests</span>
          </span>
        }
        action={
          <PixelButton size="sm" variant="honey" onClick={onNavigateToQuests}>
            Quest board &rarr;
          </PixelButton>
        }
      >
        {totalActiveQuests === 0 ? (
          <div className="p-4 bg-cream-deep border-2 border-dashed border-oak-dark text-center space-y-3">
            <p className="font-pixel-body text-base text-cocoa-soft">
              Your quest log is empty. Pick up a bounty or post a quest to earn XP!
            </p>
            <PixelButton size="sm" variant="honey" onClick={onNavigateToQuests}>
              Post first quest &rarr;
            </PixelButton>
          </div>
        ) : urgentQuests.length === 0 ? (
          <DialogueBox
            speaker="Tally Sprite"
            text="All urgent tasks and quests are cleared! Grab a bounty from the Quest Board to keep advancing."
            instant={true}
          />
        ) : (
          <div className="space-y-3">
            {urgentQuests.slice(0, 3).map(quest => {
              const totalSubs = quest.subtasks.length;
              const doneSubs = quest.subtasks.filter(s => s.done).length;
              const isMain = quest.kind === 'main';

              return (
                <div
                  key={quest.id}
                  className={`
                    p-3.5 border-3 space-y-2 bg-cream
                    ${isMain ? 'border-honey' : 'border-oak-dark'}
                    shadow-[3px_3px_0_var(--cocoa)]
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-pixel-heading text-[10px] px-2 py-0.5 border ${
                            isMain
                              ? 'bg-honey text-cocoa border-honey-dark font-bold'
                              : 'bg-cream-deep text-cocoa border-oak-dark'
                          }`}
                        >
                          {isMain ? 'Main quest' : 'Side quest'}
                        </span>

                        <div className="flex items-center text-honey">
                          {Array.from({ length: quest.difficulty }).map((_, i) => (
                            <PixelIcon key={i} name="star" size={12} />
                          ))}
                        </div>
                      </div>

                      <h4 className="font-pixel-heading text-sm sm:text-base text-cocoa mt-1 font-semibold">
                        {quest.title}
                      </h4>
                    </div>

                    <PixelButton
                      size="sm"
                      variant="moss"
                      onClick={() => completeQuest(quest.id)}
                      icon={<PixelIcon name="check" size={14} />}
                    >
                      Complete
                    </PixelButton>
                  </div>

                  {/* Subtask progress */}
                  {totalSubs > 0 && (
                    <div className="pt-1">
                      <SegmentedBar
                        current={doneSubs}
                        max={totalSubs}
                        segments={Math.max(4, totalSubs)}
                        variant="honey"
                        height={10}
                        label={`Subtasks: ${doneSubs}/${totalSubs}`}
                        showNumbers={false}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </PixelPanel>
    </div>
  );
};
