---
name: zegabonk-memory
description: Token-cheap index for the ZEGABONK Three.js game. Use at the start of any gameplay, camera, skill, UI, or asset task in this repo. Read mem/INDEX.md and mem/HOTSPOTS.md instead of the full app.js.
---

# ZEGABONK memory

1. Read `mem/INDEX.md`.
2. If you need a function, open only that range from `mem/HOTSPOTS.md`.
3. Grep `app.js` with a tight pattern. Cap reads with offset/limit.
4. After a large structural change, run `python mem/rebuild-index.py` and update HOTSPOTS ranges if they drifted.
5. Then load `threejs-game-director` and one specialist (`threejs-runtime`, `threejs-perf`, `threejs-assets`, or `threejs-playtest`).

Do not load lore bibles, HANDOFF.md, or the full skills array unless that is the task.
