# Voxel integration handoff (P2/P3)

This session shipped the factory and creature defs. `app.js` / `index.html` were not touched (write lock). Wire-in is a small, mechanical swap.

## Files

| File | Role |
|---|---|
| `voxel.js` | Factory. Globals below. |
| `models/creatures.js` | 17 creature defs. Registers on load. |
| `models/bosses.js` | Boss defs (other session). Same factory. |
| `models/gallery.html` | Review page. `?id=goblin`, `?set=creatures`, `?set=bosses`. |

## 1. Script tags (`index.html`)

`app.js` is a plain script. THREE is already assigned on `window` in the module boot block. Load voxel files **after** `window.THREE = THREE` and **before** `app.js`:

```html
<script type="module">
  import * as THREE from 'three';
  window.THREE = THREE;
  // ...existing GLTFLoader boot...
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });
  }
  await loadScript('voxel.js');
  await loadScript('models/creatures.js');
  try { await loadScript('models/bosses.js'); } catch (e) {}
  var s = document.createElement('script');
  s.src = 'app.js?v=' + Date.now();
  document.body.appendChild(s);
</script>
```

Do not convert `voxel.js` to an ES module.

## 2. Global API

- `registerVoxelModel(id, def)`
- `buildVoxelModel(id, opts)` -> `THREE.Group`
  - `opts.outline` default true
  - `opts.fitHeight` scales the group so AABB height matches
  - `opts.scale` extra multiplier
  - `opts.center` default true (origin = feet XZ center)
- `getVoxelModelInfo(id)` -> `{ width, height, depth, radius, voxelCount, anim, parts, scale }`
- `listVoxelModels()`
- `setVoxelOutlineVisible(group, bool)`
- `getVoxelMaterials()` -> `{ opaque, emissive, outline }` (shared, never clone)
- `disposeVoxelCache(id?)` only if hot-reloading defs

Repeat `buildVoxelModel("goblin")` reuses cached BufferGeometry. New Group/Mesh wrappers only. Do not `geometry.dispose()` on kill.

Group layout:

```
Group (id)
  Group (part name)   // rotate this for anim
    Mesh  opaque toon (vertex colors)
    Mesh  emissive eyes  (if any)
    Mesh  __outline
```

Look up parts with `group.getObjectByName("legL")` or `group.userData.parts.legL`.
`group.userData.anim` is `biped | quad | fly | crawl | squash | hover | slither | orbit`.

## 3. Beast type -> model id

Same string as `normalBeastType` for the shipped set:

```
goblin wolf skeleton spider bat slime
zombie boar fox ghost scorpion snake
crow bear creeper wraith void
```

Fallbacks (no voxel yet): keep the old sphere/cylinder path.

Suggested map for later clones:

```
redBat        -> bat      (palette swap later)
polarBear     -> bear
purpleSlime   -> slime
purpleSkeleton-> skeleton
purpleShadow  -> wraith
shadow        -> wraith
horror        -> void
```

Companions `goblin_minion` / `wolf_minion` / `skeleton_minion` can reuse those three ids at a smaller `fitHeight`.

## 4. `createEnemy` swap (app.js ~5697)

Keep everything that picks `normalBeastType`, name, hp, speed, `scaleVar`.

Replace the inline mesh block (from the first `new THREE.Mesh` / `isBoss` variant through the last `g.add(...)` before the aura, currently ending near the `if (tier !== "normal")` aura at ~6903). Leave aura, `makeHpBar`, `makeNameLabel`.

```js
var modelId = (typeof getVoxelModelDef === "function" && getVoxelModelDef(normalBeastType))
  ? normalBeastType
  : null;

if (modelId) {
  var built = buildVoxelModel(modelId, { outline: true });
  var info = built.userData.voxelInfo;
  var sH = cfg.height / Math.max(info.height, 0.01);
  var sR = (cfg.radius * 2) / Math.max(info.width, 0.01);
  built.scale.setScalar(Math.min(sH, sR) * scaleVar);
  while (built.children.length) g.add(built.children[0]);
  g.userData.voxelId = modelId;
  g.userData.parts = built.userData.parts;
  g.userData.anim = built.userData.anim;
} else {
  // existing sphere/cylinder body
}
```

Cleaner: skip the transfer and use the built group as `g` from the start:

```js
var g = modelId
  ? buildVoxelModel(modelId, { outline: true })
  : new THREE.Group();
if (modelId) {
  var info = g.userData.voxelInfo;
  var sH = cfg.height / Math.max(info.height, 0.01);
  var sR = (cfg.radius * 2) / Math.max(info.width, 0.01);
  g.scale.setScalar(Math.min(sH, sR) * scaleVar);
} else {
  g.scale.setScalar(scaleVar);
  // old mesh code
}
```

Hitbox stays `radius: cfg.radius * scaleVar` and `cfg.height`. `Math.min(sH, sR)` keeps the mesh inside that capsule. Spider/snake are wide: radius fit wins, they sit a bit shorter than `cfg.height`, which is correct.

Origin is feet-center. Place with the same `mesh.position.y = groundY` as today.

Bosses: if `models/bosses.js` is loaded, ids look like `boss_arachne`. Map `bossVariant` 0..n in the `isBoss` branch. Do not block creature wire-in on bosses.

## 5. Other call sites (PLAN.md names, line numbers drift)

Grep, do not trust stale line numbers:

| Fn | Use |
|---|---|
| `createEnemy` | Main swap. |
| `spawnEnemy` | Unchanged if it only calls `createEnemy`. |
| `createFlyingEnemy` / `Inner` | `bat` / `crow` / generic `flying` (no flying voxel yet). |
| `createShadowEnemy` / `Inner` | No shadow voxel yet; optional `wraith` stand-in. |
| `updateEnemies` | Wing flap uses `wingIndices` child slots. Switch to `getObjectByName("wingL"|"wingR")`. Slime squash: scale the `body` part. |
| `killEnemy` | Remove group from scene. Do not dispose voxel geometry. |
| `createHerobrineBoss` / `createAngelBoss` / `spawnVoidBossAt` / `spawnTempleBossAt` | Boss ids when those defs exist. |

Biped idle (later): rotate `legL`/`legR` / `armL`/`armR` on X. Quad: `legFL` `legFR` `legBL` `legBR`. Wolf bite: rotate `jaw`. Scorpion telegraph: rotate `tail`. Snake: phase-offset `seg1`..`seg3`. Void: spin `shard1`..`shard4`.

## 6. Materials / perf

One `MeshToonMaterial` (3-step gradient, vertex color, no specular) + one emissive `MeshBasicMaterial` + one outline `MeshBasicMaterial` for **all** voxel actors. Do not set per-enemy material color; tint is in vertex colors.

No shadow maps on these meshes (blob shadow stays the cheap circle already in the game).

## 7. Review

`http://localhost:5173/models/gallery.html?set=creatures`

Screenshots: `tests/artifacts/creatures/`. Replay: `npx playwright test tests/creatures-gallery.spec.js`.
