# ZEGABONK V2 Director Handoff

Last updated: 2026-08-14 - corrective handoff

## Read this first: current player-visible verdict

The V2 technical foundation advanced, but the current game is **not** at an
acceptable presentation bar. The user directly rejected the visible Crown
Runner and its locomotion/attack motion as worse than the prior prototype and
also rejected the main-menu presentation. Treat the current hero art,
animation and all player-facing menu/UI presentation as regressions until a
fresh live comparison proves otherwise. Do not describe M5b art, main menu,
first-minute fun or the complete game as passed.

What is genuinely proven:

- The V2 shell builds and runs; main menu -> lobby -> run -> pause -> main has
  browser evidence. This is functional evidence only, not menu-quality
  approval.
- The pooled/instanced swarm architecture met the 200-enemy technical gate.
- Local profile persistence works through the DEV Grom result preview.
- The first map has three state-driven stage labels/landmarks and working
  portal state in source.

What is **not** proven or currently rejected:

- Main-menu information architecture, visual composition, interaction motion,
  settings/pause polish and every other player-facing UI surface.
- Crown Runner model quality, silhouette, idle/run/attack animation,
  camera/player feel and basic combat presentation.
- A normal player-controlled three-portal expedition from start to final boss.
- Remote XP pickup as a satisfying player-visible interaction.
- M5b visual gate, endgame gameplay, global leaderboard and all co-op work.

### Immediate recovery gates: P0 menu/UI and M5b-0R gameplay (do these before new features)

The next agent should freeze new endgame, co-op and leaderboard scope. Do not
merely reskin the existing menu. Start with an actual screenshot audit of the
main menu, lobby, settings and pause state, then replace the weak information
hierarchy, card geometry, typography, interaction motion and background
composition as one coherent command-screen system. Use code-native UI text and
controls, not image-generated fake UI text. Verify keyboard focus, settings
persistence, reduced-motion behavior and every viewport state.

After the P0 menu/UI baseline is captured, run this narrow gameplay recovery
loop:

1. Capture a clean normal-run before image showing the hero at rest, moving,
   attacking one Rattlecap and collecting one XP token.
2. Re-author or replace the Crown Runner with one cohesive, low-poly model.
   It must read as a single playable character at gameplay camera distance:
   large head/torso/boots, one clear cyan cape, a readable hammer, no detached
   floating-looking armour blocks, and a calm idle.
3. Reduce the existing procedural limb swing before attempting any new rig.
   Current runtime multipliers in `v2/src/render/WorldRenderer.ts` are too
   aggressive (`0.78`, `0.58`, `0.90`) and are a direct regression risk.
   A restrained root bob + small arm/leg swing is preferable to exaggerated
   disconnected pivots. Keep attack motion on the visible weapon/actor.
4. Re-run `npm run typecheck` and `npm run build`, then capture the same four
   live frames. Reject/revert the asset if it is not visibly better.
5. Only then request an independent SOL pixel review. M5b-0R passes only if
   the reviewer sees coherent character presentation, readable first contact,
   camera framing, magnetic pickup feedback and a clean console. The previous
   7.1/10 review is a failure, not a baseline to round up.

### Current implementation map

- `v2/src/render/WorldRenderer.ts` owns the active hero loading, hero pivot
  animation, camera framing, Rattlecap actors, combat flare and XP rendering.
  It is the first place to inspect and modify for M5b-0R.
- `v2/tools/create_crownfall_actors.py` exports the current disliked hero and
  Rattlecap GLBs. It is authoring input, not proof of quality.
- `v2/public/assets/models/crown_runner_v1.glb` is the current runtime hero;
  `v2/public/assets/models/rattlecap_runner_v1.glb` is the current enemy.
- `v2/src/core/Simulation.ts` owns movement, XP magnet, stage/portal state,
  and DEV guardian preview. Do not reshape it for cosmetic fixes unless a
  player-visible behavior defect is reproduced.
- `v2/src/core/ProfileStore.ts` owns local-only persistence and run-id
  de-duplication. It has DEV-preview proof only.
- `v2/src/app/GameApp.ts` contains DEV-only `?stress=200` and `?preview=grom`
  routes. Keep these clearly non-production and do not use them as normal-flow
  proof.

### Active plan after recovery

