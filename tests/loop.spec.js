import { test, expect } from '@playwright/test';
import { enterLobbyFromPlay } from './helpers.js';

test('full loop: portal -> Muhafiz -> kill -> chapter 2', async ({ page }) => {
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

  await page.evaluate(() => {
    state.routePhase = 'portal';
    spawnPortal(getClassicRoutePortal());
  });
  await page.evaluate(() => {
    const p = state.portalPos;
    player.mesh.position.set(p.x, 0, p.z);
  });

  await page.waitForFunction(() => state.routeBossSpawned === true, null, { timeout: 15000 });

  const bossInfo = await page.evaluate(() => {
    const b = enemies.find((e) => e.isRouteBoss);
    if (!b) return { exists: false };
    return {
      exists: true,
      name: b.name,
      hp: b.hp,
      meshCount: (() => { let n = 0; b.mesh && b.mesh.traverse((c) => { if (c.isMesh) n++; }); return n; })(),
      chapter: state.chapter,
    };
  });
  console.log('--- boss info ---');
  console.log(JSON.stringify(bossInfo));

  expect(bossInfo.exists).toBe(true);
  expect(bossInfo.name).toBe('Kirik-Tac Muhafizi');
  expect(bossInfo.meshCount).toBeGreaterThan(12);

  const killLog = await page.evaluate(() => {
    const log = {};
    try {
      if (!state.profile && typeof createDefaultPlayerProfile === 'function') state.profile = createDefaultPlayerProfile();
      const b = enemies.find((e) => e.isRouteBoss);
      log.found = !!b;
      if (b) { b.hp = 0; killEnemy(b); }
      log.defeated = !!state.routeBossDefeated;
      log.unlocked = !!state.portalUnlocked;
      log.phase = state.routePhase;
      log.chapter = state.chapter;
    } catch (e) {
      log.err = String(e && e.stack || e);
    }
    return log;
  });
  console.log('--- kill log ---');
  console.log(JSON.stringify(killLog));

  await page.evaluate(() => {
    if (state.chapter === 2) return;
    const p = state.portalPos;
    if (p && player.mesh) player.mesh.position.set(p.x, 0, p.z);
    if (typeof enterPortal === 'function') enterPortal();
  });
  await page.waitForFunction(() => state.chapter === 2 && state.routePhase === 'running', null, { timeout: 8000 });

  const after = await page.evaluate(() => ({
    chapter: state.chapter,
    routePhase: state.routePhase,
    endlessMode: state.endlessMode,
    hardcoreMode: state.hardcoreMode,
  }));
  console.log('--- after portal hop ---');
  console.log(JSON.stringify(after));
  expect(after.chapter).toBe(2);
  expect(after.routePhase).toBe('running');
  expect(after.endlessMode).toBeFalsy();
  expect(after.hardcoreMode).toBeFalsy();

  await page.screenshot({ path: 'tests/artifacts/loop-chapter2.png', fullPage: true });

  console.log('--- console errors ---');
  console.log(consoleErrors.length ? consoleErrors.join('\n') : 'none');
  console.log('--- page errors ---');
  console.log(pageErrors.length ? pageErrors.join('\n') : 'none');
  console.log('--- failed requests ---');
  console.log(allFailed.size ? Array.from(allFailed).join('\n') : 'none');

  expect(pageErrors).toEqual([]);
});
