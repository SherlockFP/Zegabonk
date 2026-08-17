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
- Current score: ~8.1/10 (loop 8, opening 8.2, juice 7.6, HUD/menu 8.3, map 8.0, town hub 7.6, audio 5.6). AA 9 still wants recorded SFX.
- Hunt chain: explore chests/POIs -> level -> elites -> portal GPS
- Play opens Tac Koyu (3D hub). Portal -> lobby overlay -> run. Yol Tasi +2.. after Ender. Gear + durability/repair in `hub.js`.
- Horde spawns 32-44m ahead of camera, despawn 78m
- Chapter 1 favors goblin/wolf GLBs

## Known P0

- Pause resume is `#pauseResumeBtn` (start continue is `#resumeBtn`)
- `updateCamera` ~17169 chase cam. Do not reload old localStorage camera (`settingsVersion`)
- GLB facing: some clones need `rotation.y = Math.PI`
- `loop.spec.js` still asserts Warden then `endlessMode` (Ender arena also starts there)

## Do not

- Rebuild a `v2/` tree (HANDOFF.md is stale)
- Reproduce MEGABONK names/art; clone the loop/feel
- Commit or push unless asked
