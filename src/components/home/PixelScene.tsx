import React from 'react';

export interface PixelSceneProps {
  streak: number;
  dailyGoalsMet: boolean;
  className?: string;
  onPetAnchorClick?: () => void;
}

/**
 * PixelScene: Cozy SVG golden-hour home scene at top of Base Camp.
 * Height: 140px on mobile, 200px on desktop.
 * - Five hard sky bands
 * - Blocky sun & drifting clouds
 * - Layered hills
 * - Grass-block ground with dirt & stones
 * - Oak cabin with chimney smoke and window that glows brighter when daily goals are met
 * - Campfire wired to streak (unlit at 0, ember at 1-2, small fire at 3-6, full fire at 7+)
 * - Minecraft-style tree & fireflies
 * - Extension points: PetSlot anchor & empty weather overlay
 * Tokens only.
 */
export const PixelScene: React.FC<PixelSceneProps> = ({
  streak,
  dailyGoalsMet,
  className = '',
  onPetAnchorClick,
}) => {
  return (
    <div
      className={`
        relative w-full h-[140px] sm:h-[200px] overflow-hidden select-none
        border-b-4 border-oak-dark bg-cream shadow-[0_4px_0_var(--cocoa)]
        ${className}
      `}
      style={{ imageRendering: 'pixelated' }}
    >
      <svg
        viewBox="0 0 400 120"
        className="w-full h-full block"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="crispEdges"
      >
        {/* ================= 1. FIVE HARD SKY BANDS ================= */}
        <rect x="0" y="0" width="400" height="20" fill="var(--sky-1)" />
        <rect x="0" y="20" width="400" height="18" fill="var(--sky-2)" />
        <rect x="0" y="38" width="400" height="16" fill="var(--sky-3)" />
        <rect x="0" y="54" width="400" height="14" fill="var(--sky-4)" />
        <rect x="0" y="68" width="400" height="14" fill="var(--sky-5)" />

        {/* ================= 2. BLOCKY GOLDEN SUN ================= */}
        <g id="pixel-sun">
          <rect x="306" y="12" width="20" height="20" fill="var(--ember)" opacity="0.6" />
          <rect x="308" y="14" width="16" height="16" fill="var(--honey)" />
          <rect x="312" y="18" width="8" height="8" fill="var(--cream)" />
        </g>

        {/* ================= 3. DRIFTING PIXEL CLOUDS ================= */}
        {/* Cloud 1 */}
        <g className="animate-pixel-drift" style={{ animationDuration: '60s' }}>
          <g transform="translate(40, 14)">
            <rect x="0" y="4" width="36" height="10" fill="var(--cream)" opacity="0.85" />
            <rect x="8" y="0" width="20" height="6" fill="var(--cream)" opacity="0.9" />
            <rect x="4" y="12" width="28" height="4" fill="var(--cream-deep)" opacity="0.75" />
          </g>
        </g>

        {/* Cloud 2 */}
        <g className="animate-pixel-drift" style={{ animationDuration: '90s', animationDelay: '-30s' }}>
          <g transform="translate(180, 26)">
            <rect x="0" y="4" width="28" height="8" fill="var(--cream)" opacity="0.8" />
            <rect x="6" y="0" width="16" height="6" fill="var(--cream)" opacity="0.85" />
            <rect x="4" y="10" width="20" height="3" fill="var(--cream-deep)" opacity="0.7" />
          </g>
        </g>

        {/* ================= 4. LAYERED HILLS ================= */}
        {/* Back Hills (Dusk/Purple-Moss) */}
        <g id="back-hills">
          {/* Distant ridge left */}
          <rect x="0" y="64" width="45" height="18" fill="var(--dusk)" opacity="0.7" />
          <rect x="20" y="58" width="30" height="10" fill="var(--dusk)" opacity="0.7" />
          {/* Distant ridge center */}
          <rect x="150" y="62" width="70" height="20" fill="var(--dusk)" opacity="0.6" />
          <rect x="170" y="56" width="35" height="10" fill="var(--dusk)" opacity="0.6" />
          {/* Distant ridge right */}
          <rect x="270" y="60" width="90" height="22" fill="var(--dusk)" opacity="0.65" />
          <rect x="290" y="54" width="45" height="12" fill="var(--dusk)" opacity="0.65" />
        </g>

        {/* Front Hills (Moss Dark) */}
        <g id="front-hills">
          <rect x="0" y="72" width="80" height="10" fill="var(--moss-dark)" />
          <rect x="30" y="68" width="50" height="6" fill="var(--moss-dark)" />
          <rect x="120" y="70" width="90" height="12" fill="var(--moss-dark)" />
          <rect x="140" y="66" width="45" height="6" fill="var(--moss-dark)" />
          <rect x="250" y="71" width="150" height="11" fill="var(--moss-dark)" />
          <rect x="280" y="66" width="60" height="7" fill="var(--moss-dark)" />
        </g>

        {/* ================= 5. OAK CABIN & CHIMNEY ================= */}
        <g id="oak-cabin">
          {/* Chimney */}
          <rect x="76" y="32" width="8" height="18" fill="var(--cocoa)" />
          <rect x="75" y="30" width="10" height="3" fill="var(--oak-dark)" />

          {/* Stepped Chimney Smoke */}
          <g className="animate-pixel-smoke">
            <rect x="78" y="24" width="3" height="3" fill="var(--cream)" />
            <rect x="80" y="16" width="4" height="4" fill="var(--cream-deep)" />
            <rect x="83" y="8" width="5" height="5" fill="var(--cream)" opacity="0.6" />
          </g>

          {/* Stepped Roof (Gable style) */}
          <rect x="42" y="44" width="52" height="4" fill="var(--oak-dark)" />
          <rect x="46" y="40" width="44" height="4" fill="var(--oak-dark)" />
          <rect x="50" y="36" width="36" height="4" fill="var(--cocoa)" />
          <rect x="56" y="32" width="24" height="4" fill="var(--cocoa)" />
          <rect x="62" y="29" width="12" height="3" fill="var(--oak-dark)" />

          {/* Cabin Walls (Oak Planks) */}
          <rect x="44" y="48" width="48" height="32" fill="var(--oak)" />
          {/* Plank Horizontal Seam Lines */}
          <rect x="44" y="56" width="48" height="1" fill="var(--oak-dark)" />
          <rect x="44" y="64" width="48" height="1" fill="var(--oak-dark)" />
          <rect x="44" y="72" width="48" height="1" fill="var(--oak-dark)" />
          {/* Corner Framing Pillars */}
          <rect x="44" y="48" width="5" height="32" fill="var(--oak-dark)" />
          <rect x="87" y="48" width="5" height="32" fill="var(--oak-dark)" />

          {/* Cabin Door */}
          <rect x="52" y="58" width="12" height="22" fill="var(--oak-dark)" />
          <rect x="54" y="60" width="8" height="19" fill="var(--cocoa)" />
          <rect x="60" y="69" width="2" height="2" fill="var(--honey)" /> {/* Knob */}

          {/* Cabin Window (Glows brighter when dailyGoalsMet is true) */}
          <g id="cabin-window">
            <rect x="68" y="54" width="16" height="14" fill="var(--cocoa)" />
            {dailyGoalsMet ? (
              <>
                {/* Brilliant Golden Glow */}
                <rect x="70" y="56" width="12" height="10" fill="var(--cream)" />
                <rect x="72" y="58" width="8" height="6" fill="var(--honey)" />
                <rect x="75" y="56" width="2" height="10" fill="var(--cocoa)" />
                <rect x="70" y="60" width="12" height="2" fill="var(--cocoa)" />
                {/* Window Glow Rays */}
                <rect x="66" y="58" width="2" height="6" fill="var(--honey)" opacity="0.8" />
                <rect x="86" y="58" width="2" height="6" fill="var(--honey)" opacity="0.8" />
                <rect x="73" y="51" width="6" height="2" fill="var(--honey)" opacity="0.8" />
                <rect x="73" y="69" width="6" height="2" fill="var(--honey)" opacity="0.8" />
              </>
            ) : (
              <>
                {/* Warm Ambient Glow */}
                <rect x="70" y="56" width="12" height="10" fill="var(--honey)" />
                <rect x="75" y="56" width="2" height="10" fill="var(--cocoa)" />
                <rect x="70" y="60" width="12" height="2" fill="var(--cocoa)" />
              </>
            )}
          </g>
        </g>

        {/* ================= 6. MINECRAFT-STYLE TREE ================= */}
        <g id="minecraft-tree">
          {/* Wood Trunk */}
          <rect x="348" y="54" width="8" height="26" fill="var(--oak-dark)" />
          <rect x="350" y="56" width="4" height="24" fill="var(--oak)" />

          {/* Stepped Foliage Tiers */}
          {/* Tier 1 (Base canopy) */}
          <rect x="330" y="36" width="44" height="16" fill="var(--moss-dark)" />
          <rect x="334" y="38" width="36" height="12" fill="var(--moss)" />

          {/* Tier 2 (Middle canopy) */}
          <rect x="336" y="24" width="32" height="14" fill="var(--moss-dark)" />
          <rect x="338" y="26" width="28" height="10" fill="var(--moss)" />

          {/* Tier 3 (Top crown) */}
          <rect x="342" y="14" width="20" height="12" fill="var(--moss-dark)" />
          <rect x="344" y="16" width="16" height="8" fill="var(--moss)" />
        </g>

        {/* ================= 7. CAMPFIRE (WIRED TO STREAK) ================= */}
        <g id="campfire" transform="translate(136, 70)">
          {/* Stone Base & Crossed Logs */}
          <rect x="2" y="8" width="18" height="3" fill="var(--cocoa)" />
          <rect x="4" y="7" width="14" height="3" fill="var(--oak-dark)" />
          <rect x="3" y="6" width="4" height="2" fill="var(--oak)" />
          <rect x="15" y="6" width="4" height="2" fill="var(--oak)" />

          {/* Streak Fire Logic */}
          {streak === 0 ? (
            /* Unlit: Ash and charcoal */
            <g id="fire-unlit">
              <rect x="8" y="7" width="6" height="2" fill="var(--cocoa-soft)" />
            </g>
          ) : streak <= 2 ? (
            /* Ember (1-2 days) */
            <g id="fire-ember">
              <rect x="9" y="6" width="4" height="3" fill="var(--ember)" />
              <rect x="10" y="5" width="2" height="2" fill="var(--honey)" />
              <rect x="10" y="2" width="2" height="2" fill="var(--cream-deep)" opacity="0.6" className="animate-pixel-bob-2px" />
            </g>
          ) : streak <= 6 ? (
            /* Small Fire (3-6 days) */
            <g id="fire-small" className="animate-pixel-flicker">
              <rect x="7" y="3" width="8" height="6" fill="var(--ember)" />
              <rect x="8" y="1" width="6" height="6" fill="var(--honey)" />
              <rect x="10" y="3" width="2" height="4" fill="var(--cream)" />
              {/* Floating Spark */}
              <rect x="11" y="-3" width="2" height="2" fill="var(--honey)" />
            </g>
          ) : (
            /* Full Roaring Fire (7+ days) */
            <g id="fire-full" className="animate-pixel-flicker">
              <rect x="5" y="2" width="12" height="7" fill="var(--berry)" />
              <rect x="6" y="-1" width="10" height="9" fill="var(--ember)" />
              <rect x="7" y="-5" width="8" height="11" fill="var(--honey)" />
              <rect x="9" y="-3" width="4" height="8" fill="var(--cream)" />
              {/* Sparks rising */}
              <rect x="6" y="-8" width="2" height="2" fill="var(--honey)" />
              <rect x="14" y="-7" width="2" height="2" fill="var(--ember)" />
              <rect x="10" y="-11" width="2" height="2" fill="var(--cream)" />
            </g>
          )}
        </g>

        {/* ================= 8. FIREFLIES ================= */}
        <g id="fireflies">
          <rect x="115" y="74" width="2" height="2" fill="var(--honey)" className="animate-pixel-firefly" style={{ animationDelay: '0s' }} />
          <rect x="220" y="70" width="2" height="2" fill="var(--honey)" className="animate-pixel-firefly" style={{ animationDelay: '1.2s' }} />
          <rect x="260" y="65" width="2" height="2" fill="var(--honey)" className="animate-pixel-firefly" style={{ animationDelay: '0.6s' }} />
          <rect x="315" y="72" width="2" height="2" fill="var(--honey)" className="animate-pixel-firefly" style={{ animationDelay: '1.8s' }} />
        </g>

        {/* ================= 9. EXTENSION POINT: PET SLOT ANCHOR ================= */}
        <g
          id="pet-slot-anchor"
          transform="translate(185, 68)"
          onClick={onPetAnchorClick}
          className="cursor-pointer"
        >
          <title>Companion resting spot</title>
          {/* Subtle wooden marker slab on the grass */}
          <rect x="0" y="9" width="18" height="3" fill="var(--oak-dark)" />
          <rect x="2" y="8" width="14" height="2" fill="var(--cream-deep)" />
          {/* Small dormant sparkle indicator */}
          <rect x="8" y="4" width="2" height="2" fill="var(--honey)" opacity="0.6" className="animate-pixel-bob-2px" />
        </g>

        {/* ================= 10. GRASS-BLOCK GROUND (DIRT & STONES) ================= */}
        <g id="ground-layer">
          {/* Top Grass Blade Layer */}
          <rect x="0" y="80" width="400" height="6" fill="var(--moss)" />
          {/* Stepped hanging grass pixels */}
          {Array.from({ length: 40 }).map((_, i) => {
            const h = (i % 3 === 0 ? 4 : i % 2 === 0 ? 2 : 3);
            return (
              <rect
                key={i}
                x={i * 10}
                y={86}
                width={i % 2 === 0 ? 4 : 6}
                height={h}
                fill="var(--moss)"
              />
            );
          })}

          {/* Dirt Body */}
          <rect x="0" y="86" width="400" height="34" fill="var(--oak-dark)" />

          {/* Embedded Dirt & Pebble Highlights */}
          <g id="dirt-stones">
            <rect x="24" y="94" width="6" height="4" fill="var(--cocoa)" />
            <rect x="26" y="92" width="4" height="2" fill="var(--cocoa)" />
            <rect x="68" y="102" width="8" height="4" fill="var(--cocoa)" />
            <rect x="112" y="92" width="4" height="4" fill="var(--oak)" />
            <rect x="156" y="98" width="6" height="6" fill="var(--cocoa)" />
            <rect x="204" y="90" width="4" height="4" fill="var(--oak)" />
            <rect x="246" y="104" width="6" height="4" fill="var(--cocoa)" />
            <rect x="290" y="94" width="6" height="4" fill="var(--oak)" />
            <rect x="334" y="100" width="8" height="4" fill="var(--cocoa)" />
            <rect x="372" y="92" width="4" height="4" fill="var(--oak)" />
          </g>
        </g>

        {/* ================= 11. EXTENSION POINT: WEATHER OVERLAY LAYER ================= */}
        {/* Ready for rain, snow, or falling autumn leaves */}
        <g id="weather-overlay-layer" className="pixel-weather-layer pointer-events-none" />
      </svg>
    </div>
  );
};