1. P0: main menu, lobby, settings and pause redesign with a live screenshot
   gate. No score is assumed from the old menu.
2. M5b-0R: character/camera/first-contact/pickup recovery and independent
   screenshot gate.
3. M5b-1: normal three-portal run, Grom, result, reload persistence; no DEV
   shortcut used as acceptance evidence.
4. M5c: choose a server architecture and add an authoritative score-event
   protocol before presenting any global/community leaderboard as live.
5. M6: only after M5 passes, extract multiplayer-safe state then build a
   1-4-player authoritative co-op vertical slice with separate board rules.

The user explicitly wants a professional, bright stylized 3D action game, not
a documentation-heavy prototype. Each loop must produce and inspect a live
player-visible improvement; if the screenshot is worse, stop and repair or
revert before stacking more scope.

## Active source of truth: V2 controlled rebuild

The legacy root game is now a reference implementation, not the production
foundation. New production work lives under `v2/`. Preserve the root build for
behavior comparison and rollback evidence; do not continue stacking systems on
the monolithic legacy `app.js`.

### Verified V2 checkpoint

- Milestone 1 Shell Gate passes: `npm run typecheck` and `npm run build`.
- Browser flow passes: main menu -> lobby -> run -> pause -> quit to main.
- Settings persistence passed reload testing.
- The final regression added no browser console warning or error.
- The main menu is a verified visual improvement over legacy and currently
  scores about 7/10; lobby is about 6/10.
- Gameplay remains a bright proxy scene at about 3/10. Combat, enemies,
  production characters, authored level art and progression are not complete.
- Three.js is loaded only when a run starts. The menu shell remains a small
  entry chunk and key art ships as compressed AVIF/WebP.
- Production assets must enter through `v2/src/assets/AssetManifest.ts` and pass
  `v2/docs/ART_ASSET_CONTRACT.md`; generated concepts and Blender exports do not
  count as shipped quality until they pass in-game visual and performance QA.

### 2026-08-14 M4 and M5a checkpoint

- M4 passed an independent SOL/ultra swarm gate at 8.5/10: 200 active enemies
  held for 30+ seconds with 83-85 calls and no browser error in normal or stress
  routes. Pooling, spatial lookup, 20 Hz enemy AI and instanced rendering are
  now the V2 scale baseline.
- M5a adds `ProfileStore`, a local-only durable account record, and
  `AudioDirector`, which packages the existing project menu/game music into V2
  and honors master/music controls. The main command screen reads local level,
  XP, daily progress and personal records rather than showing fabricated global
  rankings. Its current hero art is the original project asset
  `v2/public/assets/ui/menu-keyart-v4.png`.
- This is not global leaderboard completion. M5c must introduce a selected
  server and server-authored score event protocol before any world rank or
  community target is shown as live.

### 2026-08-14 active M5b correction record

- The user-reported player-quality regression is now tracked as an open M5b
  gate, not as a finished art pass. The first full independent visual score was
  **7.1/10 and failed**: it found stale stage-clear feedback, too-wide camera
  framing, oversized hit flashes and unclear XP-versus-ambient-crystal reading.
- The stale objective is repaired at the simulation source; the camera and
  impact flare are tightened. Crown Runner, Rattlecap and King Grom are
  project-authored GLBs registered in the V2 manifest. Grom is a single
  detailed guardian actor; the 200-enemy crowd remains instanced.
- M4 was rerun after the asset work. A failed 105-call / 102,718-triangle run
  caused an explicit crowd-LOD repair. The verified replacement held 200
  active enemies for 31 seconds at 199 FPS / 5.0 ms / 65 calls / 46,514
  triangles with no browser warning or error. This is a performance proof only,
  not a complete M5 art or gameplay pass.
- Grom victory -> result -> reload persistence was proven in the DEV-only boss
  preview: 2,500 score, local Level 2 profile, 3 Crown Shards, one victory and
  the Crown Rift unlock persisted with no console error. The normal three-
  portal traversal is still an open M5b acceptance gate.

### 2026-08-14 M3 first-map checkpoint

- `v2/` now has one coherent first-map route, Yesil Yukuslar, instead of a
  renderer-only static arena. The same run changes from Mosswatch Harabeleri to
  Yarik Sirti at 5 kills and Tac Yukselisi at 11 kills. The stage title and
  objective come from `SimulationSnapshot`, so HUD and environment cannot
  disagree.
