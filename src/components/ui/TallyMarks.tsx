import React from 'react';

export interface TallyMarksProps {
  count: number;
  maxDisplayBundles?: number;
  strokeColor?: string;
  slashColor?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * TallyMarks: 4 vertical strokes in cocoa + diagonal slash in ember for 5th stroke.
 * Zero hardcoded hexes.
 */
export const TallyMarks: React.FC<TallyMarksProps> = ({
  count,
  maxDisplayBundles = 8,
  strokeColor = 'var(--cocoa)',
  slashColor = 'var(--ember)',
  size = 'md',
  className = '',
}) => {
  if (count <= 0) {
    return (
      <span className="font-pixel-body text-base text-cocoa-soft italic">
        0 marks
      </span>
    );
  }

  const fullBundles = Math.floor(count / 5);
  const remainder = count % 5;

  const dims = {
    sm: { w: 22, h: 16 },
    md: { w: 28, h: 22 },
    lg: { w: 34, h: 28 },
  }[size];

  const renderBundle = (key: string, strokeCount: number, hasSlash: boolean) => {
    return (
      <svg
        key={key}
        width={dims.w}
        height={dims.h}
        viewBox="0 0 28 22"
        fill="none"
        className="flex-shrink-0"
        shapeRendering="crispEdges"
      >
        {/* 4 vertical strokes */}
        {strokeCount >= 1 && <rect x="3" y="3" width="3" height="16" fill={strokeColor} />}
        {strokeCount >= 2 && <rect x="9" y="3" width="3" height="16" fill={strokeColor} />}
        {strokeCount >= 3 && <rect x="15" y="3" width="3" height="16" fill={strokeColor} />}
        {strokeCount >= 4 && <rect x="21" y="3" width="3" height="16" fill={strokeColor} />}

        {/* Diagonal slash for 5th count */}
        {hasSlash && (
          <polygon
            points="1,18 4,20 27,4 24,2"
            fill={slashColor}
          />
        )}
      </svg>
    );
  };

  const bundlesToRender = Math.min(fullBundles, maxDisplayBundles);
  const overflowBundles = fullBundles - bundlesToRender;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {Array.from({ length: bundlesToRender }).map((_, i) =>
        renderBundle(`bundle-${i}`, 4, true)
      )}
      {remainder > 0 && renderBundle('remainder', remainder, false)}

      {overflowBundles > 0 && (
        <span className="font-pixel-heading text-xs px-1.5 py-0.5 bg-cream-deep border border-oak-dark text-cocoa">
          +{overflowBundles * 5} more
        </span>
      )}
    </div>
  );
};
