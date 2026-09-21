import React from 'react';

export interface SegmentedBarProps {
  current: number;
  max: number;
  segments?: number;
  variant?: 'honey' | 'moss' | 'ember' | 'sky';
  label?: string;
  showNumbers?: boolean;
  className?: string;
  height?: number;
}

/**
 * SegmentedBar: Hunger/XP bar style with highlight row and a shimmering pixel at the head.
 * Zero hard-coded hexes.
 */
export const SegmentedBar: React.FC<SegmentedBarProps> = ({
  current,
  max,
  segments = 10,
  variant = 'honey',
  label,
  showNumbers = true,
  className = '',
  height = 14,
}) => {
  const safeMax = Math.max(1, max);
  const safeCurrent = Math.max(0, Math.min(current, safeMax));
  const fillRatio = safeCurrent / safeMax;
  const activeSegments = Math.round(fillRatio * segments);

  const colors = {
    honey: {
      fill: 'bg-honey',
      highlight: 'bg-cream',
      border: 'border-honey-dark',
      dark: 'bg-honey-dark',
    },
    moss: {
      fill: 'bg-moss',
      highlight: 'bg-cream-deep',
      border: 'border-moss-dark',
      dark: 'bg-moss-dark',
    },
    ember: {
      fill: 'bg-ember',
      highlight: 'bg-honey',
      border: 'border-cocoa',
      dark: 'bg-berry',
    },
    sky: {
      fill: 'bg-sky',
      highlight: 'bg-cream',
      border: 'border-oak-dark',
      dark: 'bg-dusk',
    },
  }[variant];

  return (
    <div className={`w-full ${className}`}>
      {(label || showNumbers) && (
        <div className="flex justify-between items-center mb-1 text-xs font-pixel-heading text-cocoa font-medium">
          {label && <span>{label}</span>}
          {showNumbers && (
            <span className="font-pixel-body text-sm text-cocoa-soft">
              {safeCurrent} / {safeMax}
            </span>
          )}
        </div>
      )}

      {/* Segmented Track */}
      <div
        className="flex items-center gap-1 p-1 bg-cream-deep border-2 border-oak-dark shadow-[inset_1px_1px_0px_var(--cocoa-soft)]"
        style={{ height: height + 6 }}
      >
        {Array.from({ length: segments }).map((_, idx) => {
          const isFilled = idx < activeSegments;
          const isHead = idx === activeSegments - 1;

          return (
            <div
              key={idx}
              className={`
                relative flex-1 h-full border border-oak-dark/40 overflow-hidden
                ${isFilled ? colors.fill : 'bg-cream/40'}
              `}
            >
              {/* Highlight row along top */}
              {isFilled && (
                <div
                  className={`absolute top-0 inset-x-0 h-1 ${colors.highlight} opacity-80 pointer-events-none`}
                />
              )}

              {/* Shimmering pixel at head segment */}
              {isHead && (
                <span
                  className="absolute top-0.5 right-0.5 w-1 h-1 bg-cream animate-pixel-shimmer pointer-events-none"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
