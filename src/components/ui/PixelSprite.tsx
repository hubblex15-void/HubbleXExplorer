import React, { useState, useEffect } from 'react';

export interface PixelSpriteProps {
  frames: React.ReactNode[];
  fps?: number;
  className?: string;
  paused?: boolean;
}

/**
 * Stepped pixel-art sprite component
 * Cycles through frames array at specified fps
 */
export const PixelSprite: React.FC<PixelSpriteProps> = ({
  frames,
  fps = 8,
  className = '',
  paused = false,
}) => {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (paused || frames.length <= 1) return;

    const interval = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % frames.length);
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [frames.length, fps, paused]);

  if (frames.length === 0) return null;

  return (
    <div
      className={`inline-flex items-center justify-center select-none ${className}`}
      style={{ imageRendering: 'pixelated' }}
    >
      {frames[frameIndex % frames.length]}
    </div>
  );
};
