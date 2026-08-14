# ZEGABONK 2.0 Game Bible

Status: discovery contract, 2026-08-13. Targets below are not implemented unless marked **verified-runtime**.

## Product identity

ZEGABONK is an original third-person 3D survivor roguelite about converting movement, positioning and build choices into increasingly absurd but readable impact. The player should understand the immediate threat, feel each power change and finish a run with a build identity that can be described in one sentence.

The product may learn genre principles from other games. It must not copy their characters, names, iconography, maps, UI composition, progression graph, jokes, audiovisual assets or distinctive presentation.

## Player promise

1. Start a run in seconds.
2. Move and fight with immediate feedback.
3. Receive a meaningful choice before repetition sets in.
4. Turn choices into visible mechanical synergies.
5. Face escalating pressure, events and authored landmarks.
6. Defeat or survive an objective, receive a legible reward and continue to a harder map.
7. Finish with a transparent score and a reason to try another character, route or challenge.

## Core loops

### Run loop

`select character + map + challenge -> enter readable spawn -> kill -> collect -> choose upgrade -> form synergy -> event/chest/shrine -> boss or survival objective -> reward -> next map -> result`

Cadence targets are **design hypotheses**, not measured current behavior:

- first useful input: under 2 seconds after the map becomes visible;
- first build choice: 30–75 seconds;
- early choices: every 45–90 seconds, adjusted by XP curve;
- visible mechanical change at least every two choices;
- a run contains short tension/release cycles, not continuous modal interruption;
- standard competitive rules never hide score multipliers or invalidation conditions.

### Meta loop

`finish run -> review score/build -> earn unlock/mastery currency -> unlock options rather than mandatory power -> plan character/constellation route -> start another comparable run`

Meta progression should expand play styles, mastery goals and planning. It must not become paid power, energy gating, streak loss or FOMO.

## Character contract

Every character needs:

- a unique silhouette readable at gameplay distance;
- starting weapon and signature passive;
- clear strength, weakness and two or more viable build directions;
- unlock condition and mastery track;
- a concise selection-card explanation of the starting game plan;
- a performance-valid LOD0–LOD3 asset set.

Archetype space includes impact/melee, projectile, summon, crit, speed, tank, elemental, DoT, fortune/economy and AoE. These are design spaces, not fixed copied characters.

## Build contract

Pure percentage upgrades support a build but must not dominate choice screens. Upgrade chains should mix:

- numerical foundation;
- delivery change: pierce, return, orbit, split, chain or delayed detonation;
- trigger change: every N hits, kill, crit, movement threshold or status;
- conversion: defense to damage, pickup to area, speed to impact;
- trade-off: stronger effect with a readable cost;
- capstone: a major rule change that creates a named build identity.

A good choice answers: what changes now, what tags it advances and what it can combine with later.

## Map contract

Each biome needs an authored identity beyond color:

- a spawn landmark and visible route;
- safe recovery and dangerous pressure spaces;
- traversal opportunity and combat arena;
- event/chest/shrine positions with occupancy checks;
- boss or milestone space;
- readable bounds and elevation;
- gameplay modifier tied to the biome;
- procedural variation constrained by authored grammar.

Random distribution without route, landmark or encounter intent is not acceptable.

## Competition contract

Menu and results should eventually expose personal, character, map, weekly and global comparisons. Competitive runs require:

- immutable `scoreRulesVersion`;
- game version, content version, seed, map, character and challenge IDs;
- duration, maps completed, kills by tier, bosses, combo, damage and optional objectives;
- upgrade/build snapshot and run-end reason;
- clear standard/challenge/modded eligibility;
- server-authoritative validation before a global leaderboard is called finished.

Patch-incompatible boards must be archived or filtered, not silently mixed.

## Current verified runtime

At 1600×900 in hidden Chromium, the following path was directly observed:

`boot -> menu -> lobby -> Scout + Classic -> running -> WASD movement -> combat -> XP -> repeated level-up -> keyboard upgrade selection -> pause/resume -> death/results -> restart`

At 82 seconds the observed run was level 5 with 79 kills. Boss, portal, map completion, next-map transition, persistence and PHP-backed leaderboard were not reached normally. They remain unverified, not failed.

## Quality gates

A gameplay-affecting milestone is complete only after:

1. baseline capture;
2. bounded change;
3. actual launch and interaction;
4. equivalent after-capture;
5. console/network and state checks;
6. performance comparison;
7. explicit keep/revert verdict.

One initial implementation and one focused repair are allowed before root-cause reassessment.

## Dependency order

1. Reliable launch and deterministic QA hooks.
2. Performance/resource-lifecycle baseline.
3. Complete playable run transition coverage.
4. Movement/combat readability.
5. Intentional Classic spawn/map grammar.
6. Upgrade/build differentiation.
7. Character and enemy asset batches.
8. BONK Constellation.
9. Competitive backend and verification.
10. Broad content expansion.

The next harness must choose one measured player problem, not begin a simultaneous rewrite.