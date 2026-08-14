# ZEGABONK 2.0 Codex Handoff

Date: 2026-08-13
Status: discovery and baseline complete; next milestone intentionally not started.

## Exact current project state

- Static browser game: Three.js r0.159 loaded from CDN through `index.html`.
- No `package.json`, build pipeline or project-local automated test suite.
- Runtime is concentrated in `app.js` (15,955 lines); `styles.css` has 675 lines and `index.html` has 435 lines.
- The project directory is not its own Git repository. The detected Git root is `C:/Users/Sher`; `zegabonk/` appears as untracked `?? ./` from inside the project. No commit or staging was performed.
- No production source or asset replacement remains from this discovery pass. A temporary Classic decoration-loader experiment was reverted after it increased work without meeting the visual target.
- Canonical discovery documents now exist:
  - `docs/ZEGABONK_GAME_BIBLE.md`
  - `docs/ART_DIRECTION_BIBLE.md`
  - `docs/UI_UX_BIBLE.md`
  - `docs/PROGRESSION_BIBLE.md`
  - `docs/PERFORMANCE_BUDGET.md`
  - `docs/BASELINE_AUDIT.md`
- Older `GAME_BIBLE.md`, `docs/design/ART_BIBLE.md`, `docs/audit/*` and `docs/technical/PERFORMANCE_BUDGET.md` remain as historical inputs. Do not silently treat them as the new canonical contract when they conflict with the files above.

## What was tested

Environment: Windows 11, Ryzen 7 6800H integrated Radeon, hidden/headless Chromium, 1600×900 viewport, `http://127.0.0.1:4173/`.

Directly exercised route:

`boot -> main menu -> lobby -> Scout + Classic -> Start -> WASD movement -> combat/auto attack -> XP -> repeated level-up -> Digit1 upgrade -> pause/resume -> forced live-HP death/results -> restart`

Observed representative run state at 82 seconds: level 5, 79 kills, 63/120 HP, five live enemies.

### Runtime screenshots

- `docs/baseline/screenshots/01-main-menu.webp`
- `docs/baseline/screenshots/02-lobby.webp`
- `docs/baseline/screenshots/03-gameplay-82s.webp`
- `docs/baseline/screenshots/04-level-up.webp`
- `docs/baseline/screenshots/05-pause.webp`
- `docs/baseline/screenshots/06-death-results.webp`
- `docs/baseline/screenshots/07-restart.webp`

## What works

- Browser boot, loading overlay completion and main menu.
- Lobby character/map selection and Start.
- Scout on Classic map.
- WASD movement, camera response, combat, damage, kills and XP.
- Level-up modal and keyboard upgrade selection.
- Pause/resume simulation state.
- Death/results state and restart by direct DOM button click.
- Current static route produced no console/page/request errors before score submission.

## What does not work or remains unverified

### Confirmed issue

The tested Python static server returns `501 Unsupported method ('POST')` for `user_bilgisi/api.php` on death. The PHP score/persistence path cannot work under that server. A PHP-capable server was not available in the session.

### Not reached normally

- boss encounter and boss kill;
- map objective/completion;
- portal and next-map transition;
- temple stress encounter;
- persistence and real leaderboard read/write;
- challenge validation;
- controller/touch flow;
- portrait/narrow-landscape UI;
- audio quality;
- one-, five- and ten-minute resource stability.

These are unverified, not failed.

### Automation caveat

One ARIA-helper click on Restart timed out. A direct DOM click succeeded and restarted correctly. Investigate accessibility/focus targeting before calling it a player-facing restart defect.

## Performance measurements

Stable 10-second light-gameplay rAF sample at run time 63.55 seconds:

- 1,324 frames;
- mean 7.555 ms;
- p95 10.1 ms;
- p99 13.3 ms;
- max 26.7 ms;
- approximately 132.36 uncapped headless rAF/s;
- approximately 75.2 FPS 1%-low equivalent;
- 394 render calls;
- 22,493 triangles;
- 749 geometries;
- 132 textures;
- 11 programs;
- level 3, 55 kills, four enemies, one projectile.

