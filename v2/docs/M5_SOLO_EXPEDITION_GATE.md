# M5 Solo Expedition Gate

## Outcome

Ship one complete desktop solo expedition: an account profile selects a run,
the player clears three distinct stages through explicit portals, defeats Grom,
receives durable rewards, and returns to a professional menu that reflects real
local progress. Crown Rift remains locked until that story result exists.

## Sub-gates

| Gate | Player-visible result | Proof required |
| --- | --- | --- |
| M5a | Main menu is a living command screen: animated interactions, real profile/daily stats, persistent settings and legacy score playback | Main -> lobby -> game browser run; reload retains settings/profile; no console errors |
| M5b | One run owns three portal stages and a readable boss finish; transitions preserve the current build and never reuse a hidden kill threshold as the route | Normal browser path through all portals and Grom, screenshots, state assertions |
| M5c | Results award the profile once, unlock the Crown Rift, and show a truthful local record. Global board data stays unavailable until server verification exists. | Win, reload, replay, defeat/retry regression and duplicate-award checks |
| M5d | Crown Rift contract is seeded, bounded and repeatable without resource growth across three transitions | Same-seed contract checks, three runtime transitions, diagnostics and SOL review |

## Non-negotiable state boundary

- `ProfileStore`: local account progression only: level, daily counters, shards,
  unlocks and personal records. It survives refresh.
- `RunState`: character, upgrades, XP, current score and timer. It survives a
  story portal, but resets only when a new expedition begins.
- `StageState`: `story-stage`, `portal`, `boss`, `result` and later `rift`.
  It is the only owner of route transitions.
- A future global board receives server-verified event logs, never a client
  supplied score total. UI must not impersonate a worldwide ranking beforehand.

## Current M5a implementation evidence

- `ProfileStore` persists local profile XP, level, record, daily kills, daily
  guardian clears, survival time and Crown Shards.
- `AudioDirector` switches between the legacy project menu playlist and game
  track on real user-driven menu/run transitions, honoring master and music
  volume.
- The main menu now uses project key art `menu-keyart-v4.png`, animated action
  controls and a command deck sourced from the profile, not fabricated online
  names or scores.

## Immediate next slice

Replace the current kill-count visual-stage thresholds with an explicit route
state machine and portal interactions. Keep M3 art landmarks as the visual
language, but let stage progression be owned by route completion rather than
renderer timing.

### Route implementation checkpoint

- A stage now exposes its clear target in the HUD, opens a physical stage
  portal, and requires `E` inside a visible interaction range to advance.
- Portal 1 advances to Stage 2, Portal 2 advances to Stage 3, and Portal 3
  starts Catlak Kral Grom. Existing level upgrades and combat build values stay
  intact through the transition; transient enemies/orbs are cleared.
- Current browser evidence covers normal combat to a live portal objective and
  the out-of-range `E` feedback. Full three-portal and boss acceptance remains
  open until a controlled movement smoke flow reaches each portal.

### M5c persistence checkpoint

- `SimulationSnapshot` now carries one run id per reset. `ProfileStore` stores
  the last 32 awarded ids and refuses a duplicate result, so the visible result
  modal cannot award the same local expedition twice.
- Profile schema v2 migrates schema v1 without discarding earned XP, records
  `storyCompleted` on Grom victory, and reflects that unlock honestly in the
  command screen. The Crown Rift surface remains non-playable until M5d; no
  global or ranked claim is shown.
- Still required: a fresh browser Grom win, reload evidence for the profile,
  and a repeat call/runtime regression showing the duplicate guard in action.

### M5c live evidence - 2026-08-14

The DEV-only Grom preview was used to prove the result seam without bypassing
combat. With the guardian inside normal hammer range, automatic combat reached
the real victory modal at 2,500 score / 1 kill / level 1. Returning to the main
menu and reloading preserved level 2, 42/780 account XP, 3 Crown Shards, one
guardian clear, one victory, one expedition, and the local 2,500 record; the
Crown Rift card changed from locked to unlocked. Browser console error/warning
output was empty. This validates result-to-profile persistence, but does not
replace the full physical three-portal expedition smoke test.
