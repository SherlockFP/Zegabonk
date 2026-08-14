# Crownfall Asset Production Backlog

The game ships authored, original assets. Concepts are visual direction, not
runtime screenshots or copied UI. External downloads may only enter the project
with a recorded source and a license suitable for commercial redistribution.

## Current usable sources

| Family | Direction source | First runtime asset | Status |
| --- | --- | --- | --- |
| Hero | `assets/concepts/characters/hero-crownrunner-turnaround-v1.png` | `public/assets/models/crown_runner_v1.glb` | integrated, needs visual gate |
| Basic enemy | `assets/concepts/characters/enemy-rattlecap-runner-turnaround-v1.png` | `public/assets/models/rattlecap_runner_v1.glb` | integrated for detailed actor pool |
| Boss | `assets/concepts/characters/boss-king-grom-turnaround-v1.png` | `public/assets/models/king_grom_v1.glb` | integrated, needs live boss gate |
| World | `assets/concepts/environment/*runtime-kit*.png` | tower, arch, spire GLBs | integrated landmarks |
| Skills/items | `assets/concepts/vfx/skills-items-runtime-sheet-v1.png` | hammer arc, XP crystal, flask, coin, telegraph | next production slice |
| UI | `assets/concepts/ui/zegabonk-ui-concept-hero-select-v2.png` and `zegabonk-ui-concept-settings-terminal-v2.png` | DOM/CSS surfaces | M5a redesign input |

## Asset contract

1. GLB is the runtime format; authoring scripts or `.blend` files are retained.
2. Shared materials only; named root/pivot nodes; metres, Y-up, gameplay pivot
   at ground contact.
3. Hero and boss use an explicit low/medium LOD plan before crowd use. Repeated
   enemies keep InstancedMesh as their crowd representation and use detailed
   GLB actors only near the player.
4. Every imported external file records URL, author, license, import date,
   optimization output and final runtime owner before use.
5. New assets require a live scene check plus the M5 scorecard; a GLB export is
   not acceptance.

## Production order

1. Correct the Crown Runner/Rattlecap axis export, then finish the upright
   visual gate and add walk/idle/attack polish.
2. Finish Rattlecap wind-up, hurt and death read; keep instanced crowd fallback.
3. Validate Grom's spawn, telegraph and defeat in the full expedition route.
4. Convert the skills/items concept sheet into shared geometry, material and
   pooled effects.
5. Build zone 1's cliff, bridge, crystal and tower kit; then place it with LOD.
6. Apply the hero-select and settings concepts as responsive production DOM.

## Validation record

`crown_runner_v1.glb` and `rattlecap_runner_v1.glb` are authored by
`v2/tools/create_crownfall_actors.py`. A first export exposed an axis error in
live Chrome; it was repaired at the authoring root, then reviewed as upright
and grounded in a fresh independent SOL browser pass. The next acceptance is
the complete playtest scorecard, not the export itself.

`king_grom_v1.glb` is authored by `v2/tools/create_crownfall_grom.py` and is
registered in the runtime manifest. Its 1,488-triangle body is loaded only for
the guardian encounter; the 200-enemy crowd remains instanced.
