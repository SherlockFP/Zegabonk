# BONKED.IO Art Bible

## Direction: Chunky Impact Myth

BONKED.IO is an original low-detail 3D combat diorama seen through a restrained pixelated world render and a dark retro-pixel HUD. The visual promise is **large readable masses, deliberate color steps and comic physical force**. It is not faux 2D pixel art: models remain volumetric, lighting describes planes and the final world buffer supplies the pixel edge.

The authored look must remain recognizable with effects disabled and at a distance. Detail never compensates for a weak silhouette.

## Originality and provenance

- Build characters and landmarks from original combinations of generic volumes, not traced screenshots, copied meshes, recognizable costumes or another game's proportions.
- Do not reproduce another game's character roster, skeleton, icon silhouettes, palette ordering, UI framing, effect timing, names or signature motifs. Genre conventions such as a health bar or a warning circle are acceptable only in BONKED.IO's shape and palette system.
- Procedural primitives and internally authored materials are the default. Any future external source must have recorded author, source URL, license and modification rights before it enters the asset pipeline.
- A palette value is not protected identity by itself; the contract is the combined hierarchy, shapes and behavior markers below. Do not market the direction as “in the style of” a living artist or named game.

## Non-negotiable visual hierarchy

Read the frame in this order:

1. active danger or attack telegraph;
2. player position and facing;
3. nearest hostile role and open escape lane;
4. pickup or objective;
5. landmark and biome;
6. decorative dressing.

If a lower item masks a higher item, reduce its saturation, contrast, outline, motion or screen coverage. Player, enemy and world may not share the same combination of hue, value and edge treatment.

## World scale and modeling grammar

One Three.js world unit equals one nominal metre. Use this common scale even for procedural meshes.

| Family | Contract |
| --- | --- |
| Player | `1.8-2.2 m` total body height, `0.65-0.9 m` footprint. One tool/glove/headpiece supplies `35-55%` of silhouette width and creates a clear left/right asymmetry. |
| Standard enemy | `1.4-2.6 m` high and `0.7-1.6 m` wide according to role. Keep one primary body mass plus one behavior marker. |
| Elite | Base family at `1.25-1.5x` height or width, plus one new crown, spine, banner or split-limb silhouette. Scale and color alone are insufficient. |
| Boss | `2.5-4x` player footprint, two or three stacked masses and one asymmetric landmark feature. The weak point must remain inside the overall silhouette, not read as unrelated loot. |
| Pickup | `0.25-0.5 m` core, hovering `0.15-0.35 m`; use a diamond, capsule or hexagonal read rather than miniature equipment detail. |
| Hard blocker | Minimum `0.6 m` visible base width. The collision footprint follows the visible trunk, rock or wall within `0.1 m`; canopy and soft foliage do not imply collision. |
| Landmark | `6-14 m` high, one dominant contour visible through normal fog from `35-50 m`; use an original broken arch, leaning monolith or stacked impact totem family. |

Favor boxes, low-sided cylinders, wedges and faceted capsules. Use `6-12` radial sides for normal props and `12-16` only on the player, boss focal pieces or large circular telegraphs. Bevels are `2-5%` of object width. Do not model a feature thinner than `0.08 m` on the player or `0.12 m` on enemies/world props unless it is a VFX plane.

Materials use broad planes: environment roughness `0.72-0.95`, actors `0.55-0.85`, and metalness `0-0.15` except an explicitly metallic tool (`0.35` maximum). Emissive surface area stays below `12%` of a regular actor and `20%` of a boss.

## Binding asset and swarm budget

The quality order is **silhouette -> animation pose -> material value grouping -> lighting -> coherent palette -> VFX timing**. More polygons, larger textures, extra material slots and extra dynamic lights do not outrank that order. Close inspection may use authored quality, but normal play is a large-swarm case and must never render a screen full of showcase meshes.

### Transform and export contract

- Author at metre scale: `1 unit = 1 m`, `+Y` up, `+Z` forward. Apply object scale and rotation before export.
- Place the ground pivot at `(0,0,0)`: the lowest load-bearing foot, wheel, trunk or wall base touches `Y=0`. Center `X/Z` on the gameplay footprint, not on a weapon tip, canopy or VFX.
- Record unanimated bounds in metres and the maximum animated bounds. Roots may translate only through an explicit root-motion clip; normal locomotion is in-place.
- Tri counts below are rendered triangles, not quads. A material slot is a draw call before instancing/batching. Decorative backfaces and hidden interior faces do not ship.
- Visual LOD may change, but gameplay origin, ground contact, collider and targeting height do not move. Difference between corresponding LOD bounds is at most `5%`.

