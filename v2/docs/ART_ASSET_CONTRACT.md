# ZEGABONK V2 Art and Asset Contract

## Identity

Bright stylized dark fantasy: optimistic sky and terrain, dark costume anchors,
clean silhouettes, chunky geometry, semi-realistic roughness and high-contrast
combat effects. Family and teen friendly, but not preschool-like.

MEGABONK is a pacing/readability reference only. ZEGABONK ships original names,
characters, silhouettes, maps, UI frames, effects, audio and encounter content.

## Runtime contract

- GLB is the shipping model format; Blender files are source artifacts only.
- 1 world unit = 1 metre, +Y up, +Z forward, ground pivot at Y=0.
- Runtime imports stable manifest IDs, never ad hoc filenames.
- Normal enemies use shared materials, LODs and instanced render archetypes.
- Gameplay collisions use primitive proxies, never render-mesh raycasts.
- Production imports require source/provenance, triangle, material, texture,
  animation, bounds and collider metadata.

## First production kit

1. Crown Runner hero: hammer silhouette, shared humanoid rig, idle/run/attack/hit/death.
2. Rattlecap pursuer: forward wedge and continuous chase pose.
3. Sunscar bulwark: broad shield silhouette and brace telegraph.
4. Crownwing skimmer: detached wing silhouette and dive telegraph.
5. Green Rise biome kit: 3 trees, 3 rocks, 2 ruins, 2 grass clumps, flowers,
   Crown beacon landmark and portal frame.
6. BONK VFX kit: light hit, heavy hit, critical, danger telegraph, XP and portal.

## M3 asset ledger

| Asset | Art source | Runtime source | Budget | Gate |
| --- | --- | --- | ---: | --- |
| Mosswatch tower v1 | `assets/concepts/environment/mosswatch-runtime-kit-v2.png` | `v2/tools/create_mosswatch_tower.py` -> `mosswatch_tower_v1.glb` | 2,512 tris, 4 materials, 4 meshes | Chrome scale and Stage 1 silhouette check pending |
| Rift Scar arch v1 | `assets/concepts/environment/rift-scar-runtime-kit-v1.png` | `v2/tools/create_rift_scar_arch.py` -> `rift_scar_arch_v1.glb` | 1,460 tris, 3 materials, 3 meshes | Chrome scale and Stage 2 silhouette check pending |
| Crown Ascent spire v1 | `assets/concepts/environment/crown-ascent-runtime-kit-v1.png` | `v2/tools/create_crown_ascent_spire.py` -> `crown_ascent_spire_v1.glb` | 2,232 tris, 3 materials, 3 meshes | Chrome scale and Stage 3 silhouette check pending |

Both source sheets are generated as original ZEGABONK concept references. The
shipping GLBs are project-authored Blender exports and carry no third-party
game, character, logo or branded content. Image generation informs silhouette,
palette and material direction only; it is not treated as an imported runtime
mesh.

### Runtime floor-alignment rule

The first M3 visual re-gate found that the exported landmark bounds extended
below local ground: tower `-1.78m`, arch `-2.49m`, spire `-2.10m`. Every static
landmark loader must calculate its post-scale world bounds and lift the root by
`-bounds.min.y` before attaching it to a stage. This is a compatibility guard
for prototype exports, not a substitute for correcting pivots in the final
Blender source. Final production exports still need a verified Y=0 floor pivot.

## Gameplay budgets

- Hero LOD1: 6k-10k triangles, <=2 materials, <=48 bones.
- Standard enemy LOD1: 2.5k-5k; LOD2: 500-1.2k; one swarm material.
- Normal prop LOD1: 0.8k-3k; shared atlas or vertex colors.
- One shadowed directional light, one hemisphere term and one unshadowed fill.
- Normal frame: <=350 draw calls and <=300k visible actor triangles.
- Stress frame: <=450 draw calls and <=400k visible actor triangles.

## Acceptance

Every production asset must pass silhouette, material, animation, in-game scale,
LOD stability and swarm performance captures. A concept or successful Blender
export is not a production asset until the running-game gate passes.
