# Gauntlet loop

Honest scores vs inflated 8.1. User taste was ~3/10 before town/art. Re-score after each pass.
Loop goal: hunt -> 7:00 gate -> Kirik-Tac Muhafizi -> kill opens portal now -> next biome -> Bolum 3 -> Ender.

## Pass 2026-08-17 (portal / voxel)

1. Stand in chapter gate 3s -> Kirik-Tac Muhafizi approaches from 18m.
2. Kill -> portal opens now (no 10:00 wait).
3. Enter -> Bolum 2 biome. Bolum 3 kill -> Ender.
4. Classic campaign: no random cyan teleports, no instant hardcore.
5. Cheap voxel edges. Smash crates denser. Linear tone map.

Scores then: overall **5.6/10**. Loop 7.0 was the win. Map 4.2 still the gap.

## This pass (juice + menu chars) 2026-08-17 night

Tie leftover UI/feel to the same loop. Not a new product.

1. Restore pre-OG character select language: big portrait tiles on the start menu AND lobby (use existing `assets/ui/char-*.png`). Pick fighter before Play. Keep `#playBtn` -> town hub.
2. Hit feel (survivor AA): squash on hit, heavier knock, longer freeze on chunky hits, bigger damage pop, kill punch. No extra bloom/OutlinePass.
3. Keep hunt/portal/Muhafiz as the north star. Do not fill the kite bowl or rewrite CLASSIC_GEO this slice.
4. Screenshot menu (char dock), lobby grid, 8s combat. Re-score honestly.
5. Playwright: menu dock exists; loop.spec still Muhafiz -> chapter 2.

## Honest scores (after juice + char select shots)

Shots: `tests/artifacts/menu-after.png`, `lobby.png`, `gameplay.png`. Loop test green.

| Slice | Prev | Now | Why |
| --- | --- | --- | --- |
| Loop | 7.0 | 7.0 | Unchanged, still the north star |
| Opening | 5.5 | 6.3 | Menu fighter strip then town; portraits read |
| Juice | 5.8 | 6.4 | Squash/knock/freeze/pop in code; stills at 1s don't prove it |
| HUD/menu | 7.0 | 7.7 | Bottom SAVASCI dock + lobby 4-col portrait grid |
| Map / art | 4.2 | 4.2 | Deferred |
| Creatures | 5.0 | 5.0 | Deferred |
| Boss | 6.2 | 6.2 | Unchanged |
| Perf | 6.0 | 6.0 | Caps kept |
| Audio | 4.0 | 4.2 | Hit crunch a bit louder, still synth |

Overall **6.0/10**. Menu/char select is the visible win. Map dressing remains the AA gap.

## This pass (voxel reskin) 2026-08-18

Map/art was the AA gap. Same loop goal. Dress CLASSIC_GEO with custom voxel props and pixel textures.

1. Image-gen tileable 64px albedos in `assets/textures/` (grass, dirt, stone, bark, leaves, brick, crate, moss, water, sand, scorch). NearestFilter, no mips.
2. Blender voxel kit: `assets/models/props/voxel_{tree,rock,ruin,shrine,crate}.glb`.
3. Classic trees are boxes + bark/leaf maps. Rocks/bushes/crates/water/ruins use the same atlas.
4. `dressClassicGeoKits()` rings grove/ruins/shrine/danger/passes. Chapter 2 sand / 3 scorch on ground.
5. Concepts in `assets/concepts/biome/` for art direction, not runtime.

## Honest scores (after juice + this reskin)

Shots: `tests/artifacts/gameplay.png`, `geo-grove.png`, `geo-ruins.png`.

| Slice | Prev | Now | Why |
| --- | --- | --- | --- |
| Loop | 7.0 | 7.0 | Unchanged north star |
| Opening | 6.3 | 6.3 | Menu unchanged this slice |
| Juice | 6.4 | 6.5 | Pixel ground reads punchier with the same hit code |
| HUD/menu | 7.7 | 7.7 | Unchanged |
| Map / art | 4.2 | 6.1 | Voxel trees + zone kits + 64px tiles. Still not MEGABONK density. |
| Creatures | 5.0 | 5.2 | Box rocks/bushes only; mobs still mixed |
| Boss | 6.2 | 6.2 | Unchanged |
| Perf | 6.0 | 5.8 | Extra grove/ruin clones. Caps kept. |
| Audio | 4.2 | 4.2 | Unchanged |

Overall **6.4/10**. Map is the visible win. Still next: box-kit remaining SphereGeometry mobs, recorded SFX, denser POI clutter.

## This pass (HUD / menus / box mobs) 2026-08-18

Same loop. Raise the remaining UI and creature silhouettes.

1. Pixel HUD icons (hp/coin/kill). Timer top-center. Hide leftover mana bar.
2. Pause/levelup/lobby frames thicker gold pixel. Skill slots use existing skill icons.
3. Default goblin blob + flame/shadow/magic/rare/unique fallbacks are boxes, not spheres.

## Honest scores (after HUD + box-mob shots)

Shots: `gameplay.png`, `hud-pause.png`, `gameplay-levelup.png`, `lobby.png`.

