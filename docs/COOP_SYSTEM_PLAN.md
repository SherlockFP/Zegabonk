# ZEGABONK Co-op System Plan

## Product target

1-4 oyuncu, oda koduyla veya arkadas davetiyle ayni hikaye ya da Tac Yarigi run'ina girer. Co-op, solo oyunun yan modu degil; ayni combat kurallarini paylasan fakat ayri denge, sosyal kurtarma ve liderlik tablosu olan bir urun sutunudur.

## Non-negotiable decisions

- Host-authoritative simulation for the first shipping version.
- Client only sends input/aim/skill intent; host owns enemies, damage, drops, timer, portal, boss and score.
- Solo and co-op leaderboards never mix.
- Match player count locks when combat starts. Mid-run spectators may join, active player drop-in waits for the next portal.
- Permanent gear is allowed in progression co-op; normalized weekly mode uses fixed power budget.
- Friendly fire is off by default.

## Lobby and joining flow

### Host

1. `CO-OP` -> `ODA KUR`.
2. Story or Tac Yarigi, public/friends/code-only, max player, region selected.
3. Six-character room code and invite link generated.
4. Host sees player card, ping, chosen hero, mastery band and ready state.
5. All players ready -> 5 second launch countdown.

### Joiner

1. `ODA KODU` or invite link.
2. Compatibility check: build hash, ruleset, save schema.
3. Character/loadout select.
4. Ready; initial world snapshot loads; clock starts only after every player ACKs.

### Reconnect

- 90 second reconnect reservation.
- Disconnected player becomes invulnerable idle echo for 15 seconds, then leaves combat.
- Rejoin receives authoritative snapshot plus input sequence cursor.
- Host migration is not in v1; host loss safely ends ranked submission and grants partial non-ranked rewards.

## Network model

First target: WebSocket relay/signaling plus host authority. WebRTC DataChannel may carry gameplay traffic after signaling, but a relay fallback is required for NAT/mobile reliability.

Fixed simulation:

- host gameplay tick: 20 Hz;
- client input send: 30 Hz, batched and sequenced;
- snapshot: 10-15 Hz with delta compression;
- local player prediction and reconciliation;
- remote player interpolation buffer: 100-150 ms;
- enemies are not individually fully replicated every frame. Replicate spawn id, archetype, authoritative transform/HP deltas and high-value events.

Required module boundary before networking:

```text
InputIntent -> SimulationWorld -> GameEvents -> RenderView
                       |
                       +-> Snapshot/Replay/Score proof
```

The current global `app.js` must first expose stable entity ids and separate simulation mutations from Three.js mesh mutations. Networking directly against mesh arrays is rejected.

## Player-count scaling

Baseline formula, tuned per boss:

```text
normal enemy HP   = base x (1 + 0.45 x (players - 1))
elite/boss HP     = base x (1 + 0.70 x (players - 1))
spawn budget      = base x (1 + 0.55 x (players - 1))
elite frequency   = base + 3% x (players - 1)
enemy damage      = base x (1 + 0.08 x (players - 1))
kill quota        = base x (1 + 0.35 x (players - 1))
reward quantity   = base x (1 + 0.30 x (players - 1))
```

Damage grows slowly; HP, simultaneous pressure and role combinations grow faster. This prevents one-shot deaths while still stopping four-player focus fire from deleting bosses.

Dynamic scaling uses `activeCombatPlayers`, but recalculates only at portal boundaries. A disconnect cannot instantly lower a live boss's HP.

## Co-op combat rules

- Personal XP radius is generous; shared kill credit prevents last-hit arguments.
- Loot is instanced per player. Gold/material event is shared but item rolls are personal.
- Same character can be selected more than once in casual mode; normalized ranked mode may enforce unique heroes after testing.
- Crowd-control resistance scales with repeated applications from the whole team.
- Boss targets rotate by threat windows, not only nearest player.
- Combo meter has personal streak and team chain; team chain rewards coordinated elite/boss kills, not trash farming.

## Downed and revive

- Zero HP -> downed for 20 seconds, not immediate run end.
- Crawl and ping allowed; attacks disabled.
- Teammate holds revive for 3 seconds; taking a heavy hit interrupts.
- Each down adds one Wound. Wound reduces max HP by 8% until the next portal, max 3.
- All players down simultaneously -> rift failure.
- Solo keeps existing death rule.
- Ranked score records downs, revives and full-team wipes.

## Co-op Tac Yarigi

- Contract seed, affixes, timer and quota are host authoritative.
- Portal only activates when living players are inside the rally radius or vote to leave one player behind.
- Boss starts after shared quota.
- Timer is shared; reviving costs time and score.
- Fast completion advances +1/+2/+3 using the same percentages as solo, then applies a party-size score coefficient.

## Separate leaderboard

Board key:

`season + ruleset + partySize + normalized/progression`

Rank tuple:

1. deepest completed rift;
2. score;
3. remaining time;
4. fewer downs;
5. earlier verified submission.

Entry stores all player account ids, hero ids, gear-power bands, seed, affixes, build hash, input/event digest and host/server validation status. A 2-player record never competes with 4-player.

## Anti-cheat and score integrity

- Never trust client-reported damage, kill, timer or final score.
- Host authority is acceptable for casual play but insufficient alone for ranked cash/prize integrity.
- Ranked submission requires relay/server event checks, impossible-rate detection, signed session token and deterministic score recomputation.
- Every gameplay-affecting patch increments ruleset/build hash; incompatible boards archive instead of silently mixing.

## Delivery program

### C0 - Architecture extraction

- stable entity ids;
- fixed simulation tick;
- input intent queue;
- event bus;
- serializable world snapshot;
- deterministic contract seed;
- two-process local harness.

Exit: two local simulations consume the same input/event log and agree on score, boss HP and portal state.

### C1 - Two-player LAN vertical slice

- create/join code;
- two players in one small arena;
- movement, basic attack, one enemy archetype, HP and revive;
- disconnect/reconnect;
- no public matchmaking.

Exit: 20-minute LAN run, no permanent desync, reconnect under 5 seconds.

### C2 - Full combat replication

- all character skills;
- enemy director and bosses;
- personal loot;
- portal transitions;
- 1-4 player scaling;
- bandwidth/perf overlay.

Exit: 4 players + target dense wave, host p95 frame <= 25 ms, client traffic target <= 80 KB/s average.

### C3 - Co-op endgame and persistence

- party RiftContract;
- shared objective/timer;
- party reward transaction;
- failure recovery;
- separate local test leaderboard.

Exit: duplicate rewards and split-brain saves blocked by idempotent run id.

### C4 - Online service and ranked beta

- authenticated accounts;
- lobby service and relay fallback;
- server-verified submissions;
- seasonal 2P/3P/4P boards;
- moderation/reporting/privacy controls.

Exit: closed beta telemetry meets crash, disconnect, desync and fraud thresholds.

## Test matrix

- 1/2/3/4 player scaling at depths 1, 10, 30 and 100.
- 40/100/180/300 ms latency; 1/3/8% packet loss.
- host disconnect, client disconnect, reconnect during boss and portal.
- simultaneous revive/loot/portal interaction.
- duplicate/reordered inputs and snapshots.
- old client/new ruleset rejection.
- mobile/desktop mixed aspect ratio and controller/keyboard mix.
- leaderboard separation by party size and normalized/progression rule.

## Explicitly deferred

- dedicated authoritative simulation server;
- host migration;
- public skill-based matchmaking;
- cross-platform voice chat;
- trading/economy;
- PvP.

These are not prerequisites for proving that co-op ZEGABONK is fun.
