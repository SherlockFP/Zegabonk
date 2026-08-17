# Runtime layout

```
src/
  main.ts                 boot only
  simulation/             state, rules, input actions, save
  render/app.ts           renderer, scene, camera, resize, context
  render/loaders.ts       GLTF / Draco / KTX2
  render/objects.ts       spawn / despawn meshes
  physics/world.ts        Rapier world + collider map
  ui/                     DOM HUD / menus
  diagnostics/perf.ts     fps, draw calls, behind ?debug=1
```

New systems get a file in `simulation/` plus a thin view in `render/`. Do not put HP, quest flags, or inventory on `mesh.userData` as the source of truth.
