# Tally Realm · Living Scene

A cozy pixel-art cabin scene that lives inside your app. It follows the **real time**, **real weather** and **real season** of your location, and a hand-drawn traveller lives there: he works outside by day, goes indoors, lights a fire at night, cooks, rests, sleeps, and physically **collects the rewards** your app gives out.

Everything is drawn in code (no images, no video, no dependencies except React for the optional wrapper). Sky, sun, moon phase, clouds, rain, snow, fog, lightning, seasons and lighting all change **gradually** — nothing snaps.

## What's in this zip
| Path | What |
|---|---|
| `src/livingscene/` | The engine + React wrapper. Copy this folder into your project as `src/livingscene/`. |
| `preview/preview.html` | Double-click to try everything: drag the time, change weather/season, play any activity, hand out rewards. Works offline. |
| `prompts/` | The 3 prompts to paste into Google AI Studio (install, live real-world data, rewards). |
| `docs/ANIMATION-CATALOG.md` | Every activity, when it happens, every motion. |

The GIF library (every time of day, weather, season, activity, reward, celebration) is in the separate **animation-previews** zip.

## Install (AI Studio, Build mode)
1. In the Build file panel create the folder `src/livingscene` and upload **all files from this zip's `src/livingscene/`**, keeping the `react/` sub-folder. (If folder upload is not offered, upload the files in batches with the same relative paths.)
2. Paste `prompts/1-install-in-ai-studio.md`, then `2-live-time-weather-location.md`, then `3-rewards-resources.md` — one at a time, checking the app after each.
3. Do not let the AI edit files inside `src/livingscene`. If it reports TypeScript errors there, send me the error text.

## Use it (React)
```tsx
import { useRef, useState } from 'react';
import { LivingSceneView, SceneClock, useLiveEnvironment, loadPlace, ResourceIcon, RESOURCES } from './livingscene';
import type { SceneHandle } from './livingscene';

export function BaseCamp() {
  const [place] = useState(loadPlace());              // null → approximate place from the device time zone
  const env = useLiveEnvironment(place, 20);          // live weather, refreshed every 20 min
  const scene = useRef<SceneHandle>(null);
  return (
    <LivingSceneView ref={scene} env={env}
      progress={{ streak: 5, level: 3, goalsMet: false, cabinLevel: 1 }}
      onCollect={e => addToBag(e.kind, e.amount)} />
  );
}
// when the user finishes something:
// scene.current?.grant('wood', 2);  scene.current?.celebrate('levelUp');
```

### Props of `<LivingSceneView>`
| Prop | Meaning |
|---|---|
| `env` | `{lat, lon, weather}` — pass the result of `useLiveEnvironment()` |
| `progress` | `{streak, level, goalsMet, cabinLevel}` — bigger fire + growing crops with streak, string lights from cabin level 2, lamp posts at level 3 |
| `season` | `'auto'` (default, from date + hemisphere) or force `'spring' \| 'summer' \| 'autumn' \| 'winter'` |
| `motion` | `'full'` (12 fps) · `'calm'` (8 fps) · `'off'` (one frame every 20 s). Respects `prefers-reduced-motion`. |
| `outfit` | `{cloak, scarf, hat}` hex colours — unlockable cosmetics |
| `onCollect` | `{kind, amount}` fires when the traveller actually picks a reward up — update your inventory here |
| `onActivity`, `onState` | what he is doing now / sun, phase, weather (once a second) |
| `showClock`, `use24h` | the date + time sign inside the scene |
| `aspect`, `className`, `style` | layout (canvas is `object-fit: cover`, ground stays visible) |
| `timeSource` | `() => epochMs` to override the clock (debug / time-lapse) |

Ref handle: `grant(kind, n)`, `celebrate('levelUp' | 'streak' | 'goal' | 'quest')`, `play(activityId)`, `engine()`.
Reward kinds: `wood stone berry herb mushroom fish gem star` (icons: `<ResourceIcon kind="wood" />`).

## How "real" it is
* **Sun and moon**: computed from latitude/longitude and the date (sunrise, sunset, golden hour, real moon phase). The clock shown is the device clock, so use your own location (or a place in your time zone) so sky and clock agree.
* **Weather**: Open-Meteo (free, no key). Codes are mapped to cloud / rain / snow / fog / thunder / wind and *eased* toward those targets. Snow accumulates and melts; wet ground darkens.
* **Season**: palettes and foliage drift continuously across the year (Southern Hemisphere handled). Force a season in settings if your climate has no real winter.
* **Bedtime** is 23:00 device time; he wakes at dawn.

## Performance
About 17 ms per frame on a laptop CPU (single core, no GPU). The wrapper pauses when the tab is hidden and lowers its frame rate by itself if a phone is slow.

## Privacy
Only latitude/longitude (rounded) are sent to Open-Meteo. Location and the last weather reading are kept in `localStorage` (`livingscene:*`). Nothing else leaves the device.

## Troubleshooting
* **Blank/black canvas** → check the console for an import error; `src/livingscene/index.ts` must exist.
* **Weather never changes** → the preview iframe may block network/geolocation; use the city search, or open the deployed app.
* **Time looks wrong** → your saved location is in another time zone than the device.
* **TS error about `ImageData`** → the code already casts it; make sure `lib` includes `dom`.
