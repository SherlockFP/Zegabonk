# ZEGABONK Skills and Items Concept Pack v1

`skills-items-runtime-sheet-v1.png` is an original visual-language reference for the first expedition's pickups, active skills, item tokens, and danger telegraphs. It complements `combat-vfx-language-sheet-v1.png`; it is not a source sprite sheet or a literal UI layout.

## Runtime read

| Asset | Gameplay role | Primary color | Runtime form |
| --- | --- | --- | --- |
| Rune hammer arc | Basic melee hit | Cyan | GPU particle ribbon plus a short additive mesh trail |
| XP crystal | Run experience | Cyan | Shared low-poly GLB, instanced; 8-frame bob and emissive pulse |
| Crown coin | Persistent BONK reward | Gold | Shared low-poly GLB, instanced; rotate slowly only within camera range |
| Heart vial | Health pickup | Green | Shared low-poly GLB, instanced; use a simple green burst on collect |
| Rift shard | Portal / rift currency | Violet | Shared low-poly GLB, instanced; vertical hover plus violet spark burst |
| Ember flask | Area-damage item | Orange | Projectile GLB or billboard; simulate the explosion with pooled particles |
| Shockwave | Wide hammer skill | Cyan | Flat camera-facing mesh/ribbon; never allocate particles per hit |
| Guard crest | Short defensive boon | Gold | HUD/item icon plus a single shield-ring effect around the player |
| Rift key | Portal interaction | Violet | Static/key pickup GLB; reuse rift-shard material family |
| Danger disk | Enemy attack telegraph | Red | Flat transparent decal/mesh, depth-offset from terrain, no texture animation required |

## Blender and texture contract

- Source orientation: Z up, front toward Blender -Y; pickup origin at its gameplay anchor or centered base.
- Keep each pickup under 700 triangles at LOD0. Shockwave, telegraph, and aura must be meshes/cards rather than modeled volumetric geometry.
- Use one shared pickup atlas when silhouettes are approved: 1024 px base-color/emissive/ORM. Favor vertex color for cheap rarity variants.
- Emitters may use a separate additive material. Never add real point lights for pickups or per-enemy impact effects.
- Export static GLB 2.0 with applied transforms, no cameras or lights. Produce LOD1 at roughly 45% triangles only after a runtime screen-size check.
- Store runtime effect timing and colors in data tables. The render path must use pools and shared materials, not `new Mesh`, new texture, or new material on collection/hit.
- Red danger language is reserved for harmful enemy geometry. Cyan means player action/XP, gold is reward or defense, violet is rift/portal, green is health, orange is explosive impact.

## Delivery order

1. XP crystal, coin, health vial, and rift shard as shared static GLBs.
2. Hammer arc and danger disk as pooled renderer primitives.
3. Guard crest, rift key, then ember flask after pickup collection is verified in the actual Three.js scene.
4. Validate visibility at normal gameplay camera distance and in the 200-enemy stress scene before adding detail.
