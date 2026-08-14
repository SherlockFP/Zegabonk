# ZEGABONK 2.0 Performance Budget

Status: baseline plus acceptance contract, 2026-08-13.

## Measurement context

Verified surface: hidden/headless Chromium, Windows 11, Ryzen 7 6800H integrated Radeon, 1600×900 viewport, static server at `http://127.0.0.1:4173/`.

A stable 10-second gameplay requestAnimationFrame sample at run time 63.55 seconds produced:

- 1,324 frames;
- mean 7.555 ms, p95 10.1 ms, p99 13.3 ms, max 26.7 ms;
- approximately 132.36 uncapped headless rAF/s and 75.2 FPS 1%-low equivalent;
- 394 render calls, 22,493 triangles, 749 geometries, 132 textures, 11 programs;
- level 3, 55 kills, four live enemies, one projectile.

This is a light-load headless baseline, not dense-swarm proof and not monitor-visible FPS.

A reverted discovery experiment enabling dormant Classic decoration reached 481 calls, 37,177 triangles, 569 geometries, 72 textures and 56 programs with 56–81 ms long tasks. A noisier capture contained multi-second scheduling stalls and is excluded. Current `app.js` keeps that legacy decoration path disabled after chunked tree batches.

## Target budgets

Targets require equivalent hardware, viewport, map, seed/rules and warm-up.

| Scenario | Mean | p95 | p99 | Long frame | Draw calls | Visible tris |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Menu/lobby | <= 8 ms | <= 12 ms | <= 16.7 ms | < 33 ms | <= 180 | <= 150k |
| Normal gameplay | <= 12 ms | <= 16.7 ms | <= 22 ms | < 40 ms | <= 350 | <= 500k |
| Dense combat | <= 16.7 ms | <= 25 ms | <= 33 ms | < 50 ms | <= 450 | <= 900k |
| Swarm stress | <= 25 ms | <= 33 ms | <= 50 ms | < 80 ms | <= 550 | <= 1.5m |

Budgets are acceptance starting points. Visual degradation must preserve silhouette, telegraph and input response before surface detail.

## Memory and lifecycle gates

Record `renderer.info.memory.geometries`, `.textures`, program count, JS heap when available, active entity/projectile/VFX counts and detached DOM listeners.

- After warm-up, run one-minute, five-minute and ten-minute steady-load captures.
- After repeated restart/map cycles, geometry/texture/program counts return to a stable plateau.
- No per-shot geometry/material allocation where sharing or pooling preserves behavior.
- No resource is disposed while still shared; no removed unique resource remains undisposed.
- Zero unbounded active projectile, pickup, VFX, listener or scene-node growth.

## Asset and swarm gates

Apply `docs/ART_DIRECTION_BIBLE.md` budgets before integration. Runtime representation:

- LOD0: 8–16 close actors, full animation, selected casters;
- LOD1: reduced 2–5k-triangle gameplay mesh, 10–30 Hz AI/animation;
- LOD2: 300–1,000 triangles, archetype×cell `InstancedMesh`, 2–5 Hz AI;
- LOD3: two-triangle impostor, 0.5–1 Hz aggregate simulation, no shadow.

Use projected screen height plus 10–15% hysteresis. Pool fixed-capacity slots. Partition instance buckets by world cell for useful culling. Use one shadow-casting directional light; never point-light shadows per enemy.

## Profiling protocol

1. Fresh page and clean console/network state.
2. Fixed viewport, DPR, character, map, rules, seed when supported.
3. Warm up gameplay before sampling.
4. Capture 30 seconds normal and 60 seconds stress.
5. Record rAF percentiles, Chrome Main thread tasks/GC, `renderer.info`, entity counts and screenshots.
6. Separate CPU, GPU/draw, loading and allocation symptoms.
7. Apply one bounded change.
8. Repeat equivalent capture and record visual/regression verdict.

If multi-pass rendering is added, use `renderer.info.autoReset=false` and reset only after all passes so counters remain meaningful.

## Source-only hotspot backlog

These are code-derived hypotheses requiring profiler confirmation:

- `app.js:11721-11726`: enemy shots create unique sphere geometry/material; share or pool after reproducing allocation churn.
- `app.js:14059-14068`: `updateMapAnimations` traverses the world graph per active frame; register animated nodes instead.
- `app.js:2178-2266`: GLB map traversal, all-mesh shadows and broad collider extraction can scale with mesh count.
- `app.js:5886-5894`: creature clone and bounds fitting can spike respawn; cache bounds/fit metadata before considering pooling.
- `app.js:13739-13783`: streamed decoration performs per-frame visibility work; profile world-size scaling.
- `app.js:3352`, `app.js:3787`, `app.js:3906-3908`: many point lights increase light/shadow cost; cap and pool.
- `app.js:7972`: temple encounter can request 500 spiders plus 180 purple enemies; it is a mandatory swarm benchmark.
- `app.js:7107-7228`: standard, special and boss spawn caps need a combined population budget.
- Lifecycle review must cover death/restart/map cleanup for HP bars, projectiles, cloned materials and listeners.

Do not optimize a backlog item without a trace or counter that shows it matters.

## A/B acceptance

Every performance change records:

- same scenario and run metadata;
- before/after frame percentiles and render/memory counters;
- screenshot pair at equivalent composition;
- observed gameplay/visual regressions;
- keep/revert decision.

A change fails even when faster if it destroys telegraph readability, silhouette, animation intent or collision consistency.