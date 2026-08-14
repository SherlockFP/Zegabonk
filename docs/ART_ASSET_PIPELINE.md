# ZEGABONK Art and Asset Pipeline

## Target look

- Low-poly, hand-shaped large planes and clean silhouettes.
- Bright adventure palette with darker costume anchors.
- Slightly exaggerated hands, head, weapon and enemy role markers.
- Semi-realistic roughness, but no photographic micro-noise.
- Cyan player/rift, orange enemy danger, gold reward, violet corruption.

## Production loop

1. Image concepts: key art, UI sheet, hero/enemy turnaround, environment kit and VFX sheet.
2. Art review: silhouette at 128 px, palette, originality and gameplay role readability.
3. Blender graybox: real player scale, pivot, naming and material slots.
4. Model pass: large planes first, then only silhouette-relevant details.
5. Rig/animation: shared humanoid rig where possible; 6-8 core clips.
6. Browser export: GLB, Meshopt, KTX2 where textures are used, separate collider metadata.
7. Runtime review: screenshot, animation, depth readability and performance overlay.
8. Fix or reject. A concept does not become production merely because it looks good in isolation.

## Vertical slice command

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --python tools\blender\generate_vertical_slice.py
```

Outputs:

- `assets/models/prototype/hero_hammer_v1.glb`
- `assets/models/prototype/goblin_mask_v1.glb`
- `assets/models/prototype/rift_crystal_v1.glb`
- `assets/models/prototype/zegabonk_vertical_slice_v1.blend`
- `docs/generated/model-vertical-slice-v1.png`

These v1 models are unrigged visual/performance prototypes. They are not final gameplay characters.

## Shipping budgets

- Hero LOD0: 8k-15k triangles; LOD1 4k-8k; LOD2 1.5k-3k.
- Normal enemy LOD0: 2.5k-6k; LOD1 1k-3k; crowd impostor or merged far LOD.
- Boss LOD0: 15k-30k, used sparingly.
- Prop: 50-2.5k triangles depending on screen size.
- One 1k texture set per reusable character family; atlases for props and enemy variants.
- No per-instance material clone, point light, shadow or animation mixer in dense crowds.
- Gameplay collision uses primitive proxies, never render mesh collision.

## Model-ready concept sheets

Each accepted character sheet must include:

- front, side and back in neutral pose;
- flat silhouette row at 128 px;
- color swatches and material labels;
- weapon scale relative to body height;
- face/eye expression range;
- joint and deformation notes;
- LOD detail-removal order;
- forbidden details that would damage readability or performance.
