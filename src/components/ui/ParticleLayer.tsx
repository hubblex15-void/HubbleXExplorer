import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface PixelParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  text?: string;
}

interface ParticleContextType {
  spawnXpOrbs: (originX?: number, originY?: number) => void;
  spawnLevelUpFireworks: () => void;
  spawnPlusOne: (x: number, y: number, text?: string) => void;
}

const ParticleContext = createContext<ParticleContextType | null>(null);

export const ParticleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [particles, setParticles] = useState<PixelParticle[]>([]);

  const addParticles = useCallback((newParticles: PixelParticle[]) => {
    setParticles(prev => {
      const combined = [...prev, ...newParticles];
      // Hard cap at 40 particles as requested
      return combined.slice(-40);
    });
  }, []);

  const spawnPlusOne = useCallback(
    (x: number, y: number, text: string = '+1') => {
      const id = 'p_' + Math.random().toString(36).substring(2, 9);
      const snappedX = Math.round(x / 4) * 4;
      const snappedY = Math.round(y / 4) * 4;

      addParticles([
        {
          id,
          x: snappedX,
          y: snappedY,
          vx: 0,
          vy: -4,
          size: 16,
          color: 'var(--honey)',
          life: 0,
          maxLife: 14,
          text,
        },
      ]);
    },
    [addParticles]
  );

  const spawnXpOrbs = useCallback(
    (originX?: number, originY?: number) => {
      const startX = originX ?? window.innerWidth / 2;
      const startY = originY ?? window.innerHeight / 2;
      const count = 2; // 1-2 small XP orbs as specified
      const colors = ['var(--moss)', 'var(--honey)', 'var(--moss-dark)'];

      const newOrbs: PixelParticle[] = [];
      for (let i = 0; i < count; i++) {
        const id = 'orb_' + Math.random().toString(36).substring(2, 9);
        newOrbs.push({
          id,
          x: Math.round((startX + (i - 0.5) * 16) / 4) * 4,
          y: Math.round(startY / 4) * 4,
          vx: (i === 0 ? -1 : 1) * 3,
          vy: -6,
          size: 6,
          color: colors[i % colors.length],
          life: 0,
          maxLife: 16,
        });
      }
      addParticles(newOrbs);
    },
    [addParticles]
  );

  const spawnLevelUpFireworks = useCallback(() => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight * 0.35;
    const colors = ['var(--honey)', 'var(--ember)', 'var(--moss)'];
    const newParticles: PixelParticle[] = [];

    // Up to 24 particles for level up firework (well within 40 cap)
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const speed = 3 + (i % 3) * 2;
      newParticles.push({
        id: 'fw_' + Math.random().toString(36).substring(2, 9),
        x: Math.round(centerX / 4) * 4,
        y: Math.round(centerY / 4) * 4,
        vx: Math.round((Math.cos(angle) * speed) / 2) * 2,
        vy: Math.round((Math.sin(angle) * speed) / 2) * 2,
        size: 6,
        color: colors[i % colors.length],
        life: 0,
        maxLife: 18,
      });
    }
    addParticles(newParticles);
  }, [addParticles]);

  // Stepped 12 fps particle update loop
  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles(prev => {
        return prev
          .map(p => ({
            ...p,
            x: Math.round((p.x + p.vx) / 4) * 4,
            y: Math.round((p.y + p.vy) / 4) * 4,
            vy: p.text ? p.vy : p.vy + 0.5, // Gravity for orbs/fireworks
            life: p.life + 1,
          }))
          .filter(p => p.life < p.maxLife);
      });
    }, 1000 / 12);

    return () => clearInterval(interval);
  }, [particles.length]);

  return (
    <ParticleContext.Provider value={{ spawnXpOrbs, spawnLevelUpFireworks, spawnPlusOne }}>
      {children}
      {/* Particle Overlay Layer */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-50 overflow-hidden select-none"
        style={{ imageRendering: 'pixelated' }}
      >
        {particles.map(p => {
          if (p.text) {
            return (
              <span
                key={p.id}
                className="absolute font-pixel-heading text-xs font-bold pointer-events-none"
                style={{
                  left: p.x,
                  top: p.y,
                  color: p.color,
                  textShadow: '2px 2px 0px var(--cocoa)',
                  opacity: 1 - p.life / p.maxLife,
                }}
              >
                {p.text}
              </span>
            );
          }

          return (
            <div
              key={p.id}
              className="absolute pointer-events-none"
              style={{
                left: p.x,
                top: p.y,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                boxShadow: '1px 1px 0px var(--cocoa)',
                opacity: 1 - p.life / p.maxLife,
              }}
            />
          );
        })}
      </div>
    </ParticleContext.Provider>
  );
};

export function useParticleSpawner(): ParticleContextType {
  const ctx = useContext(ParticleContext);
  if (!ctx) {
    return {
      spawnXpOrbs: () => {},
      spawnLevelUpFireworks: () => {},
      spawnPlusOne: () => {},
    };
  }
  return ctx;
}
