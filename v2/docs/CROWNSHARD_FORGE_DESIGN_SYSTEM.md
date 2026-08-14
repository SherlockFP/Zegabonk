# Crownshard Forge Design System

SOL art-direction contract, 2026-08-14. This is the visual source of truth for
the V2 controlled rebuild.

## Identity

**Soft world, hard hit.** Bright, welcoming low-poly spaces use rounded chunky
masses. Combat uses sharp crown, crystal and hammer geometry. The game is
playful and authored; it must not look grim, generic or like an unfinished
tool surface.

## Immutable visual tokens

| Token | Value | Meaning |
| --- | --- | --- |
| Crown Ink | `#071C2A` | dark framing surface |
| Slate | `#103044` | secondary plaque |
| Parchment | `#F3E7C0` | bright type detail |
| Crystal Cyan | `#35D4DF` | player energy and movement |
| Crown Gold | `#F6B84A` | reward and primary action |
| Impact Orange | `#FF7938` | confirmed hit |
| Threat Coral | `#F2475B` | enemy anticipation only |
| Leaf Green | `#519A54` | living world/heal |
| Rift Violet | `#A86EFF` | corruption and endgame |

- Friendly forms: rounded blocks and 45-degree crown cuts.
- Enemies: ragged leaves, crooked teeth and asymmetric triangles.
- Impacts: white contact core, gold/orange radial star, cyan hammer trail,
  then material-color debris.
- UI: one clipped-corner plaque family with a small crown notch. Avoid generic
  dashboard cards and arbitrary borders.
- Motion: 150-240 ms for UI; strong motion only for danger, reward, level-up
  and BONK. Reduced motion removes decorative motion, not combat tells.

## Surface rules

- Main menu: one gold primary action; world-facing language only. Never show
  development status in the product surface.
- Hero select: selected 3D hero owns about 60% of the screen; show weapon,
  role, signature BONK and two traits in a compact rail.
- Settings: focused indigo drawer over a paused scene. Tabs are Audio, Video,
  Controls and Accessibility with immediate visual feedback where practical.
- HUD: portrait/health upper-left, transient objective upper-center, score
  upper-right, compact ability cluster lower-right. Keep central 55% of the
  playfield clear.
- First arena: a single ruin landmark, one navigable elevation change and a
  visible crown-gate destination. Later zones change materials and encounter
  language, not the base grammar.
- Hero: navy cape, teal sash, crown clasp and oversized crystal hammer must
  read at combat distance. Rattlecaps must read as leaf hood, mask face,
  glowing eyes and club. No proxy capsules in reviewed footage.
- Grom: huge timber-and-stone crown breaker, asymmetrical fracture, distinct
  locomotion and coral anticipation - never a scaled normal enemy.
- Skills/items: two-color verb icons legible at 24 px. Rarity is frame notch
  and pips, never color alone.

## Highest-impact order

1. Complete one Rattlecap exchange: coral wind-up, white/orange/cyan contact,
   80-110 ms hit stop, squash and launch.
2. Replace live proxy Crown Runner and Rattlecap silhouettes.
3. Make Yesil Yukuslar the production environment benchmark.
4. Reduce and relocate HUD around the protected playfield.
5. Apply this system consistently to main, hero select, settings, upgrades,
   pause and results.

## Pixel acceptance rubric

Score 0-2 each: original identity, playfield composition, typography,
palette/materials, hero silhouette, enemy/boss threat, BONK weight, VFX
semantics, cross-screen continuity, and production finish. Pass is 17-20,
with playfield, threat and BONK each at 2. Review real pixels at 1280x720,
1440x900 and later 390x844. Any proxy combatant, invisible threat, obstructed
center, unreadable text or development language is a fail.