Do not report the uncapped headless rAF rate as monitor-visible FPS. This was a light-load sample, not a dense-swarm benchmark.

A temporary reverted decoration experiment reached 481 calls, 37,177 triangles, 569 geometries, 72 textures and 56 programs and produced 56–81 ms long tasks. A noisier run with multi-second scheduling stalls was excluded. The experiment did not provide sufficient visual improvement.

Full budgets and profiler protocol: `docs/PERFORMANCE_BUDGET.md`.

## Project launch, build and test commands

### Verified static launch

```powershell
C:\Users\Sher\AppData\Roaming\uv\python\cpython-3.11-windows-x86_64-none\python.exe -u -m http.server 4173 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:4173/
```

This serves gameplay but cannot execute PHP.

### Build/tests

- Build: none.
- Automated tests: none.
- Current acceptance method: launch real page, interact with the actual route, capture screenshots/state, inspect console/network and record performance counters.
- PHP verification prerequisite: install/use a PHP-capable local server, then repeat score save/list/read paths. Do not claim backend success from the Python server.

## Repowise

- Installed CLI: `repowise 0.42.0`.
- Project index/config: `.repowise/` and `.repowise/mcp.json`.
- VS Code MCP: `.vscode/mcp.json`; extension recommendation also generated.
- Global managed skill created: `repowise-always`. Every future code-repository session should query the Repowise index first; if missing/stale, build a local keyless index.
- Keyless refresh command:

```powershell
repowise init --no-prose -y .
```

- MCP launch contract from `.repowise/mcp.json`: `repowise mcp C:/Users/Sher/Desktop/zegabonk --transport stdio`.
- Do not enable cloud/model prose generation unless explicitly requested. The current index is local/index-only.

## Architecture notes

- Entry points: `index.html` and `app.js`.
- Runtime combines renderer, world builders, state, input, player/enemy simulation, VFX, audio, UI, persistence and leaderboard calls in one global script.
- Main state path includes menu/lobby/running/level-up/pause/death/restart but is not centralized as one formal state machine.
- Model integration tables are around `app.js:1833-1849`; player GLB loading exists around `app.js:4126` but is disabled/unused.
- Procedural actor families are concentrated under `buildPlayer`, `createEnemy`, boss factories and projectile/VFX factories.
- Source audit found 31 normal enemy families, multiple boss families, seven companion families and large prop/VFX/pickup surfaces.
- Collision is primarily XZ circles/radii (`app.js:563`, `617`, `8400`, `11513`); imported render bounds must not silently become gameplay colliders.
- Several animations depend on child indices (`app.js:4189`, `4231`, `11793`, `13875`), which is fragile for model replacement.
- Classic uses a chunked initial world path. Large legacy decoration functions remain; enabling them wholesale is not an acceptable visual solution.
- Temple population at `app.js:7972` requests 500 spiders plus 180 purple enemies and should become a mandatory swarm benchmark.
- PHP score submission is client-connected but not a trustworthy competitive backend until server validation and versioned rules exist.

## Important research conclusions

### Game and UX

- Use survivor-game references for cadence, readable choices, build snowball and transparent score context, not for copied layout/content.
- Character selection must explain starting weapon, passive, strength, weakness and initial plan.
- Map, difficulty/tier and challenge must be visibly separate concepts.
- Results need score components, rules version, run metadata and comparable filters.
- Meta progression should unlock options/mastery, not paid power, energy gating, streak loss or FOMO.
- BONK Constellation must be an original information architecture with search, build preview, comparison and respec; never clone Path of Exile topology or visual language.

### Art/assets

- Binding direction: stylized high quality through silhouette, animation, coherent materials, lighting, palette and VFX timing.
- Pixelation applies to the world render, not HUD text. Outline only gameplay-relevant opaque meshes.
- Swarm assets require LOD0 showcase, LOD1 gameplay, LOD2 instanced swarm and LOD3 impostor representations.
- Research found coherent CC0 candidates from Quaternius and Kenney. They are candidates only, not integrated assets.
- Poly Haven was rejected as the core asset source because its realism/detail generally conflicts with the target and adds optimization work. Sketchfab requires per-model licence verification.
- All downloaded discovery-only model files were removed. Do not assume `assets/models/quaternius/` contains approved production assets.

