# Prompt 1 — install the engine + show date & time

I've added a folder `src/livingscene/` to this project. It is a finished, self-contained pixel-art animation engine (a cozy cabin scene with a traveller character, real sun and moon, seasons, weather and rewards). Do NOT rewrite, restyle or "improve" anything inside `src/livingscene`. Everything is imported from `src/livingscene/index.ts`: `LivingSceneView`, `SceneClock`, `ResourceIcon`, `useLiveEnvironment` and their types.

Do exactly this:
1. Replace the current scene at the top of Base Camp with `<LivingSceneView ref={sceneRef} progress={...} motion={settings.motion} season={settings.season} />`. Full width of the content column. Use `aspect="20 / 9"` on desktop and `aspect="16 / 9"` below 640px. Keep the PetSlot area below it.
2. Show the live date and time at the top of the app: put `<SceneClock compact />` on the right side of the top bar on every screen. (`LivingSceneView` already draws the full clock inside the scene.) Map the clock's CSS variables to our tokens: `--clock-bg` (dark cocoa, 85% opacity), `--clock-fg` (parchment), `--clock-border` (oak), `--font-heading` (the pixel heading font).
3. `progress` prop, derived from existing state only: `streak` = current streak, `level` = player level, `goalsMet` = every habit/goal due today is complete, `cabinLevel` = 1, +1 at level 5, +1 at level 10.
4. Settings: "Scene motion" (Full / Calm / Off) and "Season" (Auto / Spring / Summer / Autumn / Winter). Persist both with the rest of the settings.
5. Never touch engine internals; only use props and the ref handle (`sceneRef.current.grant / celebrate / play`).
6. If TypeScript reports errors inside `src/livingscene`, do not edit those files — tell me the error text instead.

When done, list the files you changed.
