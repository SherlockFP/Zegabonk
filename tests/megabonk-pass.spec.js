import { test, expect } from '@playwright/test';
import { enterLobbyFromPlay } from './helpers.js';

test('lobby and first combat frame', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await page.goto('/');
  await expect(page.locator('#startScreen')).toBeVisible({ timeout: 30000 });
  await page.waitForFunction(() => document.getElementById('loadingOverlay')?.classList.contains('hidden'), null, { timeout: 30000 });
  await expect(page.locator('#menuCharDock')).toBeVisible();
  await expect(page.locator('.menuCharTile[data-char="scout"]')).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'tests/artifacts/menu-after.png', fullPage: true });
  await page.screenshot({ path: 'tests/artifacts/gauntlet-menu.png', fullPage: true });

  await enterLobbyFromPlay(page);
  await page.waitForTimeout(600);
  await expect(page.locator('.lobbyCharCard[data-char="scout"] .lobbyCharPortrait')).toBeVisible();
  await page.screenshot({ path: 'tests/artifacts/lobby.png', fullPage: true });

  await page.click('#lobbyStartBtn');
  await page.waitForSelector('#hud:not(.hidden)', { timeout: 60000 });
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    if (typeof spawnEnemy === "function") {
      for (let i = 0; i < 8; i++) spawnEnemy();
    }
    if (player && player.mesh) {
      player.mesh.position.y = (typeof sampleTerrainHeight === "function")
        ? sampleTerrainHeight(player.mesh.position.x, player.mesh.position.z)
        : player.mesh.position.y;
    }
  });
  await page.waitForTimeout(1800);
  await expect(page.locator('#topCenterTime')).toBeVisible();
  await page.screenshot({ path: 'tests/artifacts/gameplay.png', fullPage: true });

  await page.keyboard.press('Escape');
  await expect(page.locator('#pauseMenu')).toBeVisible();
  await expect(page.locator('#pauseResumeBtn')).toBeVisible();
  await page.screenshot({ path: 'tests/artifacts/hud-pause.png', fullPage: true });
  await page.click('#pauseResumeBtn');
  await expect(page.locator('#pauseMenu')).toBeHidden();

  await page.evaluate(() => { if (typeof openLevelup === 'function') openLevelup(); });
  await expect(page.locator('#levelup')).toBeVisible();
  await page.screenshot({ path: 'tests/artifacts/gameplay-levelup.png', fullPage: true });
  await page.evaluate(() => { if (typeof closeLevelupAndResume === 'function') closeLevelupAndResume(); });

  await page.evaluate(() => {
    if (!player || !player.mesh) return;
    player.mesh.position.set(-86, sampleTerrainHeight(-86, 36), 36);
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'tests/artifacts/geo-grove.png', fullPage: true });
  await page.evaluate(() => {
    if (!player || !player.mesh) return;
    player.mesh.position.set(94, sampleTerrainHeight(94, 22), 22);
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'tests/artifacts/geo-ruins.png', fullPage: true });
  expect(pageErrors).toEqual([]);
});
