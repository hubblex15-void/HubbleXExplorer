import React, { useState, useEffect } from 'react';
import { useTallyStore } from '../store/useTallyStore.tsx';
import { Tracker, TrackerType, ScheduleType, LogEntry } from '../types/index.ts';
import { PixelPanel } from '../components/ui/PixelPanel.tsx';
import { PixelButton } from '../components/ui/PixelButton.tsx';
import { PixelIcon } from '../components/ui/PixelIcon.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { TallyMarks } from '../components/ui/TallyMarks.tsx';
import { SegmentedBar } from '../components/ui/SegmentedBar.tsx';
import { DialogueBox } from '../components/ui/DialogueBox.tsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.tsx';
import { PixelSprite } from '../components/ui/PixelSprite.tsx';
import { formatFriendlyDate, getTodayKey } from '../lib/dates.ts';
import { useParticleSpawner } from '../components/ui/ParticleLayer.tsx';

export const TallyLogScreen: React.FC = () => {
  const {
    state,
    todayKey,
    logTally,
    toggleHabit,
    startTimer,
    stopTimer,
    cancelTimer,
    logManualTimer,
    createTracker,
    updateTracker,
    archiveTracker,
    deleteTracker,
    editLogEntry,
    deleteLogEntry,
    openCategoryModal,
  } = useTallyStore();

  const { spawnXpOrbs, spawnPlusOne } = useParticleSpawner();

  // Selected Category filter ('all' or categoryId)
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Tracker Create / Edit Modal state
  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);
  const [editingTracker, setEditingTracker] = useState<Tracker | null>(null);
  const [isDeleteTrackerConfirmOpen, setIsDeleteTrackerConfirmOpen] = useState(false);

  // Form fields for tracker
  const [trackerName, setTrackerName] = useState('');
  const [trackerCatId, setTrackerCatId] = useState(state.categories[0]?.id || '');
  const [trackerType, setTrackerType] = useState<TrackerType>('tally');
  const [trackerUnit, setTrackerUnit] = useState('reps');
  const [trackerHasGoal, setTrackerHasGoal] = useState(false);
  const [goalAmount, setGoalAmount] = useState(10);
  const [goalPeriod, setGoalPeriod] = useState<'day' | 'week'>('day');
  const [scheduleType, setScheduleType] = useState<'daily' | 'weekdays' | 'times_per_week'>('daily');
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [timesPerWeek, setTimesPerWeek] = useState(3);
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(1);

  // Backdate / Manual log modal state
  const [backdateModal, setBackdateModal] = useState<{
    isOpen: boolean;
    tracker: Tracker | null;
    date: string;
    value: number;
    note: string;
  }>({
    isOpen: false,
    tracker: null,
    date: todayKey,
    value: 1,
    note: '',
  });

  // Edit Log Entry modal state
  const [editLogModal, setEditLogModal] = useState<{
    isOpen: boolean;
    log: LogEntry | null;
    value: number;
    note: string;
    dayKey: string;
  }>({
    isOpen: false,
    log: null,
    value: 1,
    note: '',
    dayKey: todayKey,
  });

  // Ticking timer clock for live display
  const [, setTimerTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter trackers
  const activeTrackers = state.trackers.filter(t => !t.archived);
  const displayedTrackers = activeTrackers.filter(t => {
    if (selectedCategory === 'all') return true;
    return t.categoryId === selectedCategory;
  });

  // Helper: total value logged for tracker on given day
  const getTodayTrackerValue = (trackerId: string, day: string = todayKey) => {
    return state.logs
      .filter(l => l.trackerId === trackerId && l.dayKey === day)
      .reduce((sum, l) => sum + (l.value || 0), 0);
  };

  // Helper: check habit done
  const isHabitDone = (trackerId: string, day: string = todayKey) => {
    return state.logs.some(
      l => l.trackerId === trackerId && l.dayKey === day && l.value > 0
    );
  };

  // Helper: get recent logs for tracker
  const getRecentLogsForTracker = (trackerId: string) => {
    return state.logs
      .filter(l => l.trackerId === trackerId)
      .slice(0, 5);
  };

  // Helper: format active timer elapsed string
  const formatTimerElapsed = (startedAt: string) => {
    const elapsedSec = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    const mins = Math.floor(elapsedSec / 60);
    const secs = elapsedSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Open Create Tracker Modal
  const handleOpenCreateModal = () => {
    if (state.categories.length === 0) {
      openCategoryModal();
      return;
    }
    setEditingTracker(null);
    setTrackerName('');
    const defaultCatId =
      selectedCategory !== 'all' && state.categories.some(c => c.id === selectedCategory)
        ? selectedCategory
        : state.categories[0]?.id || '';
    setTrackerCatId(defaultCatId);
    setTrackerType('tally');
    setTrackerUnit('reps');
    setTrackerHasGoal(false);
    setGoalAmount(10);
    setGoalPeriod('day');
    setScheduleType('daily');
    setSelectedWeekdays([1, 2, 3, 4, 5]);
    setTimesPerWeek(3);
    setDifficulty(1);
    setIsTrackerModalOpen(true);
  };

  // Open Edit Tracker Modal
  const handleOpenEditModal = (tracker: Tracker) => {
    setEditingTracker(tracker);
    setTrackerName(tracker.name);
    setTrackerCatId(tracker.categoryId);
    setTrackerType(tracker.type);
    setTrackerUnit(tracker.unit || (tracker.type === 'timer' ? 'min' : 'reps'));
    setTrackerHasGoal(!!tracker.goal);
    setGoalAmount(tracker.goal?.amount || 10);
    setGoalPeriod(tracker.goal?.period || 'day');
    setScheduleType(tracker.schedule?.type || 'daily');
    if (tracker.schedule?.type === 'weekdays') {
      setSelectedWeekdays(tracker.schedule.days);
    }
    if (tracker.schedule?.type === 'times_per_week') {
      setTimesPerWeek(tracker.schedule.times);
    }
    setDifficulty(tracker.difficulty || 1);
    setIsTrackerModalOpen(true);
  };

  // Save Tracker
  const handleSaveTracker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackerName.trim()) return;

    if (!trackerCatId) {
      alert('A category is required to create a tracker.');
      return;
    }

    let schedule: ScheduleType = { type: 'daily' };
    if (scheduleType === 'weekdays') {
      schedule = { type: 'weekdays', days: selectedWeekdays };
    } else if (scheduleType === 'times_per_week') {
      schedule = { type: 'times_per_week', times: timesPerWeek };
    }

    const trackerPayload = {
      categoryId: trackerCatId,
      name: trackerName.trim(),
      icon: trackerType === 'timer' ? 'clock' : trackerType === 'habit' ? 'shield' : 'swords',
      type: trackerType,
      unit: trackerType === 'habit' ? undefined : trackerUnit.trim(),
      goal: trackerHasGoal ? { amount: Number(goalAmount), period: goalPeriod } : undefined,
      schedule,
      difficulty,
      archived: false,
    };

    if (editingTracker) {
      updateTracker(editingTracker.id, trackerPayload);
    } else {
      createTracker(trackerPayload);
    }

    setIsTrackerModalOpen(false);
  };

  // Submit Backdate entry
  const handleSaveBackdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!backdateModal.tracker) return;

    const { tracker, date, value, note } = backdateModal;

    if (tracker.type === 'tally') {
      logTally(tracker.id, Number(value), note, date);
    } else if (tracker.type === 'timer') {
      logManualTimer(tracker.id, Number(value), note, date);
    } else if (tracker.type === 'habit') {
      toggleHabit(tracker.id, date);
    }

    setBackdateModal({ isOpen: false, tracker: null, date: todayKey, value: 1, note: '' });
  };

  // Submit Edit Log
  const handleSaveEditLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLogModal.log) return;
    editLogEntry(editLogModal.log.id, {
      value: Number(editLogModal.value),
      note: editLogModal.note,
      dayKey: editLogModal.dayKey,
    });
    setEditLogModal({ isOpen: false, log: null, value: 1, note: '', dayKey: todayKey });
  };

  const handleTallyClick = (e: React.MouseEvent, trackerId: string, amount: number) => {
    logTally(trackerId, amount);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    spawnPlusOne(rect.left + 20, rect.top - 10, `+${amount}`);
    spawnXpOrbs(rect.left + 20, rect.top);
  };

  const handleHabitToggle = (e: React.MouseEvent, trackerId: string) => {
    const isDone = isHabitDone(trackerId);
    toggleHabit(trackerId);
    if (!isDone) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      spawnPlusOne(rect.left + 20, rect.top - 10, '✓ +10 XP');
      spawnXpOrbs(rect.left + 20, rect.top);
    }
  };

  // 4-frame pixel hourglass for live timers
  const hourglassFrames = [
    // Frame 1: Top bulb full
    <svg key="hg1" width={22} height={22} viewBox="0 0 16 16" fill="none" shapeRendering="crispEdges">
      <rect x="2" y="1" width="12" height="2" fill="var(--oak-dark)" />
      <rect x="2" y="13" width="12" height="2" fill="var(--oak-dark)" />
      <rect x="3" y="3" width="10" height="4" fill="var(--honey)" />
      <rect x="5" y="7" width="6" height="2" fill="var(--honey)" />
      <rect x="7" y="9" width="2" height="2" fill="var(--cream-deep)" />
      <rect x="5" y="11" width="6" height="2" fill="var(--cream-deep)" />
      <rect x="7" y="8" width="2" height="1" fill="var(--honey)" />
    </svg>,
    // Frame 2: Sand dropping through neck
    <svg key="hg2" width={22} height={22} viewBox="0 0 16 16" fill="none" shapeRendering="crispEdges">
      <rect x="2" y="1" width="12" height="2" fill="var(--oak-dark)" />
      <rect x="2" y="13" width="12" height="2" fill="var(--oak-dark)" />
      <rect x="4" y="3" width="8" height="3" fill="var(--honey)" />
      <rect x="6" y="6" width="4" height="2" fill="var(--honey)" />
      <rect x="7" y="8" width="2" height="2" fill="var(--honey)" />
      <rect x="6" y="10" width="4" height="2" fill="var(--honey)" />
      <rect x="5" y="12" width="6" height="1" fill="var(--honey)" />
    </svg>,
    // Frame 3: Bottom filling up
    <svg key="hg3" width={22} height={22} viewBox="0 0 16 16" fill="none" shapeRendering="crispEdges">
      <rect x="2" y="1" width="12" height="2" fill="var(--oak-dark)" />
      <rect x="2" y="13" width="12" height="2" fill="var(--oak-dark)" />
      <rect x="5" y="4" width="6" height="2" fill="var(--honey)" />
      <rect x="7" y="6" width="2" height="2" fill="var(--honey)" />
      <rect x="7" y="8" width="2" height="1" fill="var(--honey)" />
      <rect x="6" y="9" width="4" height="2" fill="var(--honey)" />
      <rect x="4" y="11" width="8" height="2" fill="var(--honey)" />
    </svg>,
    // Frame 4: Bottom bulb full
    <svg key="hg4" width={22} height={22} viewBox="0 0 16 16" fill="none" shapeRendering="crispEdges">
      <rect x="2" y="1" width="12" height="2" fill="var(--oak-dark)" />
      <rect x="2" y="13" width="12" height="2" fill="var(--oak-dark)" />
      <rect x="5" y="3" width="6" height="2" fill="var(--cream-deep)" />
      <rect x="6" y="5" width="4" height="2" fill="var(--cream-deep)" />
      <rect x="7" y="7" width="2" height="2" fill="var(--cream-deep)" />
      <rect x="5" y="9" width="6" height="2" fill="var(--honey)" />
      <rect x="3" y="11" width="10" height="2" fill="var(--honey)" />
    </svg>,
  ];

  return (
    <div className="space-y-6 pb-20 animate-pixel-slide-in">
      {/* Screen Title & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-pixel-heading text-lg sm:text-xl text-cocoa font-bold flex items-center gap-2">
            <PixelIcon name="tally_log" size={22} />
            <span>Activity logs</span>
          </h2>
          <p className="font-pixel-body text-base text-cocoa-soft mt-0.5">
            Record counts, timers, and habit checks. All progress feeds your XP ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <PixelButton
            variant="oak"
            size="sm"
            onClick={openCategoryModal}
            icon={<PixelIcon name="star" size={16} />}
          >
            Categories
          </PixelButton>
          <PixelButton
            variant="moss"
            size="sm"
            onClick={handleOpenCreateModal}
            icon={<PixelIcon name="plus" size={16} />}
          >
            New tracker
          </PixelButton>
        </div>
      </div>

      {/* Category Tabs: styled as warm wooden buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`
            px-3 py-1.5 font-pixel-heading text-xs whitespace-nowrap border-2 select-none cursor-pointer pixel-btn-block
            ${
              selectedCategory === 'all'
                ? 'bg-cream-deep text-cocoa border-honey shadow-[0_2px_0_var(--honey-dark)] font-bold'
                : 'bg-cream text-cocoa-soft border-oak-dark shadow-[0_2px_0_var(--oak-dark)] hover:bg-cream-deep'
            }
          `}
        >
          All categories ({activeTrackers.length})
        </button>

        {state.categories.map(cat => {
          const count = activeTrackers.filter(t => t.categoryId === cat.id).length;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`
                px-3 py-1.5 font-pixel-heading text-xs whitespace-nowrap border-2 select-none cursor-pointer pixel-btn-block flex items-center gap-2
                ${
                  isSelected
                    ? 'bg-cream-deep text-cocoa border-honey shadow-[0_2px_0_var(--honey-dark)] font-bold'
                    : 'bg-cream text-cocoa-soft border-oak-dark shadow-[0_2px_0_var(--oak-dark)] hover:bg-cream-deep'
                }
              `}
            >
              <span
                className="w-2.5 h-2.5 inline-block border border-cocoa"
                style={{ backgroundColor: cat.elementColor }}
              />
              <span>{cat.name} ({count})</span>
            </button>
          );
        })}

        <PixelButton
          size="sm"
          variant="parchment"
          onClick={openCategoryModal}
          className="whitespace-nowrap flex-shrink-0"
        >
          + Manage
        </PixelButton>
      </div>

      {/* Trackers Grid & Empty States */}
      {state.categories.length === 0 ? (
        <DialogueBox
          speaker="Tally Sprite"
          text="No categories exist in your realm yet! Create your first category before adding trackers."
          actionText="Create first category"
          onAction={openCategoryModal}
        />
      ) : activeTrackers.length === 0 ? (
        <DialogueBox
          speaker="Tally Sprite"
          text="Your tracker ledger is empty! Start logging counts, timers, or daily habits to earn XP."
          actionText="Create first tracker"
          onAction={handleOpenCreateModal}
        />
      ) : displayedTrackers.length === 0 ? (
        <DialogueBox
          speaker="Tally Sprite"
          text={`No active trackers currently in category "${state.categories.find(c => c.id === selectedCategory)?.name || ''}".`}
          actionText="Add tracker here"
          onAction={handleOpenCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {displayedTrackers.map(tracker => {
            const category = state.categories.find(c => c.id === tracker.categoryId);
            const todayVal = getTodayTrackerValue(tracker.id);
            const activeTimer = state.activeTimers[tracker.id];
            const recentLogs = getRecentLogsForTracker(tracker.id);
            const habitChecked = tracker.type === 'habit' && isHabitDone(tracker.id);

            return (
              <PixelPanel
                key={tracker.id}
                variant="parchment"
                showNails={true}
                title={
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 flex-shrink-0 border border-cocoa"
                      style={{ backgroundColor: category?.elementColor || 'var(--honey)' }}
                    />
                    <span className="truncate">{tracker.name}</span>
                  </div>
                }
                action={
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        setBackdateModal({
                          isOpen: true,
                          tracker,
                          date: todayKey,
                          value: tracker.type === 'timer' ? 15 : 1,
                          note: '',
                        })
                      }
                      title="Backdate or manual log entry"
                      className="px-2 py-1 bg-cream-deep hover:bg-cream text-cocoa border border-oak-dark font-pixel-heading text-[10px] pixel-btn-block cursor-pointer"
                    >
                      Backdate
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(tracker)}
                      title="Edit tracker config"
                      className="px-2 py-1 bg-cream-deep hover:bg-cream text-cocoa border border-oak-dark font-pixel-heading text-[10px] pixel-btn-block cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => archiveTracker(tracker.id)}
                      title="Archive tracker"
                      className="px-2 py-1 bg-cream-deep hover:bg-berry hover:text-cream text-cocoa border border-oak-dark font-pixel-heading text-[10px] pixel-btn-block cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                }
              >
                <div className="space-y-4">
                  {/* Status & Goal summary */}
                  <div className="flex items-center justify-between font-pixel-body text-base border-b border-cream-deep pb-2">
                    <div className="flex items-center gap-2 text-cocoa-soft">
                      <span className="font-pixel-heading text-[10px] px-2 py-0.5 bg-cream-deep border border-oak-dark text-cocoa">
                        {tracker.type === 'tally' ? 'Tally' : tracker.type === 'timer' ? 'Timer' : 'Habit'}
                      </span>
                      <span>
                        {tracker.goal
                          ? `Goal: ${tracker.goal.amount} ${tracker.unit || ''} / ${tracker.goal.period === 'day' ? 'day' : 'week'}`
                          : 'No goal set'}
                      </span>
                    </div>

                    <span className="font-pixel-heading text-xs text-cocoa font-bold">
                      Today: {todayVal} {tracker.unit || (tracker.type === 'timer' ? 'min' : '')}
                    </span>
                  </div>

                  {/* Visual Progress: Tally Marks or Active Timer or Habit Button */}
                  {tracker.type === 'tally' && (
                    <div className="p-3 bg-cream border-2 border-oak-dark shadow-[inset_1px_1px_0_var(--cocoa-soft)]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-pixel-heading text-xs text-cocoa font-semibold">
                          Today's tally strokes
                        </span>
                        <span className="font-pixel-body text-sm text-cocoa-soft">
                          {todayVal} total count
                        </span>
                      </div>
                      <TallyMarks
                        count={todayVal}
                        size="md"
                        maxDisplayBundles={8}
                        strokeColor="var(--cocoa)"
                        slashColor="var(--berry)"
                      />
                    </div>
                  )}

                  {tracker.type === 'timer' && (
                    <div className="p-3 bg-cream border-2 border-oak-dark shadow-[inset_1px_1px_0_var(--cocoa-soft)] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-pixel-heading text-xs text-cocoa font-semibold">
                          Timer HUD
                        </span>
                        {activeTimer && (
                          <span className="font-pixel-heading text-xs text-berry font-bold animate-pulse">
                            ● Recording live
                          </span>
                        )}
                      </div>

                      {activeTimer ? (
                        <div className="flex items-center justify-between bg-cream-deep p-3 border-2 border-oak-dark text-cocoa">
                          <div className="flex items-center gap-3">
                            <PixelSprite frames={hourglassFrames} fps={2} />
                            <div>
                              <span className="font-pixel-heading text-[10px] text-cocoa-soft block">
                                Elapsed time
                              </span>
                              <span className="font-pixel-level text-base sm:text-lg text-cocoa font-bold">
                                {formatTimerElapsed(activeTimer.startedAt)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <PixelButton
                              size="sm"
                              variant="berry"
                              onClick={() => {
                                stopTimer(tracker.id);
                                spawnPlusOne(window.innerWidth / 2, window.innerHeight / 2, 'Timer recorded!');
                                spawnXpOrbs(window.innerWidth / 2, window.innerHeight / 2);
                              }}
                            >
                              Stop & log
                            </PixelButton>
                            <button
                              onClick={() => cancelTimer(tracker.id)}
                              className="px-2 py-1 text-xs text-cocoa-soft hover:text-berry underline cursor-pointer"
                            >
                              Discard
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <PixelButton
                            size="sm"
                            variant="honey"
                            className="flex-1"
                            onClick={() => startTimer(tracker.id)}
                            icon={<PixelIcon name="clock" size={16} />}
                          >
                            Start timer
                          </PixelButton>

                          <PixelButton
                            size="sm"
                            variant="parchment"
                            onClick={() =>
                              setBackdateModal({
                                isOpen: true,
                                tracker,
                                date: todayKey,
                                value: 25,
                                note: 'Pomodoro block',
                              })
                            }
                          >
                            + Manual mins
                          </PixelButton>
                        </div>
                      )}
                    </div>
                  )}

                  {tracker.type === 'habit' && (
                    <div className="p-3 bg-cream border-2 border-oak-dark shadow-[inset_1px_1px_0_var(--cocoa-soft)] flex items-center justify-between">
                      <div>
                        <span className="font-pixel-heading text-xs text-cocoa-soft block font-semibold">
                          Daily habit status
                        </span>
                        <span className="font-pixel-body text-base text-cocoa">
                          {habitChecked ? '✓ Checked off for today (+10 XP)' : 'Not checked today'}
                        </span>
                      </div>

                      <PixelButton
                        size="md"
                        variant={habitChecked ? 'moss' : 'oak'}
                        onClick={e => handleHabitToggle(e, tracker.id)}
                        icon={habitChecked ? <PixelIcon name="check" size={16} /> : undefined}
                      >
                        {habitChecked ? 'Done (Undo)' : 'Check off'}
                      </PixelButton>
                    </div>
                  )}

                  {/* Quick Log Buttons for Tally */}
                  {tracker.type === 'tally' && (
                    <div className="flex items-center gap-2">
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
                  )}

                  {/* Goal progress bar if tracker has goal */}
                  {tracker.goal && (
                    <SegmentedBar
                      current={todayVal}
                      max={tracker.goal.amount}
                      segments={6}
                      variant={todayVal >= tracker.goal.amount ? 'moss' : 'honey'}
                      height={10}
                      label={`Goal: ${todayVal}/${tracker.goal.amount} ${tracker.unit || ''}`}
                      showNumbers={false}
                    />
                  )}

                  {/* Recent Log Entries Accordion */}
                  <div className="pt-2 border-t border-cream-deep">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-pixel-heading text-[10px] text-cocoa-soft font-semibold">
                        Recent entries
                      </span>
                    </div>

                    {recentLogs.length === 0 ? (
                      <p className="font-pixel-body text-sm text-cocoa-soft italic">
                        No activity recorded yet for this tracker.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {recentLogs.map(log => (
                          <div
                            key={log.id}
                            className="px-2.5 py-1.5 bg-cream-deep border border-oak-dark flex items-center justify-between gap-2 text-sm"
                          >
                            <div className="min-w-0">
                              <span className="font-pixel-heading text-[10px] text-cocoa-soft mr-2">
                                {formatFriendlyDate(log.dayKey)}
                              </span>
                              <span className="font-pixel-heading text-xs text-cocoa font-bold">
                                +{log.value} {tracker.unit || (tracker.type === 'timer' ? 'min' : '')}
                              </span>
                              {log.note && (
                                <span className="font-pixel-body text-sm text-cocoa-soft ml-2 truncate">
                                  ({log.note})
                                </span>
                              )}
                              <span className="font-pixel-heading text-[10px] text-moss-dark ml-2 font-bold">
                                +{log.xp} XP
                              </span>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() =>
                                  setEditLogModal({
                                    isOpen: true,
                                    log,
                                    value: log.value,
                                    note: log.note || '',
                                    dayKey: log.dayKey,
                                  })
                                }
                                title="Edit entry"
                                className="px-1.5 py-0.5 bg-cream hover:bg-cream-deep text-cocoa font-pixel-heading text-[10px] border border-oak-dark cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteLogEntry(log.id)}
                                title="Delete entry (removes XP)"
                                className="px-1.5 py-0.5 bg-cream hover:bg-berry hover:text-cream text-cocoa font-pixel-heading text-[10px] border border-oak-dark cursor-pointer"
                              >
                                Del
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </PixelPanel>
            );
          })}
        </div>
      )}

      {/* Tracker Create / Edit Modal */}
      <Modal
        isOpen={isTrackerModalOpen}
        onClose={() => setIsTrackerModalOpen(false)}
        title={editingTracker ? 'Edit tracker' : 'Create new tracker'}
      >
        <form onSubmit={handleSaveTracker} className="space-y-4">
          <div>
            <label className="font-pixel-heading text-xs text-cocoa block mb-1">
              Tracker name *
            </label>
            <input
              type="text"
              required
              value={trackerName}
              onChange={e => setTrackerName(e.target.value)}
              placeholder="e.g. Pushups, Deep work, Reading, Workout"
              className="w-full bg-cream-deep border-2 border-oak-dark px-3 py-2 font-pixel-body text-base text-cocoa outline-none shadow-[inset_1px_1px_0_var(--cocoa-soft)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-pixel-heading text-xs text-cocoa block">
                  Category *
                </label>
                <button
                  type="button"
                  onClick={openCategoryModal}
                  className="font-pixel-heading text-[10px] text-cocoa underline hover:text-berry cursor-pointer"
                >
                  + Manage
                </button>
              </div>
              {state.categories.length === 0 ? (
                <div className="p-2 bg-cream-deep border border-berry text-xs font-pixel-body text-berry">
                  No categories exist! Click "+ Manage" above.
                </div>
              ) : (
                <select
                  required
                  value={trackerCatId}
                  onChange={e => setTrackerCatId(e.target.value)}
                  className="w-full bg-cream-deep border-2 border-oak-dark px-2 py-2 font-pixel-body text-base text-cocoa outline-none shadow-[inset_1px_1px_0_var(--cocoa-soft)]"
                >
                  {state.categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="font-pixel-heading text-xs text-cocoa block mb-1">
                Type *
              </label>
              <select
                value={trackerType}
                onChange={e => setTrackerType(e.target.value as TrackerType)}
                className="w-full bg-cream-deep border-2 border-oak-dark px-2 py-2 font-pixel-body text-base text-cocoa outline-none shadow-[inset_1px_1px_0_var(--cocoa-soft)]"
              >
                <option value="tally">Tally (Counts & strokes)</option>
                <option value="timer">Timer (Minutes / sessions)</option>
                <option value="habit">Habit (Daily check-off)</option>
              </select>
            </div>
          </div>

          {trackerType !== 'habit' && (
            <div>
              <label className="font-pixel-heading text-xs text-cocoa block mb-1">
                Measurement unit
              </label>
              <input
                type="text"
                value={trackerUnit}
                onChange={e => setTrackerUnit(e.target.value)}
                placeholder="e.g. reps, min, pages, glasses"
                className="w-full bg-cream-deep border-2 border-oak-dark px-3 py-1.5 font-pixel-body text-base text-cocoa outline-none shadow-[inset_1px_1px_0_var(--cocoa-soft)]"
              />
            </div>
          )}

          {/* Goal Settings */}
          <div className="p-3 bg-cream-deep border-2 border-oak-dark space-y-2">
            <label className="flex items-center gap-2 cursor-pointer font-pixel-heading text-xs text-cocoa">
              <input
                type="checkbox"
                checked={trackerHasGoal}
                onChange={e => setTrackerHasGoal(e.target.checked)}
                className="w-4 h-4 accent-honey"
              />
              <span>Enable goal target (+20 XP bonus)</span>
            </label>

            {trackerHasGoal && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="font-pixel-heading text-[10px] text-cocoa-soft block mb-1">
                    Target amount
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={goalAmount}
                    onChange={e => setGoalAmount(Number(e.target.value))}
                    className="w-full bg-cream border-2 border-oak-dark px-2 py-1 font-pixel-body text-base text-cocoa outline-none shadow-[inset_1px_1px_0_var(--cocoa-soft)]"
                  />
                </div>
                <div>
                  <label className="font-pixel-heading text-[10px] text-cocoa-soft block mb-1">
                    Period
                  </label>
                  <select
                    value={goalPeriod}
                    onChange={e => setGoalPeriod(e.target.value as 'day' | 'week')}
                    className="w-full bg-cream border-2 border-oak-dark px-2 py-1.5 font-pixel-body text-base text-cocoa outline-none shadow-[inset_1px_1px_0_var(--cocoa-soft)]"
                  >
                    <option value="day">Per day</option>
                    <option value="week">Per week</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Schedule Settings */}
          <div className="space-y-2">
            <label className="font-pixel-heading text-xs text-cocoa block">
              Schedule occurrence
            </label>
            <div className="flex gap-2">
              {(['daily', 'weekdays', 'times_per_week'] as const).map(sch => (
                <button
                  type="button"
                  key={sch}
                  onClick={() => setScheduleType(sch)}
                  className={`
                    flex-1 py-1.5 px-2 font-pixel-heading text-xs border-2 cursor-pointer pixel-btn-block
                    ${
                      scheduleType === sch
                        ? 'bg-cream-deep text-cocoa border-honey shadow-[0_2px_0_var(--honey-dark)] font-bold'
                        : 'bg-cream text-cocoa-soft border-oak-dark shadow-[0_2px_0_var(--oak-dark)] hover:bg-cream-deep'
                    }
                  `}
                >
                  {sch === 'daily' ? 'Daily' : sch === 'weekdays' ? 'Weekdays' : 'Times/wk'}
                </button>
              ))}
            </div>

            {scheduleType === 'times_per_week' && (
              <div className="pt-2">
                <label className="font-pixel-heading text-[10px] text-cocoa-soft block mb-1">
                  Target times per week: {timesPerWeek}x
                </label>
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={timesPerWeek}
                  onChange={e => setTimesPerWeek(Number(e.target.value))}
                  className="w-full accent-honey"
                />
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-cream-deep">
            {editingTracker && (
              <PixelButton
                type="button"
                size="md"
                variant="berry"
                onClick={() => setIsDeleteTrackerConfirmOpen(true)}
              >
                Delete
              </PixelButton>
            )}
            <PixelButton type="button" size="md" variant="oak" onClick={() => setIsTrackerModalOpen(false)}>
              Cancel
            </PixelButton>
            <PixelButton type="submit" size="md" variant="moss">
              Save tracker
            </PixelButton>
          </div>
        </form>
      </Modal>

      {/* Delete Tracker ConfirmDialog */}
      <ConfirmDialog
        isOpen={isDeleteTrackerConfirmOpen}
        title="Delete tracker"
        message={`Are you sure you want to delete "${editingTracker?.name}" and all its activity logs? This cannot be undone.`}
        confirmLabel="Delete tracker"
        cancelLabel="Cancel"
        variant="berry"
        onConfirm={() => {
          if (editingTracker) {
            deleteTracker(editingTracker.id);
          }
          setIsDeleteTrackerConfirmOpen(false);
          setIsTrackerModalOpen(false);
        }}
        onCancel={() => setIsDeleteTrackerConfirmOpen(false)}
      />

      {/* Backdate / Manual Entry Modal */}
      <Modal
        isOpen={backdateModal.isOpen}
        onClose={() => setBackdateModal(prev => ({ ...prev, isOpen: false }))}
        title={`Log entry: ${backdateModal.tracker?.name || ''}`}
      >
        <form onSubmit={handleSaveBackdate} className="space-y-4">
          <div>
            <label className="font-pixel-heading text-xs text-cocoa block mb-1">
              Date
            </label>
            <input
              type="date"
              required
              value={backdateModal.date}
              onChange={e => setBackdateModal(prev => ({ ...prev, date: e.target.value }))}
              className="w-full bg-cream-deep border-2 border-oak-dark px-3 py-2 font-pixel-body text-base text-cocoa outline-none shadow-[inset_1px_1px_0_var(--cocoa-soft)]"
            />
          </div>

          <div>
            <label className="font-pixel-heading text-xs text-cocoa block mb-1">
              Amount ({backdateModal.tracker?.unit || (backdateModal.tracker?.type === 'timer' ? 'minutes' : 'count')})
            </label>
            <input
              type="number"
              min="1"
              required
              value={backdateModal.value}
              onChange={e => setBackdateModal(prev => ({ ...prev, value: Number(e.target.value) }))}
              className="w-full bg-cream-deep border-2 border-oak-dark px-3 py-2 font-pixel-body text-base text-cocoa outline-none shadow-[inset_1px_1px_0_var(--cocoa-soft)]"
            />
          </div>

          <div>
            <label className="font-pixel-heading text-xs text-cocoa block mb-1">
              Note / Journal (optional)
            </label>
            <input
              type="text"
              value={backdateModal.note}
              onChange={e => setBackdateModal(prev => ({ ...prev, note: e.target.value }))}
              placeholder="e.g. Evening session, gym with Alex..."
              className="w-full bg-cream-deep border-2 border-oak-dark px-3 py-2 font-pixel-body text-base text-cocoa outline-none shadow-[inset_1px_1px_0_var(--cocoa-soft)]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-cream-deep">
            <PixelButton
              type="button"
              size="md"
              variant="oak"
              onClick={() => setBackdateModal(prev => ({ ...prev, isOpen: false }))}
            >
              Cancel
            </PixelButton>
            <PixelButton type="submit" size="md" variant="moss">
              Log entry
            </PixelButton>
          </div>
        </form>
      </Modal>

      {/* Edit Log Entry Modal */}
      <Modal
        isOpen={editLogModal.isOpen}
        onClose={() => setEditLogModal(prev => ({ ...prev, isOpen: false }))}
        title="Edit log entry"
      >
        <form onSubmit={handleSaveEditLog} className="space-y-4">
          <div>
            <label className="font-pixel-heading text-xs text-cocoa block mb-1">
              Date
            </label>
            <input
              type="date"
              required
              value={editLogModal.dayKey}
              onChange={e => setEditLogModal(prev => ({ ...prev, dayKey: e.target.value }))}
              className="w-full bg-cream-deep border-2 border-oak-dark px-3 py-2 font-pixel-body text-base text-cocoa outline-none shadow-[inset_1px_1px_0_var(--cocoa-soft)]"
            />
          </div>

          <div>
            <label className="font-pixel-heading text-xs text-cocoa block mb-1">
              Value
            </label>
            <input
              type="number"
              min="1"
              required
              value={editLogModal.value}
              onChange={e => setEditLogModal(prev => ({ ...prev, value: Number(e.target.value) }))}
              className="w-full bg-cream-deep border-2 border-oak-dark px-3 py-2 font-pixel-body text-base text-cocoa outline-none shadow-[inset_1px_1px_0_var(--cocoa-soft)]"
            />
          </div>

          <div>
            <label className="font-pixel-heading text-xs text-cocoa block mb-1">
              Note
            </label>
            <input
              type="text"
              value={editLogModal.note}
              onChange={e => setEditLogModal(prev => ({ ...prev, note: e.target.value }))}
              className="w-full bg-cream-deep border-2 border-oak-dark px-3 py-2 font-pixel-body text-base text-cocoa outline-none shadow-[inset_1px_1px_0_var(--cocoa-soft)]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-cream-deep">
            <PixelButton
              type="button"
              size="md"
              variant="oak"
              onClick={() => setEditLogModal(prev => ({ ...prev, isOpen: false }))}
            >
              Cancel
            </PixelButton>
            <PixelButton type="submit" size="md" variant="moss">
              Update log
            </PixelButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};
