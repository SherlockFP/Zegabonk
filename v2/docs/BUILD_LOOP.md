# ZEGABONK V2 Build Loop

## Objective

Build an original, bright low-poly survival action game that reaches a verified
7.5/10 product bar without inheriting the legacy monolith.

## Loop contract

Each loop owns one player-visible outcome and one failable gate:

1. Freeze scope and define the screenshot or gameplay proof.
2. Implement the smallest complete vertical path.
3. Run typecheck and production build.
4. Exercise the path in the browser and capture evidence.
5. Score only the categories touched by the loop.
6. Fix once. If the same gate fails twice, redesign the seam instead of adding patches.
7. Stop when the gate passes; do not polish unrelated surfaces.

At most two full replans are allowed per milestone. A third replan pauses the
milestone for a product decision. This prevents infinite agent loops.

## Weighted product score

| Category | Weight |
| --- | ---: |
| Combat feel and fun | 25 |
| Art direction and visual quality | 20 |
| Gameplay depth and replay | 20 |
| UI, UX and accessibility | 15 |
| Performance and stability | 15 |
| Product coherence | 5 |

Scores are evidence-based. New code, generated images and written plans do not
raise a score until they improve a running build.

## Milestone 1: V2 Shell Gate

Status: **PASS - 2026-08-14**

Observable result:

- professional main menu with strong key art and clear hierarchy;
- run lobby with one honest playable route and one hero slot;
- categorized settings that persist locally;
- Play transitions to a real Three.js scene with fixed-step simulation;
- asset manifest and renderer boundaries exist before production models arrive.

Pass commands:

```powershell
npm run typecheck
npm run build
```

Browser gate: no new warning/error, settings survive reload, main -> lobby ->
run works, and a desktop screenshot is materially stronger than the legacy menu.

## Explicit non-goals for Milestone 1

- co-op networking;
- mobile controls;
- Crown Rift migration;
- final hero/enemy models;
- full combat and level-up systems.

Those open only after the shell gate passes.

## Milestone 2: BONK Combat Gate

Observable result: Crown Runner can move, aim and land a readable hammer hit on
one production enemy archetype; hits produce recoil, audio/VFX feedback, damage,
death and XP; one level-up choice materially changes the next 60 seconds.

Gate: a five-minute browser run has no uncaught error, no stuck input, no
unbounded object creation, and the combat loop is judged at least 6/10 in a
captured before/after playtest. Proxy capsules do not pass this gate.

## Milestone 3: First Level Art Gate

Observable result: Yesil Yukuslar is one authored map kit that changes across
three portal stages through lighting, landmarks, hazards, spawn composition and
route pressure. Stage three ends in Grom's final arena.

Gate: three stage screenshots are immediately distinguishable but visually
coherent; navigation has no dead spawn or unreadable hazard; all production
GLBs pass `ART_ASSET_CONTRACT.md` and asset provenance is recorded.

## Milestone 4: Swarm and Performance Gate

Replace proxy object-per-enemy rendering with stable entity ids, render
archetypes, instancing, pools, a spatial hash, fixed-rate AI and explicit
profiling counters. Optimize from measurements, not from architecture labels.

Gate at desktop DPR 1 after 10 seconds warmup and 60 seconds capture with 200
active enemies: mean frame <= 16.7 ms, p95 <= 25 ms, p99 <= 33 ms, draw calls
<= 450, no geometry/material allocation per spawn, and memory reaches a plateau.

## Milestone 5: Complete Solo Run Gate

Ship upgrade drafting, build synergies, elites, portal objectives, Grom,
death/results, persistent unlocks and score event recording. Then migrate the
already-prototyped Crown Rift contract into the V2 state model.

Gate: three consecutive fresh expeditions and three consecutive rifts complete
without state leakage or resource growth; score is reproducible from events;
local boards are clearly marked unranked.

## Milestone 6: Co-op Foundation Gate

Open only after Milestone 5. Introduce `playersById`, input intents and an
authoritative fixed-tick room server before matchmaking UI. Ranked co-op never
trusts a client-computed score.

Gate: 1/2/4-player scaling, revive, disconnect/reconnect and roster-locked rift
tests pass; solo and each party-size leaderboard are separate. Mobile remains a
later milestone until the user explicitly reopens it.
