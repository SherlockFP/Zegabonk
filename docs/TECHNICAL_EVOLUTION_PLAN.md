# ZEGABONK Technical Evolution Plan

Status: binding production roadmap
Target: 200-500 active enemies without losing combat readability or art quality

## Current evidence

The game is a working Three.js browser runtime, but the combat architecture is still prototype-shaped.

- `createEnemy()` creates a new `THREE.Group` per enemy.
- Procedural enemy branches allocate meshes, geometries and materials inside the spawn path.
- Projectile paths also contain per-shot geometry and material allocation.
- Enemy, projectile and effect collections are updated from one large frame loop.
- Targeting and collision paths include repeated linear scans.
- Raycasting is centralized for arena ground and water checks. It is not currently performed once per enemy.
- The light baseline is healthy, but it only contained four enemies. Dense-swarm performance is not proven.

This means the performance concern is valid, but the solution must be measured migration, not an unverified full rewrite.

## Target runtime

```text
Three.js renderer
|- data-oriented gameplay state
|- InstancedMesh enemy and prop renderers
|- fixed-capacity object pools
|- central LOD classification
|- spatial hash for neighbors and collision candidates
|- fixed-rate AI scheduler
|- cheap XZ gameplay collision
|- GPU-friendly pooled particles
|- asset manager with preload and streaming contracts
|- animation manager with mixer budgets
|- explicit post-processing budget
|- procedural level authoring tools
`- profiling and debug overlay
```

## Migration rules

1. Gameplay data owns truth. Three.js objects are render handles, not entities.
2. Collision size comes from authored gameplay metadata, never from render bounds by accident.
3. Normal swarm enemies use shared geometry and material. Bosses and showcase elites may keep unique scene graphs.
4. No enemy owns a dynamic light, shadow map, raycaster or independent update loop.
5. No hot-path spawn creates a geometry, material, texture or audio graph.
6. Every architecture step requires before/after swarm evidence.
7. The current playable route stays usable throughout migration.

## Delivery stages

### P0 - Measurement and authored world seam

Deliverables:

- F3 profiler with frame time, p95, max, draw calls, triangles, geometry, texture and entity counts.
- Stable debug snapshot through `window.__zegabonkDebug.getSnapshot()`.
- One map only: Darbe Yarigi.
- Shared-material and InstancedMesh landmark slice.
- Level-driven visual phases without rebuilding terrain.

Exit gate:

- Menu -> lobby -> run works in the real browser.
- Console has no blocking runtime errors.
- Level phase change does not allocate a replacement world.
- Added authored map slice stays below 10 steady-state draw calls.

### P1 - Enemy render archetype pilot

Scope only one rigid normal enemy family.

- Add numeric entity id and data record.
- Separate transform, health, role and cooldown data from render object.
- Create LOD0 unique/showcase, LOD1 cheap mesh and LOD2 InstancedMesh forms.
- Preallocate a fixed-capacity pool.
- Keep boss and elite code unchanged.

Benchmark populations: 50, 100, 200 and 500 stationary/moving enemies.

Exit gate:

- No geometry/material creation while the pilot archetype spawns.
- LOD2 instances update in bounded batches.
- Kill, damage, XP and cleanup behavior remains equivalent.
- 200-enemy frame p95 and renderer counters beat the legacy branch.

### P2 - Spatial and AI scheduler

- Add a world-space uniform hash grid.
- Query nearby cells for targeting, separation, aura and projectile candidates.
- Run normal enemy decisions at 8-12 Hz.
- Interpolate render transforms each frame.
- Keep boss telegraphs and close-range steering at a higher controlled rate.

Exit gate:

- Candidate checks scale with local density instead of total entity count.
- AI remains readable at variable frame rates.
- Deterministic debug seed reproduces the benchmark wave.

### P3 - Effects and projectile allocation

- Pool projectile render handles and gameplay records.
- Replace CPU mesh spam with pooled billboards, instanced quads or batched geometry.
- Reserve priority channels for boss telegraphs, heavy BONK impacts and rewards.
- Enforce particle density setting in spawn budgets.

Exit gate:

- No per-shot geometry/material allocation in normal combat.
- Telegraphs remain visible at maximum tested density.
- Effect pools recover across death, restart and chapter transition.

### P4 - Asset and animation runtime

- Asset manifest defines URL, license, compressed size, LODs, textures, collider metadata and preload group.
- Meshopt and KTX2 are required for shipping GLB content unless a measured exception is documented.
- Animation manager owns mixers and update frequency.
- Normal swarm LOD2 has no mixer.
- Stream distant optional content without delaying first playable state.

Exit gate:

- One player, one normal enemy family and one elite pass runtime asset validation.
- Missing optional assets fall back without breaking the run.
- Restart returns GPU resource counts to the accepted envelope.

### P5 - Post-processing and shipping scale

- Add only effects that materially improve silhouettes, depth or impact.
- World rendering may use a reduced internal buffer; DOM UI stays native resolution.
- Post stack has low, normal and high presets with measured GPU cost.
- Dense encounter, temple-scale encounter and ten-minute lifecycle become release gates.

## Performance budgets

Normal target at 1600x900:

- frame p95 <= 16.7 ms on the reference machine;
- draw calls <= 350;
- visible triangles <= 500k;
- map draw-call share <= 75;
- no long task above 50 ms during a phase transition.

Dense target:

- draw calls <= 450;
- visible triangles <= 900k;
- 200 active enemies are the first mandatory swarm gate;
- 500 enemies are a stress gate, not an excuse to reduce telegraph clarity.

## Stop conditions

Pause a migration stage when any of these occurs:

- the browser route no longer reaches playable combat;
- visual readability is worse at equivalent density;
- resource counts grow across restart;
- a large abstraction is added without replacing a measured cost;
- boss or elite identity is flattened to satisfy normal-enemy batching.

