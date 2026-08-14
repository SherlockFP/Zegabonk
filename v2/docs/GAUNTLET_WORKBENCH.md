# ZEGABONK V2 Gauntlet Workbench

## North star

Build a bright, original low-poly action roguelite that is fun in its first
minute, readable in a crowd and technically able to grow into competitive
solo/co-op play. Inspiration may inform pacing and readability only; names,
characters, world, UI and assets remain original ZEGABONK work.

## Quality bars

| Surface | Bar | Evidence required |
| --- | --- | --- |
| First minute | Move, BONK, kill, collect XP, choose a build change and meet a guardian without instruction overload | Recorded browser flow and screenshots |
| Combat | Every hammer strike has clear windup, contact, knockback, damage, VFX and readable target response | Running scene inspection, not source review |
| Art | Bright stylized fantasy, clean role silhouettes, cyan hero/rift, amber danger/reward, violet corruption | Side-by-side screenshot review against project concept sheets |
| UI | One primary action per screen; HUD protects the playfield; settings persist | Browser flow, keyboard and reload checks |
| Performance | No per-spawn geometry/material allocation; measured swarm gate before scaling beyond 200 enemies | Diagnostics capture at the stated stress target |

## Operating loop

1. Lead selects the smallest player-visible gap with a hard pass/fail gate.
2. Builder implements only that vertical result.
3. The real build is typechecked, bundled and run in a browser.
4. A fresh critic inspects pixels and behavior, not the builder's summary.
5. The largest proven gap is fixed or the seam is redesigned after two failed
   passes. Scores move only from verified runtime evidence.
6. Stop the loop once its gate passes and write the exact next gate here.

No arbitrary loop count is used. A milestone stops when its result passes, its
improvements become too small to matter, or a product decision is genuinely
needed. Mobile and networked co-op remain closed until their dependency gates.

## Active goal

Complete ZEGABONK V2 through the gate order recorded below: M4 swarm proof,
M5 solo expedition and persistent progression, then M6 authoritative co-op.
Each gate follows the same Gauntlet Loop: observe, score from evidence, repair
the highest-impact root cause, verify, obtain independent SOL review, and only
then promote the next gate. The detailed M4 contract is `M4_SWARM_GATE.md`.

## Live board

| Gate | Status | Proof / next action |
| --- | --- | --- |
| M1 - shell | PASS | Menu, lobby, persistent settings and run shell passed browser regression on 2026-08-14. |
| M2 - BONK combat | REDESIGN | Two independent SOL reviews failed this gate (5.4, then 5.8/10). Replace the split fallback/GLB presentation seam before another review. |
| M2R - first contact presentation | PASS | SOL/ultra independent review: 8.4/10 weighted. Attached red wind-up, manual BONK, cyan/orange contact flare, hit-stop, recoil and XP/score passed in Chrome. |
| M3 - first map art kit | PASS | SOL/ultra independent M3P review: 8.5/10 weighted. Floor-aligned portal-axis landmarks, distinct stage palettes and clear playfield passed. |
| M4 - swarm | PASS | SOL/ultra independent review: 8.5/10 weighted. 200 active for 30s+, 83-85 calls, <=85,494 triangles, normal regression clean. |
| M5 - full solo expedition | ACTIVE | `M5_SOLO_EXPEDITION_GATE.md`: M5a command menu/profile/audio is implemented. M5b is paused at the M5b-0 player-quality gate: control, pickup, arena and actor review must pass before portal/endgame expansion. |
| M6 - co-op | BLOCKED BY M5 | Authoritative room simulation, then party systems and separate boards. |
| Mobile | DEFERRED | Reopen only on user instruction after desktop solo is proven. |

## M2 review record

The independent SOL review on 2026-08-14 gave M2 a weighted **5.8/10** and
failed the combat bar at **4.0/10**. The first review had already failed at
5.4/10. Runtime proof did show score, XP, hit-stop and knockback, but it also
showed an unattached/faint telegraph and a static loaded GLB while only the
hidden fallback hammer was animated. The critic also found a `hp` / `maxHp`
invariant violation on Rattlecap state. Do not call M2 passed without a new
SOL review of M2R.

## Current M2R gate

Pass only when one recorded first-contact sequence reads in order: Rattlecap
danger wind-up, manual BONK hammer motion, cyan/amber contact burst, brief
hit-stop and visible recoil, then XP/score. The telegraph must stay at the
enemy feet and the visible loaded actor, not a hidden fallback, must carry the
attack motion. A fresh SOL reviewer scores combat readability at least 6/10.

## M2R review record

SOL/ultra independently passed M2R at **8.4/10 weighted** on 2026-08-14. The
reviewer verified the first Rattlecap red wind-up, manual Q connection,
cyan/orange contact flare, 34 ms hit-stop, recoil and score/XP reward path in
Chrome. The next confirmed gap is not combat timing; it is the sparse first
arena versus the stronger menu art direction.

## M3 implementation record

On 2026-08-14, the first-map vertical slice gained three authored stage groups
driven by simulation state rather than renderer-only kill checks. The normal
Chrome run reached Mosswatch Harabeleri at start, Yarik Sirti at 5 kills and
Tac Yukselisi at 11 kills after a real level-up selection; the browser console
had no warning or error entries. Each stage has a project-authored GLB landmark
served successfully from the local Vite runtime: Mosswatch tower (2,512 tris),
Rift Scar arch (1,460 tris) and Crown Ascent spire (2,232 tris). `npm run
typecheck` and `npm run build` pass. This is implementation evidence, not an
art-pass score: a fresh SOL reviewer must judge the live pixels and landmark
readability before M3 can pass.

## M3 first SOL review

