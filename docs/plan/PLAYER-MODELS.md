# P2.5 Player voxel models

Defs live in `models/player.js`. Factory: `voxel.js` (`registerVoxelModel` / `buildVoxelModel`).
Load order: `voxel.js` then `models/player.js` (THREE already on window).
Preview: `models/preview-player.html` (`?id=scout`, `?sil=1`). Gallery was not changed (no extra-script query).
Screenshots: `tests/artifacts/player/`.

Ids match lobby `CHARACTERS` in `app.js` (`scout` ... `archer`). No prefix.
`buildVoxelModel(state.selectedCharacter)`.

Part `pivot` is world voxel coords (same as `models/creatures.js`).
Rotate the named Group for animation. Y up, +Z face, X right. Scale 0.125.

Do **not** use `fitHeight`. Hat/crest extras would shrink the body. Keep factory scale; appearance `scale` from the lobby slider multiplies the group.

## Recolor keys (lobby pickers)

Same keys on every class. Shade keys are 65% brightness + a slight purple shift of the parent.

| Lobby input | Palette keys | Default | What it paints |
|---|---|---|---|
| `appBodyColor` | `B` main, `b` shade | `#2299dd` / `#1a4a80` | cloth, fur, robe, trousers |
| `appCapeColor` | `C` main, `c` shade | `#4444aa` / `#2a2870` | cape, hood, sash, hat cloth |
| `appArmorColor` | `A` main, `a` shade | `#4488cc` / `#2a5588` | boots, plates, helmet, shield, pauldron |

Fixed (ART-DIRECTION, not pickers): `S`/`s` skin, `E` eyes, `N`/`D` black, `G`/`K` gold, `W`/`w` wood, `M` metal, `I`/`V` ice visor, `F` fire, `P` void, `R` red.

`window.PLAYER_RECOLOR` exports the picker map. `window.PLAYER_MODEL_IDS` is the 9 ids.

Swap recipe (do this inside `buildPlayer` before `buildVoxelModel`):

```
function hex6(n) {
  return "#" + ("000000" + (n >>> 0).toString(16)).slice(-6);
}
function shade65(hex) {
  var r = parseInt(hex.slice(1, 3), 16);
  var g = parseInt(hex.slice(3, 5), 16);
  var b = parseInt(hex.slice(5, 7), 16);
  r = Math.min(255, Math.round(r * 0.65 + 18));
  g = Math.round(g * 0.55);
  b = Math.min(255, Math.round(b * 0.65 + 24));
  return hex6((r << 16) | (g << 8) | b);
}
var id = state.selectedCharacter || "scout";
var def = getVoxelModelDef(id);
if (def) {
  def.palette.B = hex6(bodyColor); def.palette.b = shade65(def.palette.B);
  def.palette.C = hex6(capeColor); def.palette.c = shade65(def.palette.C);
  def.palette.A = hex6(armorColor); def.palette.a = shade65(def.palette.A);
  disposeVoxelCache(id);
}
```

Then `buildVoxelModel(id, { outline: true })`. Geometry is cached per id, so palette edits need `disposeVoxelCache` or they will not show.

`app.capeVisible === false` -> `built.userData.parts.cape.visible = false` (gorilla has no cape part).

## buildPlayer swap (app.js)

Plan cites 3943; current function is `buildPlayer` at ~4028.

Keep: appearance load, lobby `scale`, shield ring / bubble, scene add, ragdoll later.
Delete: the procedural Box/Cylinder/Sphere body (torso through visor/sword/cape).

```
var built = buildVoxelModel(id, { outline: true });
built.scale.setScalar(scale);
g.add(built);
player.mesh = g;
g.userData.parts = built.userData.parts;
g.userData.anim = built.userData.anim;
g.userData.voxelId = id;
```

Held extras (`sword`, `staff`, `bow`, `shield`) are siblings of `armL`/`armR`, not children.
Pivots for held extras sit on the matching shoulder so copying `armR.rotation` onto `sword`/`staff` keeps them locked. Or convert world pos and `armR.add(sword)`.

`updateRagdoll` (~4203) currently indexes `player.mesh.children[n]`. After the swap, look up `userData.parts.legL` etc. instead of child indices.

Bow: today `player.bowGroup` is set only for archer. After swap, `player.bowGroup = parts.bow` (or leave the old cylinders until archer anim is ported).

Script tags: same as VOXEL-INTEGRATION.md, add `await loadScript('models/player.js');` next to creatures/bosses. Do not convert to ESM.

## Catalog

| Id | Vox | H | W | Defining read | Extra parts |
|---|---|---|---|---|---|
| `scout` | 358 | 17 | 9 | visor wings + antenna | `cape` |
| `brawler` | 602 | 15 | 12 | giant pauldrons + sword | `sword` |
| `mage` | 540 | 20 | 12 | pointed hat + staff | `cape`, `staff` |
| `survivor` | 570 | 17 | 11 | hood peak + side packs | `cape` |
| `samurai` | 416 | 19 | 11 | kabuto crest + katana | `sword`, `cape` |
| `gorilla` | 1292 | 14 | 14 | barrel chest, knuckle arms | (none) |
| `monk` | 586 | 16 | 11 | oversized bald head + beads | `cape` (sash) |
| `paladin` | 699 | 18 | 11 | kite shield + helmet cross | `cape`, `shield` |
| `archer` | 395 | 16 | 10 | tall bow + quiver | `cape`, `bow` |

Shared named parts on every id: `body`, `head`, `armL`, `armR`, `legL`, `legR`.
`anim`: `biped` on all nine. Eyes: 2x2 `E` (emissive).

Body core is ~14-15 voxels. Hat/crest/antenna/bow tip add 1-5 on mage/samurai/scout/paladin.

## Load in index.html (when wiring)

After `window.THREE = THREE` and `voxel.js`, before `app.js`:

```
await loadScript('models/player.js');
```
