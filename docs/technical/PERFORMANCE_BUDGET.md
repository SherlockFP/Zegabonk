# BONKED.IO Performance Budget

Status: targets only. Baseline measurements must be added after browser runtime access is restored.

## Target desktop profile

| Metric | Target | Measurement gate |
| --- | ---: | --- |
| Gameplay frame time | 16.7 ms at normal load; 25 ms maximum at dense load | Browser performance trace |
| Visible frame rate | 60 FPS normal; 40 FPS dense minimum | 60-second and stress run |
| Interactive loading | Under 8 seconds on target hardware | Timed fresh load |
| Enemy count | Per-biome cap determined by frame-time budget | Spawn stress test |
| Projectile/effect count | Hard cap plus pooling for hot paths | Stress test and memory trace |
| Long-run memory growth | Stable after warm-up | 1, 5 and 10-minute run snapshots |

## Measurement protocol

1. Record fresh load, first interactive time and console errors.
2. Capture a 60-second normal run and a dense encounter trace.
3. Record renderer statistics where available: draw calls, triangles, textures and memory.
4. Repeat at 1, 5 and 10 minutes, noting active enemies, projectiles, effects and pickups.
5. Treat any regression above 15% in frame time as a release blocker until explained.

## Current source-level risks

- Per-frame global simulation traversals in the monolithic runtime.
- Runtime mesh/material creation in projectile and effect paths.
- Map construction and loading work concentrated in the initial run transition.
- Remote CDN dependency for the renderer and model loader.

Do not claim any of these is the observed bottleneck until a browser trace confirms it.
