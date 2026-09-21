import React, { useState, useEffect } from 'react';
import { PixelButton } from './PixelButton.tsx';

export interface DialogueBoxProps {
  speaker?: string;
  text: string;
  onDone?: () => void;
  actionText?: string;
  onAction?: () => void;
  className?: string;
  instant?: boolean;
}

export const PixelGuideAvatar: React.FC<{ speaking?: boolean; size?: number }> = ({
  speaking = false,
  size = 44,
}) => {
  return (
    <div
      className={`relative flex-shrink-0 bg-oak-dark border-3 border-honey p-1 shadow-[2px_2px_0px_var(--cocoa)] ${
        speaking ? 'animate-pixel-bob-2px' : ''
      }`}
      style={{ width: size + 8, height: size + 8 }}
    >
      {/* 16x16 Pixel Sprite Guide (Cozy winged forest sprite) */}
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" shapeRendering="crispEdges">
        {/* Sprout / Flower on head */}
        <rect x="7" y="1" width="2" height="2" fill="var(--honey)" />
        <rect x="6" y="2" width="4" height="1" fill="var(--cream)" />

        {/* Wings */}
        <rect x="1" y="5" width="2" height="3" fill="var(--sky)" opacity="0.85" />
        <rect x="13" y="5" width="2" height="3" fill="var(--sky)" opacity="0.85" />
        <rect x="2" y="7" width="2" height="2" fill="var(--cream)" opacity="0.9" />
        <rect x="12" y="7" width="2" height="2" fill="var(--cream)" opacity="0.9" />

        {/* Body (Moss Forest Sprite) */}
        <rect x="4" y="4" width="8" height="2" fill="var(--moss)" />
        <rect x="3" y="6" width="10" height="6" fill="var(--moss)" />
        <rect x="4" y="12" width="8" height="2" fill="var(--moss-dark)" />

        {/* Big Pixel Eyes */}
        <rect x="5" y="7" width="2" height="3" fill="var(--cocoa)" />
        <rect x="9" y="7" width="2" height="3" fill="var(--cocoa)" />
        <rect x="5" y="7" width="1" height="1" fill="var(--cream)" />
        <rect x="9" y="7" width="1" height="1" fill="var(--cream)" />

        {/* Blush Cheeks */}
        <rect x="4" y="9" width="1" height="1" fill="var(--ember)" />
        <rect x="11" y="9" width="1" height="1" fill="var(--ember)" />

        {/* Mouth (Talk animation) */}
        {speaking ? (
          <rect x="7" y="10" width="2" height="2" fill="var(--berry)" />
        ) : (
          <rect x="7" y="10" width="2" height="1" fill="var(--cocoa)" />
        )}
      </svg>
    </div>
  );
};

export const DialogueBox: React.FC<DialogueBoxProps> = ({
  speaker = 'Tally Sprite',
  text,
  onDone,
  actionText,
  onAction,
  className = '',
  instant = false,
}) => {
  const [displayedText, setDisplayedText] = useState(instant ? text : '');
  const [isTyping, setIsTyping] = useState(!instant);

  useEffect(() => {
    if (instant) {
      setDisplayedText(text);
      setIsTyping(false);
      return;
    }

    setDisplayedText('');
    setIsTyping(true);
    let index = 0;

    const timer = setInterval(() => {
      index++;
      if (index <= text.length) {
        setDisplayedText(text.slice(0, index));
      } else {
        clearInterval(timer);
        setIsTyping(false);
        if (onDone) onDone();
      }
    }, 20);

    return () => clearInterval(timer);
  }, [text, instant, onDone]);

  const handleSkip = () => {
    setDisplayedText(text);
    setIsTyping(false);
    if (onDone) onDone();
  };

  return (
    <div
      onClick={isTyping ? handleSkip : undefined}
      className={`
        relative p-3.5 sm:p-4 bg-cream text-cocoa
        border-4 border-oak-dark pixel-notched
        shadow-[4px_4px_0px_var(--cocoa)] flex gap-3 sm:gap-4 items-start select-none
        ${isTyping ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      <PixelGuideAvatar speaking={isTyping} size={44} />

      <div className="flex-1 min-w-0">
        {/* Name Banner */}
        <div className="flex items-center justify-between mb-1">
          <span className="font-pixel-heading text-xs px-2 py-0.5 bg-honey text-cocoa border border-honey-dark font-semibold">
            {speaker}
          </span>
          {isTyping && (
            <span className="font-pixel-body text-sm text-cocoa-soft">
              (Click to skip)
            </span>
          )}
        </div>

        {/* Dialogue Body */}
        <p className="font-pixel-body text-base sm:text-lg leading-relaxed whitespace-pre-line text-cocoa">
          {displayedText}
          {isTyping && (
            <span className="inline-block w-2 h-4 bg-cocoa ml-1 align-middle" />
          )}
        </p>

        {/* Optional Action Button */}
        {actionText && onAction && !isTyping && (
          <div className="mt-3">
            <PixelButton size="sm" variant="moss" onClick={onAction}>
              {actionText}
            </PixelButton>
          </div>
        )}
      </div>
    </div>
  );
};
