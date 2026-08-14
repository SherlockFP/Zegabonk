# ZEGABONK 2.0 Baseline Audit

Date: 2026-08-13. Evidence status: source inspection plus hidden-Chromium runtime at 1600×900.

## What was tested

Verified path:

`boot -> main menu -> lobby -> Scout + Classic -> Start -> WASD movement -> combat/auto attack -> repeated level-up -> Digit1 choice -> pause/resume -> death/results -> restart`

Representative screenshots:

- `docs/baseline/screenshots/01-main-menu.webp`
- `docs/baseline/screenshots/02-lobby.webp`
- `docs/baseline/screenshots/03-gameplay-82s.webp`
- `docs/baseline/screenshots/04-level-up.webp`
- `docs/baseline/screenshots/05-pause.webp`
- `docs/baseline/screenshots/06-death-results.webp`
- `docs/baseline/screenshots/07-restart.webp`

At 82 seconds: level 5, 79 kills, 63/120 HP, five live enemies. Boss, portal, map completion, next map, persistence and normal leaderboard flow were not reached.

## Works

- Static Three.js boot and menu rendering.
- Lobby character/map selection and start.
- Running simulation, movement, camera response and combat.
- XP/level-up modal and keyboard selection.
- Pause/resume state.
- Death/results and DOM-click restart.
- Current static route had no console/page/request errors before score submission.

## Does not work in tested server mode

`user_bilgisi/api.php` receives `501 Unsupported method ('POST')` from Python's static HTTP server when death submits a score. PHP-backed persistence/leaderboard requires a PHP-capable server and remains unverified. This is a deployment mismatch, separate from client gameplay.

One accessibility-helper click on Restart timed out; direct DOM button click succeeded. Treat this as an automation/accessibility selector risk, not proof that restart is broken.

## Performance baseline

Ten-second light gameplay sample: mean 7.555 ms, p95 10.1 ms, p99 13.3 ms, max 26.7 ms; 394 calls, 22,493 triangles, 749 geometries, 132 textures, 11 programs. See `docs/PERFORMANCE_BUDGET.md`. Dense-swarm and long-run stability are not verified.

## Evidence-backed scorecard

Scale: 0–10. `N/A` means not tested. Confidence describes evidence quality, not product quality.

| Category | Score | Confidence | Evidence |
| --- | ---: | --- | --- |
| Launch reliability | 8 | High | Boot/menu/lobby/start repeated successfully. |
| Reachable run loop | 7 | High | Combat, level-up, pause, death and restart observed. |
| Movement | 6 | Medium | WASD and camera response observed; controller/touch untested. |
| Combat feedback | 5 | Medium | Damage/kills/VFX function; dense readability not measured. |
| Upgrade interaction | 6 | High | Repeated modal choice and Digit1 selection work. |
| Build depth | 4 | Medium | Large source-defined skill surface; coherent long-run synergy not tested. |
| Enemy variety | 6 | Medium | Source contains 31 normal families and multiple bosses; runtime sample small. |
| Character variety | 3 | Medium | Lobby choices exist; distinct full-run identities not verified. |
| Map quality | 3 | High | Classic is playable but visually sparse/prototype-grade in captured route. |
| Visual cohesion | 3 | High | Procedural families and UI are functional but inconsistent/prototype-grade. |
| Asset quality | 2 | High | Most player/enemy/environment forms are procedural placeholders. |
| Animation | 2 | Medium | Transform/child-index animation dominates; production rigs absent. |
| HUD readability | 5 | Medium | Core state readable at desktop; dense and responsive states untested. |
| Menu/flow UX | 5 | High | Full tested route works; hierarchy and styling need redesign. |
| Audio | N/A | Low | Not evaluated in hidden-browser evidence. |
| Performance light load | 7 | High | Stable rAF sample, but geometry count is high. |
| Dense performance | N/A | Low | No valid dense benchmark. |
| Resource stability | N/A | Low | One/five/ten-minute lifecycle gate not run. |
| Persistence/backend | 2 | High | Static-server POST fails; PHP path and security require separate audit. |
| Competitive readiness | 1 | High | No verified authoritative score pipeline/rules-version contract. |
| Accessibility/responsive | N/A | Low | Portrait, narrow landscape, zoom, controller and screen reader not run. |
| Commercial readiness | 2 | High | Playable prototype, not coherent production presentation or verified full run. |

## Asset replacement audit

### Keep

- Current gameplay mechanics and semantic archetype distinctions.
- Procedural forms as collision/debug fallback until replacements pass parity.
- Existing original audio provisionally, pending listening/licence audit.
- Existing simple pickup/VFX shapes when they remain clearer and cheaper than models.

### Improve

- HUD hierarchy and responsive behavior.
- Terrain/path/landmark composition.
- Telegraph timing, palette discipline, world-space readability.
- Colliders and asset metadata.
- Loader, culling, resource disposal and LOD behavior.

### Replace in measured batches

- Player models and animation.
- 31 enemy families and boss families by gameplay priority.
- Environment props, vegetation, buildings and authored landmarks.
- Inconsistent icon/selection presentation.

### Delete after replacement parity

- Obsolete procedural visual branches, dead loaders and index-based animation assumptions.
- Duplicate materials/geometries and invisible decorative weight.
- Never delete collision/debug fallback before behavior and performance regression tests pass.

## Structural risks

- `app.js` is a roughly 15.9k-line monolithic runtime.
- Render, gameplay, UI, persistence and content lifecycle share global mutable state.
- Animation depends on child indices (`app.js:4189`, `4231`, `11793`, `13875`).
- Collisions are mostly XZ circles/radii (`app.js:563`, `617`, `8400`, `11513`), while imported mesh scale can diverge.
- GLB metadata lacks binding tris/material/texture/bones/LOD/collider contracts (`app.js:1833-1849`).
- Temple population (`app.js:7972`) and mixed caps need an explicit swarm budget.
- Long-run GPU/resource cleanup findings require reproduction before fixes.

## Security boundary

The PHP score path must be treated as untrusted input. Client-provided score, name, character, map or run metadata cannot authorize a global leaderboard. Validate schema, size, rate, authentication/identity and score rules server-side; store rules/game version and eligibility. Security is unverified in this baseline.

## Highest-impact next milestone

Complete one deterministic Classic run gate from spawn through boss/objective, portal and next-map transition while capturing frame-time, collision and lifecycle evidence. Then redesign the Classic spawn area as a bounded authored landmark/path/recovery slice using the Art Bible budgets. Do not begin mass asset replacement before those gates are repeatable.