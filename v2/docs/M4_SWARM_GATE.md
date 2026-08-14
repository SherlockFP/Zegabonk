# M4 Swarm Gate

## Goal

Prove that the desktop V2 runtime can simulate and render 200 active standard
enemies without creating a Three.js object per enemy or letting diagnostic work
hide a frame-time failure. This is a performance vertical slice, not a promise
that a normal story wave will immediately spawn 200 enemies.

## Cycle

1. Baseline the current normal and stress paths with an explicit development
   stress URL. Record enemy count, FPS, frame time, draw calls and triangles.
2. Replace per-spawn allocation with a fixed enemy pool. Keep simulation state
   data-only and renderer ownership separate.
3. Use the existing `InstancedMesh` archetype for swarm rendering. Loaded GLB
   actors are detail-only and must turn off above the close-combat visual cap.
4. Run enemy steering/attack decisions at a fixed lower rate; render remains
   frame-rate driven. Do not add mesh raycasts or per-enemy materials.
5. Expose a development-only overlay and `window.__zegabonkPerf` snapshot so
   a browser capture can prove the actual workload.
6. Run the 200-active stress flow for 30 seconds, then run a normal first-minute
   regression. Typecheck and production build must also pass.
7. SOL independently reviews the runtime capture and marks PASS only if the
   swarm remains readable, input remains responsive, no console error occurs,
   entities remain at 200 and no per-enemy renderer actors reappear.

## Pass bar

- 200 active Rattlecaps visible in the Vite development stress run for 30s.
- `renderer.info.render.calls <= 350`, visible actor triangles `<= 300,000`.
- Rolling frame data is exposed and does not show a sustained crash or runaway
  entity count. The exact FPS/frame-time result is recorded; no target is
  invented after the fact.
- Normal menu -> lobby -> run -> first BONK -> XP flow still works.
- `npm run typecheck` and `npm run build` pass.
- Fresh SOL reviewer accepts the evidence. A successful source refactor alone
  never passes M4.

## Non-goals

- Mobile tuning, physics middleware, network replication, final enemy behavior,
  dense projectile builds and production LOD generation are later gates.

## Implementation evidence

2026-08-14 initial implementation replaced the stress-path churn with an enemy
pool and 5m spatial hash, runs enemy decision/movement at a fixed 20 Hz, and
renders up to 200 enemies through the existing shared instanced archetype. GLB
enemy actors now stay limited to a 24-enemy detail path and are hidden when the
swarm path is active. `?stress=200` only enables in Vite development and
supplies a compact overlay plus `window.__zegabonkPerf`.

Live in-app browser capture at 40 seconds of the final spatial-hash stress run
reported 200 active enemies, 246 FPS, 4.1 ms average frame time, 83 draw calls
and 66,294 triangles. The stress console had no warning/error entries. A normal
run afterwards reached 2 kills, 250 score and 12/40 XP with no warning/error.
`npm run typecheck` and `npm run build` pass. This is builder evidence only; M4
remains REVIEW until a fresh SOL reviewer validates the live workload and
quality bar.

## Final SOL review

SOL/ultra independently passed M4 at **8.5/10 weighted** on 2026-08-14.
At 1280x720, 200 active enemies remained present from 00:01 through 00:31+;
post-soak samples were 88-98 FPS, 10.2-11.7 ms, 83-85 draw calls and
66,294-85,494 triangles. Both stress and normal console logs were empty. The
normal regression reached five kills, 625 score, 30/40 XP and Stage 2 after
manual BONKs. The next quality task is not another performance architecture
rewrite: direct-to-player steering compresses the distant swarm into an
overlapping ring after roughly 37 seconds. Add cheap separation/ring-slot
steering as encounter polish while preserving this measured budget.