- Three original ImageGen concept references were created for the kit and kept
  under `assets/concepts/environment/`. Three project-authored Blender scripts
  turn that direction into runtime GLBs: `mosswatch_tower_v1.glb` (2,512 tris),
  `rift_scar_arch_v1.glb` (1,460 tris), and `crown_ascent_spire_v1.glb` (2,232
  tris). Their manifest records, source scripts and acceptance status live in
  `v2/src/assets/AssetManifest.ts` and `v2/docs/ART_ASSET_CONTRACT.md`.
- Chrome normal-flow evidence: menu -> lobby -> run -> level-up -> Stage 2 ->
  Stage 3 completed locally; no browser console warning/error appeared, all
  three GLB URLs returned HTTP 200, and `npm run typecheck` plus `npm run build`
  pass. The Vite renderer chunk is still about 629 kB minified and remains a
  future performance split task, not a build failure.
- M3 is deliberately **REVIEW**, not PASS. A fresh SOL visual reviewer must
  inspect live pixels for landmark scale, silhouette, cohesion and playfield
  obstruction before a score is recorded.

### 2026-08-14 M3 final gate

- M3 passed an independent SOL/ultra pixel/runtime gate at **8.5/10 weighted**:
  identity 8.0, landmark readability 8.3, stage differentiation 9.2,
  playfield clarity 8.8 and technical presentation 8.7.
- The first M3 review failed 5.9, then the palette/landmark revision reached
  7.4 but exposed the actual root cause: all three GLB bounds began below
  ground. `WorldRenderer` now floor-aligns static landmark roots after scale;
  the final reviewer saw the tower, arch and spire as clear portal-axis
  silhouettes without blocking enemy or HUD readability.
- Next live gate is M4 swarm architecture. Do not add more solo content or
  mobile/co-op work until pooled/instanced entities, spatial targeting,
  fixed-rate AI and an instrumented 200-active-enemy runtime pass exist.

### Active execution order

1. Combat vertical slice: movement, camera, auto-aim, hammer BONK, one enemy,
   damage/death/XP and one meaningful level-up choice.
2. Production asset slice: rigged Crown Runner, one shared-material enemy family,
   hero/enemy animation set, authored VFX and browser-budget GLBs.
3. First complete level: Yesil Yukuslar evolves through three portal stages on
   one coherent map kit, ending in the Grom boss zone.
4. Swarm/performance: data-oriented entities, instanced render archetypes,
   pools, spatial hash, fixed-rate AI and a profiling overlay; prove 200 enemies
   before scaling higher.
5. Roguelite run and persistent profile: upgrade drafting, build synergies,
   score events, death/results, story completion and Crown Rift migration.
6. Only after the solo foundation passes: authoritative co-op prototype and
   partitioned leaderboards. Mobile controls remain explicitly deferred.

The bounded loop and milestone gates live in `v2/docs/BUILD_LOOP.md`. The art,
LOD, rig, material, collider and runtime acceptance rules live in
`v2/docs/ART_ASSET_CONTRACT.md`.

## 2026-08-14 active product direction

This handoff now carries a wider, ordered program. New prompts never silently
replace unfinished work; they are merged into this queue and executed by risk
and dependency order.

### Locked product pillars

- Story: three portal-linked levels - Yesil Yokuslar, Gunes Kirigi, Bulut Taci - ending with Catlak Kral Grom and the rescue of Princess Zega.
- Endgame: story completion unlocks infinite, timed Tac Yarigi contracts with random biome, kill quota, affixes, a rift boss, depth advancement and persistent profile rewards.
- Persistence: story unlock, max depth, Tac Parcasi, mastery and equipment schema persist; run XP/cards/combo remain roguelite and reset on a new expedition.
- Co-op target: 1-4 players, create/join code, ready room, player-count scaling, down/revive/reconnect and separate solo/2P/3P/4P leaderboards.
- Competitive integrity: local boards are prototypes only. Ranked/global score must be server-authoritative and partitioned by ruleset, party size and normalized versus progression power.
- Mobile target: first-class touch/input/performance product, not a desktop web wrapper. Low devices target stable 30 FPS; high devices target 60 FPS after measured acceptance.
- Art: bright stylized low-poly fantasy, large clean planes, exaggerated weapon/role silhouette, cyan/gold/violet combat language, family/teen friendly without becoming preschool-like.

