# Prompt 3 — rewards become resources the traveller collects

Connect our reward system to the scene. Resource kinds (type `ResourceKind`): `wood`, `stone`, `berry`, `herb`, `mushroom`, `fish`, `gem`, `star`.

1. Store: `inventory: Record<ResourceKind, number>`, persisted.
2. Settings → Rewards: each category/folder chooses the resource it earns (defaults: cycle wood, stone, berry, herb, mushroom, fish, gem for the first seven categories; `star` is only for daily goals). Editable.
3. When a tracker entry or quest is completed: `amount = 1 + Math.floor(xp / 20)`, then `sceneRef.current.grant(kind, amount)`. The traveller then physically goes and collects it (chops, mines, picks, fishes, digs).
4. IMPORTANT: increment the inventory ONLY inside the `LivingSceneView` `onCollect` callback, so the number goes up when he actually collects it. Show a small toast such as "+2 wood" there.
5. Milestones: level-up → `celebrate('levelUp')`; streak reaches 7 / 30 / 100 → `celebrate('streak')`; all daily goals done → `celebrate('goal')` and `grant('star', 1)`; quest completed → `celebrate('quest')`.
6. New "Bag" screen (replace the locked Inventory slot): a grid of `<ResourceIcon kind={k} size={40} />` with counts and "from: chopping" etc. (use the `RESOURCES` list). Empty slots dimmed.
7. Do not add any animation code — the scene already draws all of it.