| Slice | Prev | Now | Why |
| --- | --- | --- | --- |
| Loop | 7.0 | 7.0 | Unchanged |
| Opening | 6.3 | 6.6 | Bigger lobby portraits + dock still there |
| Juice | 6.5 | 6.5 | Unchanged |
| HUD/menu | 7.7 | 8.1 | Center clock, pixel icons, pause/levelup frames |
| Map / art | 6.1 | 6.1 | Unchanged |
| Creatures | 5.2 | 5.8 | Default blob is boxy; named wolves still mixed |
| Boss | 6.2 | 6.2 | Unchanged |
| Perf | 5.8 | 5.8 | Unchanged |
| Audio | 4.2 | 4.2 | Unchanged |

Overall **6.6/10**. HUD is the visible win. Audio still the floor.

## This pass (creature box-kit) 2026-08-18

Named ch1 beasts were still SphereGeometry. Same loop. Raise creature silhouettes.

1. Procedural box-kit for wolf/bear/boar/fox/ghost/spider/beetle/crow/bat/slime/skeleton and the rest of the named roster. Flat `voxelStd` materials.
2. Blender voxel GLBs: `assets/models/creatures/voxel_{wolf,boar,spider,goblin,slime}.glb`. Wired wolf/boar/spider. Goblin stays rattlecap. Missing GLB no longer falls back to goblin (so fox/bear actually use their kits).
3. Playtest: `tests/artifacts/creatures-lineup.png` + `gameplay.png`. `megabonk-pass.spec.js` green.

## Honest scores (after creature box-kit)

Shots: `creatures-lineup.png`, `gameplay.png`.

| Slice | Prev | Now | Why |
| --- | --- | --- | --- |
| Loop | 7.0 | 7.0 | Unchanged |
| Opening | 6.6 | 6.6 | Unchanged |
| Juice | 6.5 | 6.5 | Unchanged |
| HUD/menu | 8.1 | 8.1 | Unchanged |
| Map / art | 6.1 | 6.1 | Unchanged |
| Creatures | 5.8 | 6.4 | Wolves/boars/spiders read as stacked boxes. Still not MEGABONK unique sculpts. |
| Boss | 6.2 | 6.2 | Procedural boss spider still spheres |
| Perf | 5.8 | 5.8 | Unchanged |
| Audio | 4.2 | 4.2 | Unchanged |

Overall **6.7/10**. Creatures are the visible win. Audio still the floor.

## This pass (POI density + hit crunch) 2026-08-18

AA gap was empty hunt trails and synth ticks. Same loop. Do not fill the kite bowl.

1. Smash crates along hunt POIs + Yuk Tasi rings. Cap 96. Extra world chests at Kor Cukur and Uzak Kule.
2. Thicker grove/ruins/shrine/pass dress + crate props. Central rim only, spawn bowl still clear.
3. Hit/crate crunch uses a noise buffer + thicker kick. Still synth, not recorded.
4. F3 profiler no longer wipes samples on hitch, so FPS actually ticks.

## Honest scores (after POI density)

Shots: `gameplay.png`, `geo-grove.png`, `geo-ruins.png`.

| Slice | Prev | Now | Why |
| --- | --- | --- | --- |
| Loop | 7.0 | 7.0 | Unchanged north star |
| Opening | 6.6 | 6.6 | Unchanged |
| Juice | 6.5 | 6.6 | Crate/hit crunch is fatter in code |
| HUD/menu | 8.1 | 8.1 | Unchanged |
| Map / art | 6.1 | 6.5 | POI camps + denser grove/ruins. Still not MEGABONK clutter. |
| Creatures | 6.4 | 6.4 | Unchanged |
| Boss | 6.2 | 6.2 | Unchanged |
| Perf | 5.8 | 5.5 | More prop draw calls. Overlay ticks. CI stills are not a GPU. |
| Audio | 4.2 | 4.8 | Noise crunch on hit/crates. Still no recorded SFX. |

Overall **6.8/10**. Map density is the visible win. Audio still the floor.

## This pass (instance trees + boss kit + corridors) 2026-08-18

SFX skipped on purpose. Cut draw calls, box the procedural bosses, dress hunt corridors.

1. Classic trees are 4 InstancedMeshes (720 count) instead of ~560 x 4 meshes. 12 hero GLB trees near spawn. Shared smash-crate geo/mat, no edge overlay.
2. Procedural boss variants (spider / tentacle / slime / default) are box-kit. Kirik-Tac Muhafizi already was.
3. Extra rock/bush rings on hunt corridors. Spawn bowl still clear.

## Honest scores (after instance + boss kit)

Shots: `gameplay.png`, `geo-grove.png`. Loop test: Muhafiz -> chapter 2.

| Slice | Prev | Now | Why |
| --- | --- | --- | --- |
| Loop | 7.0 | 7.0 | Unchanged |
| Opening | 6.6 | 6.6 | Unchanged |
| Juice | 6.6 | 6.6 | Unchanged |
| HUD/menu | 8.1 | 8.1 | Unchanged |
| Map / art | 6.5 | 6.7 | Corridor clutter. Still not MEGABONK density. |
| Creatures | 6.4 | 6.4 | Unchanged |
| Boss | 6.2 | 6.6 | Fallback spider/tentacle/slime are boxes. King Grom GLB still used when loaded. |
| Perf | 5.5 | 6.0 | Trees instanced. CI stills still ~15 fps (software). |
| Audio | 4.8 | 4.8 | Skipped this pass |

Overall **6.9/10**. Perf structure is the win. Recorded SFX still deferred.

## Still next

- Recorded SFX (deferred)
- Instance dressClassicGeoKits GLB clones if draw calls stay high
- King Grom / unique boss sculpts
