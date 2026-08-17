# ZEGABONK agent contract

Three.js browser MEGABONK-like survivor. Production code is the root `app.js` + `index.html` + `styles.css`. There is no `v2/` folder.

## Token rules (always)

1. Read `mem/INDEX.md` before opening `app.js`.
2. Never read all of `app.js` (~18k lines). Use Grep + the line ranges in `mem/HOTSPOTS.md`.
3. Do not paste GAME_BIBLE / lore docs into context unless the task is lore.
4. Prefer one surgical edit over a rewrite.
5. Binary assets (`*.glb`, `*.hdr`, `*.blend`) are not source of truth; `assets/ASSETS_README.md` is.

## Stack

- Runtime: vanilla Three.js 0.159 via importmap in `index.html`
- Serve: `npm run serve` -> http://localhost:5173
- Tests: Playwright `npm test`
- Models: GLB under `assets/`. Blender MCP on `localhost:9876`

## Skills to load on demand

- Gameplay/camera/combat: `three-webgl-game`
- HUD/menus: `game-ui-frontend` + `frontend-design`
- GLB export/optimize: `web-3d-asset-pipeline`
- Playtest/screenshots: `game-playtest`
- Blender: project MCP `blender` (port 9876)
