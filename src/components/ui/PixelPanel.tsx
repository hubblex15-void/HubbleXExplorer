import React from 'react';

export interface PixelPanelProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  variant?: 'parchment' | 'sign' | 'well';
  className?: string;
  contentClassName?: string;
  id?: string;
  showNails?: boolean;
}

/**
 * PixelPanel: Cream fill, 4px oak-dark border with inner highlight line,
 * notched corners, and optional small nail pixels on sign panels.
 * Zero hard-coded hexes.
 */
export const PixelPanel: React.FC<PixelPanelProps> = ({
  children,
  title,
  subtitle,
  action,
  variant = 'parchment',
  className = '',
  contentClassName = '',
  id,
  showNails = false,
}) => {
  const isWell = variant === 'well';
  const displayNails = showNails || variant === 'sign';

  return (
    <div
      id={id}
      className={`
        relative pixel-notched
        ${isWell ? 'bg-cream-deep border-3 border-oak-dark' : 'bg-cream border-4 border-oak-dark'}
        shadow-[4px_4px_0px_var(--cocoa)]
        text-cocoa
        ${className}
      `}
    >
      {/* Inner highlight line */}
      <div className="absolute inset-[2px] border border-cream-deep pointer-events-none" />

      {/* Decorative corner nails for sign panels */}
      {displayNails && (
        <>
          <span className="absolute top-2 left-2 w-1.5 h-1.5 bg-cocoa shadow-[1px_1px_0_var(--oak-dark)] pointer-events-none z-10" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-cocoa shadow-[1px_1px_0_var(--oak-dark)] pointer-events-none z-10" />
          <span className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-cocoa shadow-[1px_1px_0_var(--oak-dark)] pointer-events-none z-10" />
          <span className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-cocoa shadow-[1px_1px_0_var(--oak-dark)] pointer-events-none z-10" />
        </>
      )}

      {(title || action || subtitle) && (
        <div className="px-4 py-2.5 flex items-center justify-between gap-3 border-b-2 border-cream-deep relative z-10">
          <div className="min-w-0">
            {title && (
              <h3 className="font-pixel-heading text-sm sm:text-base tracking-wide flex items-center gap-2 text-cocoa font-semibold">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="font-pixel-body text-base text-cocoa-soft mt-0.5 leading-snug">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}

      <div className={`p-4 relative z-10 ${contentClassName}`}>{children}</div>
    </div>
  );
};