### Implemented in the legacy/reference slice

- Versioned persistent profile and deterministic Tac Yarigi contract generator.
- Final Mega Boss now unlocks Princess Zega rescue and the Crown Rift portal.
- Rift timer, quota, depth scaling, affixes, rift boss, success/timeout next portal and persistent shard/mastery rewards.
- Separate local Crown Rift leaderboard and HUD/debug rift fields.
- Main menu uses new bright original key art and the three-level story promise.
- Lore, endgame, co-op and mobile product/architecture plans exist under `docs/`.
- Blender 5.2 headless vertical-slice pipeline generated hero, masked goblin and rift crystal GLBs plus a preview render.
- The experimental hero GLB integration was removed from the active legacy
  runtime after visual regression. Its concept/blockout remains reference-only.
- Image concept packs exist for story/co-op lobby, endgame workshop, six character/enemy/boss turnarounds, three-stage environment kit and VFX language.

### Legacy verified runtime checkpoint

- Classic menu -> lobby -> run reaches the HUD without a new console warning or error; the previous background-type and missing bomb-state crashes are fixed.
- QA Crown Rift success cycling passed three consecutive depth choices (+1, +4, +7) and opened the next +10 portal.
- QA Crown Rift timeout passed and preserved the active build while opening a retry/next portal.
- The headless Blender hero GLB rendered in the live run with correct floor alignment and a readable hammer silhouette.
- The integrated hero remains a vertical-slice blockout: production rig, locomotion/attack animation, material polish and measured draw-call/resource acceptance are still open.

### Ordered execution loop

1. Promote the hero blockout into a rigged production vertical slice with idle/run/attack clips and one shared material budget.
2. Replace the sparse Classic environment with the authored three-stage kit while preserving the verified portal/endgame lifecycle.
3. Measure calls, triangles, frame time and resource growth across dense combat and three consecutive portals.
4. Extract state boundaries required by co-op: profile/run/stage/rift, fixed simulation tick, input intent and stable entity ids.
5. Build the two-player LAN/co-op vertical slice before public matchmaking.
6. Keep mobile implementation deferred until the user reopens that milestone; retain its architecture plan only.
7. Replace local score trust with an authoritative service before calling any board ranked/global.

### New source-of-truth documents

- `docs/GAME_LORE_BIBLE.md`
- `docs/ENDGAME_SYSTEM_BIBLE.md`
- `docs/COOP_SYSTEM_PLAN.md`
- `docs/MOBILE_RELEASE_PLAN.md`
- `docs/ART_ASSET_PIPELINE.md`


This is the durable operating contract for BONKED.IO. It incorporates the two
user-supplied takeover prompts:

1. `BONKED.IO - Autonomous Productization + Gauntlet Mode`
2. `BONKED.IO - Legacy Prototype Takeover / Systemic Rebuild Mode`

The original intent is preserved here as a project-specific execution guide.
When this file conflicts with a direct user instruction, the direct user
instruction wins.

## Product mandate

BONKED.IO is an original, web-first survival action roguelite. It may learn
from the readability, pacing, and crowd-control principles of adjacent games,
including MEGABONK, but must never copy their names, characters, assets, UI,
worlds, text, audio, or encounter content.

The target is not a nicer prototype. The target is a coherent, performant,
commercially credible indie game moving toward a verified 7.5/10 quality bar.
Use the existing project as evidence of intent, not proof of quality.

Core player fantasy: enter a dangerous arena, read the crowd, create space with
absurdly satisfying impacts, collect power, shape a build, and break through an
escalating threat.

Core loop: fight -> collect -> choose upgrades -> create builds -> survive
escalation -> defeat a milestone -> unlock/replay.

## Current project state

### Implemented and verified

- The project is a static Three.js browser game. It has no package/build/test
  manifest; run it from a local static HTTP server, not `file://`.
- A blocking Classic-map startup path was repaired. In Chrome smoke testing,
  menu -> lobby -> Classic reached a live canvas in about 3.4 seconds with no
  console warning/error entries.