### Geometry budgets by family

`LOD0` is close showcase only; `LOD1` is normal gameplay; `LOD2` is the swarm workhorse; `LOD3` is an ultra-cheap distant read.

| Asset family | LOD0 close | LOD1 gameplay | LOD2 swarm | LOD3 distant |
| --- | ---: | ---: | ---: | ---: |
| Player | `12k-20k tris` | `6k-10k` | `1.5k-3k` | `250-600` |
| Standard enemy | `6k-10k` | `2.5k-5k` | `500-1.2k` | `80-250` |
| Elite | `10k-16k` | `5k-8k` | `1k-2k` | `150-400` |
| Boss | `20k-35k` | `10k-18k` | `2.5k-6k` | `300-1k` |
| Pickup / small interactable | `0.8k-2k` | `300-800` | `80-250` | `12-60` |
| Hard blocker / normal prop | `2k-8k` | `0.8k-3k` | `150-800` | `24-150` |
| Primary landmark | `12k-25k` | `5k-12k` | `1k-4k` | `100-500` |

Going below a range is welcome when silhouette and deformation still pass. Going above its maximum requires a measured visual failure at the previous budget and explicit art/engineering approval; “more detail” is not evidence.

### Materials, textures and rig budgets

| Resource | Player / standard enemy | Elite / boss | World prop / landmark |
| --- | --- | --- | --- |
| Material slots | LOD0 `<=2`; LOD1 `<=2`; LOD2-3 `1` | LOD0 `<=3`; LOD1 `<=2`; LOD2-3 `1` | Prop `1`; landmark LOD0-1 `<=2`, LOD2-3 `1` |
| Texture sets | Player: one `1024²` maximum set; standard enemy: one `512²` set, preferably a family atlas | One `1024²` maximum set; boss may add one `512²` mask only with approval | Prop: shared `256²-512²` atlas; landmark: one `1024²` maximum set |
| Texture maps | Base color or palette index plus one packed mask/ORM. Normal map is optional on LOD0-1 and absent on LOD2-3 unless it visibly changes planes. | Same; emissive belongs in the packed mask, not a separate full-resolution image. | Prefer vertex colors. No unique normal/roughness texture for a small prop. |
| Bones | Player `<=48` LOD0-1, `<=24` LOD2, `<=8` LOD3; standard enemy `<=28/24/12/4` | Elite `<=40/32/16/4`; boss `<=64/48/20/8` | Static by default; animated prop `<=12/8/4/0` |
| Skin weights | `<=4` per vertex LOD0-1, `<=2` LOD2, `<=1` LOD3 | Same | Same when rigged |

LOD2 uses shared atlases and one material whenever a family appears in a swarm. LOD3 prefers vertex color or a shared `256²` atlas. No texture exceeds `1024²`; no asset ships photographic `2K/4K/8K` maps. Keep a normal biome's resident art textures at or below `96 MiB` estimated GPU memory and any one asset at or below `8 MiB`.

The gameplay lighting budget is one shadow-casting directional key, one hemisphere/ambient term and at most two unshadowed scene fills. A projectile, pickup or enemy does not receive its own dynamic light; use emissive color and timed VFX instead. Normal gameplay targets `<=350` total draw calls and `<=300k` visible actor triangles; the authored stress-swarm capture targets `<=450` draw calls and `<=400k` actor triangles. Reduce LOD/materials before reducing player or telegraph readability.

### LOD selection contract

Projected screen height is authoritative; distance is only a secondary hint.

| Level | Normal trigger | Purpose |
| --- | --- | --- |
| LOD0 | Paused/controlled showcase or projected height `>160 px` | Close silhouette, deformation and material inspection; never the default crowd level. |
| LOD1 | `48-160 px` | Normal combat around the player. All behavior markers and contact poses remain intact. |
| LOD2 | `14-48 px`, or density pressure after `40` visible hostiles | Swarm level. Preserve outer contour, tool/role marker and major color blocks; remove face and inner seams. |
| LOD3 | `<14 px` or beyond normal decision distance | Ultra-cheap distant contour. Use `0-8` bones, one material and no independent micro-animation. |

Use `15%` hysteresis at thresholds. Hide a swap during movement, impact or occlusion; do not cross-fade two full meshes for more than two frames. A transition fails if ground contact jumps more than `0.03 m`, the outer contour changes more than `8%`, the role marker disappears above `12 px` projected height, or palette identity changes. LOD3 may merge harmless swarm motion, but attacking, elite and boss units promote one level while their telegraph is active.

