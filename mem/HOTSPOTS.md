# app.js hotspots

Read only the range you need. Grep names; line numbers drift.

## State / meta

- `state` object near top
- `CAMPAIGN_MAPS` / `MYTHIC_KEYS` / hunt (`HUNT_POI_SPOTS`, `CLASSIC_YUK_TASI`, `updateHunt`, `isHuntReady`)
- `createDefaultPlayerProfile` / `renderCampaignProgress` / `renderRetentionHub`
- `skills` array: grep `id: "`
- `MAX_WEAPONS`

## World / assets

- GLB preload / `createEnemy`
- `startRun`
- `enterTownHub` / `hub.js` (Tac Koyu, gear, Yol Tasi)
- `applyMapTheme` / `applyBiomeTheme` / `BIOME_BY_CHAPTER`

## Input / camera / combat

- `bindEvents`, mouse look, `bindPauseMenu`
- `updateCamera` (grep the function)
- `applySkill` / `canPickSkill`
- `applyDamageEnemy` (Ender crystal shield)
- `updateEnemies` / `updateEnderBoss`
- `spawnBoss` / `killEnemy` / `unlockCrownRifts`
- `enterPortal` (Warden endless + Ender)
- `animate` / `showGameOver` / `onPlayerDeath`

## UI HUD

- `updateHud` / `#runObjective`
- skill icons / tab / skill bar
- minimap
