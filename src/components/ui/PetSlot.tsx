import React, { useState } from 'react';
import { PixelPanel } from './PixelPanel.tsx';
import { PixelIcon } from './PixelIcon.tsx';

export interface PetSlotProps {
  className?: string;
}

export const PetSlot: React.FC<PetSlotProps> = ({ className = '' }) => {
  const [bumping, setBumping] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleBump = () => {
    setBumping(true);
    setShowHint(true);
    setTimeout(() => setBumping(false), 200);
  };

  return (
    <PixelPanel
      variant="parchment"
      title={
        <span className="flex items-center gap-2 text-cocoa">
          <PixelIcon name="mystery" size={16} />
          <span>Realm pet sanctuary</span>
        </span>
      }
      className={className}
    >
      <div className="flex flex-col sm:flex-row items-center gap-4 py-1">
        {/* Mystery Question Block */}
        <button
          onClick={handleBump}
          aria-label="Mystery companion block"
          title="Click to inspect mystery block"
          className={`
            relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 cursor-pointer
            bg-honey border-4 border-t-cream border-l-cream border-r-honey-dark border-b-honey-dark
            shadow-[3px_3px_0px_var(--cocoa)] flex items-center justify-center
            transition-transform duration-75
            ${bumping ? '-translate-y-2' : 'hover:-translate-y-0.5 active:translate-y-1'}
          `}
        >
          {/* Rivets on corners */}
          <span className="absolute top-1 left-1 w-1 h-1 bg-honey-dark" />
          <span className="absolute top-1 right-1 w-1 h-1 bg-honey-dark" />
          <span className="absolute bottom-1 left-1 w-1 h-1 bg-honey-dark" />
          <span className="absolute bottom-1 right-1 w-1 h-1 bg-honey-dark" />

          {/* Glowing Question icon */}
          <div className="animate-pixel-bob-2px">
            <PixelIcon name="mystery" size={26} />
          </div>
        </button>

        {/* Text / Lore */}
        <div className="flex-1 text-center sm:text-left min-w-0">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h4 className="font-pixel-heading text-sm text-cocoa font-semibold">
              Mystery companion block
            </h4>
            <span className="font-pixel-heading text-[10px] bg-cream-deep px-2 py-0.5 border border-oak-dark text-cocoa">
              Coming soon
            </span>
          </div>

          <p className="font-pixel-body text-base text-cocoa-soft mt-1 leading-snug">
            {showHint
              ? '★ "A gentle forest familiar slumbers within! Continue logging tallies and quests to gather energy for hatching."'
              : 'An enchanted resting nook for your future companion. Active tallies and habit streaks will nurture your realm pet!'}
          </p>
        </div>
      </div>
    </PixelPanel>
  );
};
