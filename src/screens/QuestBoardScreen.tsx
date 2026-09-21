import React, { useState } from 'react';
import { useTallyStore } from '../store/useTallyStore.tsx';
import { Quest, QuestKind, Subtask } from '../types/index.ts';
import { PixelPanel } from '../components/ui/PixelPanel.tsx';
import { PixelButton } from '../components/ui/PixelButton.tsx';
import { PixelIcon } from '../components/ui/PixelIcon.tsx';
import { SegmentedBar } from '../components/ui/SegmentedBar.tsx';
import { Modal } from '../components/ui/Modal.tsx';
import { DialogueBox } from '../components/ui/DialogueBox.tsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.tsx';
import { formatFriendlyDate, getTodayKey } from '../lib/dates.ts';
import { calculateXpForQuest } from '../lib/xp.ts';
import { useParticleSpawner } from '../components/ui/ParticleLayer.tsx';

export const QuestBoardScreen: React.FC = () => {
  const {
    state,
    todayKey,
    createQuest,
    updateQuest,
    toggleSubtask,
    completeQuest,
    reopenQuest,
    deleteQuest,
    openCategoryModal,
  } = useTallyStore();

  const { spawnXpOrbs, spawnPlusOne } = useParticleSpawner();

  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'done'>('today');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [questToDelete, setQuestToDelete] = useState<Quest | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<QuestKind>('side');
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(1);
  const [dueDate, setDueDate] = useState(todayKey);
  const [categoryId, setCategoryId] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Filter quests
  const todayQuests = state.quests.filter(q => {
    if (q.status !== 'active') return false;
    if (!q.dueDate) return true;
    return q.dueDate <= todayKey;
  });

  const upcomingQuests = state.quests.filter(q => {
    if (q.status !== 'active') return false;
    return q.dueDate && q.dueDate > todayKey;
  });

  const doneQuests = state.quests.filter(q => q.status === 'completed');

  const displayedQuests =
    activeTab === 'today'
      ? todayQuests
      : activeTab === 'upcoming'
      ? upcomingQuests
      : doneQuests;

  const handleOpenCreateModal = () => {
    setEditingQuest(null);
    setTitle('');
    setKind('side');
    setDifficulty(1);
    setDueDate(todayKey);
    setCategoryId(state.categories[0]?.id || '');
    setSubtasks([]);
    setNewSubtaskTitle('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (quest: Quest) => {
    setEditingQuest(quest);
    setTitle(quest.title);
    setKind(quest.kind);
    setDifficulty(quest.difficulty);
    setDueDate(quest.dueDate || todayKey);
    setCategoryId(quest.categoryId || '');
    setSubtasks([...quest.subtasks]);
    setNewSubtaskTitle('');
    setIsModalOpen(true);
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSub: Subtask = {
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      title: newSubtaskTitle.trim(),
      done: false,
    };
    setSubtasks(prev => [...prev, newSub]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (subId: string) => {
    setSubtasks(prev => prev.filter(s => s.id !== subId));
  };

  const handleSaveQuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingQuest) {
      updateQuest(editingQuest.id, {
        title: title.trim(),
        kind,
        difficulty,
        dueDate,
        categoryId: categoryId || undefined,
        subtasks,
      });
    } else {
      createQuest({
        title: title.trim(),
        kind,
        difficulty,
        dueDate,
        categoryId: categoryId || undefined,
        subtasks,
      });
    }

    setIsModalOpen(false);
  };

  const handleCompleteQuest = (e: React.MouseEvent, quest: Quest) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const reward = calculateXpForQuest(quest);
    spawnPlusOne(rect.left + 40, rect.top - 16, `+${reward} XP`);
    spawnXpOrbs(rect.left + 40, rect.top);
    completeQuest(quest.id);
  };

  return (
    <div className="space-y-6 pb-20 animate-pixel-slide-in">
      {/* Board Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-pixel-heading text-lg sm:text-xl text-cocoa font-bold flex items-center gap-2">
            <PixelIcon name="quest_board" size={22} />
            <span>Quest board</span>
          </h2>
          <p className="font-pixel-body text-base text-cocoa-soft mt-0.5">
            Accept bounties and tackle main milestones. Completing quests grants large XP rewards.
          </p>
        </div>

        <PixelButton
          variant="honey"
          size="sm"
          onClick={handleOpenCreateModal}
          icon={<PixelIcon name="plus" size={16} />}
        >
          Post new quest
        </PixelButton>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('today')}
          className={`
            px-3.5 py-1.5 font-pixel-heading text-xs select-none cursor-pointer border-2 pixel-btn-block
            ${
              activeTab === 'today'
                ? 'bg-cream-deep text-cocoa border-honey shadow-[0_2px_0_var(--honey-dark)] font-bold'
                : 'bg-cream text-cocoa-soft border-oak-dark shadow-[0_2px_0_var(--oak-dark)] hover:bg-cream-deep'
            }
          `}
        >
          Today & due ({todayQuests.length})
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`
            px-3.5 py-1.5 font-pixel-heading text-xs select-none cursor-pointer border-2 pixel-btn-block
            ${
              activeTab === 'upcoming'
                ? 'bg-cream-deep text-cocoa border-honey shadow-[0_2px_0_var(--honey-dark)] font-bold'
                : 'bg-cream text-cocoa-soft border-oak-dark shadow-[0_2px_0_var(--oak-dark)] hover:bg-cream-deep'
            }
          `}
        >
          Upcoming ({upcomingQuests.length})
        </button>

        <button
          onClick={() => setActiveTab('done')}
          className={`
            px-3.5 py-1.5 font-pixel-heading text-xs select-none cursor-pointer border-2 pixel-btn-block
            ${
              activeTab === 'done'
                ? 'bg-cream-deep text-moss-dark border-moss shadow-[0_2px_0_var(--moss-dark)] font-bold'
                : 'bg-cream text-cocoa-soft border-oak-dark shadow-[0_2px_0_var(--oak-dark)] hover:bg-cream-deep'
            }
          `}
        >
          Completed ({doneQuests.length})
        </button>
      </div>

      {/* Quests List */}
      {displayedQuests.length === 0 ? (
        <DialogueBox
          speaker="Guild Master"
          text={
            state.quests.length === 0
              ? 'No bounties or quests posted on the Guild Board yet! Post your first quest to start earning high-tier XP rewards.'
              : activeTab === 'today'
              ? 'No active quests due for today! Post a new quest above or take time to train your tallies.'
              : activeTab === 'upcoming'
              ? 'No future bounties on the board. You can schedule quests for upcoming days when posting a quest.'
              : 'No completed bounties yet. Slay some tasks to fill the Hall of Fame!'
          }
          actionText={activeTab !== 'done' || state.quests.length === 0 ? 'Post first quest' : undefined}
          onAction={activeTab !== 'done' || state.quests.length === 0 ? handleOpenCreateModal : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedQuests.map(quest => {
            const isMain = quest.kind === 'main';
            const xpReward = calculateXpForQuest(quest);
            const totalSubs = quest.subtasks.length;
            const doneSubs = quest.subtasks.filter(s => s.done).length;
            const isCompleted = quest.status === 'completed';

            return (
              <PixelPanel
                key={quest.id}
                variant="parchment"
                showNails={true}
                title={
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-pixel-heading text-[10px] px-2 py-0.5 border ${
                        isMain
                          ? 'bg-honey text-cocoa border-honey-dark font-bold'
                          : 'bg-cream-deep text-cocoa border-oak-dark'
                      }`}
                    >
                      {isMain ? '★ Main quest' : 'Side quest'}
                    </span>

                    {/* Difficulty Stars */}
                    <div className="flex items-center text-honey" title={`Difficulty ${quest.difficulty} stars`}>
                      {Array.from({ length: quest.difficulty }).map((_, i) => (
                        <PixelIcon key={i} name="star" size={13} />
                      ))}
                    </div>
                  </div>
                }
                action={
                  <div className="flex items-center gap-1.5">
                    {!isCompleted && (
                      <button
                        onClick={() => handleOpenEditModal(quest)}
                        title="Edit quest"
                        className="px-2 py-1 bg-cream-deep hover:bg-cream text-cocoa border border-oak-dark font-pixel-heading text-[10px] pixel-btn-block cursor-pointer"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => setQuestToDelete(quest)}
                      title="Delete quest"
                      className="px-2 py-1 bg-cream-deep hover:bg-berry hover:text-cream text-cocoa border border-oak-dark font-pixel-heading text-[10px] pixel-btn-block cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                }
              >
                <div className="space-y-3">
                  {/* Quest Title & Reward */}
                  <div className="flex items-start justify-between gap-3">
                    <h3
                      className={`font-pixel-heading text-base leading-snug font-semibold ${
                        isCompleted ? 'line-through text-cocoa-soft opacity-60' : 'text-cocoa'
                      }`}
                    >
                      {quest.title}
                    </h3>

                    <div className="flex-shrink-0 text-right">
                      <span className="font-pixel-heading text-xs text-moss-dark font-bold block">
                        +{xpReward} XP
                      </span>
                      {isMain && (
                        <span className="font-pixel-body text-xs text-cocoa-soft">
                          (+50 Main bonus)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Due Date & Category */}
                  <div className="flex items-center gap-3 font-pixel-body text-base text-cocoa-soft border-b border-cream-deep pb-2">
                    {quest.dueDate && (
                      <span className="flex items-center gap-1">
                        <PixelIcon name="clock" size={12} />
                        <span>Due: {formatFriendlyDate(quest.dueDate)}</span>
                      </span>
                    )}
                    {quest.categoryId && (
                      <span>
                        •{' '}
                        {state.categories.find(c => c.id === quest.categoryId)?.name || 'General'}
                      </span>
                    )}
                  </div>

                  {/* Main Quest Progress Bar */}
                  {isMain && totalSubs > 0 && (
                    <div className="pt-1">
                      <SegmentedBar
                        current={doneSubs}
                        max={totalSubs}
                        segments={Math.max(4, totalSubs)}
                        variant="honey"
                        height={12}
                        label="Campaign progress"
                        showNumbers={true}
                      />
                    </div>
                  )}

                  {/* Subtasks List */}
                  {totalSubs > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="font-pixel-heading text-[10px] text-cocoa-soft font-semibold block">
                        Objectives ({doneSubs}/{totalSubs}):
                      </span>
                      <div className="space-y-1 bg-cream-deep p-2 border border-oak-dark">
                        {quest.subtasks.map(sub => (
                          <div
                            key={sub.id}
                            onClick={() => !isCompleted && toggleSubtask(quest.id, sub.id)}
                            className={`
                              flex items-center gap-2.5 p-1 select-none text-base font-pixel-body
                              ${
                                isCompleted
                                  ? 'opacity-70'
                                  : 'cursor-pointer hover:bg-cream pixel-btn-block'
                              }
                            `}
                          >
                            <div
                              className={`
                                w-4 h-4 border-2 flex items-center justify-center flex-shrink-0
                                ${
                                  sub.done
                                    ? 'bg-moss border-moss-dark text-cocoa'
                                    : 'bg-cream border-oak-dark'
                                }
                              `}
                            >
                              {sub.done && (
                                <div className="animate-pixel-tick">
                                  <PixelIcon name="check" size={10} />
                                </div>
                              )}
                            </div>
                            <span
                              className={`truncate ${
                                sub.done ? 'line-through text-cocoa-soft' : 'text-cocoa'
                              }`}
                            >
                              {sub.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Complete / Reopen Action */}
                  <div className="pt-2 flex items-center justify-between border-t border-cream-deep">
                    {isCompleted ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="font-pixel-body text-base text-moss-dark font-medium flex items-center gap-1">
                          <PixelIcon name="check" size={14} />
                          <span>Claimed on {formatFriendlyDate(quest.completedAt?.split('T')[0] || todayKey)}</span>
                        </span>
                        <PixelButton
                          size="sm"
                          variant="oak"
                          onClick={() => reopenQuest(quest.id)}
                        >
                          Reopen
                        </PixelButton>
                      </div>
                    ) : (
                      <PixelButton
                        size="md"
                        variant="moss"
                        fullWidth={true}
                        onClick={e => handleCompleteQuest(e, quest)}
                        icon={<PixelIcon name="check" size={16} />}
                      >
                        Claim reward (+{xpReward} XP)
                      </PixelButton>
                    )}
                  </div>
                </div>
              </PixelPanel>
            );
          })}
        </div>
      )}

      {/* Quest Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingQuest ? 'Edit guild quest' : 'Commission new quest'}
      >
        <form onSubmit={handleSaveQuest} className="space-y-4">
          <div>
            <label className="font-pixel-heading text-xs text-cocoa block mb-1">
              Quest title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Pitch a local business, Clear inbox, Gym workout"
              className="w-full bg-cream-deep border-2 border-oak-dark px-3 py-2 font-pixel-body text-base text-cocoa outline-none shadow-[inset_1px_1px_0_var(--cocoa-soft)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-pixel-heading text-xs text-cocoa block mb-1">
                Kind
              </label>
              <select
                value={kind}
                onChange={e => setKind(e.target.value as QuestKind)}
                className="w-full bg-cream-deep border-2 border-oak-dark px-2 py-2 font-pixel-body text-base text-cocoa outline-none shadow-[inset_1px_1px_0_var(--cocoa-soft)]"
              >
                <option value="side">Side quest</option>
                <option value="main">Main quest (+50 XP bonus)</option>
              </select>
            </div>

            <div>
              <label className="font-pixel-heading text-xs text-cocoa block mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(Number(e.target.value) as 1 | 2 | 3)}
                className="w-full bg-cream-deep border-2 border-oak-dark px-2 py-2 font-pixel-body text-base text-cocoa outline-none shadow-[inset_1px_1px_0_var(--cocoa-soft)]"
              >
                <option value={1}>★ Casual (10 XP)</option>
                <option value={2}>★★ Heroic (20 XP)</option>
                <option value={3}>★★★ Legendary (35 XP)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-pixel-heading text-xs text-cocoa block mb-1">
                Due date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-cream-deep border-2 border-oak-dark px-2 py-1.5 font-pixel-body text-base text-cocoa outline-none shadow-[inset_1px_1px_0_var(--cocoa-soft)]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-pixel-heading text-xs text-cocoa block">
                  Category (optional)
                </label>
                <button
                  type="button"
                  onClick={openCategoryModal}
                  className="font-pixel-heading text-[10px] text-cocoa underline hover:text-berry cursor-pointer"
                >
                  + Manage
                </button>
              </div>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full bg-cream-deep border-2 border-oak-dark px-2 py-2 font-pixel-body text-base text-cocoa outline-none shadow-[inset_1px_1px_0_var(--cocoa-soft)]"
              >
                <option value="">No category</option>
                {state.categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subtasks Builder */}
          <div className="p-3 bg-cream-deep border-2 border-oak-dark space-y-2">
            <span className="font-pixel-heading text-xs text-cocoa font-bold block">
              Subtasks / Checklist
            </span>

            {/* List of subtasks */}
            {subtasks.length > 0 && (
              <div className="space-y-1 mb-2">
                {subtasks.map((st, i) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between gap-2 p-1.5 bg-cream border border-oak-dark text-base font-pixel-body text-cocoa"
                  >
                    <span>
                      {i + 1}. {st.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="text-berry hover:text-red-700 font-pixel-heading text-xs px-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add subtask input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Add subtask and press enter..."
                className="flex-1 bg-cream border border-oak-dark px-2 py-1 font-pixel-body text-base outline-none shadow-[inset_1px_1px_0_var(--cocoa-soft)]"
              />
              <PixelButton type="button" size="sm" variant="oak" onClick={handleAddSubtask}>
                + Add
              </PixelButton>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-cream-deep">
            <PixelButton
              type="button"
              size="md"
              variant="oak"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </PixelButton>
            <PixelButton type="submit" size="md" variant="moss">
              Save quest
            </PixelButton>
          </div>
        </form>
      </Modal>

      {/* Delete Quest Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!questToDelete}
        title="Remove quest"
        message={`Are you sure you want to dismiss the quest "${questToDelete?.title}"?`}
        confirmLabel="Remove quest"
        cancelLabel="Keep quest"
        variant="berry"
        onConfirm={() => {
          if (questToDelete) {
            deleteQuest(questToDelete.id);
          }
          setQuestToDelete(null);
        }}
        onCancel={() => setQuestToDelete(null)}
      />
    </div>
  );
};
