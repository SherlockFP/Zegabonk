# BONKED.IO Quality Program

## Goal

Raise the legacy prototype toward a verified 7.5/10 product bar without
copying another game's assets, UI, characters, or encounter design. The game
keeps its own chunky impact fantasy: enter the arena, read the crowd, create
space, collect power, and break through escalating threats.

## Current checkpoint - 2026-08-13

- Classic reaches a playable canvas in the local Chrome smoke flow.
- The observed start flow was menu -> lobby -> Classic -> live scene in about
  3.4 seconds in the automation run, with no warning or error logs.
- Combat HUD is lower contrast outside of the HP, timer, kill count, minimap,
  and XP strip. Damage feedback now combines rapid ordinary hits while keeping
  crit and boss feedback immediate.
- The expensive legacy Classic decoration chain is paused after the playable
  base world. It must return only through a frame-budgeted loader.

## Delivery order

| Milestone | Outcome | Proof required | Exit rule |
| --- | --- | --- | --- |
| P0 - Reliable entry | Every shipped map gets from lobby to input-ready play without a long main-thread stall. | Chrome smoke screenshot, console capture, start duration. | Classic <= 5 sec locally; no forced 12 sec fallback. |
| P1 - Combat clarity | Player can parse target, threat, crit, loot, HP, timer, and XP at a glance. | Dense-combat screenshot and 60 sec play smoke. | No damage-text flood; normal hits do not repeatedly shake the whole camera. |
| P2 - Arena identity | Classic has a readable spawn landmark, threat lanes, and safe recovery space. | Before/after map screenshot and first-minute route test. | The player has a visible direction within 10 sec. |
| P3 - Progression | Every level pick changes a deliberate build decision with clear copy and meaningful feedback. | Three level-up choices tested across two characters. | No duplicate, dead, or unclear choice. |
| P4 - Performance guardrails | World decoration and high-entity combat degrade gracefully. | 60 sec normal and dense captures with renderer/entity counters. | Meets the budget in `docs/technical/PERFORMANCE_BUDGET.md`, or has a documented exception. |
| P5 - Release gate | A small, repeatable acceptance pack covers start, combat, level-up, boss, death, restart, and leaderboard fallback. | Filled `docs/audit/RUNTIME_QA_PROTOCOL.md`. | No P0/P1 failure remains. |

## Operating loop

1. Choose one high-impact slice from the earliest incomplete milestone.
2. Inspect the actual runtime failure or player friction before changing code.
3. Patch the narrowest responsible system.
4. Run syntax and diff checks, then replay the affected browser flow.
5. Capture a visual/runtime result, score it as pass, warn, or fail, and only
   then move to the next slice.

## Next implementation slice

Build a budgeted Classic world-finishing loader. It should add one small,
reusable decoration group per frame budget, prioritize the spawn landmark and
combat-relevant landmarks, and stop when combat pressure rises. It must never
reintroduce the pre-start or post-start main-thread lock that P0 removed.