### Collider budget

- Player and standard enemies use one upright capsule or one capsule plus a separate simple hurt sphere/box. The collider follows the torso, never the tool, horns, cape or outline.
- Elite uses `1-2` primitives; boss uses `2-4` capsules/boxes/spheres. Pickups and projectiles use one sphere or capsule.
- A hard blocker uses `1-3` boxes/capsules/convex primitives matching the visible base within `0.1 m`. Soft foliage and canopy have no collision.
- No animated triangle-mesh collider and no per-LOD collider rebuild. Static terrain may use its authored height/ground mesh; decorative rock and architecture still use primitives or a low-face convex hull.
- Separate combat hit volumes from navigation collision. A visual LOD swap cannot change pathing, hit reach or pickup radius.

### Required asset delivery record

Every proposed or shipped asset reports the following in one manifest row or review card:

1. asset ID, family, version, author and source type (`original`, `procedural` or `external`);
2. source URL, license name/SPDX ID, license URL, download date, proof path, attribution text, permitted modification/redistribution/commercial use and source-file SHA-256;
3. dimensions in metres, `+Z` facing, ground-pivot check and static/animated bounds;
4. triangle count for LOD0/1/2/3 and projected-height switch thresholds;
5. material slots/draw calls per LOD, texture names, map type, resolution, format and estimated GPU memory;
6. skeleton/bone count, maximum weights per vertex and animation clip list;
7. collider primitive types/counts, local dimensions, collision purpose and mismatch from visible base;
8. a flat-silhouette capture, material capture and in-game LOD1/LOD2 swarm capture.

Missing license evidence or any required numeric field blocks import. “Royalty-free,” a marketplace name or a screenshot is not license proof. Internally procedural assets still record generator/author, creation date, source version and the project-owned license status.

## Palette contract

These are authoring anchors, not a mandate to use every swatch in every biome. Neighboring color variation stays within `±8%` lightness and `±10°` hue unless it is a gameplay state.

| Token | Anchor / allowed range | Use and reservation |
| --- | --- | --- |
| UI/world ink | `#060C12` to `#0D1820` | Background, outer ink and deepest shadow; never use pure black over large areas. |
| Panel | `rgba(8,13,20,0.90-0.96)` | HUD and modal field. |
| Text | `#F3F8FF` | Essential UI text and rare peak highlight. |
| Muted text | `#BDD0DF` | Secondary UI copy; must still meet UI contrast rules. |
| Terrain shadow / mid / light | `#17251F` / `#2C493B` / `#466A52` | Main natural biome value ladder. Variants may shift hue, but keep the three-step spacing. |
| Stone / clay | `#4B5962` / `#765244` | Low-saturation blockers and landmarks. |
| Player core | `#63E0FF` (`#55CBE8-#7DE8FF`) | Persistent player identifier. Hostiles and terrain may not use it except a brief player-applied status. |
| Player secondary | `#FF9C73` (`#F28B67-#FFAE83`) | Tool edge or gear on at most `20%` of visible player area; not a danger fill. |
| Standard hostile | `#C85C63` to `#E0786E` | Hostile core accent; keep the body darker than the telegraph. |
| Ranged / support / tank marker | `#A879FF` / `#7CCB6B` / `#C9A24B` | Role marker only, covering `8-20%` of the silhouette; body still reads as hostile. |
| Elite | `#E85CCB` | Elite-only accent; never routine loot or scenery. |
| Boss danger | `#FF5A36` | Boss telegraph and lethal warning; never a persistent player color. |
| Reward gold | `#FFD27A` | XP milestones, high-value loot and reward confirmation; not ordinary damage. |

Environment saturation is normally `20-45%`; actor gameplay accents are `55-85%`. Against the local ground, the player's body needs at least `24` CIELAB `L*` points of separation and a standard enemy needs `18`. If the palette cannot supply this, add a value plate/contact shadow or change the ground swatch before adding glow. Telegraphs use color plus a second channel: contour, pulse cadence, directional wedge or ground interruption.

## Silhouette briefs

Silhouettes must pass as a flat one-color render without face detail.

### Player: Impact Runner

Compact torso, planted lower body and a forward-leaning wedge. The oversized tool sits off-axis and points toward attack intent. Keep a visible gap between tool and torso in idle/anticipation. A cape may trail as one broad shape, but it may not hide the feet, facing or weapon side.

