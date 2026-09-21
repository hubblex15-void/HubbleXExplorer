import React, { useEffect } from 'react';
import { CelebrationEvent } from '../../store/useTallyStore.tsx';
import { PixelIcon } from './PixelIcon.tsx';
import { PixelButton } from './PixelButton.tsx';
import { PixelSprite } from './PixelSprite.tsx';
import { useParticleSpawner } from './ParticleLayer.tsx';

export interface CelebrationBannerProps {
  event: CelebrationEvent | null;
  onDismiss: () => void;
}

/**
 * Animated celebration banner:
 * - Level up: swinging wooden sign between 2 frames + square fireworks
 * - Quest complete: 3-frame opening chest + bounce
 */
export const CelebrationBanner: React.FC<CelebrationBannerProps> = ({ event, onDismiss }) => {
  const { spawnLevelUpFireworks } = useParticleSpawner();

  useEffect(() => {
    if (!event) return;
    if (event.type === 'level_up') {
      spawnLevelUpFireworks();
    }
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);
    return () => clearTimeout(timer);
  }, [event, onDismiss, spawnLevelUpFireworks]);

  if (!event) return null;

  const isLevelUp = event.type === 'level_up';
  const isQuest = event.type === 'quest_complete';

  // Chest opening frames for quest complete (3 frames)
  const chestFrames = [
    <PixelIcon key="c1" name="chest" size={32} />,
    (
      <svg key="c2" width={32} height={32} viewBox="0 0 16 16" fill="none" shapeRendering="crispEdges">
        <rect x="1" y="4" width="14" height="10" fill="var(--oak)" />
        <rect x="2" y="5" width="12" height="3" fill="var(--oak-dark)" />
        <rect x="2" y="8" width="12" height="5" fill="var(--cream-deep)" />
        <rect x="1" y="2" width="14" height="3" fill="var(--oak-dark)" />
        <rect x="7" y="6" width="2" height="2" fill="var(--honey)" />
      </svg>
    ),
    (
      <svg key="c3" width={32} height={32} viewBox="0 0 16 16" fill="none" shapeRendering="crispEdges">
        <rect x="1" y="6" width="14" height="8" fill="var(--oak)" />
        <rect x="2" y="8" width="12" height="5" fill="var(--cream-deep)" />
        <rect x="1" y="0" width="14" height="4" fill="var(--oak-dark)" />
        <rect x="6" y="5" width="4" height="3" fill="var(--honey)" />
        <rect x="7" y="3" width="2" height="2" fill="var(--cream)" />
      </svg>
    ),
  ];

  return (
    <div
      role="alert"
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-md pointer-events-auto"
      onClick={onDismiss}
    >
      <div
        className={`
          relative p-4 sm:p-5 text-center cursor-pointer select-none
          bg-cream border-4 border-oak-dark pixel-notched
          shadow-[6px_6px_0px_var(--cocoa)] text-cocoa
          ${isLevelUp ? 'animate-pixel-swing' : 'animate-pixel-slide-in'}
        `}
      >
        {/* Decorative corner nails */}
        <span className="absolute top-2 left-2 w-1.5 h-1.5 bg-cocoa shadow-[1px_1px_0_var(--oak-dark)]" />
        <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-cocoa shadow-[1px_1px_0_var(--oak-dark)]" />
        <span className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-cocoa shadow-[1px_1px_0_var(--oak-dark)]" />
        <span className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-cocoa shadow-[1px_1px_0_var(--oak-dark)]" />

        {/* Center Visual */}
        <div className="flex items-center justify-center gap-2 mb-2">
          {isQuest ? (
            <PixelSprite frames={chestFrames} fps={4} />
          ) : (
            <div className="animate-pixel-bob-2px">
              <PixelIcon name={isLevelUp ? 'star' : 'xp_orb'} size={28} />
            </div>
          )}
        </div>

        <div className="inline-block px-2.5 py-0.5 mb-1 bg-cream-deep border border-oak-dark font-pixel-heading text-xs text-cocoa">
          {isLevelUp ? 'Rank elevated' : isQuest ? 'Quest accomplished' : 'Goal reached'}
        </div>

        <h3 className="font-pixel-heading text-base sm:text-lg text-cocoa font-bold tracking-wide my-1">
          {event.title}
        </h3>

        {event.subtitle && (
          <p className="font-pixel-body text-base text-cocoa-soft leading-snug mb-3">
            {event.subtitle}
          </p>
        )}

        <div className="mt-2 flex items-center justify-center gap-2">
          <PixelButton size="sm" variant="honey" onClick={onDismiss}>
            Claim reward
          </PixelButton>
        </div>
      </div>
    </div>
  );
};
