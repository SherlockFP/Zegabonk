# King Grom V1 asset record

## Delivery

- Source: `v2/tools/create_crownfall_grom.py`
- Runtime model: `v2/public/assets/models/king_grom_v1.glb`
- Concept target: `assets/concepts/characters/boss-king-grom-turnaround-v1.png`
- Authoring: Blender 5.2 headless, Blender Z-up / -Y forward, exported as glTF Y-up.

The GLB is a static low-poly boss blockout intended for the first in-game
integration. It is not yet a skeleton, animation set, collision body, or LOD
chain. The root custom metadata specifies the follow-up capsule proxy:
`COL_Grom_Body capsule r=0.92 h=3.4`.

## Stable runtime nodes

- `CHR_Grom_ROOT` - gameplay root at ground plane, Y=0 after GLB export.
- `CHR_Grom_MODEL` - visual source-space lift to keep beveled boots grounded.
- `SOCKET_Grom_ATTACK` - staff/crown-breaker animation pivot.
- `SOCKET_Grom_FLOATING_CROWN` - future crown hover pivot.

The authored front is Blender `-Y`; after glTF Y-up conversion this is Three.js
`-Z` forward. Root transforms are identity and the lowest `THREE.Box3` extent
is `Y=0.000010`, a floating-point exporter residue rather than a gameplay
offset.

## Validation record

Validation command (run from `v2`):

```powershell
node --input-type=module --eval "... GLTFLoader().parse(...); new THREE.Box3().setFromObject(gltf.scene) ..."
```

Measured by `GLTFLoader` and `THREE.Box3`:

| Check | Result |
| --- | --- |
| Bounds min | `[-2.111934, 0.000010, -0.815000]` |
| Bounds max | `[2.635296, 5.380293, 0.950000]` |
| Bounds size | `[4.747230, 5.380283, 1.765000]` |
| Render meshes | 54 |
| Triangles | 1,488 |
| Materials | 5 / 6 maximum |
| Named root, attack pivot, crown pivot | present |
| GLB byte size | 158,000 bytes |

Materials are shared by name: charcoal stone, slate planes, royal cape,
broken gold, and emissive rift cyan. No textures, lights, camera, or animation
tracks are embedded.

## Rebuild

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background `
  --python 'v2\tools\create_crownfall_grom.py' -- `
  'C:\Users\Sher\Desktop\zegabonk\v2\public\assets\models\king_grom_v1.glb'
```

Before shipping beyond the current blockout, add the King Grom armature and
attack clips, export named gameplay collision proxies separately, make LOD1/2,
then validate its live combat silhouette and frame cost in the Three.js scene.
