---
name: threejs-playtest
description: Playtests Three.js browser games via boot, input, HUD, resize, and screenshots. Use when the user asks to smoke-test, verify a scene, check HUD overlap, or find visual/input bugs.
---

# Three.js Playtest

1. `npm run dev` and open the local URL.
2. Confirm first actionable view in a few seconds (not a settings wall).
3. Exercise verbs: move, look, pause, menu, resize.
4. Screenshot play, pause, and one failure/empty state.
5. Report by severity with repro. No essay.

## Must check

- Playfield readable; HUD not covering aim/move center
- Pointer-lock / look stops when a menu opens
- Resize does not stretch or black-screen
- No leak when entering/leaving a scene twice
- `?debug=1` shows fps/calls if perf is in question

Use the browser MCP or Playwright only if already in the repo. Do not invent a QA framework for a prototype.
