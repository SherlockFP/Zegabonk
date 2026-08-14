# BONKED.IO Runtime QA Protocol

Use this protocol when a browser session at `http://127.0.0.1:4173/` is available. Its purpose is to turn the next playthrough into decision-quality evidence rather than a casual smoke test.

## Required evidence

Capture one screenshot and note browser-console errors for each state:

1. Loading screen after a cache-cleared refresh.
2. Main menu at 1600 x 900.
3. Lobby with the default character and Classic biome selected.
4. Fresh run at 30-60 seconds.
5. Dense combat after at least one upgrade.
6. Level-up card choice.
7. Paused/settings state.
8. Death/results state and a successful restart.

Record fresh-load time, time to input, average FPS/frame time where available, and any visible stutter during world build, level-up, enemy bursts or effects.

## Functional route

1. Refresh the game and wait until the menu is actionable.
2. Select **OYNA**, choose the default character and Classic map, then start.
3. Move with WASD for at least 30 seconds, then test mouse/camera relationship and primary attack behavior.
4. Let enemies engage. Verify a kill, XP pickup and level-up choice using normal input.
5. Choose an upgrade, confirm its visible/functional effect, then continue into a dense encounter.
6. Test pause and resume without losing input, HUD state or camera control.
7. Reach a milestone/boss/portal if it occurs in the available run window; otherwise record it as not reached, not failed.
8. Intentionally die, inspect the results screen, restart, and confirm a clean fresh run.

## Observations to record

| Surface | Questions |
| --- | --- |
| Controls | Does the player react immediately? Is camera aim/movement legible? |
| HUD | Can health, objective/threat, timer, XP and active build state be found in under two seconds? What obscures play? |
| Combat | Can the player identify their impact, danger telegraphs and enemy roles during a crowd? |
| Upgrade | Is each choice understandable and visibly consequential? |
| Map | Is there a landmark, escape route, encounter space and boss/milestone space? |
| Performance | Where does first noticeable stutter occur, and what entities/effects coincide with it? |
| State | Do menu, lobby, playing, level-up, pause, death and restart transitions preserve correct UI and input? |

## Pass criteria for the baseline gate

- Every reachable named state is captured or explicitly marked not reached.
- Console errors are copied verbatim with reproduction step.
- No score is upgraded based only on source inspection.
- The next implementation task names one observed player problem, its owning subsystem and an acceptance test.

## First implementation-gate test

Before changing gameplay, confirm this sentence accurately describes the intended first milestone:

> A fresh BONKED.IO run should present a clear threat/objective and readable player survivability, let the player see the primary attack's spatial impact, offer an upgrade with an immediately understandable build tag, and preserve a readable playfield in a dense encounter.

If it does, implementation can begin with the HUD/readability and impact-feedback slice described in `GAME_BIBLE.md`.
