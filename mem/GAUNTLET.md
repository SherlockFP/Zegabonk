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

## Needs-to-change closeout (17 Aug)

Landed:
- Player rim light on imported + procedural hero (was lost in env)
- Regional combat: narrow pass slower, crater tankier (after damage init, no TDZ)
- Crowd HP/name/cast hide at loop start so dist>72 continue cannot leak bars
- Phase fog 0.0075-0.009 -> 0.0016-0.0025 (POIs stay visible)
- Kirik Goktasi teal core + brighter beam/light
- Ch2/3 biome dress extra spots (still skip kite bowl)
- Hit/kill oscillator punch; no wav/mp3 in repo
- Ruin corner colliders 2.0, toast bottom-left, bowl rim rocks (prior)

Won't do: fill kite bowl with trees (chase cam photographs the disc on purpose).

| Pillar | Now |
| --- | --- |
| Loop / 20-40s power | 8.0 |
| Opening | 8.0 |
| Hit / juice | 7.6 |
| HUD / menu | 8.2 |
| Map | 7.6 |
| Audio | 5.6 |
| Overall | 7.7 |

`node --check app.js` clean. No commit.

## Final eval playtest (17 Aug)

Shots: `tests/artifacts/final-menu.png` ... `final-gameover.png`. No page errors.

Playtest fixes:
- Camera dropdown no longer says Megabonk
- Dirt trail less muddy
- Pause overlay lets the world show
- Lobby extras show + / -
- Epilepsy banner fades at 2.8s, lower z
- Death quotes Turkish
- Level-up title hidden so the 3-card strip stays a bottom board
- Game over z-index with other overlays

| Pillar | Score |
| --- | --- |
| Loop / 20-40s | 8.0 |
| Opening | 8.0 |
| Hit / juice | 7.6 |
| HUD / menus | 8.3 |
| Map | 7.6 |
| Audio | 5.6 |
| Gauntlet 5 | next 8, power 8, map 7, climax 7, queue 8 |
| Overall | 7.8 |

## Yuk Tasi map pass (17 Aug)

YouTube watch skill landed (`youtube-watch`). Classic map now routes like a charge-stone map: 7 trail **Yuk Tasi** plus Yemin, smash crates on dirt paths, green diamond radar, explore credit on fill. Do not copy 15 shrines or MEGABONK names.

| Pillar | Score |
| --- | --- |
| Map | 8.0 |
| Opening | 8.0 |
| Overall | 8.0 |

## Town hub + gear (17 Aug)

Play -> 3D Tac Koyu. Portal opens existing lobby overlay. Demirci craft, Sandikci inventory, Yol Tasi +N after Ender. Gear in hub.js. Mythic key still dresses classic (no CLASSIC_GEO rewrite).

## Town next-stage pass (17 Aug later)

Landed: paper-doll inventory, durability + Demirci TAMIR, NPC labels, plaza lanterns + portal path, mythic spikes/fog/crates on ch1 Yol Tasi, `#bossBarWrap` restored. `startRun` no longer simulates town during world rebuild; opening seed runs after `clearEntities`.

Playtest 1 (before fixes): T-pose in town, portal read as Yol Tasi, lanterns looked like sticks, Playwright still expected Play -> lobby. Hub ~7.2.

Playtest 2 (`npx playwright test`, 6/6): idle pose, path to Buyuk Gecit, inventory 6 slots + 100/100, TAMIR visible, Warden loop green, 4-5 opening enemies.

| Pillar | Score |
| --- | --- |
| Loop / 20-40s | 8.0 |
| Opening | 8.2 |
| Hit / juice | 7.6 |
| HUD / menus | 8.3 |
| Map | 8.0 |
| Town hub | 7.6 |
| Audio | 5.6 |
| Overall | 8.1 |

Shots: `tests/artifacts/town-plaza.png`, `town-inventory.png`, `town-craft.png`, `town-run.png`.

## Later

- Recorded SFX for 9. Unique GLBs already loaded via CREATURE_GLB_PATHS.
