# ZEGABONK Character Concept Pack v1

These sheets are original production references for a bright, stylized dark-fantasy cast. They are concept targets, not exact blueprints. During modeling, resolve minor view-to-view inconsistencies in favor of the front-view silhouette and the simplest riggable construction.

## Cast and combat read

| Asset | Role | Primary read | Target size |
| --- | --- | --- | --- |
| Crownrunner | Player hero | Upright navy triangle plus oversized cyan hammer | 1.80 m tall |
| Rattlecap Runner | Fast melee swarm | Leaf-hood triangle plus short cleaver | 1.25 m tall |
| Sunscar Bulwark | Tank / blocker | Wide sandstone sphere plus round shield | 2.20 m tall |
| Crownwing Skimmer | Air harasser | Wide indigo-cyan diamond | 2.00 m wingspan |
| Riftcap Hexer | Ranged caster | Tall violet mushroom triangle plus ring staff | 1.65 m tall |
| King Grom | Final boss | Massive rock column, cloud collar, floating crown | 4.20 m tall |

## Blender source contract

- Blender units: metric, 1 unit = 1 meter.
- Source orientation: Z up; character front faces Blender -Y.
- Origin: centered between ground contacts at Z = 0. Skimmer origin sits at body center.
- Apply scale and rotation before rigging. Keep the armature root at the asset origin.
- Keep weapon, shield, crown, and staff as separate named meshes parented to explicit sockets.
- Use clean mirrored blockout first, then break symmetry only with accessories and paint.
- Favor broad planar breaks and bevel-weighted edges over sculpted microdetail.

Suggested object names:

```text
CHR_<name>_ROOT
CHR_<name>_BODY
CHR_<name>_GEAR_<part>
CHR_<name>_ARMATURE
COL_<name>_<shape>
SOCKET_R_HAND
SOCKET_L_HAND
SOCKET_HEAD
```

## Geometry budgets

| Class | LOD0 triangles | LOD1 | LOD2 |
| --- | ---: | ---: | ---: |
| Hero | 10k-14k | 55% | 22% |
| Runner / Hexer | 5k-7k | 50% | 20% |
| Bulwark | 7k-9k | 50% | 20% |
| Skimmer | 3k-5k | 45% | 18% |
| Boss | 18k-24k | 55% | 24% |

LOD transitions should be decided from projected screen size, not fixed world distance. Preserve face, weapon, wing, shield, crown, and cap silhouettes at every LOD.

## Material and texture plan

- Use one shared opaque cast material where possible and one shared emissive material for eyes, crystals, and fissures.
- Keep each normal enemy at 1-2 materials. Hero and boss may use 2-3 only if the extra draw call has a visible payoff.
- Author a compact ORM texture: R = occlusion, G = roughness, B = metallic.
- Hero: one 1024 px color/normal/ORM set.
- Runner, Bulwark, Skimmer, Hexer: one 512-1024 px set each, or a shared 2048 px enemy atlas after silhouettes are approved.
- Boss: one 2048 px set. Put crack emissive in a separate single-channel texture if animation needs it.
- Use hand-painted value grouping. Avoid noisy albedo and tiny baked ornament.
- Ship textures as KTX2/BasisU after visual approval.

Palette anchors:

```text
Crystal cyan:      #37D7E8
Deep indigo:       #202D6B
Royal violet:      #5A2C85
Leaf teal:         #2F746B
Moss green:        #587D36
Sunscar ochre:     #C88B2C
Warm leather:      #6C4126
Brushed gold:      #C69B3E
Charcoal stone:    #2F3542
Amber eyes:        #FFA91F
```

## Rig and animation floor

- Hero: standard humanoid rig, about 45 deform bones, hammer socket, cape with 2-3 simple secondary bones.
- Runner: compact humanoid, about 28 deform bones, cleaver socket, hood fixed to head/chest with no cloth simulation.
- Bulwark: about 26 deform bones, shield socket, shell rigidly weighted; keep shoulder range clear of the shell.
- Skimmer: 9-12 bones total: root, body, two 3-bone wing chains, tail chain. No cloth simulation.
- Hexer: about 28 deform bones, staff socket; cap mostly rigid with 1 optional squash bone.
- King Grom: about 36 deform bones; crown is a rigid cluster following a head socket with authored hover animation. Cloud collar should use cards or a rigid clustered mesh, not volumetric simulation.

Minimum animation set:

```text
Idle, Move, Attack_A, Attack_B, Hit, Stagger, Death, Spawn
```

Add Cast_Loop and Cast_Release for Hexer, Fly and Dive for Skimmer, Block and Shield_Bash for Bulwark, and three clearly telegraphed phase attacks for King Grom.

## Collision and gameplay proxies

- Hero / Runner / Hexer: one vertical capsule plus optional melee hurt sphere.
- Bulwark: one body capsule and a separate shield box used only during active block frames.
- Skimmer: one body sphere; wings never participate in collision.
- King Grom: one large capsule, one head weak-point sphere, and named attack volumes activated by animation events.
- Do not derive gameplay collision from render meshes.

## GLB delivery checklist

1. Apply transforms and remove hidden geometry.
2. Verify one armature and stable node names.
3. Export GLB 2.0 with animations, tangents only when normal maps require them, and no embedded cameras or lights.
4. Prune and deduplicate with glTF Transform.
5. Add Meshopt compression and KTX2 textures after runtime compatibility is confirmed.
6. Validate pivots, scale, materials, animation clips, bounds, and collision proxies in the actual Three.js scene.
7. Profile repeated enemies with shared geometry/materials and InstancedMesh-compatible static variants where animation is not required.

## Production order

1. Crownrunner and Rattlecap graybox for scale and combat readability.
2. Shared palette/material shader proof.
3. Bulwark, Skimmer, and Hexer silhouettes.
4. One complete animation and GLB validation pass on Runner.
5. King Grom only after the normal-enemy pipeline is stable.

