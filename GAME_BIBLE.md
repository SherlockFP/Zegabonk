# BONKED.IO Game Bible

## Product identity

BONKED.IO is a third-person horde-survival roguelite about turning a scrappy arena fighter into an unstoppable **impact engine**. The player does not merely survive a crowd: they create openings, line up enemies, then BONK the formation apart with a readable, ridiculous payoff.

This is an original product. It may use genre-level ideas such as timed survival, randomized upgrades, loot and escalating crowds, but it must not reproduce MEGABONK's characters, UI, artwork, language, sound, or distinctive presentation.

## Core fantasy

"I can read the chaos, choose one smart opening, and turn it into a spectacular chain reaction."

## Player verbs

1. **Flow** - move, dodge and claim space before the crowd closes.
2. **Bonk** - land a clear primary impact that creates knockback, stagger or a visible chain reaction.
3. **Collect** - sweep up drops that immediately communicate growth.
4. **Build** - select an upgrade that visibly changes the next thirty seconds, not only a hidden stat.
5. **Break through** - defeat an elite, milestone or boss to reach the next intensity band.

## Core loop

Fight -> create space -> collect -> choose a build-shaping upgrade -> survive a new enemy composition -> defeat a milestone -> earn unlock progress -> replay with a new BONK style.

## Session structure

- **0-2 minutes, establish:** one clear weapon, a small readable enemy family and safe navigation lanes.
- **2-7 minutes, compose:** the player gains two or three noticeable interactions and learns the biome's arena rules.
- **7-12 minutes, pressure:** elites, hazards and denser formations force active positioning.
- **Milestone:** a boss or arena event tests the build with clear telegraphs and a memorable reward.
- **Finish:** an earned result screen reports build-defining choices, kills, time and a single next-run unlock hook.

## Design pillars

1. **Read the crowd.** Enemy silhouettes, telegraphs and damage feedback remain understandable at peak density.
2. **Every hit changes the board.** Primary attacks and upgrades create spatial consequences, not only numbers.
3. **Short, visible build loops.** A choice must be felt quickly and explain itself through play.
4. **Controlled chaos.** Spawns, landmarks and escape routes are authored rules with procedural variation, never arbitrary clutter.
5. **Comic force, not visual noise.** The tone is playful and punchy; VFX reserve scale and screen shake for meaningful impacts.

## Visual identity and readability contract

The playable view is a low-detail procedural 3D combat diorama beneath a dark retro-pixel HUD. Pixelation is a display treatment, not an excuse for noisy surfaces or sprite imitation: the world uses large original forms, stepped color values and restrained material detail, while HUD text and icons remain at native viewport resolution.

- **Player read:** cyan is the persistent player identifier, backed by a compact forward wedge and one oversized asymmetric tool. Optional warm-coral gear may occupy no more than one fifth of the visible body.
- **Enemy read:** behavior is identifiable from mass and negative space before color: wedge/horns for chargers, a raised separated marker for ranged units, a square shield mass for tanks and orbiting pieces for supports. Elites add a silhouette feature; they are never only recolored regular enemies.
- **World read:** terrain and non-interactive dressing stay lower in saturation and contrast than actors. Hard blockers, traversable gaps and damaging ground must have visibly different edge shapes; collision must follow the visible mass.
- **Gameplay ink:** a light outer silhouette belongs on the player, opaque enemy bodies and active hazard/interaction shapes. It does not belong on terrain sheets, water, grass, fog, particles or decorative debris.
- **Color semantics:** player cyan, hostile red/coral, elite magenta, boss-danger red-orange and reward gold are reserved gameplay channels. Every warning also changes shape, motion or timing so color is never the only signal.
- **Readability floor:** world pixelation must preserve a player at least 24 internal pixels tall, a decision-range enemy at least 12 pixels tall and telegraph borders at least 2 pixels thick. The renderer must become finer before crossing those floors; UI must never be passed through the world pixel filter.

`docs/design/ART_BIBLE.md` is the measurable art contract. Its palette, scale, outline, fog and screenshot matrix take precedence over one-off asset styling.

## Build taxonomy

- Impact: knockback, stagger, shockwaves, collision damage.
- Momentum: movement, dodge, speed-to-damage, pickup flow.
- Chain: bounce, split, echo, status propagation.
- Crush: area control, heavy strikes, armor break.
- Trick: decoys, traps, pulls and positioning tools.

Each run should offer a few cross-tag interactions. Examples: Momentum + Impact creates a dash crash; Chain + Trick converts a pull into a delayed shockwave. Names, presentation and content remain BONKED-original.

## First slice acceptance criteria

The first gameplay improvement slice must make a fresh run communicate these facts within one minute:

- current threat and run goal are visible without obstructing the playfield;
- the primary attack's range and impact are legible;
- an upgrade choice communicates its immediate effect and tag;
- the opening biome has a visible landmark, safe lane and encounter space;
- a dense encounter does not flood the display with unbounded damage text;
- the same authored encounter passes the `1600x900` and narrow-viewport screenshot matrix in `docs/design/ART_BIBLE.md`;
- player, hostile role, active telegraph and traversable lane remain distinguishable without names, damage text or an outline visible through occluders.
