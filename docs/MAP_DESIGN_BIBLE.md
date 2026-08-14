# ZEGABONK Map Design Bible

## Production map

Name: Darbe Yarigi
Region: Nightfall Hollow
Structure: one continuous arena that evolves with level and chapter

The map is not a collection of disconnected biomes. It is one authored place whose landmark, routes, atmosphere and hazards reveal new states during the run.

## Visual identity

- stylized dark fantasy;
- slightly exaggerated proportions;
- clean silhouettes;
- high-contrast combat effects;
- chunky readable geometry;
- controlled semi-realistic PBR materials.

The world uses large planes and strong forms. Small photographic noise, realistic clutter and unrelated asset-pack styles are rejected.

## Signature landmark

The Broken Warden is a distant three-shard crown structure north of spawn.

It must:

- read as one silhouette from the spawn bowl;
- orient the player without a permanent arrow;
- frame the final boss ring;
- change visibly as the run escalates;
- use the same fixed collider footprint in every phase.

## Arena grammar

- Center/south: safe spawn bowl and first recovery loop.
- North: Broken Warden landmark and final boss ring.
- East: raised broken terraces and traversal opportunities.
- West: sparse recovery grove with lower pressure.
- South: narrow pressure approach and event seam.

The initial authored slice includes a safe cyan ring, a stone route and the Broken Warden. Later slices may add terraces and recovery props, but topology changes must never trap the player.

## Evolution phases

### Levels 1-4 - Sessiz Fundalik

- cold green-black fog;
- neutral stone landmark;
- minimal ambient motes;
- maximum separation between cyan player, coral enemies and gold rewards.

### Levels 5-9 - Kok Uyanisi

- root silhouettes reveal around the landmark;
- recovery route gains subtle green guidance;
- no new blocker appears beside the player.

### Levels 10-14 - Yarik Basinci

- violet cracks activate in reserved ground seams;
- fog shifts toward violet;
- corruption uses violet exclusively.

### Levels 15-19 - Kizil Tutulma

- boss ring becomes visible;
- sky and fog darken toward crimson;
- environmental contrast drops so combat telegraphs gain priority.

### Level 20+ - Tac Dususu

- upper crown shards reveal;
- final arena silhouette is fully readable;
- reward gold is reserved for the boss resolution.

Chapter 2 forces at least Yarik Basinci. Chapter 3 forces at least Kizil Tutulma. Level remains the fine-grained visual progression source.

## Color channels

- player/core guidance: cyan and verdigris;
- normal enemy threat: coral/red;
- corruption: violet;
- reward and completion: gold;
- environment: desaturated green, stone, charcoal and bone.

Color alone is never the only threat signal. Telegraphs also require ring, wedge, line or volume shape.

## Material rules

- environment roughness: 0.72-0.95;
- actors roughness: 0.55-0.85;
- metalness: usually 0-0.15;
- no persistent full-bright emissive surfaces;
- no per-prop material clones;
- one shadow-casting directional light maximum for the world.

## Asset kit order

1. Graybox terrain, five zones, landmark and boss ring.
2. Six rock/ruin modules, four tree silhouettes and three foliage clusters.
3. Landmark states and root/crack phase kit.
4. Two hazard decals and two interactables.
5. One player, five enemy roles and one elite silhouette kit.
6. Telegraph, normal hit, heavy BONK, reward and phase-transition VFX.

Shipping bundles:

- `map_core.glb`;
- `map_props.glb`;
- `landmark.glb`;
- separate collider metadata/proxies.

## Browser budgets

- map draw calls: <= 75 normal, <= 100 dense;
- visible map geometry: <= 120k normal, <= 180k dense triangles;
- resident map textures: <= 48 MiB;
- compressed first-map package: <= 20 MiB;
- one compressed asset: <= 8 MiB;
- phase transition: no long frame above 50 ms.

Static prop families must use InstancedMesh or merged geometry. Phase assets are prebuilt and toggled; terrain is not rebuilt during combat.

## Inspiration boundary

MEGABONK is a reference for third-person horde readability, quick build escalation, clear pickups, vertical routes and visible boss objectives.

ZEGABONK must not copy its characters, map layouts, props, icons, UI arrangement, jokes, palette sequence or effect timing. Darbe Yarigi, the Broken Warden, its phase structure and its visual channels are original project identity.

