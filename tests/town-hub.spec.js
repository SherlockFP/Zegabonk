import { test, expect } from '@playwright/test';
import { enterLobbyFromPlay } from './helpers.js';

test('tac koyu hub: plaza, inventory, craft, lobby', async ({ page }) => {
  test.setTimeout(180000);
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await page.goto('/');
  await expect(page.locator('#startScreen')).toBeVisible({ timeout: 30000 });
  await page.waitForFunction(() => typeof enterTownHub === 'function', null, { timeout: 20000 });
  await page.click('#playBtn');
  await page.waitForFunction(() => typeof state !== 'undefined' && state.inTown === true, null, { timeout: 20000 });
  await page.waitForTimeout(1100);

  const town = await page.evaluate(() => ({
    inTown: state.inTown,
    map: state.currentMapId,
    player: Boolean(player && player.mesh),
    npcs: typeof townNpcs !== 'undefined' ? 0 : 4
  }));
  expect(town.inTown).toBe(true);
  expect(town.player).toBe(true);

  await page.screenshot({ path: 'tests/artifacts/town-plaza.png', fullPage: true });

  await page.evaluate(() => {
    if (!camera || !renderer || !scene) return;
    camera.position.set(0, 7.2, -9);
    camera.lookAt(0, 1.4, 12);
    renderer.render(scene, camera);
  });
  await page.waitForTimeout(80);
  await page.screenshot({ path: 'tests/artifacts/town-angle-north.png', fullPage: true });

  await page.evaluate(() => {
    if (!camera || !renderer || !scene) return;
    camera.position.set(28, 16, 6);
    camera.lookAt(0, 1, 4);
    renderer.render(scene, camera);
  });
  await page.waitForTimeout(80);
  await page.screenshot({ path: 'tests/artifacts/town-angle-east.png', fullPage: true });

  await page.evaluate(() => {
    if (!camera || !renderer || !scene) return;
    camera.position.set(-22, 14, -18);
    camera.lookAt(0, 1, 0);
    renderer.render(scene, camera);
  });
  await page.waitForTimeout(80);
  await page.screenshot({ path: 'tests/artifacts/town-angle-smith.png', fullPage: true });

  await page.keyboard.press('KeyI');
  await expect(page.locator('#gearPanel')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('#gearEquip .gearSlot')).toHaveCount(6);
  await page.screenshot({ path: 'tests/artifacts/town-inventory.png', fullPage: true });
  await page.keyboard.press('Escape');
  await expect(page.locator('#gearPanel')).toBeHidden();

  await page.evaluate(() => { if (typeof openCraftPanel === 'function') openCraftPanel(); });
  await expect(page.locator('#craftPanel')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('#craftTamirBtn')).toBeVisible();
  await page.screenshot({ path: 'tests/artifacts/town-craft.png', fullPage: true });
  await page.keyboard.press('Escape');

  await page.evaluate(() => { if (typeof closeGearPanel === 'function') closeGearPanel(); if (typeof openLobby === 'function') openLobby(); });
  await expect(page.locator('#lobbyScreen')).toBeVisible({ timeout: 15000 });
  await page.screenshot({ path: 'tests/artifacts/town-lobby.png', fullPage: true });

  await page.evaluate(() => {
    if (typeof closeGearPanel === "function") closeGearPanel();
    var btn = document.getElementById("lobbyStartBtn");
    if (btn) btn.click();
  });
  await page.waitForFunction(() => running === true && state.inTown === false, null, { timeout: 60000 });
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'tests/artifacts/town-run.png', fullPage: true });

  expect(pageErrors).toEqual([]);
});

test('play still reaches lobby then run', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#startScreen')).toBeVisible({ timeout: 30000 });
  await enterLobbyFromPlay(page);
  await page.click('#lobbyStartBtn');
  await page.waitForFunction(() => running === true, null, { timeout: 60000 });
  expect(await page.evaluate(() => state.inTown)).toBe(false);
});
