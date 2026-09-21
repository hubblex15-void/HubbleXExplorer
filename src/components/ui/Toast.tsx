import React from 'react';
import { PixelIcon } from './PixelIcon.tsx';

export interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'reward';
  icon?: string;
  onClose?: () => void;
}

/**
 * Cozy in-game pixel toast card.
 * Tokens only.
 */
export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  icon = 'star',
  onClose,
}) => {
  const typeStyles = {
    success: 'bg-moss text-cocoa border-moss-dark',
    reward: 'bg-honey text-cocoa border-honey-dark',
    info: 'bg-cream-deep text-cocoa border-oak-dark',
  }[type];

  return (
    <div
      role="alert"
      className={`
        px-3.5 py-2.5 border-3 border-solid pixel-notched
        shadow-[4px_4px_0px_var(--cocoa)]
        flex items-center gap-2.5 font-pixel-heading text-sm
        animate-pixel-slide-in
        ${typeStyles}
      `}
    >
      <span className="flex-shrink-0">
        <PixelIcon name={icon} size={16} />
      </span>
      <span className="flex-1 font-pixel-body text-base">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close message"
          className="ml-2 w-8 h-8 flex items-center justify-center border border-cocoa/30 hover:bg-cocoa/10 cursor-pointer"
        >
          <PixelIcon name="x" size={12} />
        </button>
      )}
    </div>
  );
};
