# ZEGABONK Mobile Release Plan

## Go or no-go

Mobile is a strong product fit only if it is designed as a first-class input and performance target. A wrapped desktop web build with small buttons is a no-go.

The fit is promising because ZEGABONK has:

- short, replayable score runs;
- auto-target-friendly horde combat;
- large readable characters and pickups;
- social score and co-op hooks;
- permanent progression that supports return sessions;
- visually marketable BONK moments.

## Mobile core loop

- Story stages target 6-10 minute chapters on mobile.
- Crown Rift contracts target 6-8 minutes in mobile queues; desktop may offer 10-minute standard contracts.
- Left thumb: floating movement stick.
- Right thumb: camera drag plus one prominent BONK/skill action.
- Basic attack auto-targets by default; manual aim is an advanced toggle.
- Skills use large cooldown buttons in a reachable arc, not a desktop hotbar copied to touch.
- Portal, revive, reward and interact actions use context buttons.
- Haptics: light hit, heavy BONK, level-up, boss break and revive only.

## Performance tiers

### Low - broad Android floor

- 30 FPS target;
- 0.55-0.7 dynamic render scale;
- 60-90 visible enemies using instancing/LOD;
- no realtime shadows on crowd;
- minimal transparent particles and no post-processing chain;
- 256-512 px prop atlases and compressed textures.

### Medium

- stable 45 FPS target where supported;
- 100-160 visible enemies;
- one shadow-casting sun plus player/contact shadow;
- reduced bloom and medium particle density.

### High

- 60 FPS target;
- 160-250 visible enemies after measured device validation;
- higher render scale, optional shadows and richer effects.

Google Play slow-session reporting treats 30 FPS as the broad reasonable bar and separately reports severe sessions below 20 FPS. ZEGABONK's internal acceptance is stricter: p95 frame <= 33.3 ms on the low target device after ten minutes, including a dense boss wave.

## Architecture gates

Before store work:

1. replace per-enemy meshes/materials/animation updates with archetype instances and object pools;
2. fixed-rate AI and spatial queries;
3. GPU-friendly particle pools with overdraw cap;
4. texture/GLB preload manifest and streaming budget;
5. pause/resume/background-safe clock and audio;
6. input abstraction shared by keyboard, controller and touch;
7. responsive HUD safe areas, notches and 44-48 px minimum targets;
8. deterministic quality auto-detection with manual override.

## Shipping route

### M0 - Mobile browser laboratory

- responsive lobby/HUD;
- touch input prototype;
- Android Chrome device matrix;
- 10-minute thermal/perf sessions;
- no store package.

### M1 - Android closed test

- package the web runtime with a thin native shell only after browser acceptance;
- lifecycle, back button, haptics, safe area and asset caching;
- Play Games identity optional, not a blocker;
- crash/ANR/FPS telemetry and privacy disclosure.

### M2 - Cross-platform account/co-op

- account linking;
- friend/join-code flow;
- server-authoritative score and party state;
- cross-platform build/ruleset compatibility.

### M3 - iOS TestFlight

- iOS memory/thermal pass;
- controller and touch parity;
- App Store purchase/restore and review metadata compliance;
- final age rating and privacy review.

## Retention, not pay-to-win

- First-session promise: move, BONK, level-up and first mini-boss inside 90 seconds.
- Day-one return: one new hero path or cosmetic target, not an energy wall.
- Social return: friend score notification, team Rift contract and replayable seed.
- Monetization: cosmetics, effects, banners, emotes and optional season cosmetics.
- Permanent combat power remains earnable by play; normalized competitive boards remove purchased or grinded power.
- No forced ads in combat, no paid revive in ranked, no loot-box power.

## Mobile co-op rules

- 2-player is the default quick party recommendation; 4-player remains available.
- Voice is deferred; pings, quick emotes and target markers ship first.
- Join/reconnect must tolerate backgrounding and network handoff.
- Ranked timer is server-based and never trusts device time.
- Each party size has a separate leaderboard.

## Acceptance matrix

- portrait menus and landscape gameplay at 390x844 and 844x390;
- 3 GB and 4 GB Android devices;
- thermal throttling after 10/20/30 minutes;
- Wi-Fi -> cellular handoff and background/resume;
- touch-only story, boss, portal, reward and revive completion;
- no clipped text at 200% accessibility text scale;
- no accidental system gesture conflict near screen edges;
- battery drain and device temperature recorded, not guessed.
