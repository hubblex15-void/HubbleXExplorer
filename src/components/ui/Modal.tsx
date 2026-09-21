import React, { useEffect } from 'react';
import { PixelIcon } from './PixelIcon.tsx';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Modal: A wooden sign that drops in.
 * Keyboard accessible (Escape key), 44px close target, zero hardcoded hexes.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[maxWidth];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-cocoa/75"
    >
      {/* Backdrop click area */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Wooden Sign Modal Box */}
      <div
        className={`
          relative w-full ${maxWidthClass} max-h-[90vh] flex flex-col
          bg-cream border-4 border-oak-dark pixel-notched
          shadow-[6px_6px_0px_var(--cocoa)] text-cocoa
          animate-pixel-slide-in z-10
        `}
      >
        {/* Inner highlight line */}
        <div className="absolute inset-[2px] border border-cream-deep pointer-events-none" />

        {/* 4 Corner Nails */}
        <span className="absolute top-2 left-2 w-1.5 h-1.5 bg-cocoa shadow-[1px_1px_0_var(--oak-dark)] pointer-events-none z-20" />
        <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-cocoa shadow-[1px_1px_0_var(--oak-dark)] pointer-events-none z-20" />
        <span className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-cocoa shadow-[1px_1px_0_var(--oak-dark)] pointer-events-none z-20" />
        <span className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-cocoa shadow-[1px_1px_0_var(--oak-dark)] pointer-events-none z-20" />

        {/* Modal Header */}
        <div className="px-5 py-3 border-b-2 border-cream-deep flex items-center justify-between gap-3 relative z-10">
          <h2 className="font-pixel-heading text-base sm:text-lg text-cocoa font-bold tracking-wide">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center border-2 border-oak-dark bg-cream-deep text-cocoa hover:bg-cream active:translate-y-1 cursor-pointer focus-visible:outline-3 focus-visible:outline-honey"
          >
            <PixelIcon name="x" size={16} />
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="p-5 overflow-y-auto relative z-10 max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
};
