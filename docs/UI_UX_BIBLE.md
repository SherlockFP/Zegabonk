# ZEGABONK 2.0 UI/UX Bible

Status: discovery contract. Existing screens remain implementation evidence, not the target layout.

## Principle

UI frames the playfield. It must expose state, choice and consequence without competing with movement, threats or pickups. Reference research is used for information principles only; distinctive layouts and icons must remain original.

## State hierarchy

### Main menu

Primary: Start/Continue. Secondary: Characters, Constellation, Challenges, Leaderboards. Settings remain one action away. The background should communicate the current character, environment and build identity without masking navigation.

### Lobby

Selection order is explicit:

1. character and starting plan;
2. map/biome;
3. challenge/ruleset;
4. Start.

Selected character exposes passive, starting weapon, strengths, weakness and lock condition. Map exposes objective, biome modifier, completion state and difficulty. Challenge exposes modifier, score multiplier, reward and leaderboard eligibility. Do not mix map, tier and stage under ambiguous labels.

### Gameplay HUD

- Top-left: HP and critical survivability state.
- Top-centre: run timer and current objective/boss state.
- Bottom-centre: XP/progress and immediate ability state.
- Edge/corner secondary: level, kills, currency, map/event counters and minimap where useful.
- Centre playfield: no persistent UI except reticle/target marker and urgent world-space warning.

HUD modules may be scaled or hidden individually, but minimum HP, objective and critical cooldown feedback remain available.

### Level-up

Action fully pauses. Show 3–4 choices with:

- icon and name;
- immediate mechanical change;
- tags/synergy indicators;
- current/new value comparison;
- rarity only if it has mechanical meaning;
- keyboard/gamepad shortcut;
- reroll/skip only when the system supports them.

Repeated choices must remain fast. Preserve current option order while input is active; no late resort.

### Pause/settings

Pause proves that simulation stops. Resume is primary. Input, audio, camera sensitivity, HUD scale, screen shake, contrast and motion controls are reachable without abandoning the run.

### Results

Explain the result, do not only display a number:

- duration, level, map/objective, kills by tier and bosses;
- score component breakdown and rules version;
- final build and meaningful synergies;
- unlock/mastery progress;
- personal/best comparison;
- Retry with same configuration, edit loadout, return to menu.

### Leaderboard and challenges

Filters: rules version/patch, period, character, map, challenge and eligibility. Show player-relative rank as well as top rank. A score without comparable rules, seed/version metadata or validation status is not a competitive result.

## Readability requirements

- Body text: 16 CSS px minimum desktop; 17–18 px on narrow screens.
- Critical number/state: at least 20 px equivalent.
- Pointer/touch target: 44×44 CSS px minimum.
- Text/background contrast: WCAG AA where text carries information.
- Color is never the only carrier; pair it with icon, shape, label or motion.
- Damage/telegraph effects never obscure HP, cursor or upgrade options.
- Input modality is visible and updates without reloading.
- Motion reduction disables decorative shake/flash, not necessary telegraph timing.

## Responsive acceptance matrix

| Surface | 1600×900 | 390×844 portrait | 844×390 narrow landscape |
| --- | --- | --- | --- |
| Menu/lobby | Full information and preview | One-column cards; primary action sticky; no horizontal scroll | Compact two-column; scrollable details |
| Gameplay | Full edge HUD; centre clear | Portrait gameplay only if camera/controls remain viable; otherwise explicit unsupported message | Reduced secondary counters; HP/objective/XP always visible |
| Level-up | 3–4 cards without clipping | Single-column or paged cards; stable shortcuts; primary effect above fold | Horizontal compact cards; details expand without covering all context |
| Pause/results | Centred panel, complete breakdown | Full-height scroll; persistent Resume/Retry | Two-column summary/actions; safe-area aware |

Required checks: 200% text zoom, keyboard-only traversal, touch target spacing, safe-area insets, no pointer-lock trap and no focus loss after closing modal states.

## Current source pain points

- `index.html:41-53` combines character and map choice in a dense lobby panel; target hierarchy must clarify starting plan and map rules.
- `app.js:4679-4685` wires menu/lobby controls procedurally; state and focus changes need runtime regression coverage.
- `app.js:4551-4555` binds Digit1–Digit3 for upgrade selection; visible shortcut labels must stay synchronized.
- `app.js:4801-4806` adds menu-music unlock listeners; first-interaction behavior must not steal gameplay input.
- `app.js:5134` and `app.js:15443-15447` share Escape/pause behavior; modal priority needs an explicit state contract.

## Runtime evidence

Verified at 1600×900: main menu, Scout/Classic lobby, running HUD, keyboard-selected level-up, pause/resume, death/results and restart. Screenshot evidence is under `docs/baseline/screenshots/`. Portrait and narrow-landscape acceptance have not been run and remain unverified.