import { test, expect } from '@playwright/test';
import { enterLobbyFromPlay } from './helpers.js';

test('lobby and first combat frame', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await page.goto('/');
  await expect(page.locator('#startScreen')).toBeVisible({ timeout: 30000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'tests/artifacts/menu-after.png', fullPage: true });

  await enterLobbyFromPlay(page);
  await page.waitForTimeout(600);
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
  await page.screenshot({ path: 'tests/artifacts/gameplay.png', fullPage: true });
  expect(pageErrors).toEqual([]);
});