- Classic now starts from a playable base world. The old expensive decoration
  chain is intentionally withheld until it can be restored through a
  frame-budgeted loader.
- HUD hierarchy was reduced so health, timer, kill count, radar, and XP are
  dominant. Combat feedback now aggregates rapid ordinary hit numbers while
  crit/boss feedback remains immediate.
- Baseline, product identity, art direction, runtime QA, and performance-budget
  documents exist under `docs/`.

### Not yet verified

- Player-controlled combat, dense combat, level-up, bosses, death/restart,
  map transitions, long-run performance, audio, persistence, and leaderboard
  fallback have not passed the full runtime gauntlet.
- The current Classic visual result is still sparse and prototype-grade. Do not
  inflate quality scores because startup is fixed.
- The PHP/JSON leaderboard is client-trusting and unsuitable for an
  authoritative global ranking.

## Current score discipline

Do not publish an overall score until runtime-required categories have direct
evidence. Use `docs/audit/BASELINE_SCORECARD.md` as the source of record.

Current honest checkpoint:

| Area | Status | Working assessment |
| --- | --- | --- |
| Reliable Classic entry | Passed locally | 6/10 for this slice; only Classic is tested |
| Visual/world quality | Warn | Approx. 3/10 from the captured live scene; sparse, unfinished world |
| HUD readability | Improved, not dense-combat tested | Approx. 4/10 provisional |
| Combat feedback | Implemented, not player-tested | Unscored |
| Progression/builds | Source-only | 4/10 baseline |
| Technical architecture | Source-only | 3/10 baseline |
| Commercial readiness | Source-only | 2/10 baseline |
| Overall product score | Not publishable yet | Never claim 7.5/10 without the gauntlet |

Score each category from 0 to 10 with an evidence label:

- `verified-runtime`: directly observed in the actual game.
- `source-only`: code/content signal, not playability proof.
- `provisional-visual`: judged from captured screenshots; recheck after major art
  or UI changes.
- `unscored`: no adequate evidence.

Score improvement only after before/after comparison. A score can decrease if a
change regresses the player experience.

## Productization directive

Treat the job as game direction, technical direction, product ownership, art
direction, UX, performance work, and QA - not merely refactoring.

Improve the things a player sees, feels, understands, or can measure:

- startup and loading smoothness
- movement, camera, targeting, attacks, abilities, hits, pickups, and audio
- enemy silhouette, behavior, spacing, spawning, elites, and bosses
- map identity, landmarking, navigation, controlled generation, hazards, and
  encounter pacing
- upgrade decisions, build synergies, difficulty scaling, rewards, and replay
  reasons
- menu, onboarding, HUD, settings, pause, results, responsiveness, and
  accessibility
- stability, performance, persistence, deployment readiness, security, and
  future account architecture

Do not add content merely to increase feature count. Prefer ten memorable,
readable systems over one hundred generic items.

## Legacy rebuild authority

Preserve strong systems. Patch isolated defects. Partially rebuild systems that
repeatedly block quality, performance, or iteration. Replace a system only when
runtime evidence shows that its structure is fundamentally weak.

Do not rewrite everything at once. Do not preserve a weak system simply because
it exists. Do not use architecture cleanup as a substitute for player-visible
improvement.

For each major system answer:

1. Does it work correctly?
2. Is it understandable?
3. Is it satisfying?
4. Is it strategically interesting?
5. Does it scale through a run?
6. Is it performant?
7. Does it support replayability and BONKED.IO's identity?

Any core system scoring below 6/10 remains an active improvement candidate.
Critical gameplay systems must reach 7/10+ before product-ready claims.

## Art, asset, and originality rules

The visual direction is defined in `docs/design/ART_BIBLE.md`. Maintain a
coherent chunky-impact fantasy: strong silhouettes, readable enemies, clear
rarity, meaningful VFX, and a protected playfield.

Asset priority:

1. Original or generated work consistent with the art bible.
2. Project assets that can be improved or reused.
3. Properly licensed/CC0 external assets with provenance.
4. Temporary placeholder only when necessary.

Track externally sourced assets in `docs/assets/ASSET_REGISTRY.md`. Never copy
commercial game content. Use generated imagery for exploration or assets only
when it can be converted into a usable, coherent game asset.

