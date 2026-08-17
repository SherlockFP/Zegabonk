---
name: threejs-assets
description: Ships optimized GLB/glTF for Three.js games. Use when the user mentions Blender export, GLB, Draco, Meshopt, KTX2, LOD, collision proxies, texture size, or asset budgets.
---

# Three.js Assets

Do not open binary assets. Inspect with `npx gltf-transform inspect file.glb` or the existing manifest.

## Pipeline

1. Clean in Blender: applied scale, Y-up or documented conversion, gameplay pivots, named nodes.
2. Export GLB (glTF 2.0). No FBX/OBJ as the runtime format.
3. Optimize with glTF Transform (Meshopt default; Draco if the project already decodes it).
4. Textures: resize to on-screen need; KTX2/BasisU when the loader is wired.
5. Author collision proxies as simple named meshes (`col_*`), not the render mesh.
6. LOD only for large/repeated props. Register assets by manifest key, not raw filenames.

## Runtime

- One loader module. Reuse `DRACOLoader` / `KTX2Loader` instances.
- Clone scenes with `SkeletonUtils.clone` when animations exist.
- Do not keep unused source textures after GPU upload if the pipeline allows release.

## Agent limits

- Never Read/attach `.glb`, `.gltf` binaries, `.blend`, `.hdr`, `.exr`, `.ktx2`.
- Prefer changing the export/optimize step over compensating in game code.
