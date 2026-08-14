# ZEGABONK 2.0 Art Direction Bible

Status: binding discovery contract. No external pack is integrated as of 2026-08-13.

## Visual philosophy

**Stylized high quality over brute-force realism.** Spend budget on silhouette, animation, coherent materials, lighting, palette and VFX timing before polygons, texture size, material count or dynamic lights.

The world is a chunky low-detail 3D combat diorama with restrained pixelation and a dark retro HUD. It is not faux-2D pixel art and not an asset-store collage. Volumes, planes and motion remain readable; the world render supplies the pixel character.

## Original identity

- Player: compact heroic mass, clear head/weapon/shoulder rhythm, cool cyan identity.
- Standard enemies: forward-heavy threat silhouettes, dark neutral bodies plus one role color.
- Elite/boss: silhouette change first, size second; unique telegraph shape and timing.
- Environment: broad authored masses; landmarks use height and negative space, not detail noise.
- Pickups: simple collectible shapes, bright value, stable color semantics.
- VFX: anticipation -> impact -> decay. Effects communicate gameplay before spectacle.

Do not reproduce recognizable characters, icon sets, proportions, layouts or motifs from reference games.

## Palette and hierarchy

Reserve colors consistently:

- cyan/blue: player, navigation, neutral information;
- amber/gold: reward, currency, selected positive choice;
- red/orange: immediate damage and hostile telegraph;
- violet: corruption, void, unstable challenge;
- green: healing, recovery, safe activation;
- off-white: neutral world highlight and UI text.

Terrain stays lower saturation and contrast than actors. No decorative effect may compete with hostile telegraphs or player survivability.

## Pixel and outline contract

- World and VFX render through an adaptive low-resolution buffer; HUD/text do not.
- Desktop starting target at 1600×900: 800×450 internal world buffer.
- Narrow viewports use a finer adaptive buffer with a 320-pixel short-axis floor.
- Pixelation must become finer if telegraphs, pickups, silhouettes or navigation disappear.
- Use nearest-style presentation without filtering text or thin UI rules.

Outline is required only for opaque player and hostile gameplay meshes. It is conditional for active pickups, hazards and blockers. It is prohibited on terrain, water, fog, grass, particles, decorative debris, transparent VFX and invisible colliders. Starting projected thickness: roughly 1–2 screen pixels; reduce or disable it in dense LOD2/LOD3 crowds. No full-screen OutlinePass is assumed by the current runtime.

## Lighting and material contract

- One primary shadow-casting directional light.
- Ambient/hemisphere fill establishes readable planes.
- Dynamic point lights are rare, pooled and proximity-limited; never one per swarm enemy.
- LOD2/LOD3 use emissive accents or blob shadows, not dynamic shadow maps.
- Opaque materials are preferred. Transparent layers are reserved for telegraph/VFX meaning.
- One palette/atlas per family; avoid unique materials per instance.
- Normal/roughness detail must survive the intended pixel buffer or be removed.

## Coordinate and import contract

Every production asset manifest must record:

- metres, `+Y` up, `+Z` forward;
- ground-centred pivot and intended facing;
- source URL, creator, licence URL, access date and archive SHA-256;
- source and shipped filenames;
- LOD0–LOD3 triangle/vertex counts;
- materials, draw submissions and texture dimensions/formats;
- bones, skin weights and animation clips;
- collider primitive(s), radius/extent and gameplay scale;
- compression and export settings.

Runtime visual scale and gameplay collider must derive from the same asset metadata. Render meshes are not collision meshes.

## Starting asset budgets

These are acceptance targets, not claims about researched source packs.

| Family | LOD0 close | LOD1 gameplay | LOD2 swarm | LOD3 distant |
| --- | ---: | ---: | ---: | ---: |
| Hero humanoid | 8–15k tris | 3–7k | 0.8–2k | 100–400 or impostor |
| Standard monster | 5–12k | 2–5k | 0.3–1k | 2-triangle billboard |
| Boss | up to 25k | 8–15k | 2–5k | 0.4–1k/impostor |
| Small prop/nature | 0.5–4k | 0.2–2k | 0.1–0.8k instanced | omitted/impostor |
| Building/landmark | 5–20k | 2–10k | 0.5–3k | silhouette proxy |

Further gates:

- LOD0: at most two materials per actor; LOD1–LOD3: one.
- Shared 512²–1k palette/atlas; no unique 2k texture without measured need.
- Hero LOD0: at most 48 deform bones; gameplay 32; swarm 16; LOD3 unskinned.
- Maximum four skin weights per vertex.
- Humanoid collider: capsule. Monster: sphere/capsule/box compound, at most three primitives. Environment: box/capsule or authored simple compound.
- LOD selection uses projected screen height plus 10–15% hysteresis, not distance alone.

## Swarm representation

- LOD0: close showcase animation and selected shadows.
- LOD1: gameplay silhouette and telegraph; reduced rig or baked animation.
- LOD2: archetype/cell instancing, baked loop/morph, blob or no shadow.
- LOD3: opaque/alpha-tested directional impostor, aggregate simulation.

Quality must degrade gracefully: animation frequency, secondary parts, shadow and surface detail disappear before silhouette, role color or hostile timing.

## Researched asset sources

Research identified a coherent CC0 candidate stack from one author:

- Quaternius Ultimate Modular Men;
- Quaternius Ultimate Monsters;
- Quaternius Ultimate Fantasy RTS.

Kenney Mini Dungeon/Nature Kit are CC0 alternatives. Poly Haven is CC0 but generally too realistic/high-detail for core art without retopology. Sketchfab requires per-model licence verification. None is approved or integrated until archive audit, Blender cleanup, measured budgets and in-game A/B acceptance pass.

## Screenshot acceptance

Capture equivalent before/after compositions at:

- 1600×900 desktop;
- 390×844 portrait;
- 844×390 narrow landscape when gameplay is supported.

Each batch must prove player silhouette, enemy roles, telegraphs, pickups, path/landmark, HUD readability, LOD stability and no model/collider intersection. Reject a prettier batch if it increases frame-time beyond `docs/PERFORMANCE_BUDGET.md` or creates an incoherent asset mixture.