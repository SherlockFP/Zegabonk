# ZEGABONK 2.0 Progression Bible

Status: researched design contract. Numerical targets are hypotheses until playtested.

## Progression goals

Progression should increase autonomy, competence and build expression. It must not use paid power, energy timers, streak loss or FOMO. Unlocks should add viable routes, not make the baseline character deliberately incomplete.

## Run progression

A standard run follows:

`fight -> collect XP/resources -> choose upgrade -> combine tags -> meet event/objective -> defeat boss or survive gate -> receive next-map choice/reward`

Choice cadence starts frequent and readable, then spaces out as builds become complex. A choice is meaningful when it changes at least one of:

- delivery: pierce, chain, return, orbit, split, summon;
- trigger: hit count, crit, kill, distance, status;
- area/timing: pulse, delayed burst, persistent field;
- economy/risk: pickup conversion, curse, reward multiplier;
- defense/mobility: dash, shield, recovery, retaliation;
- build rule: capstone conversion or synergy.

Every offer records current value, resulting value, tags and prerequisites. Pure `+N%` nodes may support a chain but cannot be the entire chain.

## Character progression

Each character owns:

- one starting weapon;
- one signature passive;
- two or more supported build identities;
- unlock criteria based on demonstrated play, not grind alone;
- mastery objectives that teach the character;
- cosmetic/status rewards separated from competitive power.

Account-wide progression unlocks options and planning tools. Permanent raw-stat power must be capped, refundable and excluded or normalized in strict competitive rulesets.

## BONK CONSTELLATION

BONK Constellation is an original readable network, not a reproduction of another game's topology or visual language.

### Node taxonomy

| Type | Purpose | Typical presentation |
| --- | --- | --- |
| Root | Character/build entry | Large identity node |
| Minor | One simple stat or quality-of-life change | Small, low visual weight |
| Notable | New interaction or meaningful specialization | Medium named node |
| Keystone | Rule-changing trade-off | Large warning/reward node |
| Socket | Optional modifier slot | Shape-coded slot |
| Mastery | Choice unlocked by investment in a cluster | Local branch selector |
| Bridge | Connects themes/regions | Low-detail navigation node |

Every important branch must create a real gameplay decision. Graph size is never a quality metric.

### Information architecture

- Zoomed-out: regions, roots, major routes and build identity.
- Mid zoom: categories, available paths and node state.
- Close: exact effect, comparison, requirements and downstream synergy.
- Search: stat, tag, effect, item, skill and status synonyms; highlight route and count.
- Build preview: allocate without committing, compare before/after summary, save/load/share a local plan.
- Respec: transparent cost, reversible preview and confirmation of affected downstream nodes.
- Accessibility: list/tree alternative, keyboard navigation, non-color state coding and reduced-motion pan/zoom.

### Node data contract

```text
id, version, characterScope, category, tags,
position, links[], prerequisiteExpression,
effectType, effectValue, effectTextKey,
maxRank, cost, exclusionGroup,
unlockCondition, visualState, balanceVersion
```

The effect description is generated from validated effect data where possible; text must not drift from mechanics. Save data stores stable IDs and schema/version migration information.

## Unlock and mastery layers

1. **Run layer:** temporary upgrades and resources reset after the run.
2. **Character mastery:** unlocks alternate starting plans, challenge modifiers and cosmetics.
3. **Account collection:** characters, maps, items, constellation planning and codex entries.
4. **Competitive layer:** comparable rulesets, time windows and verified run metadata.

No layer silently changes another layer's competitive eligibility.

## Score and run metadata

Every submitted run should persist:

```text
runId, account/playerId, gameVersion, contentVersion,
scoreRulesVersion, seed, mode, characterId, mapRoute,
challengeIds, start/end timestamps, duration,
level, killsByTier, bosses, objectives, damage,
upgradeIds+ranks, constellationLoadout,
scoreComponents, finalScore, endReason,
eligibility, verificationStatus
```

Daily/weekly/all-time views use explicit period and rules versions. Major balance changes archive or partition boards. The player sees top ranks and nearby ranks; comparison never hides the governing build, map or challenge filters.

## Research-derived hypotheses

Official genre sources support: frequent but readable survivor choices, wave/run pacing under roughly 20–30 minutes, quest/mastery unlocks, build experimentation with refund, and leaderboards separated by period/rules. These are principles, not copied content.

Initial playtest targets:

- player can describe the build after three choices;
- at least 70% of offers advance or intentionally pivot a visible tag path;
- no mandatory choice requires opening an external guide;
- first constellation route is understandable in under 60 seconds;
- search locates a known effect in under 10 seconds;
- preview/respec never commits without explicit action;
- competitive result always displays rules version and eligibility.

These targets remain unverified until instrumented user tests.