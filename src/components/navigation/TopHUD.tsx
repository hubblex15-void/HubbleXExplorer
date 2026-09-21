import React from 'react';
import { useTallyStore } from '../../store/useTallyStore.tsx';
import { PixelIcon } from '../ui/PixelIcon.tsx';
import { SegmentedBar } from '../ui/SegmentedBar.tsx';
import { IconButton } from '../ui/IconButton.tsx';
import { type WeatherTarget } from '../../livingscene/index.ts';

export interface TopHUDProps {
  onOpenSettings: () => void;
  weather?: WeatherTarget;
}

/**
 * TopHUD: Cozy wooden cabin oak plank header.
 * Uses tokens only.
 * Press Start 2P font specifically for the level number.
 * Sentence case everywhere.
 */
export const TopHUD: React.FC<TopHUDProps> = ({ onOpenSettings, weather }) => {
  const { state, levelInfo, streaks, totalXp } = useTallyStore();

  return (
    <header className="w-full bg-cream border-b-4 border-oak-dark px-3 sm:px-6 py-2.5 sm:py-3 text-cocoa shadow-[0_4px_0_var(--cocoa)] relative z-30">
      {/* Oak plank top highlight */}
      <div className="absolute top-0 inset-x-0 h-0.5 bg-cream-deep pointer-events-none" />

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: App Title & Hero Name */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-2.5">
            {/* Wooden Crest Block */}
            <div className="w-10 h-10 bg-cream-deep border-3 border-oak-dark flex items-center justify-center shadow-[2px_2px_0px_var(--cocoa)] flex-shrink-0">
              <PixelIcon name="swords" size={20} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-pixel-heading text-base sm:text-lg font-bold text-cocoa tracking-wide leading-none">
                  Tally Realm
                </h1>
                <span className="font-pixel-body text-sm px-1.5 py-0.2 bg-cream-deep border border-oak-dark text-cocoa-soft">
                  {state.profile.name || 'Hero'}
                </span>
              </div>
              <p className="font-pixel-body text-sm text-cocoa-soft leading-none mt-1">
                Cabin ledger • {totalXp} XP total
              </p>
            </div>
          </div>

          {/* Mobile right side: Settings button */}
          <div className="md:hidden flex items-center">
            <IconButton
              icon={<PixelIcon name="gear" size={18} />}
              label="Settings"
              onClick={onOpenSettings}
              variant="oak"
              size="md"
            />
          </div>
        </div>

        {/* Center/Right: Level Badge, Segmented XP Bar, Streak Campfire & Settings */}
        <div className="w-full md:w-auto flex-1 flex items-center justify-end gap-2.5 sm:gap-3">
          {/* Level Wooden Sign */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center bg-cream-deep border-3 border-oak-dark px-2.5 py-1 shadow-[2px_2px_0px_var(--cocoa)] min-w-[56px]">
            <span className="font-pixel-heading text-[10px] text-cocoa-soft font-semibold leading-none">
              Level
            </span>
            <span className="font-pixel-level text-xs sm:text-sm text-cocoa leading-none mt-1">
              {levelInfo.level}
            </span>
          </div>

          {/* Segmented XP Bar */}
          <div className="flex-1 max-w-xs min-w-[80px]">
            <SegmentedBar
              current={levelInfo.currentLevelXp}
              max={levelInfo.nextLevelXpRequired}
              segments={10}
              variant="honey"
              height={12}
              label="Experience"
              showNumbers={true}
            />
          </div>

          {/* Streak Campfire Badge */}
          <div
            title={`Campfire Streak: ${streaks.currentStreak} days (${streaks.tier.title})${
              streaks.hasLoggedToday ? ' - Campfire roaring today!' : ' - Log today to feed the fire!'
            }`}
            className={`
              flex-shrink-0 flex items-center gap-2 px-2.5 py-1.5 border-3 border-solid
              bg-cream-deep shadow-[2px_2px_0px_var(--cocoa)]
              ${streaks.hasLoggedToday ? 'border-ember' : 'border-oak-dark'}
            `}
          >
            <div className={streaks.currentStreak > 0 ? 'animate-pixel-flicker' : ''}>
              <PixelIcon name="flame" size={18} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-pixel-heading text-xs font-bold text-ember">
                {streaks.currentStreak}d
              </span>
              <span className="font-pixel-body text-[10px] text-cocoa-soft mt-0.5">
                {streaks.hasLoggedToday ? 'Lit' : 'Ready'}
              </span>
            </div>
          </div>

          {/* Desktop right side: Settings button */}
          <div className="hidden md:flex items-center ml-1 flex-shrink-0">
            <IconButton
              icon={<PixelIcon name="gear" size={18} />}
              label="Settings & Backups"
              onClick={onOpenSettings}
              variant="oak"
              size="md"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
