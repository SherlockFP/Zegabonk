# BONKED.IO Baseline Audit

Date: 2026-08-13
Status: Classic entry path repaired and smoke-verified; extended gameplay playthrough pending.

## Evidence collected

- Static Three.js game loaded from `index.html`; Three.js r0.159 and `GLTFLoader` are CDN imports.
- `app.js` is a single 15,880-line runtime containing rendering, world building, input, player and enemy simulation, UI, audio, persistence and leaderboard access.
- The user-facing path is menu -> lobby -> run -> level choices -> death/restart. The source also contains chapters, bosses, rituals, portals and an attack round.
- `node --check app.js` passed on the baseline.
- Chrome runtime evidence: the main menu and lobby loaded without console warnings/errors on a clean local static server. The original Classic start made the renderer's main thread unresponsive for more than 30 seconds. After the staged-loader repair, menu -> lobby -> Classic reached a live playable canvas in about 3.4 seconds and a runtime screenshot was captured with no warning/error logs.
- There is no project package manifest, build command, test runner or automated browser test configuration.
- The menu exposes six map choices. `maps/README.md` documents that missing map scripts use the embedded `buildWorldChunked` fallback; only `classic.js` is present.
- The global leaderboard is a PHP/JSON prototype. Client score submissions are unauthenticated, and the PHP API accepts client-supplied scores.

## Runtime evidence gap

No player-controlled run, dense-combat screenshot, frame-time measurement, or end-to-end death/restart transition has been claimed yet. The previous port-4173 server returned `ERR_EMPTY_RESPONSE`; subsequent smoke runs used clean local static servers.

The next baseline gate is therefore a real run at `http://127.0.0.1:4173/`, with screenshots and console errors recorded for menu, lobby, early combat, dense combat, level-up, pause, death and restart.

## Strengths worth preserving

- The prototype has broad gameplay intent: distinct characters, abilities, upgrades, bosses, ritual/portal interactions and multiple biome selections.
- The game already contains performance guardrails such as entity/effect/projectile caps and some frame-behind throttling.
- The lobby establishes a clear player promise: select a character, biome and challenge before the run.

## Confirmed product risks

1. **Coherence:** features are accumulated in one global runtime rather than presented as a single readable run structure.
2. **Map identity:** map selection is not backed by dedicated map modules, so biome identity and controlled generation are hard to verify and extend.
3. **Regression cost:** a monolithic runtime and absent tests make each change risky.
4. **Commercial readiness:** client-trusted scores, JSON persistence and no backend authentication are prototype-only foundations.
5. **Runtime proof:** visual quality, control feel, loading behavior and performance are still unmeasured.

## Patch vs rebuild decisions

| Area | Decision | Rationale |
| --- | --- | --- |
| Runtime baseline QA | Patch | Add repeatable test support and evidence first. |
| HUD hierarchy | Partial rebuild | Preserve useful data but reduce persistent visual noise and establish priority zones. |
| Run pacing and upgrade choices | Improve | Existing systems provide a base; evaluate choices in a real run before removing content. |
| Map generation | Partial rebuild | Introduce controlled biome profiles/chunks before expanding map count. |
| `app.js` structure | Incremental extraction | Do not rewrite during gameplay uncertainty; first create seams around state, map profiles and QA hooks. |
| Leaderboard/account system | Rebuild when product scope requires it | Current prototype is unsuitable for authoritative shared progression. |

## First verified priorities

1. Add a frame-budgeted decoration loader without reintroducing the Classic start stall.
2. Obtain dense-combat and player-control evidence, then measure frame time.
3. Make the run legible: threat, objective, health and active build state must dominate the HUD.
4. Turn one biome into a controlled arena with a recognizable landmark, encounter zones and a boss space.
5. Add a cheap deterministic QA/debug route before making long-run balancing claims.
