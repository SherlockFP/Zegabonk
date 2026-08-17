---
name: threejs-perf
description: Optimizes Three.js game frame time, draw calls, memory, and post-processing cost. Use when the user mentions FPS, stutter, draw calls, GPU, LOD, instancing, batching, bloom cost, or mobile performance.
---

# Three.js Perf

Read [budgets.md](references/budgets.md) only when setting numeric targets.

## Order of attack

1. Measure: `renderer.info.render` (calls, triangles), Chrome Performance, SpectorJS if the GPU path is unclear.
2. Cut draw calls before shaders: merge statics, `InstancedMesh` / `BatchedMesh` for repeats, atlas materials.
3. Cut overdraw and lights: fewer real-time lights/shadows, bake what does not move.
4. Cut pixels: pixel ratio cap 2, cheaper shadow maps, disable unused post.
5. Cut memory: dispose on unload, KTX2/Meshopt assets, no 4K textures on small props.
6. LOD + frustum cull large worlds. Do not add a custom engine.

## Defaults that stay cheap

- No post stack until the scene is readable and ≥60 fps on the target GPU.
- One directional + cheap ambient/hemisphere first. IBL only if the look needs it.
- Shadows: one caster, tight `shadow.camera`, map size 1024 unless proven otherwise.
- Animation mixers: update only visible / nearby actors.

## Do not

- Turn on SSAO/SSR/bloom to "make it look AAA" during gameplay work.
- Read `node_modules/three` to micro-optimize the library.
- Guess. If you did not measure, do not add an abstraction.
