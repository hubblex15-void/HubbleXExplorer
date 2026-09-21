# Prompt 2 — real time, real weather, real location (gradual changes)

The scene must follow the real world. Use the helpers that already exist in `src/livingscene` (do not reimplement them): `useLiveEnvironment`, `searchPlace`, `browserLocation`, `loadPlace`, `savePlace`, `guessPlace`.

1. Settings → Location card: (a) "Use my location" button → `browserLocation()`; (b) a city search box → `searchPlace(query)` showing up to 6 results to pick from; (c) show the chosen place name and a "Forget" button. Persist with `savePlace()`, load with `loadPlace()`. If geolocation is blocked (it can be inside the AI Studio preview frame) show only the city search and one line explaining why.
2. In Base Camp: keep the place in state (initial value `loadPlace()`); `const env = useLiveEnvironment(place, 20)`; pass `env` to `<LivingSceneView env={env} … />` and `<SceneClock weather={env.weather} />`. Pass the same weather to the top-bar clock.
3. A small status chip under the scene: "Live weather · updated 4 min ago", "Cached", or "Offline · showing clear skies" (from `env.source` and `env.updatedAt`), plus a ↻ button calling `env.refresh()`.
4. Do NOT add your own timers, polling or animation logic, and never remount the scene when the weather changes. The hook refreshes every 20 minutes and when the tab becomes visible; the engine eases clouds, rain, snow, fog, light and colours gradually, so nothing snaps.
5. Add Settings → Developer → "Scene debug" (off by default): a time-of-day slider (0–24h), weather buttons (clear, cloudy, rain, storm, snow, fog) and an activity dropdown. Use `LivingSceneView`'s `timeSource` prop for the time override and `sceneRef.current.engine().setWeather(...)` / `.play(id)` for the rest.
6. Finally tell me how to test dawn, dusk, rain and snow with that debug panel.