## Required gameplay standards

### World and map generation

Maps need controlled procedural generation, not random prototype geometry.
Favor reusable chunks, biome profiles, seeded variation, landmarks, safe and
danger zones, encounter zones, traversal rules, boss spaces, and performance
budgets. Each map must differ in more than colour: layout, hazards, enemies,
lighting, materials, encounters, pacing, or mechanics should make it instantly
recognizable.

The immediate map task is a frame-budgeted Classic finishing loader. It must
prioritize spawn and combat landmarks, yield during active combat, and never
reintroduce the startup lock.

### Movement, camera, and combat

Movement must be responsive and intentional: acceleration, deceleration,
collision, directional changes, knockback, dash if present, and input latency
are gameplay features. Camera distance, smoothing, FOV, tracking, obstructions,
shake, and boss framing must prioritize combat readability.

Combat is not complete because it functions. Attacks, targeting, hitboxes,
damage, crits, AoE, status, knockback, hit pause, VFX, sound, and death feedback
must be responsive, punchy, readable, and scalable. Avoid screen shake and
damage-number spam at high enemy density.

### Enemies, spawning, and difficulty

Enemies must differ in behavior, not only HP: swarm, tank, ranged, charger,
disruptor, elite, support, assassin, miniboss, and boss are valid patterns when
they improve decisions. Crowd behavior must avoid a single overlapping blob.

Spawn logic must use distance, visibility, pacing, composition, biome, run
time, player power, and performance limits. Do not pop enemies beside the player
or inside geometry.

Difficulty should be directed rather than crudely linear. It can account for
elapsed time, level, build strength, kill rate, player health, map, and selected
challenge without obvious rubber-banding.

### Progression and builds

Upgrades must make meaningful, legible changes. Remove or improve tiny,
duplicate, invisible, confusing, or trap choices. Build tags such as melee,
projectile, summon, crit, movement, elemental, status, AoE, defense, and economy
should create understandable interactions. The player should sometimes think:
"this build is ridiculous."

### Bosses and transitions

Bosses need a readable silhouette, arena, telegraphs, phases or variation,
rewards, sound/VFX treatment, and memorable stakes - not only more HP. Map
completion and transitions must preserve intended upgrades and state while
avoiding freezes, abrupt teleports, duplicate enemies, and broken UI.

## Multi-agent director workflow

Use a small specialized team only when independent work materially improves the
result. The director owns priorities, architecture, hard debugging, product
decisions, integration, visual acceptance, and final scores.

Preferred roles:

| Role | Owns | Must not do |
| --- | --- | --- |
| Director | priority, scope, design calls, integration, score, keep/revert | delegate conflicting edits blindly |
| Implementation worker | one bounded code slice, targeted validation | redefine game identity or edit unrelated systems |
| Visual/research worker | screenshots, art/UI evaluation, reference principles | copy reference-game content |
| QA worker | reproducible runtime paths, logs, measurements, regression evidence | claim gameplay success without observing it |

Rules:

- Parallelize research, visual QA, and isolated code work; never parallelize
  overlapping edits to the same subsystem.
- Give workers a concrete scope, files/systems, acceptance criteria, and whether
  they are read-only or may edit.
- Integrate one slice at a time; inspect the actual diff and run relevant tests.
- Use strong reasoning for architecture, gameplay judgment, visual judgment,
  prioritization, and review. Use workers for bounded implementation or evidence
  gathering.
- More agents do not equal more quality. Avoid duplicate repository scans and
  context inflation.

## Gauntlet loop

After the baseline, work continuously in controlled cycles:

1. **Observe**: run the actual game and collect the relevant screen/log/metric.
2. **Score**: update only evidence-supported scorecard fields.
3. **Identify**: name the highest-impact player problem.
4. **Prioritize**: use Player Impact x Quality Gain x Confidence / Cost as a
   directional guide, not fake precision.
5. **Delegate**: assign independent bounded work when beneficial.
6. **Implement**: patch the narrowest responsible system.
7. **Tier 0 validation**: syntax, lint/type/build, targeted tests, diff checks.
8. **Tier 1 validation**: launch, console, menu, start, basic movement/combat,
   restart, and performance sanity.
