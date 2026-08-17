# Token budget

Cursor 2026 loading model: skill **name+description** is always cheap; **SKILL.md body** loads on match; **references/** load only when you Read them.

## Do

- Prefer `@file` on 1–2 files over `@codebase` dumps.
- Use `.cursorignore` so GLB/binaries never enter context.
- Keep `AGENTS.md` under ~80 lines. Put procedures in skills, not always-on rules.
- Always-apply rules: under 40 lines, constraints only.
- After a working slice: new chat. Old chat is the most expensive token leak.
- Mechanical edits (rename, ignore, deps): cheaper/faster model. Architecture/game-feel: stronger model.

## Do not

- Open 10 skill reference files "just in case".
- Re-read `node_modules/three` sources unless debugging a specific API.
- Paste migration guides or full Three.js examples into the prompt.
- Keep Max/huge context on for routine feature work.

## User rule (paste once in Customize → Rules)

```
Three.js games: follow threejs-game-director. Vanilla Three + Vite + TS + GLB + Rapier. WebGLRenderer default. DOM HUD. Sim state outside meshes. Never read glb/blend/dist/node_modules. One feature per chat. Smallest playable change.
```
