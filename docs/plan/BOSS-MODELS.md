# P4.1 Boss voxel models

Defs live in `models/bosses.js`. Factory: `voxel.js` (`registerVoxelModel` / `buildVoxelModel`).
Load order: `voxel.js` then `models/bosses.js` (THREE already on window).
Preview: `models/preview-bosses.html` or gallery `models/gallery.html?set=bosses`.
Screenshots (front + side, phase 1 and 2): `tests/artifacts/bosses/`.

Phase 2 is a second registered id: `<id>_p2`. The factory has no phase flag.
`buildVoxelModel("boss_arachne")` / `buildVoxelModel("boss_arachne_p2")`.

Part `pivot` is in world voxel coords (same convention as `models/creatures.js`).
Rotate the named Group for animation; geometry is already relative to that joint.
Layers use `origin` (bbox min) + local strings; Y up, bottom layer first, row = +Z, char = +X.

## Spawn map (integration)

| Model id | Phase 2 id | Spawn / mesh builder | How it is chosen today |
|---|---|---|---|
| `boss_arachne` | `boss_arachne_p2` | `spawnBoss` `app.js:7179` via `createEnemy("boss")` | `state.currentBossIndex` / `bossVariant === 0` (`app.js:5756`) |
| `boss_kraken` | `boss_kraken_p2` | same | `bossVariant === 1` (`app.js:5775`) |
| `boss_kral_slime` | `boss_kral_slime_p2` | same | `bossVariant === 2` (`app.js:5804`) |
| `boss_golem` | `boss_golem_p2` | same | `bossVariant === 3+` else branch (`app.js:5812`) |
| `boss_herobrine` | `boss_herobrine_p2` | `createHerobrineBoss` `app.js:6883` | shrine/chapter roll + mega-arena chance |
| `boss_serafim` | `boss_serafim_p2` | `createAngelBoss` `app.js:6955` | chapter angel roll |
| `boss_void` | `boss_void_p2` | `spawnVoidBossAt` `app.js:7878` | currently forces `currentBossIndex = 2` then `createEnemy("boss")` (golem-ish). Swap mesh to `boss_void`. |
| `boss_temple` | `boss_temple_p2` | `spawnTempleBossAt` `app.js:7902` | currently `currentBossIndex = templeIndex===1 ? 0 : 1` (arachne/kraken mesh). Swap to `boss_temple`. |
| `boss_zonk_avatar` | `boss_zonk_avatar_p2` | P4.3 boss-room finale | not in code yet. Suggested: mega-arena / 3rd-portal room, `MEGA_BOSS_HP_MULT=25` path. |

`anim` on each def: crawl / hover / squash / biped / fly / orbit.

Budget (phase 1): all nine are 24-40 voxel tall and under 2500 voxels. See catalog dump in `window.BOSS_CATALOG`.

## Per-boss parts and phase 2

### 1. Arachne (`boss_arachne`) -- 28 vox, ~2489

Defining read: 8 arched legs, red fangs, egg sac on the rear/top.

Named parts:
- `abdomen` bob on idle
- `thorax` root
- `head` slight track toward player
- `fangL` `fangR` telegraph: spread down-forward, flash red before bite
- `eggSac` (p1 only) pulse
- `legL1`..`legL4` `legR1`..`legR4` walk cycle in sequence (L1,R2,L3,R4 then the other four). Pivot = hip.

Phase 2: hide `eggSac`, show `eggSacOpen` (crater). Palette: body darker, marks fire. Use for spiderling burst VFX at the crater.

### 2. Kraken Sapligi (`boss_kraken`) -- 30 vox, ~1734

Defining read: green flesh stalk, red maw, four slam tentacles (four more baked into `body`).

Named parts:
- `body` squash
- `maw` telegraph: open/pulse red before spit or bite
- `tentA` `tentB` `tentC` `tentD` raise then slam (pairs A+C, B+D). Pivot = hip on the body.

Phase 2: show `tentAFlame`..`tentDFlame` (void/fire tips, same pivots as the tentacles). Palette red -> void purple.

### 3. Kral Slime (`boss_kral_slime`) -- 25 vox, ~1646

Defining read: green blob, gold crown, front maw.

Named parts:
- `blob` squash-stretch on hop (anim: squash)
- `crown` keep world-up so it does not squash with the blob
- `skeleton` (p1) drift inside; front window + maw show bone
- `maw` telegraph: crack/glow before bounce slam

Phase 2: hide `blob` + `skeleton`, show `halfL` + `halfR` (two medium slimes). Palette green -> boss red. Integration can split hitboxes onto the two halves.

Factory has no part opacity; the blob is a shell with a front cavity so the skeleton reads.

### 4. Golem (`boss_golem`) -- 34 vox, ~2163

Defining read: stone brick humanoid, emissive chest core (weak point).

