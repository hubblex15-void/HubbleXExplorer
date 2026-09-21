import React, { useEffect, useRef } from 'react';
import { ICON } from '../fx';
import type { ResourceKind } from '../types';

export const RESOURCES: { kind: ResourceKind; label: string; from: string }[] = [
  { kind: 'wood', label: 'Wood', from: 'chopping' }, { kind: 'stone', label: 'Stone', from: 'mining' }, { kind: 'berry', label: 'Berries', from: 'picking' }, { kind: 'herb', label: 'Herbs', from: 'foraging' },
  { kind: 'mushroom', label: 'Mushrooms', from: 'foraging' }, { kind: 'fish', label: 'Fish', from: 'fishing' }, { kind: 'gem', label: 'Gems', from: 'digging' }, { kind: 'star', label: 'Star dust', from: 'night wishes' },
];
/** the same pixel icons the traveller carries, for your Bag / HUD */
export function ResourceIcon({ kind, size = 28, title }: { kind: ResourceKind; size?: number; title?: string }) {
  const ref = useRef<HTMLCanvasElement>(null), sp = ICON[kind], sc = Math.max(1, Math.floor(size / 8));
  useEffect(() => {
    const c = ref.current; if (!c || !sp) return; const g = c.getContext('2d'); if (!g) return; g.clearRect(0, 0, c.width, c.height);
    for (let y = 0; y < sp.h; y++) for (let x = 0; x < sp.w; x++) { const v = sp.px[y * sp.w + x]; if (v) { const p = sp.pal[v]; g.fillStyle = `rgb(${p[0]},${p[1]},${p[2]})`; g.fillRect(x * sc, y * sc, sc, sc); } }
  }, [kind, sc, sp]);
  return <canvas ref={ref} width={(sp ? sp.w : 7) * sc} height={(sp ? sp.h : 7) * sc} title={title} role="img" aria-label={title || kind} style={{ imageRendering: 'pixelated', width: (sp ? sp.w : 7) * sc, height: (sp ? sp.h : 7) * sc }} />;
}