SOL/ultra gave the first M3 visual gate a weighted **5.9/10** and failed it on
2026-08-14. The normal run and HUD thresholds worked, including the level-up
objective repair, console was clean, and playfield clarity scored 8/10. The
failure was visual: the common green ground, path, trees and generic beacon
overpowered the small/occluded landmarks, so stage changes read as prop swaps.
The response is one bounded visual revision: remove the generic beacon, show
the forest/shared crystals only in Mosswatch, assign stage-specific
ground/path/fog palettes, and move/scale each GLB into a clear portal-axis
silhouette. The re-gate then exposed the actual remaining root cause: all three
prototype GLBs were buried below ground by their exported local bounds. The
loader now floor-aligns them from post-scale world bounds; a final SOL re-gate
was required before M3 could be promoted.

## M3 final SOL review

SOL/ultra independently passed M3P at **8.5/10 weighted** on 2026-08-14:
map identity 8.0, landmark readability 8.3, stage differentiation 9.2,
playfield clarity 8.8 and technical presentation 8.7. Live pixel checks showed
the Mosswatch tower clear of the ground at Stage 1, the Rift Scar arch upright
and readable at Stage 2, stage HUD/objective transitions correct, and no Chrome
console warning or error. The reviewer did not re-farm Stage 3 because it was
already witnessed in the prior live gate and the pivot correction was shared by
all three assets. M4 now owns the next hard risk: prove the runtime architecture
at 200 active enemies before content scale-up.

## M4 final SOL review

SOL/ultra independently passed M4 at **8.5/10 weighted** on 2026-08-14:
performance architecture 8.8, swarm readability 5.8, runtime stability 9.4,
regression safety 9.3 and evidence quality 9.4. The only material follow-up is
the expected visual overlap of direct-to-player swarm steering after about 37
seconds. It does not reopen M4; carry the cheap neighbor-separation/ring-slot
fix into M5 encounter polish while retaining the measured pool, spatial hash,
20 Hz AI and instancing limits.

## M5 active contract

M5 is not a cosmetic menu pass. Its source of truth is
`M5_SOLO_EXPEDITION_GATE.md`: first establish honest account-facing data and a
professional command screen, then promote the current three visual map stages
into explicit portal-owned run state, boss/result persistence, and finally the
Crown Rift migration. A global leaderboard, community targets and co-op stay
absent from the player-facing claims until their data source is authoritative.

## SOL art-direction contract

`CROWNSHARD_FORGE_DESIGN_SYSTEM.md` is the current art-direction contract.
It defines the visual tokens, silhouette rules, hierarchy, ranked visual fixes
and the 20-point pixel gate. New UI/asset work must follow it; a future SOL
review scores actual pixels, not a builder summary.

## M5b-0 corrective slice

The player reported the prototype character, movement/camera, crystal pickup
and arena scale at 0.5-1/10. This is treated as a failed player-quality gate,
not a cosmetic suggestion. The correction is source-backed but **not yet
accepted**: camera-relative movement and pointer-lock orbit, 10-unit XP magnet,
72-unit arena and route, plus the first original headless-Blender Crown Runner
and Rattlecap actor pair. `M5_PLAYTEST_SCORECARD.md` defines the only path to
promote this work: fresh live evidence and a new independent SOL score.

### M5b-0 re-gate record

The first independent review failed at **4.8/10** because the Blender Z-up to
glTF Y-up actor transform placed both new actors flat on the ground. The root
export and runtime ground offsets were corrected rather than hidden with a
fallback. A limited second SOL Chrome review then passed the three repaired
claims at **7.8/10**: both actors upright/on the ground, W aligned to the
camera-forward basis, and no warning/error in a fresh menu -> lobby -> run.
This is only an interim pass. The full M5b-0 scorecard remains open until
remote magnet pickup, mouse orbit, combat readability, and the 200-enemy
regression are evidenced.

### M5b-0 second full visual review

The fresh independent SOL review scored the current live slice **7.1/10** and
failed the full M5b-0 gate. It retained credit for the menu (7.6), portal route
(7.5) and console stability (7.8), but found a stale stage-clear counter,
camera framing that kept the hero and enemy too small, an oversized BONK flare,
and XP visuals still too similar to ambient cyan crystals. The builder fixed
the counter at the simulation source, tightened the follow camera and reduced
the contact flare. Those corrections have browser proof, but require a fresh
SOL re-gate with a witnessed pickup pull and portal interaction before M5b-0
can pass.

### M4 regression after M5b asset work

The first post-asset stress run was intentionally rejected: 200 active enemies
held for 31 seconds without errors, but renderer diagnostics rose to 105 calls
and 102,718 triangles. The instanced crowd body/head meshes were simplified and
the detailed hero now uses the existing fallback only above the detailed-actor
threshold. The repeated 31-second run then measured **199 FPS, 5.0 ms, 200
enemies, 65 calls and 46,514 triangles**, with no browser warning/error. M4
therefore remains passed; normal runs keep the detailed Crown Runner GLB.

### M5c result/persistence proof

DEV Grom preview completed its live combat result, then the menu was reloaded.
The profile retained its XP, shards, daily guardian clear, local high score and
story unlock with no console warning/error. This promotes the result-to-profile
seam, but **does not promote M5**: M5b still requires a physical three-portal
normal expedition and the full visual scorecard re-gate.

## Superseded M2 gate

Pass only when a new run supports WASD movement, manual and optional automatic
BONK attacks, enemy pursuit, hit/knockback/death, XP collection, a real
three-choice level-up, guardian escalation, death/retry, and visual feedback.
The five-minute browser run must have no uncaught error or stuck input. A
separate critic must judge the captured playfield at least 6/10 for basic
combat readability; otherwise this gate remains active.
