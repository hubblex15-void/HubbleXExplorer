import React from 'react';

/**
 * Subtle low-contrast tiled pixel pattern (grass with tiny flowers)
 * Built as an inline SVG component using CSS variables.
 * Never a flat color.
 */
export const PixelBackdrop: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none -z-10 select-none overflow-hidden"
    >
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="crispEdges"
      >
        <defs>
          <pattern
            id="cozy-pixel-pattern"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            {/* Base warm ground fill */}
            <rect width="32" height="32" fill="var(--cream)" />

            {/* Inset texture dots (cream-deep) */}
            <rect x="0" y="0" width="4" height="4" fill="var(--cream-deep)" opacity="0.6" />
            <rect x="16" y="16" width="4" height="4" fill="var(--cream-deep)" opacity="0.6" />
            <rect x="8" y="24" width="4" height="4" fill="var(--cream-deep)" opacity="0.4" />
            <rect x="24" y="8" width="4" height="4" fill="var(--cream-deep)" opacity="0.4" />

            {/* Tiny stylized pixel grass tuft 1 */}
            <rect x="6" y="10" width="2" height="4" fill="var(--moss)" opacity="0.35" />
            <rect x="8" y="8" width="2" height="6" fill="var(--moss-dark)" opacity="0.3" />
            <rect x="10" y="12" width="2" height="2" fill="var(--moss)" opacity="0.3" />

            {/* Tiny stylized pixel grass tuft 2 */}
            <rect x="22" y="22" width="2" height="4" fill="var(--moss)" opacity="0.35" />
            <rect x="24" y="20" width="2" height="6" fill="var(--moss-dark)" opacity="0.3" />

            {/* Tiny pixel flower A: honey petal with cocoa stem */}
            <rect x="12" y="4" width="2" height="2" fill="var(--honey)" opacity="0.5" />
            <rect x="12" y="6" width="2" height="2" fill="var(--moss-dark)" opacity="0.3" />

            {/* Tiny pixel flower B: ember petal with cocoa stem */}
            <rect x="28" y="18" width="2" height="2" fill="var(--ember)" opacity="0.4" />
            <rect x="28" y="20" width="2" height="2" fill="var(--moss-dark)" opacity="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cozy-pixel-pattern)" />
      </svg>
    </div>
  );
};
