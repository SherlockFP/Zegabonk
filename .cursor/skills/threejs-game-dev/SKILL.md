---
name: threejs-game-dev
description: Umbrella for Three.js browser-game development. Use when building or polishing a vanilla Three.js game (scene, camera, lights, GLB, HUD, perf, playtest), including ZEGABONK town hub, combat, inventory overlays, and WebGL quality work.
---

# Three.js game development

This repo already has the pack. Do not invent a second engine.

## Load order

1. `zegabonk-memory` if this is ZEGABONK (`mem/INDEX.md`).
2. `threejs-game-director` (stack lock + which specialist).
3. **One** specialist, then stop:

| Task | Skill |
|------|--------|
| Scene, camera, loop, lights, input, dispose | `threejs-runtime` |
| FPS, draw calls, shadows, bloom cost | `threejs-perf` |
| GLB, Blender export, texture budgets | `threejs-assets` |
| Boot, screenshots, HUD overlap | `threejs-playtest` |
| DOM HUD / menus over the playfield | `game-ui-frontend` |

## This repo

- Runtime: Three.js 0.159, `app.js` + `index.html` + `styles.css`
- HUD/menus: DOM. Town hub: Three.js scene in `hub.js`
- Serve: `npm run serve` -> http://localhost:5173
- Playtest: Playwright `npm test`
- Blender MCP: `localhost:9876`

## Do not

- Load Codex `three-webgl-game` / `game-studio` reference folders
- Read `.glb` / `.blend` / `.hdr` as text
- Rewrite `CLASSIC_GEO` or fill the kite bowl to "fix" the chase cam