9. **Tier 2 validation**: screenshots and visual comparison after major visual
   milestones only.
10. **Compare**: did the player-visible result actually improve?
11. **Keep or revert**: reject visual, UX, stability, or performance regressions.
12. **Update state**: record proof, score movement, next task, and open risks.
13. **Continue**: move to the next highest-value weakness.

Do not stop after documentation. Each meaningful iteration should produce an
improvement the player can see, feel, understand, or measure.

## Anti-stall and regression policy

- At most three meaningful attempts on a non-blocking issue. Then document the
  blocker, preserve stable work, create a backlog item, and move to the next
  high-value slice.
- A project-wide blocker may receive continued attention, but keep the stable
  path usable while investigating.
- Before major changes, preserve a checkpoint. After changes, retest loading,
  menu, gameplay, progression, and persistence when affected.
- Fix newly introduced regressions before stacking unrelated changes on top.
- Never inflate scores, invent benchmarks, or call a source inspection a
  playtest.

## Runtime evidence requirements

The game is not understood from menus or source alone. Validate the complete
representative run as far as the current implementation supports:

Menu -> loading -> playing -> level-up -> playing -> pause -> playing -> boss
-> map complete -> transition -> next map -> playing -> dead -> results ->
restart/menu.

Use debug tooling when it lowers repeated QA cost: force XP/level-up, spawn a
boss, select a map, accelerate time, grant a build, teleport, or temporary god
mode. Debug tools must be clearly dev-only and must not replace normal-flow
testing.

At major visual milestones capture: loading, main menu, lobby/character choice,
early gameplay, dense gameplay, upgrade, settings/pause, boss, transition, and
death/results. Compare against earlier captures and reject regressions.

Long-run performance testing must include at least 1, 5, and 10+ minute states
when tooling permits, plus high enemies/projectiles/effects/pickups. Watch for
memory growth, leaked entities, garbage collection, and runaway arrays.

## QA and documentation locations

- `docs/audit/BASELINE_AUDIT.md`: evidence, risks, runtime findings.
- `docs/audit/BASELINE_SCORECARD.md`: scores and confidence labels.
- `docs/audit/RUNTIME_QA_PROTOCOL.md`: repeatable runtime acceptance steps.
- `docs/design/ART_BIBLE.md`: visual language and originality boundaries.
- `docs/technical/PERFORMANCE_BUDGET.md`: measured performance targets.
- `docs/roadmap/QUALITY_PROGRAM.md`: milestones and exit rules.
- `GAME_BIBLE.md`: BONKED.IO identity and core loop.

## Next active milestones

1. Restore Classic decoration through a frame-budgeted loader and give the spawn
   area a clear landmark, route, and safe recovery space.
2. Run player-controlled early and dense-combat tests; validate damage feedback,
   HUD hierarchy, movement, camera, and performance.
3. Test level-up choices across characters, then improve weak/duplicate upgrades
   and build synergies.
4. Exercise boss, death/restart, map completion, transition, persistence, and
   leaderboard fallback state transitions.
5. Replace prototype-grade backend assumptions only after the player-facing run
   loop is coherent and the deployment/auth architecture is explicitly chosen.

## Final acceptance standard

Ask: "Would this be acceptable if BONKED.IO were professionally developed
today?" Do not accept a change merely because it is better than the old code.
The player should notice a multiple-generation jump within the first few
minutes through clarity, movement, combat, world identity, progression,
performance, and polish.

## 2026-08-14 V2 corrective checkpoint

The V2 player-quality gate is active after direct feedback rated the visible
character, camera/movement, arena scale and pickup behaviour at 0.5-1/10.
Do not proceed by adding more portal, leaderboard or co-op scope until the
live M5b-0 scorecard passes. The implemented correction is camera-relative
WASD plus mouse orbit, a 10-unit XP magnet, a 72-unit first arena/long route,
and original headless-Blender Crown Runner/Rattlecap GLBs with runtime limb,
cape and hammer animation. Build/typecheck and GLB bounds passed; player-facing
quality, combat exchange and crystal collection still require fresh live
evidence and independent SOL scoring. Source of truth:
`v2/docs/M5_PLAYTEST_SCORECARD.md` and `v2/docs/ASSET_PRODUCTION_BACKLOG.md`.
