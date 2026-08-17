---
name: threejs-runtime
description: Implements vanilla Three.js game runtime in Vite/TypeScript. Use when adding scenes, cameras, render loops, GLTFLoader, Rapier bridges, input, dispose/resize, or context-loss handling in a non-React 3D game.
---

# Three.js Runtime

Read [architecture.md](references/architecture.md) only if the folder layout is missing. Read [dispose.md](references/dispose.md) only for leaks, resize, or context loss.

## Rules

1. Simulation owns entities, timers, input actions, save data. Meshes are views.
2. One clock: `THREE.Clock`, tick with `delta`. No `rotation += 0.01` in shipping code.
3. Camera has an explicit mode (follow / orbit / fps). Do not mix look and menu input.
4. Loaders live in one module. `GLTFLoader` + optional `DRACOLoader` / `KTX2Loader`.
5. Rapier world steps in simulation; renderer reads interpolated poses.
6. Dispose geometry, materials, textures, and GPU resources on scene unload.
7. Handle `resize` and `webglcontextlost` / `webglcontextrestored`.
8. `setPixelRatio(Math.min(devicePixelRatio, 2))`. Shadows and post are opt-in and measured.

## Imports

```ts
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
```

## Input

Map keys/pointers to actions (`move`, `look`, `confirm`, `pause`) in one file. Pause must release pointer-lock before any DOM menu.

## UI

DOM only unless the effect must be in-world. Keep the playfield center clear.