### Enemy behavior families

| Role | Primary mass | Required behavior marker | Motion read |
| --- | --- | --- | --- |
| Pursuer | Pear/drop body, narrower at the feet | Forward brow or nose wedge | Continuous lean and short corrective steps. |
| Charger | Low broad wedge, width `1.3-1.6x` height | Paired horns/shoulders forming a forward `V` | Plants, compresses, then commits on one axis. |
| Ranged | Tall narrow body, height `1.6-2.2x` width | Raised lantern/nozzle with at least `0.15 m` negative space from torso | Stops, lifts marker, then fires. |
| Tank | Square body, width `0.9-1.2x` height | Shield/slab covering `35-50%` of front contour | Slow rotation and braced contact. |
| Support | Round or diamond core | Three orbiting pieces or one split halo, each visibly detached | Hover or measured orbit; no charger lean. |
| Swarm | Flat dart or small bean | Paired fins/ears wider than core | Group flow; individual motion amplitude stays low. |

An elite keeps its base role readable and adds one feature above the shoulder line. A boss combines no more than two role grammars; it needs a stable readable base, an exposed anticipation pose and a unique top contour.

### World families

- **Traversable ground:** broad value fields with no high-contrast speckle. A safe lane is at least `2.5 m` wide and reads as an unbroken value band.
- **Hard blockers:** dark base, lighter top plane and a clean grounded footprint. Trees use one trunk mass plus two or three canopy clumps; rocks use three to five large planes.
- **Soft dressing:** grass, flowers and mushrooms stay below knee height and below actor contrast. Merge them into clumps; never outline individual blades.
- **Hazards:** interrupt the ground with an authored contour—crack wedge, stepped ring or striped patch—and retain a `0.25 m` clear border from unrelated clutter.
- **Landmarks:** one large contour and no more than two secondary cutouts. They may share biome colors but are `10-18` lightness points away from the distant fog.

## Outline contract

Outline means a subtle outer silhouette, not comic-book inking on every edge. Measure thickness in the internal world buffer, before nearest-neighbor upscale.

| Mesh class | Outline rule |
| --- | --- |
| Player opaque body and equipped tool | Required, `1.25-1.75 px`, ink `#061018` at `80-90%` opacity. Include the outer cape contour; exclude internal cape seams. |
| Standard enemy opaque body and behavior marker | Required while projected height is at least `8 px`, `0.75-1.25 px`, ink at `70-85%`. Do not draw inner material boundaries. |
| Elite and boss | Required, `1.25-2 px`; the role marker remains inside the same outer hierarchy. |
| Active pickup, interactable or damaging hazard | `0.75-1 px` only when its projected core is at least `6 px`; a ground telegraph may use a dark keyline instead. |
| Hard blocker | Optional `0.5-0.9 px` on the outer top silhouette only when it overlaps an actor or defines a lane. Never outline every rock/tree in a field. |
| Terrain, water, sky, fog, contact shadows, particles, grass, decorative debris, transparent VFX and invisible colliders | No outline. |

Outlines never render through occluders. They do not expand collision or substitute for a visible contact shadow. Fade the outline on sub-`8 px` distant actors rather than producing one-pixel flicker. At crowd density, attacking and nearest enemies retain full ink; background enemies may reduce outline opacity to `45-60%`. No outline may exceed `2` internal pixels or close a behavior-defining negative-space gap.

## Lighting, shadow and fog

Use one stable gameplay rig; biome mood comes from modest hue shifts, not from losing value separation.

- **Sky/ground hemisphere:** cool sky `#8CBBC7`, ground `#17211D`, intensity `0.8-1.2`.
- **Key:** warm neutral `#FFD7A3`, intensity `1.6-2.2`, elevation `35-50°`, offset so the player/tool cast a readable ground direction.
- **Fill:** cool `#76A6C7`, intensity `0.25-0.45`, opposite the key. Do not add omnidirectional ambient until planes become flat.
- **Exposure:** with ACES tone mapping, target `0.9-1.2`. Fewer than `1%` of world pixels may clip to display white outside a heavy impact.
- **Shadows:** one soft directional shadow plus a compact contact shadow. Penumbra is `0.2-0.6 m`; shadow floors at `#10161A`, never pure black. Decorative foliage does not need individual shadow maps.
- **Rim:** optional on player, elite and boss only, `5-12%` of their visible perimeter and at most `0.35` emissive-equivalent intensity. It is separation, not a neon tube.

