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

## Still next (not this commit)

- Dress CLASSIC_GEO grove/ruins with voxel props
- Box-kit remaining SphereGeometry mobs
- Recorded SFX
- FPS overlay actually ticking in stills
