---
name: threejs-game-director
description: Routes Three.js and browser 3D game work to one specialist skill, locks the 2026 stack, and keeps context lean. Use when the user mentions Three.js, threejs, WebGL, WebGPU, GLB, glTF, Vite 3D, Rapier, browser game, 3D game, HUD, shaders, or starting a 3D prototype.
---

# Three.js Game Director

Read this file only. Do not open Codex `game-studio`, `three-webgl-game`, or their `../../references/` paths — those references are missing and waste tokens.

Load **one** specialist next, then stop:

| Task | Skill |
|------|--------|
| Scene, loop, camera, loaders, physics bridge | `threejs-runtime` |
| FPS, draw calls, memory, LOD, post, GPU cost | `threejs-perf` |
| GLB/glTF, Draco, Meshopt, KTX2, Blender export | `threejs-assets` |
| HUD/menus that must not cover the playfield | `threejs-runtime` + `game-ui-frontend` only if HUD is the task |
| Boot/input/screenshot QA | `threejs-playtest` |
| New repo / scaffold | copy `C:/Users/Sher/Projects/threejs-game-kit` |

Do not load `ui-ux-pro-max`, `last30days`, or fable-mode unless the user asked.

## Stack lock (Aug 2026)

- Vanilla Three.js + Vite + TypeScript. Not React / R3F unless the repo already is React.
- `WebGLRenderer` default. `WebGPURenderer` only if the user needs compute/TSL/meshlets.
- Latest `three` (`r183+`). Addons via `three/addons/...`.
- Ship GLB / glTF 2.0. Physics: `@dimforge/rapier3d-compat`.
- HUD/menus in DOM. Simulation state outside Three objects.

Full lock: [references/stack.md](references/stack.md)

## Token rules (quality stays)

1. One feature per chat. New chat after a vertical slice ships.
2. Read 1–3 source files, then edit. No repo dumps. Explore subagent for "where is X".
3. Never attach or read `.glb`, `.blend`, `.hdr`, `.ktx2`, `dist/`, `node_modules/`.
4. Do not paste Three.js docs or generate a second engine. Smallest change that plays.
5. Scripts over generated one-off tooling. Verify with `npm run dev` / a playtest, not essays.

Details: [references/token-budget.md](references/token-budget.md)

## First playable default

Sparse shell: one objective chip, one transient hint, clear playfield. Ground + player proxy + camera + WASD is enough to prove the loop. Do not invent combat/inventory/quest systems unless asked.
