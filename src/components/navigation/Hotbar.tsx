import React from 'react';
import { HotbarSlotId, HotbarItem } from '../../types/index.ts';
import { PixelIcon } from '../ui/PixelIcon.tsx';

export interface HotbarProps {
  activeSlot: HotbarSlotId;
  onSelectSlot: (slotId: HotbarSlotId) => void;
  onLockedClick: (featureName: string, description: string) => void;
  activeQuestsCount?: number;
}

export const HOTBAR_ITEMS: HotbarItem[] = [
  { id: 'base_camp', name: 'Home', icon: 'camp' },
  { id: 'tally_log', name: 'Log', icon: 'tally_log' },
  { id: 'quest_board', name: 'Quests', icon: 'quest_board' },
  { id: 'chronicle', name: 'Stats', icon: 'chronicle', locked: true },
  { id: 'inventory', name: 'Bag', icon: 'chest', locked: true },
  { id: 'character', name: 'Hero', icon: 'character', locked: true },
];

/**
 * Hotbar: Oak plank bar with slots.
 * Fixed bottom on mobile, floating bottom on desktop.
 * Active slot has honey border and item bobs 2px (steps(2)).
 * Short, never-truncated labels: Home, Log, Quests, Stats, Bag, Hero.
 * Tokens only.
 */
export const Hotbar: React.FC<HotbarProps> = ({
  activeSlot,
  onSelectSlot,
  onLockedClick,
  activeQuestsCount = 0,
}) => {
  const handleClick = (item: HotbarItem) => {
    if (item.locked) {
      const messages: Record<string, string> = {
        chronicle:
          'The Stats chronicle is currently sealed by the guild! The upcoming Insights update will unveil your full habit heatmaps, streaks, and activity trends.',
        inventory:
          'Your adventurer Bag of Holding is locked for now! Soon you will store artifacts, cozy potions, and realm gear forged by your tallies.',
        character:
          'The Hero profile & talent sanctum is being crafted by the guild artisans! The upcoming Character update will unlock customizable pixel sprites, titles, and attributes.',
      };
      onLockedClick(item.name, messages[item.id] || 'This realm slot unlocks in an upcoming update!');
    } else {
      onSelectSlot(item.id);
    }
  };

  return (
    <nav
      aria-label="Hotbar navigation"
      className="fixed bottom-0 left-0 right-0 sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 z-40 sm:max-w-xl w-full px-2 sm:px-0 pointer-events-none"
    >
      <div
        className="
          pointer-events-auto mx-auto
          bg-cream border-4 border-oak-dark pixel-notched
          shadow-[4px_4px_0px_var(--cocoa)]
          p-1.5 flex items-center justify-between gap-1 sm:gap-2
        "
      >
        {HOTBAR_ITEMS.map((item, index) => {
          const isActive = activeSlot === item.id;
          const isLocked = item.locked;

          return (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              aria-label={`${item.name}${isLocked ? ' (Locked)' : ''}`}
              title={`${item.name} [Slot ${index + 1}]`}
              className={`
                relative flex-1 min-w-0 h-[52px] sm:h-[56px]
                flex flex-col items-center justify-center
                border-3 border-solid select-none cursor-pointer
                transition-transform duration-75
                ${
                  isActive
                    ? 'bg-cream-deep border-honey shadow-[0_0_0_2px_var(--honey-dark)] -translate-y-0.5'
                    : isLocked
                    ? 'bg-cream border-oak-dark/40 opacity-70 hover:opacity-100 hover:bg-cream-deep'
                    : 'bg-cream border-oak-dark hover:bg-cream-deep'
                }
                active:translate-y-0.5
                focus-visible:outline-3 focus-visible:outline-honey
              `}
            >
              {/* Slot number indicator (1-6) */}
              <span className="absolute top-0.5 left-1 font-pixel-heading text-[8px] sm:text-[9px] text-cocoa-soft leading-none">
                {index + 1}
              </span>

              {/* Quest badge count */}
              {item.id === 'quest_board' && activeQuestsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-berry text-cream border-2 border-cocoa font-pixel-heading text-[9px] flex items-center justify-center font-bold">
                  {activeQuestsCount}
                </span>
              )}

              {/* Icon Container with Bob on Active */}
              <div className={`relative ${isActive ? 'animate-pixel-bob-2px' : ''}`}>
                <PixelIcon
                  name={item.icon}
                  size={20}
                  className={isLocked ? 'opacity-70' : ''}
                />
                {isLocked && (
                  <span className="absolute -bottom-1 -right-1 bg-cream border border-oak-dark p-0.5">
                    <PixelIcon name="lock" size={9} />
                  </span>
                )}
              </div>

              {/* Never-truncated short label */}
              <span
                className={`
                  font-pixel-heading text-[10px] sm:text-xs mt-0.5 whitespace-nowrap leading-none
                  ${isActive ? 'text-cocoa font-bold' : isLocked ? 'text-cocoa-soft' : 'text-cocoa'}
                `}
              >
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
