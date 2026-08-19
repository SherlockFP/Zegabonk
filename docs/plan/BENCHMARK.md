# BENCHMARK - ZONK pass/fail card

Train the game against `node tools/qa/perf-probe.mjs` (server on :5173). `--fast` is for iteration; full run before calling it done.

Target GPU: desktop play view 1280x720. Probe itself may run SwiftShader; treat FPS as a floor, draw calls as the hard contract.

## Gates

| Scene | Draw calls max | FPS min | Notes |
|---|---|---|---|
| menu | (info only) | - | Diorama on |
| ingame-empty | 320 | 55 | Landmark mill/tower present |
| ingame-50 | 520 | 55 | |
| ingame-150-power | **700** | **55** (target 60) | Skills on, 150 alive |

Plus:

- `state.landmarkCount >= 4` after classic boot (4 mills at villages + 2 towers, island may be less).
- `typeof pulseBossTelegraph === "function"` (boss windup flashes the voxel model, not only the ground ring).
- Restart x5: geometries must not climb every run (see probe `leak`).

Exit code 1 if any numeric gate fails.

## How to raise the score

Most effective first (already wired):

1. Far enemy `__lod` (1 mesh) instead of per-part groups.
2. No name sprites / outlines on normal trash.
3. No PointLight forests (city lamps, village, shrine, torch).
4. Grass instance count 2200, not 5000.
5. Pixel ratio cap 1.25, shadow 1024.

Do not add bloom to chase an "AA look". Readable silhouette + 60 fps is the look.

## Record

Paste the probe stdout table into `docs/plan/STATUS.md` session log when a run finishes.