### Performance

- First scalable swarm step: central LOD classification, fixed-capacity pools and archetype×cell instancing for rigid/cheap LOD2 representations.
- Do not add hundreds of independent `LOD` objects, `AnimationMixer`s, dynamic lights or shadow casters.
- Source-only hotspots requiring profiler proof include per-shot geometry/material allocation (`app.js:11721-11726`), full scene traversal (`app.js:14059-14068`), GLB all-mesh shadow/collider work (`app.js:2178-2266`) and repeated clone/bounds fitting (`app.js:5886-5894`).

## Work completed

- Real browser boot and representative reachable route.
- Seven representative screenshots.
- Light-load performance baseline and renderer counters.
- Megabonk, survivor-loop, passive-tree UX, swarm-rendering and licensed-asset research.
- Procedural placeholder/model/collision inventory.
- Canonical Game, Art, UI/UX, Progression, Performance and Baseline Audit documents.
- Repowise installation, local keyless index, MCP configuration and global future-session rule.
- Discovery-only asset downloads removed.
- Temporary Classic decoration experiment reverted.

## Work explicitly not completed

- No production model integration.
- No Blender cleanup/export or asset manifest.
- No major UI redesign.
- No runtime architecture refactor.
- No performance optimization patch.
- No collision rewrite.
- No complete boss/portal/next-map runtime gate.
- No PHP/backend repair or security hardening.
- No dense-swarm or long-run memory benchmark.
- No project-local Git repository or commit.

## Known risks

1. Monolithic global runtime makes state/lifecycle changes high-risk.
2. No deterministic seed or test hook for the full run route.
3. PHP persistence deployment and trust boundary are unresolved.
4. Child-index animation contracts will break with model hierarchy changes.
5. Render scale and radial collider scale can diverge.
6. Geometry/material/texture cleanup may leak across shots, deaths or restarts.
7. Large encounter populations are unmeasured.
8. Legacy world decoration can add CPU/render cost without authored composition.
9. External CDN imports reduce offline/reproducible startup reliability.
10. The project is untracked inside a broad user-profile Git repository.

## Top 10 next actions, ranked

1. Build a deterministic Classic full-run QA gate: spawn -> boss/objective -> portal -> next map -> results/restart, with explicit state inspection.
2. Reproduce and fix only blockers found by that route; add minimal QA hooks rather than broad architecture changes.
3. Run one-, five- and ten-minute lifecycle captures across restart/map transitions; fix confirmed GPU/JS leaks.
4. Establish the Classic spawn landmark/path/recovery-space slice with measured collision and frame budgets.
5. Create the first production asset manifest and Blender import/export validation on one player plus one enemy archetype.
6. Implement collider metadata and visual/collider debug overlay before replacing more models.
7. Add LOD0–LOD3 for one enemy family and A/B benchmark it under controlled population.
8. Implement fixed-capacity pooling and archetype×cell LOD2 instancing only if traces confirm entity/render pressure.
9. Redesign lobby/HUD/level-up/results as one consistent responsive UI batch and run desktop/narrow acceptance.
10. Choose a PHP/backend deployment, define authoritative versioned score rules and test leaderboard security before exposing global competition.

## Recommended first implementation milestone

**Deterministic Classic Full-Run Gate + Authored Spawn Slice**

Acceptance:

1. A reproducible run can traverse spawn, normal combat, level-up, boss/objective, portal and next-map transition.
2. Every transition exposes inspectable state and produces no blocking console/network error.
3. The spawn area has one clear landmark, route, recovery zone and safe/unsafe contrast using existing assets only.
4. Collision debug view proves the route and landmark match gameplay bounds.
5. Before/after captures include frame percentiles, render/memory counters and equivalent screenshots.
6. Python-server PHP failure is isolated from gameplay; backend work is not disguised as complete.
7. No mass asset replacement, framework migration or monolith rewrite occurs in this milestone.

Stop after this handoff. The next harness should begin from action 1, not from a new broad redesign.