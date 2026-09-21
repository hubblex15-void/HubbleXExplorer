import React from 'react';

export interface PixelIconProps {
  name: string;
  size?: number;
  className?: string;
  color?: string;
}

/**
 * PixelIcon recolored completely via semantic design tokens.
 * Zero hardcoded hexes.
 */
export const PixelIcon: React.FC<PixelIconProps> = ({
  name,
  size = 20,
  className = '',
  color = 'currentColor',
}) => {
  const s = size;

  switch (name) {
    case 'flame':
    case 'fire':
      return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none" className={className} shapeRendering="crispEdges">
          <rect x="7" y="1" width="2" height="3" fill="var(--honey)" />
          <rect x="5" y="3" width="6" height="3" fill="var(--ember)" />
          <rect x="4" y="6" width="8" height="4" fill="var(--ember)" />
          <rect x="3" y="9" width="10" height="5" fill="var(--berry)" />
          <rect x="6" y="7" width="4" height="5" fill="var(--honey)" />
          <rect x="7" y="9" width="2" height="3" fill="var(--cream)" />
        </svg>
      );

    case 'swords':
      return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none" className={className} shapeRendering="crispEdges">
          <rect x="13" y="1" width="2" height="2" fill="var(--sky)" />
          <rect x="11" y="3" width="2" height="2" fill="var(--sky)" />
          <rect x="9" y="5" width="2" height="2" fill="var(--sky)" />
          <rect x="7" y="7" width="2" height="2" fill="var(--sky)" />
          <rect x="5" y="9" width="3" height="1" fill="var(--honey)" />
          <rect x="6" y="8" width="1" height="3" fill="var(--honey)" />
          <rect x="3" y="11" width="2" height="2" fill="var(--oak)" />
          <rect x="1" y="13" width="2" height="2" fill="var(--oak-dark)" />
        </svg>
      );

    case 'shield':
      return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none" className={className} shapeRendering="crispEdges">
          <rect x="3" y="2" width="10" height="2" fill="var(--oak)" />
          <rect x="2" y="4" width="12" height="6" fill="var(--cream-deep)" />
          <rect x="3" y="10" width="10" height="2" fill="var(--oak)" />
          <rect x="4" y="12" width="8" height="2" fill="var(--oak-dark)" />
          <rect x="6" y="14" width="4" height="1" fill="var(--cocoa)" />
          <rect x="7" y="4" width="2" height="7" fill="var(--honey)" />
          <rect x="4" y="6" width="8" height="2" fill="var(--honey)" />
        </svg>
      );

    case 'clock':
    case 'timer':
      return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none" className={className} shapeRendering="crispEdges">
          <rect x="4" y="1" width="8" height="1" fill="var(--cocoa)" />
          <rect x="2" y="2" width="12" height="1" fill="var(--cocoa)" />
          <rect x="1" y="4" width="14" height="8" fill="var(--honey)" />
          <rect x="2" y="13" width="12" height="1" fill="var(--cocoa)" />
          <rect x="4" y="14" width="8" height="1" fill="var(--cocoa)" />
          <rect x="3" y="3" width="10" height="10" fill="var(--cream)" />
          <rect x="7" y="4" width="2" height="4" fill="var(--cocoa)" />
          <rect x="7" y="7" width="5" height="2" fill="var(--cocoa)" />
        </svg>
      );

    case 'hourglass':
      return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none" className={className} shapeRendering="crispEdges">
          <rect x="2" y="1" width="12" height="2" fill="var(--oak-dark)" />
          <rect x="3" y="3" width="10" height="1" fill="var(--oak)" />
          <rect x="4" y="4" width="8" height="2" fill="var(--sky)" />
          <rect x="5" y="6" width="6" height="2" fill="var(--sky)" />
          <rect x="7" y="8" width="2" height="1" fill="var(--honey)" />
          <rect x="5" y="9" width="6" height="2" fill="var(--sky)" />
          <rect x="4" y="11" width="8" height="2" fill="var(--honey)" />
          <rect x="3" y="13" width="10" height="1" fill="var(--oak)" />
          <rect x="2" y="14" width="12" height="2" fill="var(--oak-dark)" />
        </svg>
      );

    case 'music':
    case 'guitar':
      return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none" className={className} shapeRendering="crispEdges">
          <rect x="9" y="1" width="5" height="2" fill="var(--dusk)" />
          <rect x="8" y="2" width="2" height="7" fill="var(--cocoa)" />
          <rect x="13" y="2" width="2" height="7" fill="var(--cocoa)" />
          <rect x="5" y="7" width="4" height="4" fill="var(--dusk)" />
          <rect x="4" y="8" width="5" height="3" fill="var(--sky)" />
          <rect x="11" y="7" width="4" height="4" fill="var(--dusk)" />
          <rect x="10" y="8" width="5" height="3" fill="var(--sky)" />
        </svg>
      );

    case 'dumbbell':
    case 'training':
      return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none" className={className} shapeRendering="crispEdges">
          <rect x="1" y="5" width="2" height="6" fill="var(--cocoa)" />
          <rect x="3" y="4" width="2" height="8" fill="var(--oak-dark)" />
          <rect x="5" y="7" width="6" height="2" fill="var(--cream-deep)" />
          <rect x="11" y="4" width="2" height="8" fill="var(--oak-dark)" />
          <rect x="13" y="5" width="2" height="6" fill="var(--cocoa)" />
        </svg>
      );

    case 'volleyball':
      return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none" className={className} shapeRendering="crispEdges">
          <rect x="4" y="1" width="8" height="14" fill="var(--honey)" />
          <rect x="1" y="4" width="14" height="8" fill="var(--honey)" />
          <rect x="2" y="2" width="12" height="12" fill="var(--sky)" />
          <rect x="4" y="4" width="8" height="8" fill="var(--cream)" />
          <rect x="7" y="1" width="2" height="14" fill="var(--cocoa)" />
          <rect x="1" y="7" width="14" height="2" fill="var(--cocoa)" />
        </svg>
      );

    case 'quill':
    case 'book':
      return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none" className={className} shapeRendering="crispEdges">
          <rect x="13" y="1" width="2" height="3" fill="var(--sky)" />
          <rect x="11" y="3" width="3" height="4" fill="var(--moss)" />
          <rect x="8" y="6" width="4" height="4" fill="var(--moss-dark)" />
          <rect x="5" y="9" width="4" height="3" fill="var(--oak)" />
          <rect x="3" y="12" width="3" height="3" fill="var(--oak-dark)" />
          <rect x="1" y="14" width="2" height="2" fill="var(--cocoa)" />
        </svg>
      );

    case 'star':
      return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none" className={className} shapeRendering="crispEdges">
          <rect x="7" y="1" width="2" height="3" fill="var(--honey-dark)" />
          <rect x="6" y="3" width="4" height="3" fill="var(--honey)" />
          <rect x="1" y="5" width="14" height="3" fill="var(--honey)" />
          <rect x="3" y="7" width="10" height="3" fill="var(--cream)" />
          <rect x="4" y="10" width="8" height="2" fill="var(--honey)" />
          <rect x="2" y="12" width="3" height="3" fill="var(--honey-dark)" />
          <rect x="11" y="12" width="3" height="3" fill="var(--honey-dark)" />
        </svg>
      );

    case 'check':
      return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none" className={className} shapeRendering="crispEdges">
          <rect x="12" y="3" width="2" height="2" fill="var(--moss)" />
          <rect x="10" y="5" width="2" height="2" fill="var(--moss)" />
          <rect x="8" y="7" width="2" height="2" fill="var(--moss)" />
          <rect x="6" y="9" width="2" height="2" fill="var(--moss)" />
          <rect x="4" y="7" width="2" height="2" fill="var(--moss)" />
          <rect x="2" y="5" width="2" height="2" fill="var(--moss)" />
          <rect x="6" y="11" width="2" height="2" fill="var(--moss-dark)" />
        </svg>
      );

    case 'cross':
    case 'x':
      return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none" className={className} shapeRendering="crispEdges">
          <rect x="2" y="2" width="3" height="3" fill="var(--berry)" />
          <rect x="11" y="2" width="3" height="3" fill="var(--berry)" />
          <rect x="5" y="5" width="6" height="6" fill="var(--berry)" />
          <rect x="2" y="11" width="3" height="3" fill="var(--berry)" />
          <rect x="11" y="11" width="3" height="3" fill="var(--berry)" />
        </svg>
      );

    case 'plus':
      return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none" className={className} shapeRendering="crispEdges">
          <rect x="6" y="2" width="4" height="12" fill={color} />
          <rect x="2" y="6" width="12" height="4" fill={color} />
        </svg>
      );

    case 'lock':
      return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none" className={className} shapeRendering="crispEdges">
          <rect x="4" y="2" width="8" height="5" fill="var(--cream-deep)" />
          <rect x="6" y="4" width="4" height="3" fill="var(--cocoa)" />
          <rect x="3" y="6" width="10" height="8" fill="var(--honey)" />
          <rect x="4" y="7" width="8" height="6" fill="var(--honey-dark)" />
          <rect x="7" y="9" width="2" height="2" fill="var(--cocoa)" />
          <rect x="7" y="11" width="2" height="2" fill="var(--cocoa)" />
        </svg>
      );

    case 'gear':
    case 'settings':
      return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none" className={className} shapeRendering="crispEdges">
          <rect x="6" y="1" width="4" height="14" fill="var(--oak)" />
          <rect x="1" y="6" width="14" height="4" fill="var(--oak)" />
          <rect x="3" y="3" width="10" height="10" fill="var(--cream-deep)" />
          <rect x="5" y="5" width="6" height="6" fill="var(--oak-dark)" />
          <rect x="6" y="6" width="4" height="4" fill="var(--cocoa)" />
        </svg>
      );

    case 'mystery':
    case 'question':
      return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none" className={className} shapeRendering="crispEdges">
          <rect x="1" y="1" width="14" height="14" fill="var(--honey)" />
          <rect x="2" y="2" width="12" height="12" fill="var(--honey-dark)" />
          <rect x="4" y="3" width="8" height="2" fill="var(--cream)" />
          <rect x="10" y="4" width="3" height="4" fill="var(--cream)" />
          <rect x="7" y="7" width="4" height="3" fill="var(--cream)" />
          <rect x="7" y="9" width="2" height="2" fill="var(--cream)" />
          <rect x="7" y="12" width="2" height="2" fill="var(--cream)" />
        </svg>
      );

    case 'heart':
      return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none" className={className} shapeRendering="crispEdges">
          <rect x="2" y="3" width="4" height="3" fill="var(--berry)" />
          <rect x="10" y="3" width="4" height="3" fill="var(--berry)" />
          <rect x="1" y="5" width="14" height="4" fill="var(--berry)" />
          <rect x="2" y="9" width="12" height="3" fill="var(--berry)" />
          <rect x="4" y="12" width="8" height="2" fill="var(--cocoa)" />
          <rect x="7" y="14" width="2" height="1" fill="var(--cocoa)" />
          <rect x="3" y="4" width="2" height="2" fill="var(--cream)" />
        </svg>
      );

    case 'xp_orb':
    case 'gem':
      return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none" className={className} shapeRendering="crispEdges">
          <rect x="6" y="2" width="4" height="2" fill="var(--honey)" />
          <rect x="3" y="4" width="10" height="2" fill="var(--moss)" />
          <rect x="2" y="6" width="12" height="4" fill="var(--moss)" />
          <rect x="3" y="10" width="10" height="2" fill="var(--moss-dark)" />
          <rect x="6" y="12" width="4" height="2" fill="var(--moss-dark)" />
          <rect x="5" y="4" width="3" height="3" fill="var(--cream)" />
        </svg>
      );

    case 'chest':
    case 'inventory':
      return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none" className={className} shapeRendering="crispEdges">
          <rect x="1" y="2" width="14" height="12" fill="var(--oak)" />
          <rect x="2" y="3" width="12" height="4" fill="var(--oak)" />
          <rect x="2" y="8" width="12" height="5" fill="var(--oak-dark)" />
          <rect x="1" y="6" width="14" height="2" fill="var(--cocoa)" />
          <rect x="7" y="6" width="2" height="3" fill="var(--honey)" />
          <rect x="7" y="7" width="2" height="2" fill="var(--cream)" />
        </svg>
      );

    case 'chronicle':
    case 'chart':
      return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none" className={className} shapeRendering="crispEdges">
          <rect x="2" y="1" width="12" height="14" fill="var(--cream)" />
          <rect x="4" y="3" width="8" height="2" fill="var(--oak-dark)" />
          <rect x="4" y="6" width="8" height="1" fill="var(--oak)" />
          <rect x="4" y="8" width="8" height="1" fill="var(--oak)" />
          <rect x="4" y="10" width="8" height="1" fill="var(--oak)" />
          <rect x="9" y="11" width="4" height="3" fill="var(--sky)" />
          <rect x="6" y="12" width="2" height="2" fill="var(--honey)" />
        </svg>
      );

    case 'character':
    case 'hero':
      return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none" className={className} shapeRendering="crispEdges">
          <rect x="4" y="1" width="8" height="7" fill="var(--cream-deep)" />
          <rect x="4" y="1" width="8" height="3" fill="var(--oak-dark)" />
          <rect x="5" y="4" width="2" height="2" fill="var(--cocoa)" />
          <rect x="9" y="4" width="2" height="2" fill="var(--cocoa)" />
          <rect x="6" y="6" width="4" height="1" fill="var(--ember)" />
          <rect x="3" y="8" width="10" height="7" fill="var(--moss)" />
          <rect x="5" y="8" width="6" height="7" fill="var(--moss-dark)" />
        </svg>
      );

    case 'camp':
    case 'base_camp':
      return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none" className={className} shapeRendering="crispEdges">
          <rect x="7" y="2" width="2" height="2" fill="var(--honey)" />
          <rect x="6" y="4" width="4" height="2" fill="var(--ember)" />
          <rect x="4" y="6" width="8" height="3" fill="var(--ember)" />
          <rect x="2" y="9" width="12" height="4" fill="var(--berry)" />
          <rect x="1" y="13" width="14" height="2" fill="var(--cocoa)" />
          <rect x="6" y="9" width="4" height="5" fill="var(--cocoa)" />
        </svg>
      );

    case 'tally_log':
      return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none" className={className} shapeRendering="crispEdges">
          <rect x="2" y="2" width="2" height="12" fill="var(--cocoa)" />
          <rect x="5" y="2" width="2" height="12" fill="var(--cocoa)" />
          <rect x="8" y="2" width="2" height="12" fill="var(--cocoa)" />
          <rect x="11" y="2" width="2" height="12" fill="var(--cocoa)" />
          <polygon points="1,12 3,14 14,3 12,1" fill="var(--ember)" />
        </svg>
      );

    case 'quest_board':
      return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none" className={className} shapeRendering="crispEdges">
          <rect x="2" y="2" width="12" height="12" fill="var(--oak)" />
          <rect x="3" y="3" width="10" height="10" fill="var(--cream)" />
          <rect x="7" y="1" width="2" height="3" fill="var(--honey)" />
          <rect x="5" y="5" width="6" height="2" fill="var(--cocoa)" />
          <rect x="5" y="8" width="6" height="1" fill="var(--oak-dark)" />
          <rect x="5" y="10" width="4" height="1" fill="var(--oak-dark)" />
        </svg>
      );

    default:
      return (
        <svg width={s} height={s} viewBox="0 0 16 16" fill="none" className={className} shapeRendering="crispEdges">
          <rect x="3" y="3" width="10" height="10" fill="var(--honey)" />
          <rect x="5" y="5" width="6" height="6" fill="var(--cocoa)" />
        </svg>
      );
  }
};