Normal biome fog uses `FogExp2` density `0.008-0.015`; short authored danger events may reach `0.016-0.022` for no more than `3 s`. Fog hue stays within `15°` of the sky/background and is `10-18` lightness points away from the landmark.

From the player, fog must preserve:

- a traversable lane for at least `20 m`;
- a standard threat and its role marker for at least `16 m`;
- a damaging telegraph for at least `12 m`;
- the primary landmark contour for `35-50 m`.

If those distances fail, reduce density or raise silhouette contrast. Do not solve it with permanent emissive materials. Bloom is limited to critical/reward pulses, radius `2-6 px` in the final display and less than `15%` of the screen for `150 ms`.

## Pixelation and texel density

Pixelation belongs to the 3D world only. The HUD, menus, text and icons render at native CSS/device resolution above the world buffer.

### World render buffer

- At `1600x900`, target `800x450` internal pixels (`0.5x` per axis); permitted range is `720x405-960x540`.
- Never fix narrow viewports to half resolution. At `390x844`, target at least `320x692`; at `844x390`, target at least `692x320`. In general the short internal axis never drops below `320 px`.
- Upscale the world with nearest-neighbor sampling. Antialiasing, blur and TAA must not soften the final pixel blocks.
- A world pixel should occupy about `1.7-2.2` display pixels on desktop and no more than `1.25` display pixels on the narrow axis. This is why narrow layouts use a finer buffer.

The pixel filter is acceptable only while all of these remain true at the normal gameplay camera:

- player projected height is at least `24` internal pixels;
- a standard enemy at decision distance is at least `12 px` high;
- a role marker occupies at least `4x4 px` and its negative-space gap is at least `2 px`;
- pickup core is at least `6 px`;
- telegraph border is at least `2 px`, with at least `6 px` of readable interior;
- no outline closes a gap or consumes more than `12%` of actor width.

If any floor fails, raise internal resolution first; then adjust camera or authored scale. Never add sharpening, glow or damage text to disguise lost geometry. Face features are optional flavor and are not allowed to carry gameplay meaning.

### Texture density

Flat colors and vertex colors are preferred. If a raster texture is necessary, use one density family:

| Surface | Texel density |
| --- | --- |
| Terrain and large architecture | `8-16 texels/m` |
| Rocks, trees and normal props | `16-24 texels/m` |
| Player and enemies | `24-40 texels/m` |
| Player tool, boss marker or focal pickup | `32-48 texels/m` |

Use nearest filtering for authored pixel textures and keep objects visible in the same shot within `2x` density of each other. A texture feature must cover at least `2x2` internal world pixels at decision distance. Limit a normal surface to three value steps; no photographic noise, subpixel checkerboard, baked outline, text, logo or fake high-poly detail.

## Dark retro UI contract

- Use panel `rgba(8,13,20,0.90-0.96)`, text `#F3F8FF`, muted `#BDD0DF`, cyan focus `#63E0FF` and coral confirmation `#FF9C73`. Reward gold and danger red-orange keep their world meanings.
- Essential HUD text is at least `12 CSS px` at `1600x900` and `11 CSS px` on narrow viewports; secondary copy is at least `10 px`, never below `9 px`. Normal text contrast is at least `4.5:1`; large labels and icons are at least `3:1`.
- Pixel-font labels use whole CSS-pixel placement, line-height `1.4-1.7` and at most `18` uppercase characters without wrapping. Do not use glow as the main text edge.
- Panel borders are `1-2 CSS px`; corner radii are `0-4 px`. Scanlines are optional at `3-5%` opacity and one device pixel. The vignette leaves the central `70%` of the playfield at `90%` or greater brightness.
- Icons use a `24x24` or `32x32` source grid and nearest scaling by integer multiples when possible. Each has one silhouette, one interior mark and at most four colors.
- Top-left owns survivability, top-center owns time/threat/objective, top-right owns decision-making navigation, and bottom-center owns abilities/XP. The central `50%` width by `45%` height is reserved for combat except a paused modal.
- Color is never the only UI state: selection adds a keyline/corner change, cooldown adds a radial or stepped mask, and danger adds an icon or pulse cadence.

## VFX and feedback

