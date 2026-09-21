import React, { useState } from 'react';
import { useTallyStore } from '../../store/useTallyStore.tsx';
import { parseQuickAddInput, ParseResult } from '../../lib/quickAddParser.ts';
import { PixelButton } from './PixelButton.tsx';
import { PixelIcon } from './PixelIcon.tsx';
import { useParticleSpawner } from './ParticleLayer.tsx';

export interface QuickAddBarProps {
  className?: string;
  onQuestCreated?: () => void;
}

export const QuickAddBar: React.FC<QuickAddBarProps> = ({ className = '', onQuestCreated }) => {
  const { state, logTally, logManualTimer, toggleHabit, createQuest } = useTallyStore();
  const { spawnPlusOne, spawnXpOrbs } = useParticleSpawner();
  const [input, setInput] = useState('');
  const [parseState, setParseState] = useState<ParseResult | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    if (message) setMessage(null);
    if (val.trim().length > 1) {
      const res = parseQuickAddInput(val, state.trackers);
      setParseState(res);
    } else {
      setParseState(null);
    }
  };

  const executeLogForTracker = (trackerId: string, value: number, originX?: number, originY?: number) => {
    const tracker = state.trackers.find(t => t.id === trackerId);
    if (!tracker) return;

    if (tracker.type === 'tally') {
      logTally(tracker.id, value);
      setMessage({ text: `Logged +${value} ${tracker.unit || 'reps'} to ${tracker.name}!`, type: 'success' });
      spawnPlusOne(originX ?? window.innerWidth / 2, originY ?? 200, `+${value}`);
      spawnXpOrbs(originX, originY);
    } else if (tracker.type === 'timer') {
      logManualTimer(tracker.id, value);
      setMessage({ text: `Logged ${value} min to ${tracker.name}!`, type: 'success' });
      spawnPlusOne(originX ?? window.innerWidth / 2, originY ?? 200, `+${value}m`);
      spawnXpOrbs(originX, originY);
    } else if (tracker.type === 'habit') {
      toggleHabit(tracker.id);
      setMessage({ text: `Checked off habit: ${tracker.name}!`, type: 'success' });
      spawnPlusOne(originX ?? window.innerWidth / 2, originY ?? 200, '✓');
      spawnXpOrbs(originX, originY);
    }

    setInput('');
    setParseState(null);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const result = parseQuickAddInput(input, state.trackers);

    if (result.status === 'matched' && result.targetTracker) {
      executeLogForTracker(result.targetTracker.id, result.parsedValue);
    } else if (result.status === 'ambiguous') {
      setParseState(result);
    } else {
      setParseState(result);
    }
  };

  const handleCreateQuestFromPrompt = () => {
    if (!parseState?.suggestedQuestTitle) return;

    createQuest({
      title: parseState.suggestedQuestTitle,
      kind: 'side',
      difficulty: 1,
      dueDate: new Date().toISOString().split('T')[0],
      subtasks: [],
    });

    setMessage({
      text: `Created new quest: "${parseState.suggestedQuestTitle}"!`,
      type: 'success',
    });

    setInput('');
    setParseState(null);
    if (onQuestCreated) onQuestCreated();
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className={`w-full ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center bg-cream-deep border-3 border-oak-dark shadow-[inset_2px_2px_0px_var(--cocoa-soft)] p-1.5 gap-2">
          {/* Prompt Icon */}
          <div className="pl-2 pr-1 text-oak-dark flex items-center">
            <PixelIcon name="quill" size={20} />
          </div>

          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder='Quick log (e.g. "guitar 30m", "pushups 25", "deep work 1h")...'
            className="flex-1 bg-transparent border-none outline-none font-pixel-body text-base sm:text-lg text-cocoa placeholder:text-cocoa-soft px-1 py-1"
          />

          <PixelButton type="submit" size="sm" variant="moss">
            Log
          </PixelButton>
        </div>
      </form>

      {/* Success / Status Banner */}
      {message && (
        <div
          className={`mt-2 px-3 py-2 border-2 font-pixel-heading text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-moss text-cocoa border-moss-dark'
              : 'bg-cream text-cocoa border-oak-dark'
          } shadow-[2px_2px_0px_var(--cocoa)]`}
        >
          <PixelIcon name={message.type === 'success' ? 'check' : 'star'} size={14} />
          <span>{message.text}</span>
        </div>
      )}

      {/* Ambiguous candidates picker */}
      {parseState && parseState.status === 'ambiguous' && parseState.candidateTrackers && (
        <div className="mt-2 p-3 bg-cream border-3 border-oak-dark shadow-[4px_4px_0px_var(--cocoa)]">
          <p className="font-pixel-heading text-xs text-cocoa mb-2 flex items-center gap-1.5 font-medium">
            <PixelIcon name="star" size={12} />
            <span>Multiple matches found. Select which tracker to log:</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {parseState.candidateTrackers.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => executeLogForTracker(t.id, parseState.parsedValue)}
                className="px-3 py-1.5 bg-cream-deep hover:bg-cream text-cocoa border-2 border-oak-dark font-pixel-heading text-xs cursor-pointer active:translate-y-1"
              >
                + {t.name} ({parseState.parsedValue} {t.unit || (t.type === 'timer' ? 'min' : '')})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No match: offer quest creation */}
      {parseState && parseState.status === 'no_match' && parseState.suggestedQuestTitle && (
        <div className="mt-2 p-3 bg-cream border-3 border-oak-dark shadow-[4px_4px_0px_var(--cocoa)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span className="font-pixel-body text-base text-cocoa">
            No tracker matched "{parseState.originalInput}". Turn this into a quest?
          </span>
          <PixelButton
            size="sm"
            variant="honey"
            onClick={handleCreateQuestFromPrompt}
            icon={<PixelIcon name="swords" size={14} />}
          >
            Create quest
          </PixelButton>
        </div>
      )}
    </div>
  );
};
