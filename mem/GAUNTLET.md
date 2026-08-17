# Gauntlet loop

Goal: MEGABONK feel + 3-map campaign + Ender + Mythic+. Re-score after each pass.

## Why a run sticks

Games that last do five things every session:

1. **Next action is obvious** - HUD objective + countdown to the next biome/Ender
2. **Power every 20-40s** - XP, cards, chests, combo banners
3. **The map is not empty** - chest + NPC in the first seconds, world event ~22s
4. **A climax with a rule** - Ender shield crystals, then the boss
5. **A reason to queue again** - death screen names the next unlock / PB / mechanic you failed

If those five are missing, the loop is a horde screensaver.

## Loop

1. Boot menu -> lobby -> 30s combat screenshot
2. Fix the worst P0 (feel, then campaign, then juice)
3. Playwright `tests/*.spec.js` (loop.spec.js still needs Warden + endlessMode)
4. Honest score. Last claimed ~5/10; this pass targets ~6 if opening + death hook land

## Story beat (classic map, biomes shift)

- 0:00 Yesil Yokuslar (orman) + 2 sandik + tuccar
- 3:30 Gunes Kirigi (col)
- 7:00 Kizil Yarik + Warden portal
- 10:00 portal -> Ender arena (crystals then boss) + endless flag (test)
- Ender dead -> storyCompleted, Mythic+ 2..10, cosmetics not raw power

## This pass

- Score target: every low pillar to 8
- Audio: kill thump + hit kick, louder music/level/pickup
- Silhouette: BEAST_LOOK tint/scale/ears/tusks/wings
- Hit: default knockback, screen flash, bigger proj, combo chip
- World: denser fog + 620 trees, punchier biome light
- HUD/menu: fat cards, XP glow, clock, combo

## Other-agent scores (17 Aug)

Map geo:
- GOOD: player readable, kite space, fake portal gone, spawn-in-geometry, meteor landmark
- NEEDS FIX: empty-looking spawn ground, horizon washed in combat fog, lighting a bit flat, meteor too grey, achievement toast covering playfield

HUD:
- GOOD: edge vitals / minimap / thin XP, center playfield clear of chrome
- NEEDS FIX: achievement toast + fat level-up board on playfield

Gameplay leftovers landed: opening 1-2 spawn, MAX_TOMES 4, named tomes, meteor rare, early chase 0.65x

Follow-up this turn: dirt/grass punch, closer ridge silhouettes, teal meteor, edge toasts, scout-only lobby + 3 original chars wired.

## Needs-fix pass (17 Aug later)

- Spawn pad flat radius 16m -> 7m, closer rolls/ridges in chase cam
- Horizon cones: MeshBasic grey rock at 78m / 268m (no green hemi spikes)
- Grass canvas: fine blades, no giant tiled ellipses; spawn dirt discs thinned
- Ch1 fog 0.0028, cooler hemi, stronger sun, meteor point light
- Radar range 64 + POI/chest/meteor dots on green fill
- Level-up overlay: transparent playfield, pointer-events only on cards

## Pass 17 Aug later (levelup + hills)

P0 landed:
- `#levelup` is a bottom 3-card strip (no full-screen blur/board). Side skill/stat columns stay in DOM, hidden. `#pauseResumeBtn` untouched.
- Classic ground 128-seg. `sampleClassicHeight`: spawn ring (0,-12) r=16 stays 0. West/east/north ridges ~14-20m, grove/ruins belts, bowl rim ~14m at the far tree line. Raking sun. Default `camPitch` -0.58.

Screens: `tests/artifacts/geo-menu.png`, `geo-lobby.png`, `geo-gameplay.png`, `geo-overview.png`, `geo-levelup.png`, `menu-live.png`, `lobby-live.png`, `run-live.png`.

| Pillar | Score |
| --- | --- |
| Center playfield readable | GOOD |
| Level-up does not bury world | GOOD |
| Terrain readable from chase cam | NEEDS FIX |
| Opening 5-10 enemies, not a swarm | GOOD (cap 8 at L1, ~5-8 on screen) |
| HUD on edges | GOOD (achievement toast still mid-left) |
| Original names/art | GOOD (Darbe Yarigi, BONK, Kabukcu/Yaprakci/Kaykayci, Ruzgar Tomari) |

Terrain: heights are real (spawn 0, rim ~14m, ridges ~15-20m) but the chase cam looks into the kite bowl, so the disc read remains. Do not flatten the bowl to "fix" it.

Lobby: 12 chars, scout unlocked, Kabukcu/Yaprakci/Kaykayci locked as designed. `node --check app.js` clean. No commit.

## Fun beat pass (17 Aug)

Genre keys (original names): power every ~22s, level-up magnet, smash crates, chest light pillar, paid world chests that scale, combo chest at x15.

- `updateRunWorldEvents` was never called; now in animate. First event 18s, then 18-26s (28-38s after 3 min).
- New events: CEKIM DALGASI, KIRIK KUTULAR, SANS SANDIKLARI, RISK PAKTI. First 45s stays juicy, not blood moon.
- Level-up sucks XP/coins 2.4s. Combo 8 magnet, combo 15 chest.
- Smash crates on meteor path. World chests: first free, then +8c each.
- Chest beam ~9m so chase cam can see loot.

| Pillar | Was | Now |
| --- | --- | --- |
| Loop / 20-40s power | 7.5 | 8.0 |
| Map not empty | 6.0 | 7.0 |
| Hit / juice | 7.0 | 7.5 |
| Opening | 7.5 | 8.0 |
| Overall | 6.8 | 7.3 |

Still open: chase-cam disc, ch2/3 authored geo, recorded SFX, unique beast GLB.

## Later

- Unique GLB per beast + recorded SFX for 9