- **Standard hit:** one directional wedge/spark, `80-120 ms`, no larger than `1.5x` enemy width.
- **Heavy BONK:** anticipation gap, one `120-180 ms` contact pulse and a ground shockwave `2-4 m` wide. Peak white occupies less than `8%` of the frame.
- **Telegraph:** stable authored contour, `0.45 s` minimum for regular enemies and `0.7 s` for elite/boss attacks unless repeated training has established a faster pattern.
- **Damage text:** aggregate repeated low-value hits. Individual text is for critical, lethal or build-transforming events and never carries the only hit confirmation.
- **Particles:** use chunky quads or low-sided fragments at least `2x2` internal pixels. A normal hit emits `3-8`; a heavy impact `12-24`. Particles receive no outline and clear within `0.6 s` unless they mark a persistent hazard.

## Animation principles

- Every attack has anticipation, one unmistakable contact frame and recovery. Favor pose change over motion trails.
- Normal anticipation changes the silhouette by at least `10%` of actor width; elite/boss anticipation changes it by at least `15%`.
- Enemies commit in readable directions. A turn immediately before impact may not exceed `30°` unless turning is the attack's explicit behavior.
- Keep impact squash/stretch within `8-15%` on regular actors and `5-10%` on bosses so collision scale still feels credible.
- Camera shake is impulse-based, `80-180 ms` for normal heavy hits and `180-280 ms` for milestone impacts. Accessibility can reduce it to zero without removing the contact pose, sound or ground pulse.

## Screenshot acceptance matrix

Capture the same deterministic art-check encounter at `100%` browser zoom with: player; one pursuer, charger, ranged, tank and support; one elite; one pickup; one active telegraph; one hard blocker; the primary landmark; and normal biome fog. Disable names and damage text for the silhouette pass. Capture once at `1600x900`, once at `390x844`, and once at `844x390` if landscape narrow play is supported.

| Check | `1600x900` desktop acceptance | Narrow acceptance (`390x844`; also `844x390`) |
| --- | --- | --- |
| World raster | `800x450` target; blocks are visible but diagonals do not dissolve. | Short internal axis `>=320 px`; no forced `0.5x` buffer and no softened upscale. |
| Player read | Player is found within `1 s`, cyan core and tool side remain distinct, projected height `>=24 px`. | Same; player is not hidden by stacked HUD and remains `>=24` internal pixels high. |
| Enemy family read | All five roles are correctly identified from flat silhouettes at decision distance; markers are `>=4x4 px`. | At least the nearest three roles remain simultaneously readable; off-axis roles may leave frame but may not be cropped by HUD. |
| Elite/boss hierarchy | Elite differs by scale, top contour and magenta accent—not recolor alone. | New contour remains visible without relying on a nameplate. |
| Outline | Player `1.25-1.75 px`, enemies `0.75-1.25 px`; no terrain/particle ink, x-ray or closed negative spaces. | No outline exceeds `2` internal pixels or `12%` of actor width; distant ink fades instead of flickering. |
| Palette separation | Player-ground difference `>=24 L*`; enemy-ground `>=18 L*`; cyan, magenta, danger and gold reservations are respected. | Same sampled thresholds; no panel tint changes world color semantics. |
| Telegraph | Border `>=2 px`, interior `>=6 px`; it remains readable beneath hit VFX and is not confused with loot. | Same internal-pixel floors and at least `0.25 m` visual clearance from clutter. |
| Lighting/fog | Lane visible `20 m`, threat `16 m`, telegraph `12 m`, landmark `35-50 m`; fewer than `1%` clipped white pixels. | Same world-distance reads; crop/reflow does not replace fog separation with permanent glow. |
| HUD | Essential text `>=12 CSS px`, contrast passes, no combat element sits behind an opaque panel in the central reserved area. | Essential text `>=11 CSS px`, secondary `>=9 px`; panels reflow or collapse with no clipping, overlap or horizontal scroll. |
| Pixel/detail stability | No feature required for play is one pixel wide; nearest-neighbor blocks are consistent; no moiré or subpixel texture noise. | Role gaps remain `>=2 px`; if not, the capture fails and resolution must increase. |
| LOD/swarm stability | In the stress scene, LOD1/2 swaps keep ground contact within `0.03 m`, contour change within `8%`, actor triangles `<=400k` and total draw calls `<=450`. | Nearest threats promote to readable LOD; no role marker vanishes above `12 px`, no material flash and no LOD0 crowd regression. |
| Grayscale backup | Player, danger and route remain readable by value, contour and motion-state pose. | Same; color loss may reduce flavor but not target selection or route choice. |

A screenshot passes only if every applicable row passes without zooming, debug labels or explanatory overlays. Two independent reviewers must be able to point to the player, the immediate danger, one safe lane and each visible enemy role before discussing polish. A failed row changes the asset, palette, camera, fog or render scale; it is not waived by adding more VFX.
