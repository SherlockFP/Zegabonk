import { test, expect } from '@playwright/test';
import { enterLobbyFromPlay } from './helpers.js';

test('full loop: portal → Warden (Grom GLB) → kill → exit → endless', async ({ page }) => {
  const consoleErrors = [];
  const pageErrors = [];
  const allFailed = new Set();

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('requestfailed', (req) => {
    allFailed.add(`${req.method()} ${req.url()} :: ${req.failure()?.errorText}`);
  });
  page.on('response', (res) => {
    if (res.status() >= 400) allFailed.add(`HTTP ${res.status()} ${res.request().method()} ${res.url()}`);
  });

  await page.goto('/');
  await expect(page.locator('#startScreen')).toBeVisible({ timeout: 30000 });
  await enterLobbyFromPlay(page);
  await page.click('#lobbyStartBtn');
  await page.waitForFunction(() => running === true && state.inTown === false, null, { timeout: 60000 });
  await page.waitForSelector('#hud:not(.hidden)', { timeout: 60000 });

  // --- Force portal phase (skip 7-min timer) ---
  await page.evaluate(() => {
    state.routePhase = 'portal';
    spawnPortal(getClassicRoutePortal());
  });
  // Teleport player into portal zone
  await page.evaluate(() => {
    const p = state.portalPos;
    player.mesh.position.set(p.x, 0, p.z);
  });

  // --- 3s charge → Warden spawns at (0,0,62) ---
  await page.waitForFunction(() => state.routeBossSpawned === true, null, { timeout: 15000 });

  const bossInfo = await page.evaluate(() => {
    const b = enemies.find((e) => e.isRouteBoss);
    if (!b) return { exists: false };
    return {
      exists: true,
      name: b.name,
      hp: b.hp,
      gromLoaded: Boolean(bossAsset),
      meshCount: (() => { let n = 0; b.mesh && b.mesh.traverse((c) => { if (c.isMesh) n++; }); return n; })(),
    };
  });
  console.log('--- boss info ---');
  console.log(JSON.stringify(bossInfo));

  expect(bossInfo.exists).toBe(true);
  expect(bossInfo.name).toBe('Kilitli Cikis Warden');
  expect(bossInfo.gromLoaded).toBe(true);
  expect(bossInfo.meshCount).toBeGreaterThan(20); // Grom GLB = 54 meshes; procedural spider = 13

  // --- Kill boss → exit unlocks ---
  await page.evaluate(() => {
    const b = enemies.find((e) => e.isRouteBoss);
    if (b) { b.hp = 0; killEnemy(b); }
  });
  await page.waitForFunction(() => state.routeBossDefeated === true, null, { timeout: 5000 });
  const after = await page.evaluate(() => ({
    portalUnlocked: state.portalUnlocked,
    routePhase: state.routePhase,
  }));
  console.log('--- after boss kill ---');
  console.log(JSON.stringify(after));
  expect(after.portalUnlocked).toBe(true);
  expect(after.routePhase).toBe('exit');

  // --- Force routeTime → enter portal → endless ---
  await page.evaluate(() => {
    state.routeTime = CLASSIC_ROUTE_ENDLESS_TIME;
    const p = state.portalPos;
    player.mesh.position.set(p.x, 0, p.z);
  });
  await page.waitForFunction(() => state.endlessMode === true, null, { timeout: 5000 });
  await page.screenshot({ path: 'tests/artifacts/loop-endless.png', fullPage: true });

  console.log('--- console errors ---');
  console.log(consoleErrors.length ? consoleErrors.join('\n') : 'none');
  console.log('--- page errors ---');
  console.log(pageErrors.length ? pageErrors.join('\n') : 'none');
  console.log('--- failed requests ---');
  console.log(allFailed.size ? Array.from(allFailed).join('\n') : 'none');

  expect(pageErrors).toEqual([]);
});