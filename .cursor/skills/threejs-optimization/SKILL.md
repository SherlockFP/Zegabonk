---
name: threejs-optimization
description: ZONK/Killgram Three.js perf budgets and the attack order for FPS, draw calls, LOD, lights, and the perf-probe benchmark. Use when the user mentions FPS, stutter, draw calls, GPU, LOD, instancing, 60 fps, 700 draws, threejs-perf, or optimization.
---

# ZONK Three.js optimization

Personal `threejs-perf` is the generic order of attack. This skill is the **repo contract**. Do not add post/bloom, a second engine, or `BufferGeometryUtils` imports that fight `vendor/three.min.js`.

## Measure first

```
npm run dev
node tools/qa/perf-probe.mjs --fast
```

Full run: `npm run perf`. Gates live in `docs/plan/BENCHMARK.md`. Train the game until the probe prints PASS.

## Budgets (play view, 1280x720)

| Scene | Draw calls | FPS |
|---|---|---|
| Empty classic | <= 320 | >= 55 (target 60) |
| 50 enemies | <= 520 | >= 55 |
| 150 enemies + skills | **<= 700** | **>= 55 (target 60)** |

Pixel ratio stays `min(dpr, 1.25)`. One directional shadow, map 1024. No extra PointLights on lamps/villages/grass.

## Order of attack (this repo)

1. Measure `renderer.info.render.calls` via perf-probe. Do not guess.
2. Cut **enemy** draws: at most 16 full voxel enemies (`ENEMY_LOD_NEAR_MAX`); the rest use one `__lod` mesh. Normal tier: no outline, no name sprite, no blob. HP bars only when damaged.
3. Cut lights before shaders: MeshBasic bulbs, not `PointLight` forests.
4. Keep world instanced. Do not set `InstancedMesh.frustumCulled = true` unless instance bounding spheres are rebuilt (culling bugs).
5. Landmarks are few instanced voxel props (`landmark_mill`, `landmark_tower`), not unique mesh piles.
6. Boss windup must flash the **model** (`pulseBossTelegraph`) plus the ground ring.

## Do not

- Shared voxel materials: never `material.color` on hit (flashes every enemy).
- Convert `app.js` to an ES module.
- Add SSAO/SSR/bloom to "look AAA".
- Coop/TD (P8/P9) unless the user reverses that.
