# M5 Playtest Scorecard

This is a player-facing quality gate, not a source-code checklist. A slice only
advances after a fresh browser session and an independent visual review.

## Scoring scale

Score each dimension 0 to 10. The gate fails below 7 in any blocking dimension
or below 7.5 overall. "Runs" or "builds" is never a score substitute.

| Dimension | Blocking check |
| --- | --- |
| Character readability | Hero is recognisable from the default camera, has a clear hammer silhouette, and does not look like a primitive proxy. |
| Movement and camera | WASD is camera-relative; mouse rotates the follow camera; movement, facing and walk animation agree. |
| Combat feel | A normal BONK has anticipation, arc, impact flash, hit stop, recoil and readable enemy wind-up. |
| Pickups | XP crystals pull from the clearly visible magnet radius and collect without pixel-perfect contact. |
| Arena scale | Player sees a route, distant landmark and side dressing; portal is a destination, not a prop at their feet. |
| UI hierarchy | Gameplay centre remains clear; only one dominant action and no development-status copy are visible. |
| Performance | Normal run is stable; the existing 200-enemy stress gate remains below the established draw/triangle budget. |
| Stability | Fresh run, level choice, portal, defeat and retry have no console errors. |

## Current corrective slice

Implemented but not yet awarded a player score:

- Camera-relative WASD and pointer-lock mouse orbit.
- Arena radius 72, 152-unit route, repositioned portals and landmarks.
- XP magnet range 10, stronger pull, 1.1-unit collection radius.
- Crown Runner and Rattlecap are original headless-Blender GLBs with named
  limb pivots; runtime animates walk, cape and hammer swing.
- King Grom now has a separate original GLB, attack pivot and floating crown
  pivot. The guardian remains a single detailed actor, never a crowd path.

## Required evidence before this gate passes

1. Fresh browser screenshot/video of idle, moving, BONK hit, pickup and portal.
2. Browser console free of errors or warnings relevant to the run.
3. One independent SOL visual score against this scorecard.
4. Re-run the 200-enemy stress test after the actor integration.
