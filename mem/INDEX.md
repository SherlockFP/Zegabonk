# ZEGABONK memory index

Refresh: `python mem/rebuild-index.py`

## What this game is

Third-person 3D auto-battler survivor (MEGABONK-like). WASD + mouse look. Auto weapons. Level-up 3 cards. Campaign: 3 biomes then Ender, then Mythic+.

## Files that matter

| File | Role | Size |
| --- | --- | --- |
| `app.js` | All gameplay. Do not read whole file. | ~19k lines |
| `index.html` | DOM HUD/menus. Keep element IDs. | ~500 lines |
| `styles.css` | UI theme | often dirty |
| `maps/classic.js` | Classic map extras | small |
| `tests/*.spec.js` | Playwright. `loop.spec.js` needs Warden + endlessMode | small |
| `mem/GAUNTLET.md` | Iteration plan | small |

## Product targets

- MEGABONK feel: dense map, find the portal, stand in it -> Warden
- Characters use per-class GLB under `assets/models/production/`
- Creature GLB + aliases (goblin/rattlecap, bat=crow, etc)
- Honest score ~6.7/10 after creature box-kit (loop 7.0, HUD/menu 8.1, juice 6.5, map 6.1, creatures 6.4). See `mem/GAUNTLET.md`.
- Hunt chain: explore chests/POIs -> level -> elites -> portal GPS
- Classic gate: stand 3s -> Kirik-Tac Muhafizi approaches -> kill opens portal now -> Bolum 2. No 10:00 wait. Hardcore/random teleports off until story/endless.
- Play opens Tac Koyu (3D hub). Portal -> lobby overlay -> run. Yol Tasi +2.. after Ender. Gear + durability/repair in `hub.js`.
- Horde spawns 32-44m ahead of camera, despawn 78m
- Chapter 1 favors goblin/wolf GLBs

## Known P0

- Pause resume is `#pauseResumeBtn` (start continue is `#resumeBtn`)
- `updateCamera` ~17169 chase cam. Do not reload old localStorage camera (`settingsVersion`)
- GLB facing: some clones need `rotation.y = Math.PI`
- `loop.spec.js` asserts Muhafiz then chapter 2 (not 10:00 endless)

## Do not

- Rebuild a `v2/` tree (HANDOFF.md is stale)
- Reproduce MEGABONK names/art; clone the loop/feel
- Commit or push unless asked
