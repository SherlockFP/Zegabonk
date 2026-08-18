# P2.4 Voxel prop set (classic solo map)

Defs: `models/props.js`. Factory: `voxel.js` (`registerVoxelModel` / `buildVoxelModel`).
Load after `voxel.js` (THREE already on window). Do not load via gallery this session.
Preview: `models/preview-props.html` (`?id=tree_oak&angle=front`, `?all=1`, `?sil=1`).
Screenshots: `tests/artifacts/props/`. Replay: `npx playwright test tests/props-preview.spec.js`.

Scale is 0.125 (same as creatures). `buildVoxelModel` centers feet on XZ. Single `body` part unless noted.
Rocks are 20% darker stone; pass `{ outline: false }` on place if they should read as unwalkable (ART-DIRECTION 6).

app.js is not wired. Line numbers below are the plan anchors (~) plus current locations.

## Spawn map (integration)

| Model id | Voxels | Native HxWxD (u) | Replaces | Suggested place scale |
|---|---|---|---|---|
| `tree_oak` | 245 | 1.63 x 1.38 x 1.00 | Forest scatter (not in the three fns yet). Do not swap `addGrassField` planes. | `fitHeight` 3.2 |
| `tree_pine` | 204 | 2.13 x 1.00 x 1.00 | Same forest scatter, mixed with oak. | `fitHeight` 3.6 |
| `rock_s` | 24 | ~0.38 cube | Extra scatter; collider pebble. | scale 0.9-1.4 |
| `rock_m` | 76 | 0.63 cube | Extra scatter; blocker. | scale 1.0-1.6 |
| `crate` | 64 | 0.50 cube | `addDecorativeProps` ~3873 (now `app.js:3958`). 70 random boxes. | scale 1.0-2.0 (matches 0.5-1.05 boxes) |
| `chest_closed` | 75 | 0.63 x 0.63 x 0.38 | Real loot chests (not the fake crates). Lid part `lid`, hinge pivot voxel `[2,3,0]`. | `fitHeight` 0.9 |
| `chest_open` | 72 | 0.75 tall | Open state of the same chest (gold interior). Same `lid` pivot. | same |
| `lamp` | 36 | 1.13 tall | `addLamppostsAndWells` ~3886 (now `app.js:3971`) metal posts + bulbs. Keep PointLight. | `fitHeight` 3.5 |
| `well` | 71 | 1.00 tall | Same fn; name has wells but none are spawned today. | `fitHeight` 1.8 |
| `fence` | 22 | 0.75 x 0.88 x 0.13 | `addVillages` ~3583 (now `app.js:3668`) 14 cylinder posts. One panel = 2 posts + 2 rails. | `fitHeight` 1.3; instance around r=18 |
| `shrine` | 62 | 1.25 tall | `addShrines` ~3824 (now `app.js:3909`) platform+blade+orb mesh. Keep dome/ring/hold VFX. | `fitHeight` 2.4 |
| `portal_frame` | 72 | 1.13 x 1.13 x 0.38 | `spawnPortal` ~7798 (now `app.js:7952`) pillars+lintel only. Keep portal plane, beam, lights. Ring part `ring` (emissive cyan). | `fitHeight` 6-8 (do not scale to the 24u sky frame) |
| `turret_base` | 64 | 0.50 x 0.88 x 0.88 | `spawnTurret` `app.js:10091` cylinder pad. Gold-edge disc; gun head stays a child later. | `fitHeight` 1.2 |

## Named parts

- `chest_closed` / `chest_open`: `lid` -- rotate around local X at pivot (back hinge). Closed lid sits on the body; open id already has lid up.
- `portal_frame`: `ring` -- pulse scale or spin; voxels sit in front of the stone door.

Everything else is one `body` mesh (instancing-friendly for P1.4).

## Notes

- Palette: ART-DIRECTION 2 (grass/wood/stone/gold/void/ice/fire/poison/ink). Village well roof uses tier red `#ff4d62`. Lamp and shrine orbs are emissive (`E`).
- `addGrassField` (~3998) stays instanced grass cards; these props do not replace it.
- Torch posts in `addLamppostsAndWells` can reuse `lamp` at smaller `fitHeight` (~2.2) or wait for a dedicated torch id.