Named parts:
- `torso` (p1)
- `core` telegraph: flare before slam
- `head` tilt
- `armL` `armR` overhead smash. Pivot = shoulder
- `legL` `legR` stomp. Pivot = hip

Phase 2: hide `torso`, show `magmaBody` + `magmaDrip`. Stone palette tints dirt. Core stays.

### 5. Herobrine (`boss_herobrine`) -- 26 vox, ~1354

Defining read: Steve-like blocks, huge white emissive eyes, right arm already raised.

Named parts:
- `head` tiny idle tick; teleport = hide group, scatter voxels, reform
- `body`
- `armL` hang
- `armR` telegraph: point / raise (already forward)
- `legL` `legR`

Phase 2: show `obs1` `obs2` `obs3` `obs4` (orbit around body). Shirt/skin darken. Cubes are separate parts; spin them in Y around the boss.

### 6. Serafim (`boss_serafim`) -- 34 vox, ~1628

Defining read: bone-white body, gold halo, two wing groups (two pairs baked per side), ground sigil.

Named parts:
- `body` hover
- `head`
- `halo` (p1) spin + pulse (telegraph with `sigil` before light columns)
- `wingL` `wingR` flap. Pivot = shoulder
- `sigil` ground ring, pulse before holy columns (`spawnTelegraph` already exists)
- `legL` `legR`

Phase 2: hide `halo` `wingL` `wingR`, show `haloCrack` `wingLDark` `wingRDark`. Gold -> void/boss (fallen).

### 7. Void Efendisi (`boss_void`) -- 29 vox, ~1884

Defining read: dark eye globe, yellow iris, six orbit cubes.

Named parts:
- `core` hover
- `iris` (p1) telegraph: slit narrows then orbs lean in
- `orb1`..`orb6` orbit, then launch at player and return (anim: orbit)

Phase 2: hide `iris`, show `eyeOpen` + `beam` (forward ice/gold slab). Sweep the beam Group in Y. Void tints toward boss red.

`spawnVoidBossAt` currently builds a generic bossVariant-2 mesh. Wire `boss_void` here; do not reuse kral slime.

### 8. Tapinak Muhafizi (`boss_temple`) -- 34 vox, ~2130

Defining read: mossy stone statue, gold helm/trim, raised hammer arm.

Named parts:
- `body`
- `head`
- `armL` guard
- `armR` (p1) smash telegraph (gold hammer head)
- `legL` `legR` intro: start with legs/body folded (sit), then stand

Phase 2: hide `armR`, show `armStump` + `whip`. Whip is a chained line; flail it. Gold -> void.

`spawnTempleBossAt` currently reuses variant 0/1 meshes. Wire `boss_temple` instead.

### 9. ZONK Avatari (`boss_zonk_avatar`) -- 40 vox, ~2259

Defining read: 3x-player glitch clone, negative palette (boss red / void / gold cracks), stolen-skill orbs.

Named parts:
- `head` jitter
- `body` (p1)
- `armL` `armR` skill poses
- `legL` `legR` run
- `orbFire` `orbIce` `orbSword` telegraph before the matching stolen skill

Phase 2: hide `body`, show `coreSkel`. Speed up. Palette collapses to ink/void.

No spawn function yet (P4.3). Suggested hook: after 3 portals, boss-room arena, this id, mega HP mult.

## Factory mismatches (documented vs voxel.js)

ART-DIRECTION section 5 showed layer strings + local `pivot`. Real `voxel.js`:

1. `emissiveKeys` (array). Not `emissive`. Default is only `["E"]`. Bosses set the full glow list.
2. `pivot` is world voxel coords of the joint, matching creature `boxes`. Layers are stamped at `part.origin` (default `[0,0,0]`). `offset` is ignored; bosses use `origin`.
3. Also accepts `boxes` and `voxels` arrays (creatures use `boxes`). Bosses keep `layers` as the brief specified.
4. No phase/opacity on a def. Phase 2 = second id `*_p2`. Slime is a hollow shell (no transparent material).
5. `anim` string is stored on the def (`biped` default).
6. Eyes use palette gold `#ffe066` (same as creatures), not the `#ffff44` in the ART-DIRECTION example.
7. Load `voxel.js` before `bosses.js`. There is a queue fallback (`__VOXEL_MODEL_QUEUE`) if order flips; the factory does not flush it itself.

## Wire-in sketch

In `createEnemy` boss branch, pick id from `bossVariant` (0 arachne, 1 kraken, 2 kral_slime, else golem).
In `createHerobrineBoss` / `createAngelBoss`, `buildVoxelModel("boss_herobrine"|"boss_serafim")` instead of primitives.
In `spawnVoidBossAt` / `spawnTempleBossAt`, do not reuse `currentBossIndex` meshes; build `boss_void` / `boss_temple`.
HP < 50%: swap to `*_p2` or hide/show the listed parts if you keep one group. Swap is simpler (cached geos).

Do not edit `voxel.js` for these defs.
